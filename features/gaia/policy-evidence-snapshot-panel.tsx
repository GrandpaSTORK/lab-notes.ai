"use client"

import { useState, useTransition } from "react"
import type { SnapshotRequest } from "@/lib/gaia/policy-evidence-snapshot"
import type { SavedSnapshot, SnapshotActionResult, SnapshotPage } from "@/lib/gaia/policy-evidence-snapshot-store"
import { SNAPSHOT_BOUNDARY } from "@/lib/gaia/policy-evidence-snapshot-boundary"
import { SnapshotEvidence } from "./policy-evidence-snapshot"

export function TrustSnapshotPanel({ page, createAction }: { page: SnapshotPage; createAction: (request: SnapshotRequest) => Promise<SnapshotActionResult> }) {
  const [candidateId, setCandidateId] = useState(page.saved[0]?.snapshot.candidateId ?? page.candidates[0]?.id ?? "")
  const [created, setCreated] = useState<SavedSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const selected = created?.snapshot.candidateId === candidateId ? created : page.saved.find((item) => item.snapshot.candidateId === candidateId)
  const saved = selected && selected.snapshot.runId === page.runId &&
    (["source", "proof", "reviews", "dissent"] as const).every((key) => selected.snapshot.bindings[key] === page.bindings?.[key]) ? selected : null
  function freeze() {
    if (!page.bindings) return
    const expectedBindings = page.bindings
    setError(null)
    startTransition(async () => {
      try {
        const result = await createAction({ runId: page.runId, candidateId, expectedBindings })
        if (result.ok) setCreated(result.saved)
        else setError(result.message)
      } catch { setError("Snapshot creation could not be confirmed. Reload to inspect local artifacts before retrying.") }
    })
  }
  return <section aria-labelledby="frozen-snapshot-title" className="mt-10 border-y-2 border-peat py-6">
    <h2 id="frozen-snapshot-title" className="text-3xl">BUILD-001D — Trust Evidence Snapshot</h2>
    <p className="mt-3 font-bold">{SNAPSHOT_BOUNDARY}</p>
    <p className="mt-3">Freeze one candidate with its saved human review and validated challenge evidence. No model is invoked. The earlier BUILD-001B export remains unchanged.</p>
    <p className="mt-2">Snapshots record the inputs at creation time. After saving a human review or changing local evidence, reload before freezing another snapshot. Unsaved review drafts are excluded.</p>
    <p className="mt-2">Review artifact: {page.reviewsState}. Challenge artifact: {page.dissentState}.</p>
    {page.issue ? <p role="alert" className="mt-4 border-2 border-signal-strong p-4">{page.issue}</p> : <>
      <label htmlFor="snapshot-candidate" className="mt-4 block font-bold">Candidate to freeze or inspect</label>
      <select id="snapshot-candidate" value={candidateId} disabled={pending} onChange={(event) => { setCandidateId(event.target.value); setError(null) }} className="mt-2 min-h-11 max-w-full border-2 border-peat bg-surface p-2">
        {page.candidates.map((item) => <option key={item.id} value={item.id}>{item.id}</option>)}
      </select>
      <p className="mt-2 whitespace-pre-wrap break-words">{page.candidates.find((item) => item.id === candidateId)?.wording}</p>
      <button type="button" disabled={pending || !candidateId} onClick={freeze} className="mt-4 min-h-11 border-2 border-peat bg-surface px-4 py-2 font-bold hover:bg-paper disabled:opacity-60">{pending ? "Freezing snapshot…" : "Freeze a new snapshot"}</button>
    </>}
    <p role="status" aria-live="polite" className="mt-3">{created ? "Snapshot saved as a separate local artifact. Upstream evidence and human review were preserved." : ""}</p>
    {error && <p role="alert" className="mt-3">{error}</p>}
    {page.warnings.map((warning) => <p key={warning} className="mt-3 border-l-4 border-signal-strong pl-3">{warning}</p>)}
    {saved && !page.issue ? <>
      <p className="mt-4 break-all font-mono text-sm">{saved.path}</p>
      <a download={saved.path.split("/").at(-1)} href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(saved.snapshot, null, 2))}`} className="mt-3 inline-flex min-h-11 items-center border-2 border-peat bg-surface px-4 py-2 font-bold">Download frozen Trust Evidence Snapshot</a>
      <SnapshotEvidence snapshot={saved.snapshot} />
    </> : !page.issue && <p className="mt-4">No current validated frozen snapshot is available for this candidate. Existing snapshots are never overwritten.</p>}
  </section>
}
