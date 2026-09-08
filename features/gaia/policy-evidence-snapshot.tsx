import type { TrustSnapshot } from "@/lib/gaia/policy-evidence-snapshot"

export function SnapshotEvidence({ snapshot }: { snapshot: TrustSnapshot }) {
  const model = snapshot.modelInterpreted, human = snapshot.humanReview, dissent = snapshot.unseenDissent
  return <article aria-label={`Frozen evidence ${snapshot.candidateId}`} className="mt-5 border-2 border-peat bg-paper p-4 sm:p-6">
    <h3 className="text-xl font-bold">Trust Evidence Snapshot — {snapshot.candidateId}</h3>
    <p className="mt-2">Frozen {snapshot.createdAt} · {snapshot.runId} · {snapshot.schemaVersion}</p>
    <p className="mt-2 font-bold">{snapshot.boundary}</p>
    <p className="mt-2">Synthetic working data. Not real citizen testimony. This is a frozen record, not a live review state.</p>
    <p className="mt-2">{snapshot.attribution}</p>
    <section aria-label="Mechanically verified" className="mt-5">
      <h4 className="font-bold">MECHANICALLY VERIFIED</h4>
      <p>{snapshot.mechanicallyVerified.scope}</p>
      <p className="mt-2">Examination coverage: {snapshot.mechanicallyVerified.coverage.examined}/{snapshot.mechanicallyVerified.coverage.expected} records.</p>
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 font-bold">Exact input artifacts and fingerprints</summary>
        {Object.entries(snapshot.inputs).map(([name, item]) => <div key={name} className="mt-3 border-t border-structure pt-2">
          <p className="font-bold">{name}: {item.state}</p><p className="break-all font-mono text-sm">{item.path}</p>
          <p className="break-all font-mono text-sm">SHA-256: {item.sha256 ?? "Absent — no artifact fingerprint"}</p>
        </div>)}
        <p className="mt-3">The JSON embeds exact input bytes as base64 for portable revalidation. Hashes do not attest authorship or meaning.</p>
      </details>
    </section>
    <section aria-label="Model interpretation" className="mt-5">
      <h4 className="font-bold">MODEL-INTERPRETED</h4>
      <p className="mt-2 font-bold">Original machine interpretation</p><p className="whitespace-pre-wrap break-words">{model.originalMachineWording}</p>
      <p className="mt-2">Original assessment: {model.machineAssessment.status}</p><p>Assessment reason: {model.machineAssessment.reason}</p>
      <p className="mt-2">{model.relevance}</p>
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 font-bold">Inspect every examined source and original relationship</summary>
        {model.evidence.map((item, index) => <div key={index} className="mt-4 border-t border-structure pt-3">
          <p className="font-mono text-sm">{item.sourceId} · {item.kind}</p>
          {item.quote !== null && <><blockquote className="mt-2 whitespace-pre-wrap break-words border-l-4 border-peat pl-4">{item.quote}</blockquote><p>UTF-16 offsets [{item.start}, {item.end}), zero-based, end exclusive.</p></>}
          <p className="mt-2">Original model explanation: {item.explanation}</p>
          <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Full source testimony — {item.sourceId}</summary><p className="whitespace-pre-wrap break-words">{item.originalTestimony}</p></details>
        </div>)}
      </details>
      <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Original generation provenance and limitations</summary>
        <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(model.generationProvenance, null, 2)}</pre>
        <ul className="mt-3 list-disc pl-5">{model.limitations.map((item, index) => <li key={index}>{item}</li>)}</ul>
      </details>
    </section>
    <section aria-label="Saved human disposition" className="mt-5">
      <h4 className="font-bold">{human.epistemicClass}</h4><p>{human.scope}</p>
      <p className="mt-2 font-bold">Human disposition: {human.disposition ?? "No human disposition has been recorded."}</p>
      <p>Review state: {human.state} · ledger: {human.ledgerState}</p><p className="mt-2">{human.meaning}</p>
      {human.rationale !== null && <p className="mt-2 whitespace-pre-wrap break-words">Saved human rationale: {human.rationale}</p>}
      {human.revisedWording !== null && <><p className="mt-2 whitespace-pre-wrap break-words">Separate revised wording: {human.revisedWording}</p><p>{human.revisionAssessment}</p></>}
      <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Human-review revision and history</summary>
        <p>Ledger revision: {human.ledgerRevision ?? "No ledger"}</p><p className="break-all">{human.historyReference}</p>
        <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(human.history, null, 2)}</pre>
      </details>
    </section>
    <section aria-label="Frozen unseen dissent" className="mt-5">
      <h4 className="font-bold">{dissent.epistemicClass} — Unseen dissent</h4><p className="mt-2 font-bold">{dissent.state}</p>
      {dissent.messages.map((message) => <p key={message}>{message}</p>)}
      <p className="mt-3">{dissent.boundary}</p>
      {dissent.challenge?.findings.map((item, index) => <div key={index} className="mt-4 border-t border-structure pt-3">
        <p className="font-mono text-sm">{item.status} · {item.sourceId}</p>
        <blockquote className="mt-2 whitespace-pre-wrap break-words border-l-4 border-peat pl-4">{item.quote}</blockquote>
        <p>UTF-16 offsets [{item.start}, {item.end}), zero-based, end exclusive.</p>
        <p className="mt-2">Original relationship: {item.originalRelationships.map(({ kind }) => kind).join(", ")}</p>
        <p className="mt-2">Model challenge explanation: {item.explanation}</p><p className="mt-2">Model novelty explanation: {item.noveltyReason}</p>
        <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Full challenged testimony — {item.sourceId}</summary><p className="whitespace-pre-wrap break-words">{item.originalTestimony}</p>
          <pre className="mt-2 whitespace-pre-wrap break-all text-xs">{JSON.stringify(item.originalRelationships, null, 2)}</pre></details>
      </div>)}
      <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Challenge provenance and limitations</summary>
        {dissent.challenge && <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(dissent.challenge.provenance, null, 2)}</pre>}
        <ul className="list-disc pl-5">{[...dissent.limitations, ...(dissent.challenge?.limitations ?? [])].map((limit, index) => <li key={index}>{limit}</li>)}</ul>
      </details>
    </section>
    <section aria-label="Unresolved meaning" className="mt-5 border-t-2 border-peat pt-4">
      <h4 className="font-bold">UNRESOLVED — WHAT WAS NOT ESTABLISHED</h4>
      <p className="mt-2 font-bold">WITNESS: Verification must name its boundary.</p>
      <ul className="mt-3 list-disc space-y-2 pl-5">{snapshot.unresolved.whatWasNotEstablished.map((limit, index) => <li key={index}>{limit}</li>)}</ul>
    </section>
  </article>
}
