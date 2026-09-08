import type { ChangePage } from "@/lib/gaia/policy-evidence-change-store"
import { SnapshotEvidence } from "./policy-evidence-snapshot"

export function DecisionEvidenceChange({ page }: { page: ChangePage }) {
  const notice = page.notice, record = notice?.historicalRecord
  return <section id="decision-evidence-change" aria-labelledby="decision-change-title" className="min-w-0 border-y-2 border-peat py-6">
    <h2 id="decision-change-title" className="font-display text-3xl">BUILD-001G — Decision Evidence Change Notice</h2>
    <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 font-bold">Choose a saved historical decision</summary>
      <p>The initial selection is the first filename in the sorted run/decision inventory, not a judgment about priority or recency.</p>
      <ul className="mt-3 space-y-3">{page.choices.map((choice) => <li key={`${choice.runId}-${choice.decisionId}`}>
        <a className="inline-block min-h-11 break-all font-mono text-sm underline" href={`?decisionRun=${encodeURIComponent(choice.runId)}&decision=${encodeURIComponent(choice.decisionId)}#decision-evidence-change`}>{choice.runId} / {choice.decisionId}</a>
      </li>)}</ul>
    </details>
    {page.warnings.map((warning) => <p className="mt-3" key={warning}>{warning}</p>)}
    {page.issue && <p role="alert" className="mt-4 border-2 border-peat p-4">{page.issue}</p>}
    {notice && record && <>
      <p className="mt-4 text-lg font-bold">{notice.rule}</p>
      <p className="mt-3 font-bold">{notice.historicalRule}</p>
      <p className="mt-3">{notice.authority}</p>
      <div className="mt-5 border-2 border-peat bg-surface p-4 sm:p-6">
        <h3 className="text-xl font-bold">{notice.presentation.heading}</h3>
        {notice.presentation.messages.map((message) => <p className="mt-3" key={message}>{message}</p>)}
        <p className="mt-3 break-words font-mono text-sm">{notice.state}</p>
        <p className="mt-3">Comparison scope: current local files in {page.comparisonRunId ?? "an unavailable run"}. This request-time check compares exactly source, proof, reviews and dissent. Reload to check again.</p>
        <p className="mt-3">Fingerprints beside INVALID or NOT_VALIDATED are identities of observed bytes only. They are not validated evidence. Incomplete or invalid checks make no binding-agreement claim.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-left text-sm">
            <caption className="mb-3 text-left font-bold">Recorded and current evidence bindings</caption>
            <thead><tr><th scope="col" className="w-1/5 border-b-2 border-peat p-2">Input</th><th scope="col" className="border-b-2 border-peat p-2">Recorded state / SHA-256</th><th scope="col" className="border-b-2 border-peat p-2">Current state / SHA-256</th></tr></thead>
            <tbody>{notice.rows.map((row) => <tr key={row.input}>
              <th scope="row" className="break-words border-b border-line p-2 align-top">{row.input}{" "}<span className="mt-2 block text-xs font-normal">{row.comparison}</span></th>
              <td className="border-b border-line p-2 align-top"><p>{row.recorded.state}</p><p className="mt-2 break-all font-mono text-xs">{row.recorded.sha256 ?? "ABSENT"}</p></td>
              <td className="border-b border-line p-2 align-top"><p className="break-words">{row.current.state}</p><p className="mt-2 break-all font-mono text-xs">{row.current.sha256 ?? (row.current.state === "ABSENT" ? "ABSENT" : "No fingerprint available")}</p></td>
            </tr>)}</tbody>
          </table>
        </div>
      </div>
      <article aria-label="Historical human decision" className="mt-5 border-2 border-peat bg-surface p-4 sm:p-6">
        <h3 className="text-2xl font-bold">Original Human Decision Record · {record.decisionStatus}</h3>
        <p className="mt-3 font-bold">{record.disclosure}</p>
        <p className="mt-3">{record.authority}</p><p className="mt-3">{record.evidenceBoundary}</p>
        <p className="mt-3 font-mono text-sm">Historical validity: {notice.historicalValidity}</p>
        <dl className="mt-4 space-y-3 break-words">
          {([ ["Human decision", record.humanDecision.decisionText], ["Human rationale", record.humanDecision.rationale],
            ["Decision maker (synthetic)", record.humanDecision.decisionMaker], ["Role (synthetic)", record.humanDecision.role],
            ["Decision authority (synthetic)", record.humanDecision.decisionAuthority] ] as const).map(([label, value]) => <div key={label}><dt className="font-bold">{label}</dt><dd className="whitespace-pre-wrap">{value}</dd></div>)}
        </dl>
        <p className="mt-3">{record.humanDecision.identityBoundary}</p>
        <p className="mt-3">Acknowledged: {record.unresolvedAcknowledgement.statement}</p>
        <p className="mt-3 font-bold">Frozen review: {record.humanReview.disposition ?? "No human disposition recorded"} · {record.humanReview.epistemicClass}</p>
        <p>{record.humanReview.scope}</p>
        <p className="mt-3 font-bold">Frozen dissent: {record.unseenDissent.state}</p>
        {record.unseenDissent.messages.map((message) => <p key={message}>{message}</p>)}
        <p className="mt-3">{record.unseenDissent.boundary}</p>
        {record.unseenDissent.challenge?.findings.map((finding, i) => <p className="mt-3 font-mono text-sm" key={i}>{finding.status} · {finding.sourceId}</p>)}
        <section aria-label="Historical decision trace" className="mt-5 break-words border-t-2 border-peat pt-4">
          <h4 className="text-xl font-bold">Decision → Brief → Snapshot → original evidence</h4>
          <p className="mt-3">{record.principle}</p>
          <p className="mt-3 font-mono text-sm">Record: {page.recordPath}</p>
          <p className="font-mono text-sm">Record SHA-256: {page.recordSha256}</p>
          <p>{record.runId} · {record.candidateId} · Recorded {record.createdAt}</p>
          <p className="mt-3 font-mono text-sm">Brief identity: {record.trace.briefIdentity}</p>
          <p>{record.trace.briefHashScope}</p>
          <p className="mt-3 font-bold">Exact frozen interpretation</p><p className="whitespace-pre-wrap">{notice.frozenBrief.interpretation.wording}</p>
          <p className="mt-3">{notice.frozenBrief.authority}</p>
          <p className="mt-3 font-mono text-sm">Snapshot: {record.trace.snapshotPath}</p>
          <p className="font-mono text-sm">Snapshot SHA-256: {record.trace.snapshotSha256}</p>
          <p className="mt-3">The evidence below comes only from the decision&apos;s embedded frozen snapshot. Current files and the separately displayed working brief are not substituted.</p>
          <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 font-bold">Inspect frozen snapshot, complete testimony and unresolved limitations</summary>
            <SnapshotEvidence snapshot={notice.frozenBrief.fullSnapshot} />
          </details>
          <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Inspect exact reconstructed BUILD-001E brief</summary>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(notice.frozenBrief, null, 2)}</pre>
          </details>
          {page.recordDownload && <a className="mt-3 inline-block min-h-11 font-bold underline" download={`human-decision-${record.decisionId}.json`} href={page.recordDownload}>Download unchanged historical decision and embedded evidence</a>}
        </section>
      </article>
    </>}
  </section>
}
