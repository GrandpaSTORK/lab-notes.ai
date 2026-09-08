import { readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { SOURCE_PATH } from "./policy-evidence"
import { latestProof, RUNS_PATH } from "./policy-evidence-review-store"
import { assertBindings, composeSnapshot, inputBindings, runIdSchema, snapshotRequestSchema, SnapshotInputError, validatedSnapshotInputs, validateSnapshot, type SnapshotBytes, type SnapshotRequest, type TrustSnapshot } from "./policy-evidence-snapshot"

export function readSnapshotInputs(root: string, runId: string): SnapshotBytes {
  runIdSchema.parse(runId)
  const dir = join(root, RUNS_PATH, runId)
  const optional = (name: string) => {
    try { return readFileSync(join(dir, name)) } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
      throw error
    }
  }
  return { source: readFileSync(join(root, SOURCE_PATH)), proof: readFileSync(join(dir, "proof.json")), reviews: optional("reviews.json"), dissent: optional("dissent.json") }
}
function assertSelected(root: string, runId: string, proofSha256: string) {
  const selected = latestProof(root)
  if (!selected || selected.runId !== runId || selected.context.proofSha256 !== proofSha256) throw new Error("Selected proof changed. Reload before creating or displaying a snapshot.")
}
export type SavedSnapshot = { path: string; snapshot: TrustSnapshot }
export function saveSnapshot(root: string, input: SnapshotRequest, createdAt = new Date().toISOString()): SavedSnapshot {
  const request = snapshotRequestSchema.parse(input)
  assertSelected(root, request.runId, request.expectedBindings.proof)
  const bytes = readSnapshotInputs(root, request.runId)
  const snapshot = validateSnapshot(composeSnapshot(bytes, request, createdAt), { runId: request.runId, candidateId: request.candidateId, bindings: request.expectedBindings })
  assertBindings(inputBindings(readSnapshotInputs(root, request.runId)), request.expectedBindings)
  assertSelected(root, request.runId, request.expectedBindings.proof)
  const name = `trust-evidence-${request.candidateId}-${createdAt.replace(/\D/g, "")}.json`
  const path = `${RUNS_PATH}/${request.runId}/${name}`
  // Exclusive creation: never repair, normalize, or overwrite an upstream file or snapshot.
  writeFileSync(join(root, path), JSON.stringify(snapshot, null, 2), { flag: "wx" })
  return { path, snapshot }
}
export function loadSnapshotPage(root: string, runId: string, selectedProofSha256: string) {
  const saved: SavedSnapshot[] = [], warnings: string[] = []
  try {
    assertSelected(root, runId, selectedProofSha256)
    const bytes = readSnapshotInputs(root, runId), bindings = inputBindings(bytes)
    if (bindings.proof !== selectedProofSha256) throw new Error("Selected proof changed before snapshot loading")
    const { context, ledger, dissent } = validatedSnapshotInputs(bytes)
    const dir = join(root, RUNS_PATH, runId)
    for (const name of readdirSync(dir)) {
      if (!/^trust-evidence-CAND-\d{3}-\d+\.json$/.test(name)) continue
      try {
        const snapshot = validateSnapshot(JSON.parse(readFileSync(join(dir, name), "utf8")), { runId, bindings })
        if (!name.startsWith(`trust-evidence-${snapshot.candidateId}-`)) throw new Error("Candidate filename mismatch")
        saved.push({ path: `${RUNS_PATH}/${runId}/${name}`, snapshot })
      } catch { warnings.push(`${name}: invalid or stale snapshot preserved on disk and excluded from the current view.`) }
    }
    assertBindings(inputBindings(readSnapshotInputs(root, runId)), bindings)
    assertSelected(root, runId, selectedProofSha256)
    saved.sort((a, b) => b.snapshot.createdAt.localeCompare(a.snapshot.createdAt))
    return { runId, bindings, candidates: context.proof.candidates.map((item) => ({ id: item.id, wording: item.candidate.interpretation })),
      reviewsState: bytes.reviews === null ? "ABSENT" : "VALIDATED",
      reviewRevision: bytes.reviews === null ? null : ledger.revision,
      dissentState: dissent === null ? "ABSENT" : "VALIDATED", saved, warnings, issue: null }
  } catch (error) {
    return { runId, bindings: null, candidates: [], reviewsState: error instanceof SnapshotInputError && error.input === "reviews" ? "INVALID" : "UNAVAILABLE",
      reviewRevision: null, dissentState: error instanceof SnapshotInputError && error.input === "dissent" ? "INVALID" : "UNAVAILABLE", saved: [], warnings,
      issue: error instanceof SnapshotInputError ? error.message : "Snapshot inputs or selected-proof binding could not be validated. Creation and display are blocked; no input was repaired." }
  }
}
export type SnapshotPage = ReturnType<typeof loadSnapshotPage>
export type SnapshotActionResult = { ok: true; saved: SavedSnapshot } | { ok: false; message: string }
