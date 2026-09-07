import { DISSENT_BOUNDARY, DISSENT_LIMITATIONS } from "@/lib/gaia/policy-evidence-dissent-boundary"
import type { Dissent } from "@/lib/gaia/policy-evidence-dissent"

export function UnseenDissent({ candidateId, dissent }: { candidateId: string; dissent?: { artifact: Dissent | null; issue: string | null } }) {
  const challenge = dissent?.artifact?.challenges.find((item) => item.candidateId === candidateId)
  return <section aria-label={`Unseen dissent ${candidateId}`} className="mt-6 border-2 border-peat bg-paper p-4">
    <h3 className="text-xl font-bold">UNSEEN DISSENT CHALLENGE</h3>
    <p className="mt-3 font-bold">WITNESS: Verification must name its boundary.</p>
    <p className="mt-2">{DISSENT_BOUNDARY}</p>
    <p className="mt-2">“This quotation matches the source” does not mean “This quotation materially challenges the interpretation.”</p>
    {dissent?.issue ? <p role="alert" className="mt-3">{dissent.issue}</p> : !challenge ? <p className="mt-3">No validated challenge run is available for this candidate. Dissent has not been tested here.</p> : <>
      <p className="mt-3 font-bold">{challenge.findings.length} potential unseen dissent items</p>
      <p>{dissent?.artifact?.disclosure}</p>
      {!challenge.findings.length && <><p>No potential unseen dissent was surfaced by this challenge run.</p><p className="font-bold">This does not establish that no dissent exists.</p></>}
      {challenge.findings.map((item, index) => <div key={index} className="mt-4 border-t border-structure pt-4">
        <p className="break-words font-mono text-sm">{item.status} · {item.sourceId}</p>
        <blockquote className="mt-3 whitespace-pre-wrap break-words border-l-4 border-peat pl-4">{item.quote}</blockquote>
        <p className="mt-2">Original BUILD-001A relationship: {item.originalRelationships.map(({ kind }) => kind).join(", ")}</p>
        <p className="mt-2">Model challenge explanation: {item.explanation}</p>
        <p className="mt-2">Model novelty explanation: {item.noveltyReason}</p>
        <p className="mt-2">TRACEABILITY VERIFIED · UTF-16 offsets [{item.start}, {item.end}), zero-based, end exclusive.</p>
        <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 font-bold">Read full original testimony — {item.sourceId}</summary><p className="whitespace-pre-wrap break-words">{item.originalTestimony}</p>
          <pre className="mt-3 whitespace-pre-wrap break-all text-xs">{JSON.stringify(item.originalRelationships, null, 2)}</pre></details>
      </div>)}
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 font-bold">Challenge provenance and model limitations</summary>
        <p className="break-all">Source SHA-256: {dissent?.artifact?.sourceSha256}</p><p className="break-all">Proof SHA-256: {dissent?.artifact?.proofSha256}</p>
        <p>Schema: {dissent?.artifact?.schemaVersion}</p>
        <pre className="mt-3 whitespace-pre-wrap break-all text-xs">{JSON.stringify(challenge.provenance, null, 2)}</pre>
        <ul className="list-disc pl-5">{challenge.limitations.map((limit, index) => <li key={index}>{limit}</li>)}</ul>
      </details>
    </>}
    <p className="mt-3">Observed: supplied synthetic source text. Mechanically verified: quotations and artifact bindings when a valid run is loaded. Model-interpreted: possible challenging bearing and novelty. Human-confirmed: only the separately saved review, which this challenge does not change. Unresolved: meaning and materiality.</p>
    <h4 className="mt-4 font-bold">WHAT WAS NOT ESTABLISHED</h4>
    <ul className="mt-2 list-disc space-y-2 pl-5">{DISSENT_LIMITATIONS.map((limit) => <li key={limit}>{limit}</li>)}</ul>
  </section>
}
