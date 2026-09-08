import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { sha256 } from "./policy-evidence"
import { latestProof, RUNS_PATH } from "./policy-evidence-review-store"
import { inputBindings, runIdSchema } from "./policy-evidence-snapshot"
import { readSnapshotInputs } from "./policy-evidence-snapshot-store"
import { projectDecisionBrief, snapshotNameSchema, type DecisionBrief, type LocalEvidenceIdentity } from "./policy-evidence-brief"

export type BriefPage = { brief: DecisionBrief | null; issue: string | null; names: string[]; runId: string | null; selectedName: string | null; downloadHref: string | null }
/** Read-only selection. Explicit invalid snapshots block; no fallback or migration. */
export function loadDecisionBrief(root: string, selectedRunId: string, selectedProofSha256: string, requestedName?: unknown, requestedRunId?: unknown): BriefPage {
  let names: string[] = [], runId: string | null = null, name: string | null = null
  try {
    runId = runIdSchema.parse(requestedRunId ?? selectedRunId)
    const selected = latestProof(root)
    if (!selected || selected.runId !== selectedRunId || selected.context.proofSha256 !== selectedProofSha256) throw new Error("Selected proof changed")
    const dir = join(/* turbopackIgnore: true */ root, RUNS_PATH, runId)
    names = readdirSync(/* turbopackIgnore: true */ dir).filter((entry) => snapshotNameSchema.safeParse(entry).success)
      .sort((a, b) => b.split("-").at(-1)!.localeCompare(a.split("-").at(-1)!) || a.localeCompare(b))
    name = requestedName === undefined ? names[0] ?? null : snapshotNameSchema.parse(requestedName)
    if (name === null) return { brief: null, issue: "No frozen snapshot is available. No brief was fabricated.", names, runId, selectedName: null, downloadHref: null }
    // Ignored local evidence is read at request time, never included in a deployment trace.
    const snapshotPath = join(/* turbopackIgnore: true */ dir, name)
    const bytes = readFileSync(/* turbopackIgnore: true */ snapshotPath)
    // Local evidence affects only the comparison claim, never the brief's substantive content.
    let current: LocalEvidenceIdentity | undefined
    try { current = { runId: selectedRunId, bindings: inputBindings(readSnapshotInputs(root, selectedRunId)) } } catch { current = undefined }
    const digest = sha256(bytes)
    const brief = projectDecisionBrief(bytes, { runId, candidateId: /^trust-evidence-(CAND-\d{3})-/.exec(name)![1], name, sha256: digest }, current)
    if (sha256(readFileSync(/* turbopackIgnore: true */ snapshotPath)) !== digest) throw new Error("Snapshot changed during reading")
    const stillSelected = latestProof(root)
    if (!stillSelected || stillSelected.runId !== selectedRunId || stillSelected.context.proofSha256 !== selectedProofSha256) throw new Error("Selected proof changed")
    if (current && JSON.stringify(inputBindings(readSnapshotInputs(root, selectedRunId))) !== JSON.stringify(current.bindings)) throw new Error("Local inputs changed during comparison")
    return { brief, issue: null, names, runId, selectedName: name, downloadHref: `data:application/json;base64,${bytes.toString("base64")}` }
  } catch {
    return { brief: null, issue: "Decision Evidence Brief blocked: the selected snapshot, embedded evidence (including dissent), or selection could not be validated. Invalid dissent is not zero findings. No artifact was repaired or replaced.", names, runId, selectedName: name, downloadHref: null }
  }
}
