import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { SOURCE_PATH, sha256 } from "./policy-evidence"
import { DISPOSITIONS } from "./policy-evidence-review"
import { composeSnapshot, inputBindings, validateSnapshot } from "./policy-evidence-snapshot"
import { loadSnapshotPage, readSnapshotInputs, saveSnapshot } from "./policy-evidence-snapshot-store"
import { snapshotFixture, SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"

function diskFixture() {
  const fixture = snapshotFixture(), root = mkdtempSync(join(tmpdir(), "gaia-snapshot-test-"))
  const dir = join(root, ".local/gaia/policy-evidence/run-test")
  mkdirSync(dir, { recursive: true }); mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), fixture.bytes.source)
  for (const key of ["proof", "reviews", "dissent"] as const) writeFileSync(join(dir, `${key}.json`), fixture.bytes[key]!)
  return { ...fixture, root, dir }
}
describe("BUILD-001D composition", () => {
  it("is deterministic for identical bytes, selection and timestamp, and validates portably", () => {
    const { bytes, request, snapshot } = snapshotFixture()
    expect(composeSnapshot(bytes, request, SNAPSHOT_TEST_TIME)).toEqual(snapshot)
    expect(validateSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot)
    expect(Buffer.from(snapshot.inputs.proof.bytesBase64!, "base64")).toEqual(bytes.proof)
    expect(snapshot.modelInterpreted.originalMachineWording).toBe(JSON.parse(Buffer.from(bytes.proof).toString()).candidates[0].candidate.interpretation)
    expect(snapshot.modelInterpreted.machineAssessment).toEqual(JSON.parse(Buffer.from(bytes.proof).toString()).candidates[0].validated.assessment)
    expect(snapshot.mechanicallyVerified.coverage.examined).toBe(20)
    expect(snapshot.modelInterpreted.evidence).toHaveLength(20)
  })
  it.each(DISPOSITIONS)("preserves %s and rationale without transferring authority to dissent", (disposition) => {
    const { snapshot, ledger, dissent } = snapshotFixture(disposition)
    expect(snapshot.humanReview.disposition).toBe(disposition)
    expect(snapshot.humanReview.epistemicClass).toBe("HUMAN-REVIEWED")
    expect(snapshot.humanReview.scope).toBe("Only the saved human disposition and rationale are recorded here. This class does not confirm model meaning, challenge materiality or participant meaning.")
    expect(snapshot.humanReview.currentEvent).toEqual(ledger.events[0])
    expect(snapshot.humanReview.rationale).toBe(ledger.events[0].rationale)
    expect(snapshot.humanReview.history).toEqual(ledger.events)
    expect(snapshot.humanReview.revisedWording).toBe(ledger.events[0].revisedWording)
    expect(snapshot.unseenDissent.challenge).toEqual(dissent.challenges[0])
    expect(snapshot.unseenDissent.challenge!.findings[0].status).toBe("POTENTIAL_UNSEEN_DISSENT")
    expect(snapshot.unseenDissent.epistemicClass).toBe("MODEL-INTERPRETED")
    if (disposition === "HOLD_DISSONANCE") expect(snapshot.humanReview.meaning).toContain("Unresolved")
  })
  it("preserves exact dissent quotation, source, offsets and original relationship", () => {
    const { snapshot, dissent } = snapshotFixture()
    const actual = snapshot.unseenDissent.challenge!.findings[0], original = dissent.challenges[0].findings[0]
    expect(actual).toEqual(original)
    expect(actual.originalTestimony.slice(actual.start, actual.end)).toBe(actual.quote)
    expect(actual.originalRelationships[0].kind).toBe("SUPPORT")
  })
  it("distinguishes zero findings, absent dissent, absent reviews and an unreviewed candidate", () => {
    const { bytes, request, snapshot } = snapshotFixture("CONFIRM", false)
    expect(snapshot.unseenDissent.state).toBe("VALIDATED_ZERO_FINDINGS")
    expect(snapshot.unseenDissent.messages).toEqual(["No potential unseen dissent was surfaced by this challenge run.", "This does not establish that no dissent exists."])
    const absent = { ...bytes, reviews: null, dissent: null }
    const result = composeSnapshot(absent, { ...request, expectedBindings: inputBindings(absent) }, SNAPSHOT_TEST_TIME)
    expect(result.unseenDissent.state).toBe("ABSENT")
    expect(result.unseenDissent.challenge).toBeNull()
    expect(result.inputs.dissent.sha256).toBeNull()
    expect(result.humanReview.ledgerState).toBe("ABSENT")
    expect(result.humanReview.disposition).toBeNull()
    expect(result.humanReview.epistemicClass).toBe("UNRESOLVED")
    expect(composeSnapshot(bytes, { ...request, candidateId: "CAND-002" }, SNAPSHOT_TEST_TIME).humanReview.meaning).toBe("No human disposition has been recorded.")
  })
  it.each(["reviews", "dissent"] as const)("blocks invalid %s even with its new fingerprint", (key) => {
    const { bytes, request } = snapshotFixture()
    const broken = { ...bytes, [key]: Buffer.from('{"invalid":true}') }
    expect(() => composeSnapshot(broken, { ...request, expectedBindings: inputBindings(broken) }, SNAPSHOT_TEST_TIME)).toThrow(`Invalid ${key}`)
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("rejects changed %s bytes and stale external bindings", (key) => {
    const { bytes, request, snapshot } = snapshotFixture()
    const changed = { ...bytes, [key]: Buffer.concat([Buffer.from(bytes[key]!), Buffer.from(" ")]) }
    expect(() => composeSnapshot(changed, request, SNAPSHOT_TEST_TIME)).toThrow("input changed")
    expect(() => validateSnapshot(snapshot, { runId: request.runId, bindings: inputBindings(changed) })).toThrow("input changed")
  })
  it("rejects presence changes, invalid source/proof and stale B/C proof associations", () => {
    const { bytes, request } = snapshotFixture()
    expect(() => composeSnapshot({ ...bytes, dissent: null }, request, SNAPSHOT_TEST_TIME)).toThrow()
    for (const key of ["source", "proof"] as const) {
      const broken = { ...bytes, [key]: Buffer.from("{}") }
      expect(() => composeSnapshot(broken, { ...request, expectedBindings: inputBindings(broken) }, SNAPSHOT_TEST_TIME)).toThrow()
    }
    for (const key of ["reviews", "dissent"] as const) {
      const artifact = JSON.parse(Buffer.from(bytes[key]!).toString()); artifact.proofSha256 = sha256("different proof")
      const changed = { ...bytes, [key]: Buffer.from(JSON.stringify(artifact)) }
      expect(() => composeSnapshot(changed, { ...request, expectedBindings: inputBindings(changed) }, SNAPSHOT_TEST_TIME)).toThrow(`Invalid ${key}`)
    }
  })
  it.each(["trustScore", "consensus", "semanticCorrectness", "participantConfirmedMeaning"])("rejects unsupported %s authority", (field) => {
    expect(() => validateSnapshot({ ...snapshotFixture().snapshot, [field]: true })).toThrow("unsupported authority")
  })
  it("rejects nested authority tampering, corrupted embedded bytes and candidate/run mismatch", () => {
    const { snapshot, request } = snapshotFixture()
    const changed = structuredClone(snapshot); changed.humanReview.disposition = "REJECT"
    expect(() => validateSnapshot(changed)).toThrow()
    const altered = structuredClone(snapshot); altered.unseenDissent.challenge!.findings[0].start++
    expect(() => validateSnapshot(altered)).toThrow()
    const corrupt = structuredClone(snapshot); corrupt.inputs.reviews.bytesBase64 = Buffer.from("{}").toString("base64")
    expect(() => validateSnapshot(corrupt)).toThrow("fingerprint mismatch")
    expect(() => validateSnapshot(snapshot, { runId: "run-other", bindings: request.expectedBindings })).toThrow("selection mismatch")
    expect(() => validateSnapshot(snapshot, { runId: request.runId, candidateId: "CAND-003", bindings: request.expectedBindings })).toThrow("selection mismatch")
  })
  it("writes a separate ignored artifact once and preserves every upstream byte", () => {
    const { root, request, bytes } = diskFixture()
    const saved = saveSnapshot(root, request, SNAPSHOT_TEST_TIME)
    const frozenBytes = readFileSync(join(root, saved.path))
    expect(validateSnapshot(JSON.parse(frozenBytes.toString()))).toEqual(saved.snapshot)
    expect(() => saveSnapshot(root, request, SNAPSHOT_TEST_TIME)).toThrow(/EEXIST/)
    expect(readFileSync(join(root, saved.path))).toEqual(frozenBytes)
    expect(inputBindings(readSnapshotInputs(root, request.runId))).toEqual(inputBindings(bytes))
    expect(execFileSync("git", ["check-ignore", saved.path], { encoding: "utf8" })).toContain("trust-evidence-")
  })
  it("exposes invalid dissent as a blocker, not zero findings, and writes no snapshot", () => {
    const { root, dir, request } = diskFixture()
    writeFileSync(join(dir, "dissent.json"), "{}")
    const page = loadSnapshotPage(root, request.runId, request.expectedBindings.proof)
    expect(page.dissentState).toBe("INVALID")
    expect(page.issue).toContain("no zero-finding result")
    expect(page.bindings).toBeNull()
    expect(() => saveSnapshot(root, { ...request, expectedBindings: inputBindings(readSnapshotInputs(root, request.runId)) }, SNAPSHOT_TEST_TIME)).toThrow()
    expect(readdirSync(dir).some((name) => name.startsWith("trust-evidence-"))).toBe(false)
  })
  it("rejects stale selection for creation and display; preserves stale snapshots on disk", () => {
    const { root, dir, request } = diskFixture()
    const saved = saveSnapshot(root, request, SNAPSHOT_TEST_TIME)
    expect(loadSnapshotPage(root, request.runId, request.expectedBindings.proof).saved).toHaveLength(1)
    expect(loadSnapshotPage(root, request.runId, sha256("wrong selected proof")).saved).toEqual([])
    expect(() => saveSnapshot(root, { ...request, expectedBindings: { ...request.expectedBindings, proof: sha256("wrong") } })).toThrow("Selected proof changed")
    writeFileSync(join(dir, "reviews.json"), Buffer.concat([readFileSync(join(dir, "reviews.json")), Buffer.from(" ")]))
    const page = loadSnapshotPage(root, request.runId, request.expectedBindings.proof)
    expect(page.saved).toEqual([])
    expect(page.warnings[0]).toContain("stale snapshot preserved")
    expect(readFileSync(join(root, saved.path)).length).toBeGreaterThan(0)
  })
})
