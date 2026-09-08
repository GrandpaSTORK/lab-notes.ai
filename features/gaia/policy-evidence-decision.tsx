import type { SavedDecision } from "@/lib/gaia/policy-evidence-decision-store"

export function DecisionRecordEvidence({ saved }: { saved: SavedDecision }) {
  const { record } = saved
  return <article aria-label={`Recorded decision ${record.decisionId}`} className="mt-6 min-w-0 border-2 border-peat bg-surface p-4 sm:p-6">
    <h3 className="font-display text-2xl">Frozen human decision · {record.decisionStatus}</h3>
    <p className="mt-3 font-bold">{record.disclosure}</p>
    <p className="mt-3">{record.authority}</p>
    <p className="mt-3">{record.evidenceBoundary}</p>
    <p className="mt-3 font-mono text-sm">{saved.localAgreement === "MATCHES_SELECTED_LOCAL_INPUTS"
      ? "Frozen evidence matched selected local inputs at the last check. Reload to compare again."
      : "HISTORICAL_OR_NOT_CHECKED: this record is valid against its frozen bytes, but is not presented as current evidence."}</p>
    <dl className="mt-4 space-y-3 break-words">
      <div><dt className="font-bold">Human-authored decision</dt><dd className="whitespace-pre-wrap">{record.humanDecision.decisionText}</dd></div>
      <div><dt className="font-bold">Human-authored rationale</dt><dd className="whitespace-pre-wrap">{record.humanDecision.rationale}</dd></div>
      <div><dt className="font-bold">Decision maker (synthetic)</dt><dd className="whitespace-pre-wrap">{record.humanDecision.decisionMaker}</dd></div>
      <div><dt className="font-bold">Role (synthetic)</dt><dd className="whitespace-pre-wrap">{record.humanDecision.role}</dd></div>
      <div><dt className="font-bold">Decision authority (synthetic, supplied)</dt><dd className="whitespace-pre-wrap">{record.humanDecision.decisionAuthority}</dd></div>
    </dl>
    <p className="mt-3">{record.humanDecision.identityBoundary}</p>
    <p className="mt-4 font-bold">Acknowledged: {record.unresolvedAcknowledgement.statement}</p>
    <section aria-label="Recorded decision evidence boundaries" className="mt-4 border-2 border-peat p-4">
      <h4 className="text-xl font-bold">Unchanged human review · {record.humanReview.epistemicClass}</h4>
      <p>{record.humanReview.disposition ?? "No human disposition has been recorded."}</p>
      <p className="whitespace-pre-wrap">{record.humanReview.rationale}</p>
      <p>{record.humanReview.scope}</p>
      <h4 className="mt-4 text-xl font-bold">Frozen challenge · {record.unseenDissent.state}</h4>
      {record.unseenDissent.messages.map((message) => <p key={message}>{message}</p>)}
      <p className="mt-3">{record.unseenDissent.boundary}</p>
      {record.unseenDissent.challenge?.findings.map((finding, index) => <details key={`${finding.sourceId}-${index}`} className="mt-3 border-t border-line pt-3">
        <summary className="min-h-11 cursor-pointer font-bold">{finding.status} · {finding.sourceId}</summary>
        <blockquote className="mt-2 whitespace-pre-wrap border-l-4 border-peat pl-4">{finding.quote}</blockquote>
        <p>Validated UTF-16 location: [{finding.start}, {finding.end})</p>
        <p>Original relationship: {finding.originalRelationships.map((item) => item.kind).join(", ")}</p>
        <p className="mt-2">MODEL-INTERPRETED bearing: {finding.explanation}</p>
        <p>MODEL-INTERPRETED novelty: {finding.noveltyReason}</p>
        <p className="mt-2 whitespace-pre-wrap">Complete testimony: {finding.originalTestimony}</p>
      </details>)}
      <h4 className="mt-4 text-xl font-bold">UNRESOLVED — WHAT WAS NOT ESTABLISHED</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5">{record.unresolved.whatWasNotEstablished.map((limit, i) => <li key={i}>{limit}</li>)}</ul>
    </section>
    <section aria-label="Decision evidence trace" className="mt-4 break-words border-2 border-peat p-4">
      <h4 className="text-xl font-bold">Trace Decision → Brief → Snapshot → original evidence</h4>
      <p className="mt-2">MECHANICALLY VERIFIED: record structure and frozen trace bindings; no decision correctness is verified.</p>
      <p className="mt-2 font-mono text-sm">Decision path: {saved.path}</p>
      <p className="font-mono text-sm">Decision SHA-256: {saved.sha256}</p>
      <p>Recorded at: {record.createdAt}</p>
      <p>{record.runId} · {record.candidateId}</p>
      <p className="font-mono text-sm">Brief identity: {record.trace.briefIdentity}</p>
      <p className="font-mono text-sm">Snapshot path: {record.trace.snapshotPath}</p>
      <p className="font-mono text-sm">Snapshot SHA-256: {record.trace.snapshotSha256}</p>
      {Object.entries(record.trace.bindings).map(([key, value]) => <p key={key} className="font-mono text-sm">{key} SHA-256: {value ?? "ABSENT"}</p>)}
      <a href="#decision-evidence-brief" className="mt-4 inline-block min-h-11 font-bold underline">Inspect this frozen brief, complete testimony and full BUILD-001D evidence</a>
      <details className="mt-3"><summary className="min-h-11 cursor-pointer font-bold">Inspect complete saved record and embedded exact snapshot bytes</summary>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(record, null, 2)}</pre>
      </details>
    </section>
  </article>
}
