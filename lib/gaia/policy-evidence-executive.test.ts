import { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"
import { tmpdir } from "node:os"
import { expect, it } from "vitest"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { aggregateStoredThemes, projectExecutiveSnapshot, validateExecutiveProjection } from "./policy-evidence-executive"
import { executiveFixture } from "./policy-evidence-executive.test-support"
import { loadExecutivePage } from "./policy-evidence-executive-store"
import { loadDecisionBrief } from "./policy-evidence-brief-store"
import { loadDecisionPage } from "./policy-evidence-decision-store"
import { loadDecisionChangePage } from "./policy-evidence-change-store"

function diskFixture() {
  const f = executiveFixture(), root = mkdtempSync(join(tmpdir(), "gaia-executive-test-")), dir = join(root, ".local/gaia/policy-evidence/run-test")
  mkdirSync(dir, { recursive: true }); mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), f.bytes.source)
  for (const key of ["proof", "reviews", "dissent"] as const) writeFileSync(join(dir, `${key}.json`), f.bytes[key]!)
  writeFileSync(join(dir, f.identity.name), f.snapshotBytes)
  const recordPath = join(dir, `human-decision-${f.record.decisionId}.json`)
  writeFileSync(recordPath, JSON.stringify(f.record, null, 2))
  const load = () => {
    const brief = loadDecisionBrief(root, f.identity.runId, f.current.bindings.proof, f.identity.name)
    return loadExecutivePage(root, brief, loadDecisionPage(root, brief), loadDecisionChangePage(root, f.identity.runId, f.record.decisionId))
  }
  return { ...f, root, dir, recordPath, load }
}

it("deterministically projects 20 actual source records, exact interpretation and separate review/dissent", () => {
  const f = executiveFixture(), before = JSON.stringify(f.record)
  const result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, f.optional)
  expect(projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, f.optional)).toEqual(result)
  expect(validateExecutiveProjection(result, f.snapshotBytes, f.identity, f.bytes, f.optional)).toEqual(result)
  expect(result.availability).toBe("READY")
  expect(result.core.responses).toEqual({ examined: 20, supplied: JSON.parse(Buffer.from(f.bytes.source).toString("utf8")).records.length })
  expect(result.core.interpretation).toEqual({ wording: f.snapshot.modelInterpreted.originalMachineWording, epistemicClass: "MODEL-INTERPRETED" })
  expect(result.core.humanReview.disposition).toBe("CONFIRM")
  expect(result.core.humanReview.epistemicClass).toBe("HUMAN-REVIEWED")
  expect(result.core.dissent.firstFinding?.status).toBe("POTENTIAL_UNSEEN_DISSENT")
  expect(result.decision.state).toBe("RECORDED")
  expect(result.change.state).toBe("RECORDED_EVIDENCE_MATCHES_CURRENT")
  expect(JSON.stringify(f.record)).toBe(before)
})
it("counts exact existing theme labels and supporting IDs without merging, inventing or ranking", () => {
  const f = executiveFixture(), result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes)
  const records = JSON.parse(Buffer.from(f.bytes.source).toString("utf8")).records as { id: string; theme: string; text: string }[]
  expect(result.core.themes.map((theme) => [theme.label, theme.count])).toEqual([
    ["access-to-services", 4], ["workforce-capability", 4], ["data-governance", 4], ["accountability", 3], ["procurement-and-reuse", 3], ["environmental-cost", 2],
  ])
  for (const theme of result.core.themes) {
    expect(theme.sourceIds).toEqual(records.filter((record) => record.theme === theme.label).map((record) => record.id))
    expect(theme.count).toBe(theme.sourceIds.length)
  }
  expect(result.core.themes.reduce((sum, theme) => sum + theme.count, 0)).toBe(records.length)
  expect(result.core.sources).toEqual(records.map(({ id, theme, text }) => ({ id, theme, text })))
})
it("does not normalize or infer incomplete synthetic test metadata", () => {
  const result = aggregateStoredThemes([
    { id: "TEST-1", text: "Synthetic", theme: "Access" }, { id: "TEST-2", text: "Synthetic", theme: "access" },
    { id: "TEST-3", text: "Synthetic", theme: " Access " }, { id: "TEST-4", text: "Synthetic" },
    { id: "TEST-5", text: "Synthetic", theme: "" }, { id: "TEST-6", text: "Synthetic", theme: 1 },
  ])
  expect(result.themes.map((theme) => theme.label)).toEqual(["Access", "access", " Access "])
  expect(result.missingSourceIds).toEqual(["TEST-4", "TEST-5", "TEST-6"])
  expect(result.limitation).toContain("no label was inferred")
})
it.each(["zero", "absent"] as const)("preserves frozen %s without inventing dissent counts", (state) => {
  const f = executiveFixture(state), result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, f.optional)
  expect(result.core.dissent.messages).toEqual(f.snapshot.unseenDissent.messages)
  expect(result.core.dissent.state).toBe(state === "zero" ? "VALIDATED_ZERO_FINDINGS" : "ABSENT")
  expect(result.core.dissent.count).toBe(state === "zero" ? 0 : null)
})
it("selects whole exact existing limitation sentences and grounds new questions without persisting them", () => {
  const f = executiveFixture(), before = sha256(f.snapshotBytes)
  const result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, f.optional)
  for (const limitation of result.core.limitations) expect(f.snapshot.unresolved.whatWasNotEstablished).toContain(limitation.text)
  const limits = result.core.limitations.map((limit) => limit.text).join(" ")
  for (const word of ["representativeness", "semantic correctness", "participant-confirmed", "detection of dissent", "consensus", "policy sufficiency", "organisational effectiveness"]) expect(limits).toContain(word)
  expect(result.core.questions.every((question) => question.basis.startsWith("snapshot.") && question.href.startsWith("#"))).toBe(true)
  expect(result.core.questions.some((question) => question.text.includes("potential dissent"))).toBe(true)
  const absent = executiveFixture("absent")
  expect(projectExecutiveSnapshot(absent.snapshotBytes, absent.identity, absent.bytes).core.questions.some((question) => question.text.includes("potential dissent"))).toBe(false)
  expect(sha256(f.snapshotBytes)).toBe(before)
  expect(f.record).not.toHaveProperty("questions")
})
it("keeps valid earlier evidence PARTIAL when optional F/G is unavailable or invalid", () => {
  const f = executiveFixture()
  const absent = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes)
  expect(absent.availability).toBe("PARTIAL")
  expect(absent.decision).toMatchObject({ availability: "UNAVAILABLE", state: null })
  expect(absent.change).toMatchObject({ availability: "UNAVAILABLE", state: null })
  const invalidF = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, { ...f.optional, decision: {} })
  expect(invalidF.availability).toBe("PARTIAL")
  expect(invalidF.decision.availability).toBe("INVALID")
  expect(invalidF.core).toEqual(absent.core)
  const invalidG = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, { ...f.optional, change: { ...f.optional.change, state: "DECISION_CORRECT" } })
  expect(invalidG.availability).toBe("PARTIAL")
  expect(invalidG.decision.state).toBe("RECORDED")
  expect(invalidG.change).toMatchObject({ availability: "INVALID", state: null })
  expect(invalidG.core).toEqual(absent.core)
})
it.each(["recommendation", "trust", "confidence", "readiness", "consensus", "decisionCorrect"])("rejects unsupported %s authority instead of upgrading evidence", (key) => {
  const f = executiveFixture(), result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, f.optional)
  expect(result).not.toHaveProperty(key)
  expect(() => validateExecutiveProjection({ ...result, [key]: true }, f.snapshotBytes, f.identity, f.bytes, f.optional)).toThrow("unsupported")
})
it("will not attach another valid F snapshot or a mismatched G comparison to this interpretation", () => {
  const f = executiveFixture(), other = executiveFixture("zero")
  const result = projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, { decision: other.record, change: other.optional.change, changeCurrent: other.optional.changeCurrent })
  expect(result.availability).toBe("PARTIAL")
  expect(result.decision).toMatchObject({ availability: "NOT_ASSOCIATED", state: null })
  expect(result.change.state).toBeNull()
})
it.each(["source", "proof", "reviews", "dissent", "snapshot"] as const)("blocks invalid required %s instead of fabricating an interpretation or zero dissent", (key) => {
  const f = diskFixture(), path = key === "source" ? join(f.root, SOURCE_PATH) : join(f.dir, key === "snapshot" ? f.identity.name : `${key}.json`)
  writeFileSync(path, "{}")
  const result = f.load()
  expect(result.availability).toBe("BLOCKED")
  expect(result.core).toBeNull()
  expect(readFileSync(path, "utf8")).toBe("{}")
})
it("blocks unavailable or stale current evidence without substituting historical meaning", () => {
  const f = diskFixture()
  unlinkSync(join(f.dir, "dissent.json"))
  expect(f.load().availability).toBe("BLOCKED")
  expect(f.load().core).toBeNull()
  expect(loadExecutivePage(f.root, null, null, null).availability).toBe("BLOCKED")
})
it("preserves all six upstream hashes and directory entries without a persistent H artifact", () => {
  const f = diskFixture(), paths = [join(f.root, SOURCE_PATH), ...readdirSync(f.dir).map((name) => join(f.dir, name))]
  const before = paths.map((path) => sha256(readFileSync(path))), entries = readdirSync(f.dir)
  expect(paths).toHaveLength(6)
  expect(f.load().availability).toBe("READY")
  expect(f.load()).toEqual(f.load())
  expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(before)
  expect(readdirSync(f.dir)).toEqual(entries)
})
it("keeps valid core visible when saved F or optional G cannot be provided", () => {
  const f = diskFixture()
  const brief = loadDecisionBrief(f.root, f.identity.runId, f.current.bindings.proof, f.identity.name)
  const decisions = loadDecisionPage(f.root, brief)
  const noG = loadExecutivePage(f.root, brief, decisions, null)
  expect(noG.availability).toBe("PARTIAL")
  expect(noG.decision?.state).toBe("RECORDED")
  writeFileSync(f.recordPath, "{}")
  const invalid = f.load()
  expect(invalid.availability).toBe("PARTIAL")
  expect(invalid.core?.interpretation.wording).toBe(f.snapshot.modelInterpreted.originalMachineWording)
  expect(invalid.decision?.state).toBeNull()
})
