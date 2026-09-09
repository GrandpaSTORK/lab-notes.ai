import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sha256 } from "./policy-evidence"
import { projectDecisionBrief } from "./policy-evidence-brief"
import type { BriefPage } from "./policy-evidence-brief-store"
import type { DecisionPage } from "./policy-evidence-decision-store"
import { readCurrentDecisionEvidence, type ChangePage } from "./policy-evidence-change-store"
import { latestProof } from "./policy-evidence-review-store"
import { inputBindings } from "./policy-evidence-snapshot"
import { readSnapshotInputs } from "./policy-evidence-snapshot-store"
import { blockedExecutive, projectExecutiveSnapshot, type ExecutiveOptional, type ExecutivePage } from "./policy-evidence-executive"

/** Read-only composition; the selected E snapshot remains the required evidence-bearing input. */
export function loadExecutivePage(root: string, page: BriefPage | null, decisions: DecisionPage | null, change: ChangePage | null): ExecutivePage {
  if (!page?.brief || page.issue || !page.selectedName) return blockedExecutive("No valid selected frozen interpretation is available for this executive view. Detailed evidence below retains its own validation states; nothing has been fabricated.")
  try {
    const identity = { runId: page.brief.trace.runId, candidateId: page.brief.interpretation.candidateId, name: page.selectedName, sha256: page.brief.trace.snapshotSha256 }
    const selected = latestProof(root)
    if (!selected || selected.runId !== identity.runId || selected.context.proofSha256 !== page.brief.trace.bindings.proof) throw new Error("Selected proof changed")
    const path = join(/* turbopackIgnore: true */ root, page.brief.trace.snapshotPath)
    const snapshotBytes = readFileSync(/* turbopackIgnore: true */ path), current = readSnapshotInputs(root, identity.runId)
    if (JSON.stringify(projectDecisionBrief(snapshotBytes, identity, { runId: identity.runId, bindings: inputBindings(current) })) !== JSON.stringify(page.brief)) throw new Error("Displayed brief changed")
    const optional: ExecutiveOptional = {}
    const saved = decisions?.saved.find((item) => item.record.decisionId === change?.notice?.historicalRecord.decisionId) ?? decisions?.saved[0]
    if (saved) {
      try {
        const bytes = readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, saved.path))
        if (sha256(bytes) !== saved.sha256) optional.decision = null
        else { try { optional.decision = JSON.parse(bytes.toString("utf8")) } catch { optional.decision = null } }
      } catch { /* Unavailable optional decision must not block valid earlier evidence. */ }
    } else if (decisions?.warnings.length) optional.decision = null
    if (change?.notice) {
      optional.change = change.notice
      optional.changeCurrent = change.notice.currentRunId ? readCurrentDecisionEvidence(root, change.notice.currentRunId) : null
    } else if (change?.issue) optional.change = null
    const result = projectExecutiveSnapshot(snapshotBytes, identity, current, optional)
    if (sha256(readFileSync(/* turbopackIgnore: true */ path)) !== identity.sha256 ||
      JSON.stringify(inputBindings(readSnapshotInputs(root, identity.runId))) !== JSON.stringify(inputBindings(current))) throw new Error("Inputs changed during read")
    const stillSelected = latestProof(root)
    if (!stillSelected || stillSelected.runId !== identity.runId || stillSelected.context.proofSha256 !== inputBindings(current).proof) throw new Error("Selected proof changed")
    return result
  } catch { return blockedExecutive() }
}
