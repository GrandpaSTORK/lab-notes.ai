import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { DISPOSITIONS } from "./policy-evidence-review"
import { composeSnapshot, inputBindings } from "./policy-evidence-snapshot"
import { snapshotFixture, SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"
import { projectDecisionBrief } from "./policy-evidence-brief"
import { loadDecisionBrief } from "./policy-evidence-brief-store"

function input(snapshot = snapshotFixture().snapshot) {
  const bytes = Buffer.from(JSON.stringify(snapshot, null, 2))
  const identity = { runId: snapshot.runId, candidateId: snapshot.candidateId, name: `trust-evidence-${snapshot.candidateId}-20260908120000000.json`, sha256: sha256(bytes) }
  return { bytes, identity, current: { runId: snapshot.runId, bindings: snapshot.bindings } }
}
function diskFixture() {
  const fixture = snapshotFixture(), packed = input(fixture.snapshot)
  const root = mkdtempSync(join(tmpdir(), "gaia-brief-test-")), dir = join(root, ".local/gaia/policy-evidence/run-test")
  mkdirSync(dir, { recursive: true }); mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), fixture.bytes.source)
  for (const key of ["proof", "reviews", "dissent"] as const) writeFileSync(join(dir, `${key}.json`), fixture.bytes[key]!)
  writeFileSync(join(dir, packed.identity.name), packed.bytes)
  return { ...fixture, packed, root, dir }
}
describe("BUILD-001E read-only projection", () => {
  it("is deterministic and preserves exact wording, evidence, limitations and snapshot identity", () => {
    const fixture = snapshotFixture(), { bytes, identity, current } = input(fixture.snapshot)
    const before = sha256(bytes)
    const brief = projectDecisionBrief(bytes, identity, current)
    expect(projectDecisionBrief(bytes, identity, current)).toEqual(brief)
    expect(brief.interpretation.wording).toBe(fixture.snapshot.modelInterpreted.originalMachineWording)
    expect(brief.evidenceState.evidence).toEqual(fixture.snapshot.modelInterpreted.evidence)
    expect(brief.unresolved).toEqual(fixture.snapshot.unresolved)
    expect(brief.trace.snapshotSha256).toBe(before)
    expect(sha256(bytes)).toBe(before)
    expect(brief.trace.localAgreement).toBe("MATCHES_SELECTED_LOCAL_INPUTS")
  })
  it.each(DISPOSITIONS)("preserves %s, rationale, revision and HUMAN-REVIEWED scope", (disposition) => {
    const snapshot = snapshotFixture(disposition).snapshot, { bytes, identity } = input(snapshot)
    const brief = projectDecisionBrief(bytes, identity)
    expect(brief.humanReview).toEqual(snapshot.humanReview)
    expect(brief.humanReview.disposition).toBe(disposition)
    expect(brief.humanReview.epistemicClass).toBe("HUMAN-REVIEWED")
    expect(brief.humanReview.scope).toBe("Only the saved human disposition and rationale are recorded here. This class does not confirm model meaning, challenge materiality or participant meaning.")
    expect(brief.unseenDissent).toEqual(snapshot.unseenDissent)
    expect(brief.unseenDissent.challenge!.findings[0].status).toBe("POTENTIAL_UNSEEN_DISSENT")
  })
  it("preserves dissent source/quote/offsets/original relationship, model explanations and provenance", () => {
    const snapshot = snapshotFixture().snapshot, { bytes, identity } = input(snapshot)
    const challenge = projectDecisionBrief(bytes, identity).unseenDissent.challenge!
    expect(challenge).toEqual(snapshot.unseenDissent.challenge)
    const finding = challenge.findings[0]
    expect(finding.originalTestimony.slice(finding.start, finding.end)).toBe(finding.quote)
    expect(finding.originalRelationships[0].kind).toBe("SUPPORT")
  })
  it("keeps absent dissent distinct from validated zero findings and unreviewed state unresolved", () => {
    const fixture = snapshotFixture("CONFIRM", false), zero = input(fixture.snapshot)
    expect(projectDecisionBrief(zero.bytes, zero.identity).unseenDissent.messages).toEqual(["No potential unseen dissent was surfaced by this challenge run.", "This does not establish that no dissent exists."])
    const absentBytes = { ...fixture.bytes, dissent: null, reviews: null }
    const absent = input(composeSnapshot(absentBytes, { ...fixture.request, expectedBindings: inputBindings(absentBytes) }, SNAPSHOT_TEST_TIME))
    const brief = projectDecisionBrief(absent.bytes, absent.identity)
    expect(brief.unseenDissent.state).toBe("ABSENT")
    expect(brief.trace.bindings.dissent).toBeNull()
    expect(brief.humanReview.epistemicClass).toBe("UNRESOLVED")
    expect(brief.humanReview.disposition).toBeNull()
    expect(brief.trace.bindings.reviews).toBeNull()
  })
  it.each(["recommendation", "confidence", "consensus", "participantConfirmedMeaning", "dissentMateriality"])("rejects unsupported authority field %s", (key) => {
    const snapshot = { ...snapshotFixture().snapshot, [key]: true }, { bytes, identity } = input(snapshot)
    expect(() => projectDecisionBrief(bytes, identity)).toThrow()
  })
  it("rejects corrupted JSON, fingerprint mismatch, altered embedded bytes and run/candidate mismatch", () => {
    const { bytes, identity } = input()
    expect(() => projectDecisionBrief(Buffer.from("{"), { ...identity, sha256: sha256("{") })).toThrow()
    expect(() => projectDecisionBrief(bytes, { ...identity, sha256: sha256("wrong") })).toThrow("fingerprint mismatch")
    expect(() => projectDecisionBrief(bytes, { ...identity, runId: "run-other" })).toThrow("selection mismatch")
    expect(() => projectDecisionBrief(bytes, { ...identity, candidateId: "CAND-002" })).toThrow("selection mismatch")
    const snapshot = snapshotFixture().snapshot
    snapshot.inputs.proof.bytesBase64 = Buffer.from("{}").toString("base64")
    const altered = input(snapshot)
    expect(() => projectDecisionBrief(altered.bytes, altered.identity)).toThrow()
  })
  it.each(["INVALID", "ABSENT", "VALIDATED_ZERO_FINDINGS"])("rejects tampered dissent state %s instead of coercing it", (state) => {
    const snapshot = snapshotFixture().snapshot
    snapshot.unseenDissent.state = state
    const { bytes, identity } = input(snapshot)
    expect(() => projectDecisionBrief(bytes, identity)).toThrow()
  })
  it("rejects invalid embedded dissent even if its fingerprint is recomputed", () => {
    const snapshot = snapshotFixture().snapshot, malformed = Buffer.from("{}")
    snapshot.inputs.dissent.bytesBase64 = malformed.toString("base64")
    snapshot.inputs.dissent.sha256 = sha256(malformed); snapshot.bindings.dissent = sha256(malformed)
    const { bytes, identity } = input(snapshot)
    expect(() => projectDecisionBrief(bytes, identity)).toThrow("Invalid dissent")
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("separates portable validity from changed current %s", (key) => {
    const { bytes, identity, current } = input()
    const historical = projectDecisionBrief(bytes, identity, { ...current, bindings: { ...current.bindings, [key]: sha256("changed") } })
    expect(historical.trace.portableValidity).toBe("VALIDATED_AGAINST_EMBEDDED_BYTES")
    expect(historical.trace.localAgreement).toBe("HISTORICAL_INPUTS_DIFFER")
    expect(historical.trace.localBoundary).toContain("not current local evidence")
    expect(projectDecisionBrief(bytes, identity).trace.localAgreement).toBe("NOT_CHECKED")
  })
  it("preserves every upstream/snapshot byte and directory entry during current and historical loading", () => {
    const { root, dir, packed } = diskFixture()
    const paths = [join(root, SOURCE_PATH), ...readdirSync(dir).map((name) => join(dir, name))]
    const before = paths.map((path) => sha256(readFileSync(path))), entries = readdirSync(dir)
    const page = loadDecisionBrief(root, "run-test", packed.current.bindings.proof)
    expect(page.issue).toBeNull()
    expect(page.brief?.trace.localAgreement).toBe("MATCHES_SELECTED_LOCAL_INPUTS")
    expect(Buffer.from(page.downloadHref!.split(",")[1], "base64")).toEqual(packed.bytes)
    expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(before)
    expect(readdirSync(dir)).toEqual(entries)
    // External test edit makes this snapshot historical; the loader must not overwrite it.
    writeFileSync(join(dir, "reviews.json"), Buffer.concat([readFileSync(join(dir, "reviews.json")), Buffer.from(" ")]))
    const historicalBefore = paths.map((path) => sha256(readFileSync(path)))
    expect(loadDecisionBrief(root, "run-test", packed.current.bindings.proof).brief?.trace.localAgreement).toBe("HISTORICAL_INPUTS_DIFFER")
    expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(historicalBefore)
  })
  it("blocks an explicitly invalid snapshot without fallback, migration or repair", () => {
    const { root, dir, packed } = diskFixture(), name = "trust-evidence-CAND-001-20260908130000000.json"
    writeFileSync(join(dir, name), "{}")
    const result = loadDecisionBrief(root, "run-test", packed.current.bindings.proof, name)
    expect(result.brief).toBeNull()
    expect(result.issue).toContain("Invalid dissent is not zero findings")
    expect(result.downloadHref).toBeNull()
    expect(readFileSync(join(dir, name), "utf8")).toBe("{}")
    expect(loadDecisionBrief(root, "run-test", packed.current.bindings.proof).brief).toBeNull()
    expect(loadDecisionBrief(root, "run-test", packed.current.bindings.proof, packed.identity.name).issue).toBeNull()
  })
  it("rejects stale selected proof, unsafe paths and repeated query values", () => {
    const { root, packed } = diskFixture()
    expect(loadDecisionBrief(root, "run-test", sha256("stale")).brief).toBeNull()
    expect(loadDecisionBrief(root, "run-test", packed.current.bindings.proof, "../proof.json").brief).toBeNull()
    expect(loadDecisionBrief(root, "run-test", packed.current.bindings.proof, [packed.identity.name]).brief).toBeNull()
  })
})
