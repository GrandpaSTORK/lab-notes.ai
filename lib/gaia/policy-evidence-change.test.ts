import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { describe, expect, it } from "vitest"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { compareDecisionEvidence, availableCurrentEvidence, validateDecisionChangeNotice } from "./policy-evidence-change"
import { loadDecisionChangePage } from "./policy-evidence-change-store"
import { changeFixture } from "./policy-evidence-change.test-support"

function diskFixture() {
  const f = changeFixture(), root = mkdtempSync(join(tmpdir(), "gaia-change-test-")), dir = join(root, ".local/gaia/policy-evidence/run-test")
  mkdirSync(dir, { recursive: true }); mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), f.bytes.source)
  for (const key of ["proof", "reviews", "dissent"] as const) writeFileSync(join(dir, `${key}.json`), f.bytes[key]!)
  writeFileSync(join(dir, f.identity.name), f.snapshotBytes)
  const recordPath = join(dir, `human-decision-${f.record.decisionId}.json`)
  writeFileSync(recordPath, JSON.stringify(f.record, null, 2))
  return { ...f, root, dir, recordPath }
}
describe("BUILD-001G read-only identities, never decision judgments", () => {
  it("is deterministic and validates identical four-binding comparison", () => {
    const f = changeFixture(), notice = compareDecisionEvidence(f.record, f.current)
    expect(compareDecisionEvidence(f.record, f.current)).toEqual(notice)
    expect(validateDecisionChangeNotice(notice, f.record, f.current)).toEqual(notice)
    expect(notice.state).toBe("RECORDED_EVIDENCE_MATCHES_CURRENT")
    expect(notice.rows.map((row) => row.input)).toEqual(["source", "proof", "reviews", "dissent"])
    expect(notice.rows.every((row) => row.comparison === "MATCH" && row.current.state === "VALIDATED")).toBe(true)
    expect(notice.historicalRecord).toEqual(f.record)
  })
  it.each(["reviews", "dissent"] as const)("detects a validated changed %s only, even when only byte formatting changed", (key) => {
    const f = changeFixture(), bytes = { ...f.bytes, [key]: Buffer.concat([f.bytes[key]!, Buffer.from(" ")]) }
    const notice = compareDecisionEvidence(f.record, availableCurrentEvidence(f.record.runId, bytes))
    expect(notice.state).toBe("CURRENT_EVIDENCE_DIFFERS")
    expect(notice.rows.filter((row) => row.comparison === "CHANGED").map((row) => row.input)).toEqual([key])
    expect(notice.rows.find((row) => row.input === key)?.current.sha256).toBe(sha256(bytes[key]!))
    expect(notice.historicalRecord.humanDecision).toEqual(f.record.humanDecision)
    expect(notice.historicalRecord.decisionStatus).toBe("RECORDED")
  })
  it("detects valid changed proof only when optional proof-bound inputs are absent", () => {
    const f = changeFixture(true), bytes = { ...f.bytes, proof: Buffer.concat([f.bytes.proof, Buffer.from(" ")]) }
    const notice = compareDecisionEvidence(f.record, availableCurrentEvidence(f.record.runId, bytes))
    expect(notice.state).toBe("CURRENT_EVIDENCE_DIFFERS")
    expect(notice.rows.filter((row) => row.comparison === "CHANGED").map((row) => row.input)).toEqual(["proof"])
  })
  it("does not weaken the sealed fixed-corpus validator for a changed source only", () => {
    const f = changeFixture(), bytes = { ...f.bytes, source: Buffer.concat([f.bytes.source, Buffer.from(" ")]) }
    const notice = compareDecisionEvidence(f.record, availableCurrentEvidence(f.record.runId, bytes))
    expect(notice.state).toBe("CURRENT_EVIDENCE_INVALID")
    expect(notice.rows[0].current).toEqual({ state: "INVALID", sha256: sha256(bytes.source) })
    expect(notice.rows.every((row) => row.comparison === "NOT_COMPARED")).toBe(true)
    expect(notice.historicalRecord).toEqual(f.record)
  })
  it.each(["reviews", "dissent"] as const)("distinguishes %s absent-to-present, present-to-absent and absent-to-absent", (key) => {
    const absent = changeFixture(true), present = changeFixture()
    const added = compareDecisionEvidence(absent.record, availableCurrentEvidence(absent.record.runId, { ...absent.bytes, [key]: present.bytes[key] }))
    expect(added.state).toBe("CURRENT_EVIDENCE_DIFFERS")
    expect(added.rows.find((row) => row.input === key)).toMatchObject({ recorded: { state: "ABSENT", sha256: null }, current: { state: "VALIDATED" }, comparison: "CHANGED" })
    const removed = compareDecisionEvidence(present.record, availableCurrentEvidence(present.record.runId, { ...present.bytes, [key]: null }))
    expect(removed.state).toBe("CURRENT_EVIDENCE_DIFFERS")
    expect(removed.rows.find((row) => row.input === key)).toMatchObject({ recorded: { state: "VALIDATED" }, current: { state: "ABSENT", sha256: null }, comparison: "CHANGED" })
    const unchanged = compareDecisionEvidence(absent.record, absent.current)
    expect(unchanged.state).toBe("RECORDED_EVIDENCE_MATCHES_CURRENT")
    expect(unchanged.rows.find((row) => row.input === key)).toMatchObject({ recorded: { state: "ABSENT" }, current: { state: "ABSENT" }, comparison: "MATCH" })
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("keeps invalid current %s distinct from changed, absent and zero findings", (key) => {
    const f = changeFixture(), bytes = { ...f.bytes, [key]: Buffer.from("{}") }
    const notice = compareDecisionEvidence(f.record, availableCurrentEvidence(f.record.runId, bytes))
    expect(notice.state).toBe("CURRENT_EVIDENCE_INVALID")
    expect(notice.rows.find((row) => row.input === key)?.current.state).toBe("INVALID")
    expect(notice.historicalValidity).toBe("VALIDATED_AGAINST_EMBEDDED_BYTES")
    expect(notice.historicalRecord).toEqual(f.record)
  })
  it("invalid dependent review/dissent binding takes precedence over a changed valid proof", () => {
    const f = changeFixture(), bytes = { ...f.bytes, proof: Buffer.concat([f.bytes.proof, Buffer.from(" ")]) }
    const notice = compareDecisionEvidence(f.record, availableCurrentEvidence(f.record.runId, bytes))
    expect(notice.state).toBe("CURRENT_EVIDENCE_INVALID")
    expect(notice.rows.find((row) => row.input === "proof")?.current.state).toBe("VALIDATED")
    expect(notice.rows.find((row) => row.input === "reviews")?.current.state).toBe("INVALID")
    expect(notice.rows.find((row) => row.input === "dissent")?.current.state).toBe("INVALID")
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("preserves history when current %s cannot be read", (key) => {
    const f = changeFixture(), current = availableCurrentEvidence(f.record.runId, f.bytes)
    current.inputs[key] = { state: "UNAVAILABLE" }
    const notice = compareDecisionEvidence(f.record, current)
    expect(notice.state).toBe("CURRENT_EVIDENCE_NOT_CHECKED")
    expect(notice.rows.find((row) => row.input === key)?.current).toEqual({ state: "UNAVAILABLE", sha256: null })
    expect(notice.historicalRecord.humanDecision).toEqual(f.record.humanDecision)
  })
  it("retains all historical authority and frozen testimony when no current check is available", () => {
    const f = changeFixture(), notice = compareDecisionEvidence(f.record, null)
    expect(notice.state).toBe("CURRENT_EVIDENCE_NOT_CHECKED")
    expect(notice.historicalRecord.decisionStatus).toBe("RECORDED")
    expect(notice.historicalRecord.humanReview.disposition).toBe("HOLD_DISSONANCE")
    expect(notice.historicalRecord.unseenDissent.challenge!.findings[0].status).toBe("POTENTIAL_UNSEEN_DISSENT")
    expect(notice.frozenBrief.fullSnapshot).toEqual(f.snapshot)
    expect(notice.historicalRecord.humanDecision).toEqual(f.record.humanDecision)
    expect(notice.historicalRecord.unresolved).toEqual(f.record.unresolved)
  })
  it.each(["recommendation", "confidence", "trust", "readiness", "consensus", "decisionCorrect", "materiality", "participantConfirmedMeaning"])("rejects unsupported %s without inferring semantic fields", (key) => {
    const f = changeFixture(), notice = compareDecisionEvidence(f.record, f.current)
    expect(notice).not.toHaveProperty(key)
    expect(() => validateDecisionChangeNotice({ ...notice, [key]: true }, f.record, f.current)).toThrow("unsupported authority")
    expect(() => compareDecisionEvidence({ ...f.record, [key]: true }, f.current)).toThrow()
    expect(() => compareDecisionEvidence(f.record, { ...f.current, [key]: true })).toThrow()
  })
  it("rejects tampered F status, human fields with wrong shape, embedded bytes and semantic notice states", () => {
    const f = changeFixture()
    for (const record of [ { ...f.record, decisionStatus: "REVERSED" },
      { ...f.record, humanDecision: { ...f.record.humanDecision, role: null } },
      { ...f.record, frozenEvidence: { snapshotBytesBase64: Buffer.from("{}").toString("base64") } },
    ]) expect(() => compareDecisionEvidence(record, f.current)).toThrow()
    const notice = compareDecisionEvidence(f.record, f.current)
    expect(() => validateDecisionChangeNotice({ ...notice, state: "DECISION_APPROVED" }, f.record, f.current)).toThrow()
  })
  it("loads without changing source/proof/reviews/dissent/snapshot/decision bytes or directory entries", () => {
    const f = diskFixture(), paths = [join(f.root, SOURCE_PATH), ...readdirSync(f.dir).map((name) => join(f.dir, name))]
    const before = paths.map((path) => sha256(readFileSync(path))), names = readdirSync(f.dir)
    const page = loadDecisionChangePage(f.root)
    expect(page.issue).toBeNull()
    expect(page.notice?.state).toBe("RECORDED_EVIDENCE_MATCHES_CURRENT")
    expect(page.recordSha256).toBe(sha256(readFileSync(f.recordPath)))
    expect(Buffer.from(page.recordDownload!.split(",")[1], "base64")).toEqual(readFileSync(f.recordPath))
    expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(before)
    expect(readdirSync(f.dir)).toEqual(names)
  })
  it.each(["source", "proof", "reviews", "dissent"] as const)("does not hide history or use a fallback when on-disk %s is invalid", (key) => {
    const f = diskFixture(), path = key === "source" ? join(f.root, SOURCE_PATH) : join(f.dir, `${key}.json`)
    writeFileSync(path, "{}")
    const before = readFileSync(f.recordPath), page = loadDecisionChangePage(f.root)
    expect(page.notice?.state).toBe("CURRENT_EVIDENCE_INVALID")
    expect(page.notice?.historicalRecord.humanDecision).toEqual(f.record.humanDecision)
    expect(readFileSync(path, "utf8")).toBe("{}")
    expect(readFileSync(f.recordPath)).toEqual(before)
  })
  it("keeps historical access after the standalone D snapshot and current proof become unavailable", () => {
    const f = diskFixture()
    unlinkSync(join(f.dir, f.identity.name)); unlinkSync(join(f.dir, "proof.json"))
    const page = loadDecisionChangePage(f.root)
    expect(page.notice?.state).toBe("CURRENT_EVIDENCE_NOT_CHECKED")
    expect(page.notice?.historicalRecord).toEqual(f.record)
    expect(page.notice?.frozenBrief.fullSnapshot).toEqual(f.snapshot)
  })
  it("does not silently select a different record or run for malformed, repeated or mismatched requests", () => {
    const f = diskFixture()
    for (const [run, id] of [["../run-test", f.record.decisionId], ["run-test", "../proof.json"], [["run-test"], f.record.decisionId], ["run-other", f.record.decisionId]]) {
      expect(loadDecisionChangePage(f.root, run, id).notice).toBeNull()
    }
    expect(loadDecisionChangePage(f.root, undefined, undefined, ["run-test"]).notice).toBeNull()
    writeFileSync(f.recordPath, "{}")
    expect(loadDecisionChangePage(f.root).notice).toBeNull()
    expect(readFileSync(f.recordPath, "utf8")).toBe("{}")
  })
})
