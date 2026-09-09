"use client"

import { useRef, useState, useTransition, type FormEvent } from "react"
import type { DecisionRequest } from "@/lib/gaia/policy-evidence-decision"
import type { DecisionActionResult, DecisionPage, SavedDecision } from "@/lib/gaia/policy-evidence-decision-store"
import { DECISION_ACKNOWLEDGEMENT, DECISION_AUTHORITY, DECISION_BOUNDARY, DECISION_DISCLOSURE, DECISION_LIMIT } from "@/lib/gaia/policy-evidence-decision-boundary"
import { DecisionRecordEvidence } from "./policy-evidence-decision"
import { BackToExecutiveSnapshot } from "./policy-evidence-navigation"

export function HumanDecisionPanel({ page, saveAction }: { page: DecisionPage; saveAction: (request: DecisionRequest) => Promise<DecisionActionResult> }) {
  const [created, setCreated] = useState<SavedDecision | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // One ID per draft survives retries after an uncertain response; the store uses exclusive creation.
  const decisionId = useRef<string | null>(null)
  function record(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!page.selection || !page.canRecord || pending || created) return
    const data = new FormData(event.currentTarget), text = (key: string) => String(data.get(key) ?? "")
    if (data.get("acknowledgement") !== "on") { setError("Acknowledge the unresolved evidence before recording."); return }
    decisionId.current ??= crypto.randomUUID()
    const request: DecisionRequest = { decisionId: decisionId.current, selection: page.selection,
      decisionText: text("decisionText"), rationale: text("rationale"), decisionMaker: text("decisionMaker"), role: text("role"),
      decisionAuthority: text("decisionAuthority"), unresolvedAcknowledged: true, demonstration: "SYNTHETIC_TEST_DATA" }
    setError(null)
    startTransition(async () => {
      try {
        const result = await saveAction(request)
        if (result.ok) setCreated(result.saved)
        else setError(result.message)
      } catch { setError("Recording could not be confirmed. Your draft is retained. Reload to inspect saved records before retrying.") }
    })
  }
  return <section aria-labelledby="human-decision-title" className="mt-8 min-w-0 border-y-2 border-peat py-6">
    <h2 id="human-decision-title" className="font-display text-3xl">BUILD-001F — Human Decision Record</h2>
    <BackToExecutiveSnapshot />
    <p className="mt-4 text-lg font-bold">{DECISION_BOUNDARY}</p>
    <p className="mt-3">{DECISION_AUTHORITY}</p>
    <p className="mt-3">{DECISION_LIMIT}</p>
    <p className="mt-3 font-bold">{DECISION_DISCLOSURE}</p>
    {page.selection && <div className="mt-4 break-words border-2 border-peat p-4">
      <p>Evidence selected for this decision: {page.selection.runId} · {page.selection.candidateId}</p>
      <p className="font-mono text-sm">Snapshot: {page.selection.snapshotName}</p>
      <p className="font-mono text-sm">Snapshot SHA-256: {page.selection.snapshotSha256}</p>
      <p className="font-mono text-sm">BUILD-001E brief SHA-256: {page.selection.briefSha256}</p>
      <a className="mt-3 inline-block min-h-11 font-bold underline" href="#decision-evidence-brief">Inspect the selected brief and its complete frozen evidence</a>
    </div>}
    {page.issue && <p role="alert" className="mt-4 border-2 border-peat p-4">{page.issue}</p>}
    {page.warnings.map((warning) => <p key={warning} className="mt-3">{warning}</p>)}
    {page.canRecord && page.selection && !created && <form onSubmit={record} className="mt-6 space-y-4">
      <p>Enter your own synthetic demonstration decision. All fields are required. No decision or rationale is suggested.</p>
      <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
        <legend className="sr-only">Human-authored synthetic decision</legend>
        {([ ["decisionText", "Decision text (synthetic)"], ["rationale", "Rationale (synthetic)"] ] as const).map(([name, label]) => <div key={name}>
          <label htmlFor={`decision-${name}`} className="block font-bold">{label}</label>
          <textarea id={`decision-${name}`} name={name} required maxLength={12000} rows={4} className="mt-2 w-full border-2 border-peat bg-surface p-3" />
        </div>)}
        {([ ["decisionMaker", "Decision maker (synthetic)"], ["role", "Role (synthetic)"], ["decisionAuthority", "Decision authority (synthetic)"] ] as const).map(([name, label]) => <div key={name}>
          <label htmlFor={`decision-${name}`} className="block font-bold">{label}</label>
          <input id={`decision-${name}`} name={name} required maxLength={12000} className="mt-2 min-h-11 w-full border-2 border-peat bg-surface p-3" />
        </div>)}
        <label className="flex min-h-11 cursor-pointer items-start gap-3 py-3">
          <input type="checkbox" name="acknowledgement" required className="mt-1 size-5 shrink-0" />
          <span>{DECISION_ACKNOWLEDGEMENT}</span>
        </label>
        <button type="submit" disabled={pending} className="min-h-11 border-2 border-peat bg-peat px-4 py-3 font-bold text-paper disabled:opacity-70">{pending ? "Recording…" : "Record human decision"}</button>
      </fieldset>
    </form>}
    {error && <p role="alert" className="mt-4 border-2 border-peat p-4">{error}</p>}
    {created && <p role="status" className="mt-4 font-bold">Human decision recorded in a separate local artifact. GAIA did not validate the decision. Reload to compare current evidence again.</p>}
    {[...(created ? [created] : []), ...page.saved.filter((saved) => saved.record.decisionId !== created?.record.decisionId)].map((saved) => <DecisionRecordEvidence key={saved.record.decisionId} saved={saved} />)}
    {!created && page.saved.length === 0 && <p className="mt-4">No saved decision record for this exact brief is displayed.</p>}
  </section>
}
