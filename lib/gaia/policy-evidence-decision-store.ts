import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { sha256 } from "./policy-evidence"
import { projectDecisionBrief } from "./policy-evidence-brief"
import type { BriefPage } from "./policy-evidence-brief-store"
import { latestProof, RUNS_PATH } from "./policy-evidence-review-store"
import { assertBindings, inputBindings, validatedSnapshotInputs } from "./policy-evidence-snapshot"
import { readSnapshotInputs } from "./policy-evidence-snapshot-store"
import { createDecisionRecord, decisionIdSchema, decisionRequestSchema, validateDecisionRecord,
  type DecisionRequest, type DecisionSelection, type HumanDecisionRecord } from "./policy-evidence-decision"

export type SavedDecision = { path: string; sha256: string; record: HumanDecisionRecord; localAgreement: "MATCHES_SELECTED_LOCAL_INPUTS" | "HISTORICAL_OR_NOT_CHECKED" }
export type DecisionPage = { selection: DecisionSelection | null; canRecord: boolean; issue: string | null; saved: SavedDecision[]; warnings: string[] }
export type DecisionActionResult = { ok: true; saved: SavedDecision } | { ok: false; message: string }

function selectedCurrent(root: string, selection: DecisionSelection) {
  const selected = latestProof(root)
  if (!selected || selected.runId !== selection.runId || selected.context.proofSha256 !== selection.bindings.proof) throw new Error("Selected proof changed or brief is historical")
  const bytes = readSnapshotInputs(root, selection.runId)
  assertBindings(inputBindings(bytes), selection.bindings)
  validatedSnapshotInputs(bytes)
  return { runId: selected.runId, bindings: inputBindings(bytes) }
}
function snapshotBytes(root: string, selection: DecisionSelection) {
  return readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, RUNS_PATH, selection.runId, selection.snapshotName))
}

/** No upstream write. Revalidate exact selection and current bytes, then exclusively create one new record. */
export function saveDecision(root: string, input: DecisionRequest, createdAt = new Date().toISOString()): SavedDecision {
  const request = decisionRequestSchema.parse(input), selection = request.selection
  const current = selectedCurrent(root, selection), bytes = snapshotBytes(root, selection)
  const record = validateDecisionRecord(createDecisionRecord(bytes, request, current, createdAt), selection)
  // Check again after reconstruction; a stale browser draft never silently changes its evidence.
  selectedCurrent(root, selection)
  if (sha256(snapshotBytes(root, selection)) !== selection.snapshotSha256) throw new Error("Selected snapshot changed before recording")
  const path = `${RUNS_PATH}/${selection.runId}/human-decision-${request.decisionId}.json`
  const encoded = JSON.stringify(record, null, 2)
  writeFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, path), encoded, { flag: "wx" })
  return { path, sha256: sha256(encoded), record, localAgreement: "MATCHES_SELECTED_LOCAL_INPUTS" }
}

/** Saved records remain portable historical evidence; only matching current evidence enables creation. */
export function loadDecisionPage(root: string, page: BriefPage): DecisionPage {
  const result: DecisionPage = { selection: null, canRecord: false, issue: null, saved: [], warnings: [] }
  if (!page.brief || !page.selectedName) return { ...result, issue: "Decision recording blocked: no valid selected brief. Missing or invalid evidence is not a zero-finding challenge." }
  try {
    const identity = { runId: page.brief.trace.runId, candidateId: page.brief.interpretation.candidateId,
      name: page.selectedName, sha256: page.brief.trace.snapshotSha256 }
    const bytes = readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, RUNS_PATH, identity.runId, identity.name))
    const portable = projectDecisionBrief(bytes, identity)
    const selection: DecisionSelection = { runId: identity.runId, candidateId: identity.candidateId,
      snapshotName: identity.name, snapshotSha256: identity.sha256, briefSha256: sha256(JSON.stringify(portable)), bindings: portable.trace.bindings }
    result.selection = selection
    try {
      const current = selectedCurrent(root, selection)
      if (JSON.stringify(projectDecisionBrief(bytes, identity, current)) !== JSON.stringify(page.brief)) throw new Error("Displayed brief changed")
      result.canRecord = true
    } catch { result.issue = "Recording blocked: the frozen brief is historical, current evidence changed, or current agreement could not be validated. Reload and inspect the evidence; no substitution was made." }
    const dir = join(/* turbopackIgnore: true */ root, RUNS_PATH, identity.runId)
    for (const name of readdirSync(/* turbopackIgnore: true */ dir).sort()) {
      if (!name.startsWith("human-decision-") || !name.endsWith(".json")) continue
      try {
        const id = decisionIdSchema.parse(name.slice("human-decision-".length, -5))
        const recordBytes = readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ dir, name))
        const record = validateDecisionRecord(JSON.parse(recordBytes.toString("utf8")))
        if (record.decisionId !== id || record.runId !== identity.runId) throw new Error("Record filename/run mismatch")
        // Never transfer a decision to a different brief, candidate, or replacement snapshot.
        if (JSON.stringify(record.trace.selection) !== JSON.stringify(selection)) continue
        result.saved.push({ path: `${RUNS_PATH}/${identity.runId}/${name}`, sha256: sha256(recordBytes), record,
          localAgreement: result.canRecord ? "MATCHES_SELECTED_LOCAL_INPUTS" : "HISTORICAL_OR_NOT_CHECKED" })
      } catch { result.warnings.push(`${name}: invalid decision record preserved on disk and excluded. No repair was attempted.`) }
    }
    if (sha256(snapshotBytes(root, selection)) !== selection.snapshotSha256) throw new Error("Selected snapshot changed")
    if (result.canRecord) selectedCurrent(root, selection)
    return result
  } catch {
    return { selection: null, canRecord: false, saved: [], warnings: result.warnings,
      issue: "Decision recording and selected-record display blocked: the selected snapshot or evidence changed or could not be validated. Invalid dissent is not zero findings." }
  }
}
