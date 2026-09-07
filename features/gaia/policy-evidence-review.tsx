"use client"

import { useState, type FormEvent } from "react"
import { UnseenDissent } from "./policy-evidence-dissent"

import type { Disposition, ReviewActionResult, ReviewPresentation, ReviewRequest } from "@/lib/gaia/policy-evidence-review"

type Candidate = ReviewPresentation["candidates"][number]
const choices: { value: Disposition; label: string }[] = [
  { value: "CONFIRM", label: "CONFIRM" }, { value: "REVISE", label: "REVISE" },
  { value: "REJECT", label: "REJECT" }, { value: "HOLD_DISSONANCE", label: "HOLD DISSONANCE" },
]
const control = "min-h-11 border-2 border-peat bg-surface px-4 py-2 font-bold hover:bg-paper disabled:cursor-wait disabled:opacity-60"

function HumanReviewForm({ candidateId, disabled, onSave }: {
  candidateId: string; disabled: boolean
  onSave: (request: Pick<ReviewRequest, "candidateId" | "disposition" | "rationale" | "revisedWording">) => Promise<boolean>
}) {
  const [disposition, setDisposition] = useState<Disposition | "">("")
  const [rationale, setRationale] = useState("")
  const [revision, setRevision] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!disposition) return
    const saved = await onSave({ candidateId, disposition, rationale, revisedWording: disposition === "REVISE" ? revision : null })
    if (saved) { setDisposition(""); setRationale(""); setRevision("") }
  }
  return (
    <form onSubmit={submit} aria-label={`Human review ${candidateId}`} className="mt-6 border-t-2 border-peat pt-5">
      <fieldset disabled={disabled}>
        <legend className="text-xl font-bold">Your judgment — {candidateId}</legend>
        <p className="mt-2">Choose an outcome. All four are legitimate; none is selected for you.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {choices.map((choice) => (
            <label key={choice.value} className="flex min-h-11 cursor-pointer items-center gap-3 border-2 border-peat bg-surface p-3 font-bold">
              <input type="radio" name={`disposition-${candidateId}`} value={choice.value} required
                checked={disposition === choice.value} onChange={() => setDisposition(choice.value)} className="size-5 shrink-0 accent-peat" />
              {choice.label}
            </label>
          ))}
        </div>
        {disposition === "REVISE" && (
          <div className="mt-4">
            <label className="block font-bold" htmlFor={`${candidateId}-revision`}>Separate human revision — {candidateId}</label>
            <p id={`${candidateId}-revision-help`} className="mt-1">Original wording above remains read-only. This revision will require new assessment/review.</p>
            <textarea id={`${candidateId}-revision`} aria-describedby={`${candidateId}-revision-help`} required maxLength={20_000}
              value={revision} onChange={(event) => setRevision(event.target.value)} rows={5} className="mt-2 w-full border-2 border-peat bg-surface p-3" />
          </div>
        )}
        <label className="mt-4 block font-bold" htmlFor={`${candidateId}-rationale`}>Human rationale — {candidateId} (required)</label>
        <textarea id={`${candidateId}-rationale`} required maxLength={20_000} value={rationale}
          onChange={(event) => setRationale(event.target.value)} rows={3} className="mt-2 w-full border-2 border-peat bg-surface p-3" />
        <button type="submit" className={`${control} mt-3`}>Save review — {candidateId}</button>
      </fieldset>
    </form>
  )
}

function EvidenceGroup({ candidate, kind, title, empty }: {
  candidate: Candidate; kind: Candidate["evidence"][number]["kind"]; title: string; empty: string
}) {
  const items = candidate.evidence.filter((item) => item.kind === kind)
  return (
    <section aria-label={`${title} ${candidate.id}`} className="mt-6">
      <h4 className="text-lg font-bold">{title}</h4>
      {!items.length && <p className="mt-2">{empty}</p>}
      {items.map((item, index) => (
        <div key={`${item.sourceId}-${index}`} className="mt-3 border-l-4 border-structure pl-4">
          <p className="font-mono text-sm">{item.sourceId} · {item.kind}</p>
          <blockquote className="mt-2 whitespace-pre-wrap break-words font-medium" data-source-quote={item.sourceId}>{item.quote}</blockquote>
          <p className="mt-2 text-peat-muted"><strong>Model explanation:</strong> {item.explanation}</p>
          <p className="mt-2 text-sm">Verified passage location: {item.start}–{item.end} (UTF-16, zero-based, end exclusive).</p>
          <details className="mt-2">
            <summary className="min-h-11 cursor-pointer py-2 font-bold">Read full original testimony — {item.sourceId}</summary>
            <p className="whitespace-pre-wrap break-words">{item.originalTestimony}</p>
          </details>
        </div>
      ))}
    </section>
  )
}

function CandidateEvidence({ candidate }: { candidate: Candidate }) {
  const verified = candidate.whatWasVerified
  return (
    <>
      <section aria-label={`What was not established ${candidate.id}`} className="mt-5 border-2 border-signal-strong bg-paper p-4">
        <h3 className="text-lg font-bold">WHAT WAS NOT ESTABLISHED</h3>
        <p className="mt-2 font-bold">{candidate.semanticBoundary}</p>
        <ul className="mt-3 list-disc space-y-2 pl-5">{candidate.whatWasNotEstablished.map((limit) => <li key={limit}>{limit}</li>)}</ul>
      </section>
      <details className="mt-5 border-y-2 border-peat py-2">
        <summary className="min-h-11 cursor-pointer py-3 text-lg font-bold">WHY THIS INSIGHT? — {candidate.id}</summary>
        <p className="mt-3">{candidate.relevance}</p>
        <section aria-label={`What was verified ${candidate.id}`} className="mt-5 border-2 border-peat bg-paper p-4">
          <h3 className="text-lg font-bold">WHAT WAS VERIFIED</h3>
          <p className="mt-2 font-bold">{candidate.traceability}</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {verified.sourceFingerprintMatched && <li>Source corpus fingerprint matched the BUILD-001A baseline.</li>}
            {verified.expectedSourceIdsValidated && <li>Expected source IDs were validated.</li>}
            {verified.exactQuotesAndLocationsValidated && <li>Every recorded quotation matched its named source at the validated passage location.</li>}
            <li>{verified.examinedRecordCount}/{verified.expectedRecordCount} expected records have validated examination entries.</li>
            {verified.generationMetadataRetained && <li>Generation provenance fields are retained in the validated artifact. Generation was not repeated during review.</li>}
            <li>Deterministic rule applied: {verified.deterministicRuleApplied}.</li>
          </ul>
          <p className="mt-3 font-bold">“This quotation matches the source” does not mean “this quotation supports the interpretation.”</p>
        </section>
        <div className="mt-6">
          <h3 className="text-xl font-bold">SUPPORTING EVIDENCE</h3>
          <EvidenceGroup candidate={candidate} kind="SUPPORT" title="SUPPORT" empty="No supporting relationship was recorded." />
        </div>
        <div className="mt-6">
          <h3 className="text-xl font-bold">CHALLENGING / QUALIFYING EVIDENCE</h3>
          <EvidenceGroup candidate={candidate} kind="CONTRADICTION" title="CONTRADICTION" empty="No direct contradiction was recorded." />
          <EvidenceGroup candidate={candidate} kind="QUALIFICATION" title="QUALIFICATION" empty="No qualification was recorded." />
          <EvidenceGroup candidate={candidate} kind="AMBIGUITY" title="AMBIGUITY" empty="No unresolved ambiguity was recorded." />
        </div>
        <details className="my-5">
          <summary className="min-h-11 cursor-pointer py-2 font-bold">Read complete examination, including records with no relevant bearing</summary>
          {candidate.evidence.map((item, index) => <div key={`${item.sourceId}-${index}`} className="mt-4 border-t border-structure pt-3">
            <p className="font-mono text-sm">{item.sourceId} · {item.kind}</p>
            <p className="mt-2">Model explanation: {item.explanation}</p>
            <p className="mt-2 whitespace-pre-wrap break-words">{item.originalTestimony}</p>
          </div>)}
        </details>
      </details>
    </>
  )
}

export function PolicyEvidenceReview({ initialPresentation, storagePath, warnings, reviewError, saveAction, dissent }: {
  dissent?: Parameters<typeof UnseenDissent>[0]["dissent"]
  initialPresentation: ReviewPresentation
  storagePath: string
  warnings: string[]
  reviewError: string | null
  saveAction: (request: ReviewRequest) => Promise<ReviewActionResult>
}) {
  const [presentation, setPresentation] = useState(initialPresentation)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState<string | null>(null)
  async function save(request: Pick<ReviewRequest, "candidateId" | "disposition" | "rationale" | "revisedWording">) {
    setPending(true); setError(null); setMessage("Saving review…")
    try {
      const result = await saveAction({ ...request, proofSha256: presentation.proofSha256, expectedRevision: presentation.reviewRevision })
      if (!result.ok) { setError(result.message); setMessage(""); return false }
      setPresentation(result.presentation)
      setMessage(`Review saved for ${request.candidateId}. All evidence and previous review events are retained.`)
      return true
    } catch {
      setError("The save could not be confirmed. Your draft remains here. Reload to check the stored history before retrying.")
      setMessage("")
      return false
    } finally { setPending(false) }
  }
  const snapshot = JSON.stringify(presentation, null, 2)
  return (
    <>
      <section aria-label="Proof context">
        <h2 className="text-2xl font-bold">Exploration question</h2>
        <p className="mt-3 text-lg">{presentation.explorationQuestion ?? "An exploration question could not be recovered from a matching method record."}</p>
        <p className="mt-3">Unranked machine proposals. Review states describe human judgment, not machine correctness.</p>
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-2 font-bold">Proof, generation provenance and local storage</summary>
          <p className="mt-2 break-all font-mono text-sm">Proof SHA-256: {presentation.proofSha256}</p>
          <p className="mt-2 break-all font-mono text-sm">Source SHA-256: {presentation.source.sha256}</p>
          <p className="mt-2 break-words text-sm">Human-review storage: {storagePath}</p>
          <p className="mt-2">Review revision: {presentation.reviewRevision}. Reviews for other proof fingerprints are never applied automatically.</p>
          <pre className="mt-3 whitespace-pre-wrap break-all text-xs">{JSON.stringify(presentation.generationProvenance, null, 2)}</pre>
        </details>
      </section>
      {warnings.map((warning) => <p key={warning} className="mt-3 border-l-4 border-signal-strong pl-3">{warning}</p>)}
      {reviewError && <p role="alert" className="mt-4 border-2 border-signal-strong p-4">{reviewError}</p>}
      <p role="status" aria-live="polite" className="mt-4 font-bold">{message}</p>
      {error && <p role="alert" className="mt-3 border-2 border-signal-strong p-4">{error}</p>}
      {!presentation.candidates.length && <p className="mt-6">The validated proof contains no candidate interpretations. There is nothing to review.</p>}
      {presentation.candidates.map((candidate) => (
        <section key={candidate.id} aria-labelledby={`${candidate.id}-title`} className="mt-8 border-t-2 border-peat bg-surface p-4 sm:p-6">
          <h2 id={`${candidate.id}-title`} className="font-mono text-xl font-bold">{candidate.id}</h2>
          <h3 className="mt-3 text-sm font-bold uppercase">Original machine interpretation — read-only</h3>
          <p className="mt-2 whitespace-pre-wrap break-words text-xl leading-relaxed">{candidate.originalMachineWording}</p>
          <dl className="mt-5 grid gap-4 border-y border-structure py-4 sm:grid-cols-3">
            <div><dt className="text-sm">Machine assessment · original wording only</dt><dd className="mt-1 font-bold">{candidate.machineAssessment.status}</dd></div>
            <div><dt className="text-sm">Examination coverage</dt><dd className="mt-1 font-bold">{candidate.coverage.examined}/{candidate.coverage.expected} records</dd></div>
            <div><dt className="text-sm">Human review state</dt><dd className="mt-1 font-bold">{candidate.reviewState}</dd></div>
          </dl>
          <p className="mt-3"><strong>Assessment reason:</strong> {candidate.machineAssessment.reason}</p>
          <p className="mt-2 text-sm">This rule result uses model-assigned relationships; it is not a human determination of meaning.</p>
          <p className="mt-4 font-bold">{candidate.reviewMeaning}</p>
          {candidate.review && <div className="mt-3 border-l-4 border-peat pl-4">
            <p className="whitespace-pre-wrap break-words"><strong>Saved human rationale:</strong> {candidate.review.rationale}</p>
            {candidate.review.revisedWording !== null && <><h3 className="mt-3 font-bold">Separate human revision</h3><p className="mt-2 whitespace-pre-wrap break-words">{candidate.review.revisedWording}</p><p className="mt-2 font-mono text-sm">{candidate.revisionAssessment}</p></>}
            <p className="mt-2 text-sm">Saved {candidate.review.reviewedAt} · review revision {candidate.review.reviewRevision}</p>
          </div>}
          <CandidateEvidence candidate={candidate} />
          <UnseenDissent candidateId={candidate.id} dissent={dissent} />
          <details className="mt-4">
            <summary className="min-h-11 cursor-pointer py-2 font-bold">Evidence limitations — {candidate.id}</summary>
            <ul className="mt-2 list-disc space-y-2 pl-5">{candidate.limitations.map((limit, index) => <li key={index}>{limit}</li>)}</ul>
          </details>
          <HumanReviewForm candidateId={candidate.id} disabled={pending || reviewError !== null} onSave={save} />
          {!!candidate.history.length && <details className="mt-4">
            <summary className="min-h-11 cursor-pointer py-2 font-bold">Preserved review history — {candidate.id}</summary>
            <ol className="mt-2 list-decimal space-y-3 pl-5">{candidate.history.map((event) => <li key={event.reviewRevision}>
              <p className="font-bold">{event.disposition} · revision {event.reviewRevision} · {event.reviewedAt}</p>
              <p className="whitespace-pre-wrap break-words">{event.rationale}</p>
              {event.revisedWording && <p className="whitespace-pre-wrap break-words">Human revision: {event.revisedWording}</p>}
            </li>)}</ol>
          </details>}
        </section>
      ))}
      <section aria-labelledby="snapshot-title" className="mt-10 border-y-2 border-peat py-6">
        <h2 id="snapshot-title" className="text-3xl">Trust Evidence Snapshot</h2>
        <p className="mt-3">{presentation.boundary}</p>
        <p className="mt-3 font-bold">{presentation.reviewedCount} reviewed · {presentation.unreviewedCount} unreviewed</p>
        <p className="mt-2">Includes all candidates, all recorded outcomes, unresolved items and previous review events. Unsaved form drafts are excluded.</p>
        {presentation.reviewedCount > 0 && !reviewError ? <>
          <a className={`${control} mt-4 inline-flex items-center`} download={`gaia-trust-evidence-${presentation.proofSha256.slice(0, 12)}-r${presentation.reviewRevision}.json`}
            href={`data:application/json;charset=utf-8,${encodeURIComponent(snapshot)}`}>Download Trust Evidence Snapshot</a>
          <details className="mt-3"><summary className="min-h-11 cursor-pointer py-2 font-bold">Preview snapshot JSON</summary>
            <pre className="mt-3 whitespace-pre-wrap break-all text-xs">{snapshot}</pre></details>
        </> : <p className="mt-4">Save a valid human review to enable snapshot export.</p>}
      </section>
    </>
  )
}
