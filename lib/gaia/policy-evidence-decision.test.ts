import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it, vi } from "vitest"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { DISPOSITIONS } from "./policy-evidence-review"
import { loadDecisionBrief } from "./policy-evidence-brief-store"
import { projectDecisionBrief } from "./policy-evidence-brief"
import { createDecisionRecord, decisionRequestSchema, validateDecisionRecord } from "./policy-evidence-decision"
import { loadDecisionPage, saveDecision } from "./policy-evidence-decision-store"
import { decisionFixture } from "./policy-evidence-decision.test-support"
import { SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"
import { ZERO_DISSENT } from "./policy-evidence-snapshot-boundary"

function diskFixture() {
  const fixture = decisionFixture(), root = mkdtempSync(join(tmpdir(), "gaia-decision-test-"))
  const dir = join(root, ".local/gaia/policy-evidence/run-test")
  mkdirSync(dir, { recursive: true }); mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), fixture.bytes.source)
  for (const key of ["proof", "reviews", "dissent"] as const) writeFileSync(join(dir, `${key}.json`), fixture.bytes[key]!)
  writeFileSync(join(dir, fixture.identity.name), fixture.snapshotBytes)
  const load = () => loadDecisionPage(root, loadDecisionBrief(root, "run-test", fixture.current.bindings.proof, fixture.identity.name))
  return { ...fixture, root, dir, load }
}
describe("BUILD-001F human-authored, mechanically traced records", () => {
  it("constructs deterministically, preserves verbatim human text and exact snapshot/brief/four-input trace", () => {
    const f = decisionFixture(), request = f.decisionRequest
    const record = createDecisionRecord(f.snapshotBytes, request, f.current, SNAPSHOT_TEST_TIME)
    expect(createDecisionRecord(f.snapshotBytes, request, f.current, SNAPSHOT_TEST_TIME)).toEqual(record)
    expect(validateDecisionRecord(JSON.parse(JSON.stringify(record)))).toEqual(record)
    expect(record.humanDecision.decisionText).toBe(request.decisionText)
    expect(record.humanDecision.rationale).toBe(request.rationale)
    expect(record.humanDecision.decisionMaker).toBe(request.decisionMaker)
    expect(record.humanDecision.role).toBe(request.role)
    expect(record.humanDecision.decisionAuthority).toBe(request.decisionAuthority)
    expect(record.trace.selection).toEqual(request.selection)
    expect(record.trace.bindings).toEqual(f.snapshot.bindings)
    expect(Buffer.from(record.frozenEvidence.snapshotBytesBase64, "base64")).toEqual(f.snapshotBytes)
    expect(record.unresolved).toEqual(f.snapshot.unresolved)
    expect(record.decisionStatus).toBe("RECORDED")
  })
  it.each(DISPOSITIONS)("never upgrades %s or potential dissent when a decision is recorded", (disposition) => {
    const f = decisionFixture("findings", disposition)
    const record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
    expect(record.humanReview).toEqual(f.snapshot.humanReview)
    expect(record.humanReview.disposition).toBe(disposition)
    expect(record.humanReview.epistemicClass).toBe("HUMAN-REVIEWED")
    expect(record.unseenDissent).toEqual(f.snapshot.unseenDissent)
    const finding = record.unseenDissent.challenge!.findings[0]
    expect(finding.status).toBe("POTENTIAL_UNSEEN_DISSENT")
    expect(finding.originalTestimony.slice(finding.start, finding.end)).toBe(finding.quote)
    expect(finding.originalRelationships[0].kind).toBe("SUPPORT")
  })
  it.each(["zero", "absent"] as const)("preserves %s dissent without resolving uncertainty", (state) => {
    const f = decisionFixture(state)
    const record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
    expect(record.unseenDissent).toEqual(f.snapshot.unseenDissent)
    expect(record.unseenDissent.state).toBe(state === "zero" ? "VALIDATED_ZERO_FINDINGS" : "ABSENT")
    if (state === "zero") expect(record.unseenDissent.messages).toEqual(ZERO_DISSENT)
    else { expect(record.trace.bindings.dissent).toBeNull(); expect(record.unseenDissent.messages).not.toContain(ZERO_DISSENT[0]) }
  })
  it.each(["decisionText", "rationale", "decisionMaker", "role", "decisionAuthority"] as const)("rejects absent or blank %s without normalizing text", (key) => {
    const f = decisionFixture()
    for (const value of [undefined, "", " \n\t "]) expect(() => decisionRequestSchema.parse({ ...f.decisionRequest, [key]: value })).toThrow()
  })
  it("requires explicit acknowledgement and synthetic identity disclosure", () => {
    const f = decisionFixture()
    expect(() => decisionRequestSchema.parse({ ...f.decisionRequest, unresolvedAcknowledged: false })).toThrow()
    expect(() => decisionRequestSchema.parse({ ...f.decisionRequest, demonstration: "REAL_POLICY_OWNER" })).toThrow()
  })
  it.each(["recommendation", "confidence", "trust", "readiness", "consensus", "decisionCorrect", "participantConfirmedMeaning"])("rejects unsupported authority field %s", (field) => {
    const f = decisionFixture(), record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
    expect(record).not.toHaveProperty(field)
    expect(() => validateDecisionRecord({ ...record, [field]: true })).toThrow("unsupported authority")
    expect(() => decisionRequestSchema.parse({ ...f.decisionRequest, [field]: true })).toThrow()
    expect(() => validateDecisionRecord({ ...record, humanDecision: { ...record.humanDecision, [field]: true } })).toThrow()
  })
  it("rejects tampered decision status, boundary, review, dissent and embedded snapshot bytes", () => {
    const f = decisionFixture(), record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
    for (const altered of [
      { ...record, decisionStatus: "APPROVED" }, { ...record, authority: "GAIA approved" },
      { ...record, evidenceBoundary: "Dissent resolved" }, { ...record, humanReview: { ...record.humanReview, disposition: "REJECT" } },
      { ...record, unseenDissent: { ...record.unseenDissent, state: "VALIDATED_ZERO_FINDINGS" } },
      { ...record, frozenEvidence: { snapshotBytesBase64: Buffer.from("{}").toString("base64") } },
    ]) expect(() => validateDecisionRecord(altered)).toThrow()
  })
  it("blocks invalid embedded dissent even with recomputed outer snapshot fingerprints", () => {
    const f = decisionFixture(), invalid = Buffer.from("{}")
    f.snapshot.inputs.dissent.bytesBase64 = invalid.toString("base64")
    f.snapshot.inputs.dissent.sha256 = sha256(invalid); f.snapshot.bindings.dissent = sha256(invalid)
    const bytes = Buffer.from(JSON.stringify(f.snapshot)), request = structuredClone(f.decisionRequest)
    request.selection.snapshotSha256 = sha256(bytes); request.selection.bindings.dissent = sha256(invalid)
    expect(() => createDecisionRecord(bytes, request, { ...f.current, bindings: request.selection.bindings }, SNAPSHOT_TEST_TIME)).toThrow("Invalid dissent")
  })
  it.each(["snapshotSha256", "briefSha256"] as const)("rejects changed %s", (key) => {
    const f = decisionFixture(), request = structuredClone(f.decisionRequest)
    request.selection[key] = sha256("changed")
    expect(() => createDecisionRecord(f.snapshotBytes, request, f.current, SNAPSHOT_TEST_TIME)).toThrow(/fingerprint/)
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("rejects changed current %s and permits only historical validation of an existing record", (key) => {
    const f = decisionFixture(), record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
    const current = { ...f.current, bindings: { ...f.current.bindings, [key]: sha256("changed") } }
    expect(() => createDecisionRecord(f.snapshotBytes, f.decisionRequest, current, SNAPSHOT_TEST_TIME)).toThrow()
    expect(validateDecisionRecord(record)).toEqual(record)
    expect(() => validateDecisionRecord(record, { ...f.decisionRequest.selection, bindings: current.bindings })).toThrow("selection changed")
    const altered = structuredClone(f.decisionRequest); altered.selection.bindings = current.bindings
    expect(() => createDecisionRecord(f.snapshotBytes, altered, current, SNAPSHOT_TEST_TIME)).toThrow()
  })
  it("rejects wrong run/candidate and a historical run passed as current", () => {
    const f = decisionFixture()
    expect(() => createDecisionRecord(f.snapshotBytes, f.decisionRequest, { ...f.current, runId: "run-other" }, SNAPSHOT_TEST_TIME)).toThrow("Historical")
    for (const selection of [{ ...f.decisionRequest.selection, candidateId: "CAND-002" }, { ...f.decisionRequest.selection, runId: "run-other" }]) {
      expect(() => createDecisionRecord(f.snapshotBytes, { ...f.decisionRequest, selection }, { ...f.current, runId: selection.runId }, SNAPSHOT_TEST_TIME)).toThrow("selection mismatch")
    }
  })
  it("exclusively creates a separate record, reloads it, makes no model call and preserves all upstream hashes", () => {
    const f = diskFixture(), paths = [join(f.root, SOURCE_PATH), ...readdirSync(f.dir).map((name) => join(f.dir, name))]
    const before = paths.map((path) => sha256(readFileSync(path))), entries = readdirSync(f.dir)
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("No model/network call permitted"))
    try {
      expect(f.load().canRecord).toBe(true)
      const saved = saveDecision(f.root, f.decisionRequest, SNAPSHOT_TEST_TIME)
      expect(f.load().saved).toEqual([saved])
      const savedBytes = readFileSync(join(f.root, saved.path))
      expect(sha256(savedBytes)).toBe(saved.sha256)
      expect(() => saveDecision(f.root, f.decisionRequest, SNAPSHOT_TEST_TIME)).toThrow(/EEXIST/)
      expect(readFileSync(join(f.root, saved.path))).toEqual(savedBytes)
      expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(before)
      expect(readdirSync(f.dir).filter((name) => !name.startsWith("human-decision-"))).toEqual(entries)
      expect(saved.path).toMatch(/\/human-decision-[\da-f-]+\.json$/)
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally { fetchSpy.mockRestore() }
  })
  it.each(["source", "proof", "reviews", "dissent", "snapshot"] as const)("fails stale browser saves when the selected %s bytes changed, with no artifact written", (key) => {
    const f = diskFixture(), path = key === "source" ? join(f.root, SOURCE_PATH) : join(f.dir, key === "snapshot" ? f.identity.name : `${key}.json`)
    const displayed = loadDecisionBrief(f.root, "run-test", f.current.bindings.proof, f.identity.name)
    writeFileSync(path, Buffer.concat([readFileSync(path), Buffer.from(" ")]))
    const before = readFileSync(path), entries = readdirSync(f.dir)
    expect(() => saveDecision(f.root, f.decisionRequest, SNAPSHOT_TEST_TIME)).toThrow()
    expect(readFileSync(path)).toEqual(before)
    expect(readdirSync(f.dir)).toEqual(entries)
    expect(loadDecisionPage(f.root, displayed).canRecord).toBe(false)
    // A fresh selection may validate the changed snapshot bytes; the old draft still cannot save.
    if (key === "snapshot") expect(f.load().selection?.snapshotSha256).not.toBe(f.decisionRequest.selection.snapshotSha256)
    else expect(f.load().canRecord).toBe(false)
  })
  it("shows saved historical records without enabling creation, and never transfers records to another snapshot", () => {
    const f = diskFixture(), saved = saveDecision(f.root, f.decisionRequest, SNAPSHOT_TEST_TIME)
    writeFileSync(join(f.dir, "reviews.json"), "{}")
    const page = f.load()
    expect(page.canRecord).toBe(false)
    expect(page.saved[0].localAgreement).toBe("HISTORICAL_OR_NOT_CHECKED")
    expect(page.saved[0].record).toEqual(saved.record)
    const name = "trust-evidence-CAND-001-20260908130000000.json"
    writeFileSync(join(f.dir, name), f.snapshotBytes)
    const other = loadDecisionPage(f.root, loadDecisionBrief(f.root, "run-test", f.current.bindings.proof, name))
    expect(other.saved).toEqual([])
  })
  it("blocks invalid snapshots/dissent and preserves invalid decision files without repair", () => {
    const f = diskFixture(), saved = saveDecision(f.root, f.decisionRequest, SNAPSHOT_TEST_TIME)
    writeFileSync(join(f.root, saved.path), "{}")
    expect(f.load().warnings[0]).toContain("invalid decision record preserved")
    expect(f.load().saved).toEqual([])
    expect(readFileSync(join(f.root, saved.path), "utf8")).toBe("{}")
    writeFileSync(join(f.dir, "dissent.json"), "{}")
    expect(() => saveDecision(f.root, { ...f.decisionRequest, decisionId: "10000000-0000-4000-8000-000000000002" }, SNAPSHOT_TEST_TIME)).toThrow()
    writeFileSync(join(f.dir, f.identity.name), "{}")
    expect(f.load().selection).toBeNull()
    expect(f.load().issue).toContain("invalid evidence")
  })
  it("binds the canonical brief independently of historical/current presentation metadata", () => {
    const f = decisionFixture()
    const displayed = projectDecisionBrief(f.snapshotBytes, f.identity, f.current)
    expect(sha256(JSON.stringify(displayed))).not.toBe(f.decisionRequest.selection.briefSha256)
    expect(sha256(JSON.stringify(projectDecisionBrief(f.snapshotBytes, f.identity)))).toBe(f.decisionRequest.selection.briefSha256)
  })
})
