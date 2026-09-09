import type { BriefPage } from "@/lib/gaia/policy-evidence-brief-store"
import { SnapshotEvidence } from "./policy-evidence-snapshot"
import { BackToExecutiveSnapshot } from "./policy-evidence-navigation"

export function DecisionEvidenceBrief({ page }: { page: BriefPage }) {
  const brief = page.brief
  return <section id="decision-evidence-brief" aria-labelledby="decision-brief-title" className="border-y-2 border-peat bg-surface p-4 sm:p-6">
    <h2 id="decision-brief-title" className="text-3xl">BUILD-001E — Decision Evidence Brief</h2>
    <BackToExecutiveSnapshot />
    {page.names.length > 0 && <details className="mt-2"><summary className="min-h-11 cursor-pointer py-3 font-bold">Choose a frozen snapshot</summary>
      <ul className="space-y-2">{page.names.map((name) => <li key={name}><a className="inline-flex min-h-11 items-center break-all underline" aria-current={name === page.selectedName ? "page" : undefined}
        href={`?briefRun=${encodeURIComponent(page.runId!)}&brief=${encodeURIComponent(name)}#decision-evidence-brief`}>{name}</a></li>)}</ul>
    </details>}
    {page.issue && <p role="alert" className="mt-3 border-2 border-signal-strong p-4">{page.issue}</p>}
    {brief && !page.issue && <>
      <p className="mt-3 font-bold">{brief.principle}</p><p className="mt-1 font-bold">{brief.rule}</p>
      <p className="mt-2 text-sm">{brief.authority}</p>
      <p className="mt-2">Synthetic working data — not real citizen testimony.</p>
      <p className="mt-3 border-l-4 border-peat pl-3 font-bold">{brief.trace.localAgreement}: {brief.trace.localBoundary}</p>
      <h3 className="mt-4 text-xl font-bold">Interpretation under review — {brief.interpretation.candidateId}</h3>
      <p className="font-mono text-sm">MODEL-INTERPRETED</p><p className="mt-2 whitespace-pre-wrap break-words text-lg">{brief.interpretation.wording}</p>
      <dl className="mt-4 grid gap-3 border-y-2 border-peat py-3 sm:grid-cols-3">
        <div><dt>Human disposition</dt><dd className="font-bold">{brief.humanReview.disposition ?? "No human disposition has been recorded."}</dd></div>
        <div><dt>Examination coverage · MECHANICALLY VERIFIED</dt><dd className="font-bold">{brief.evidenceState.mechanicallyVerified.coverage.examined}/{brief.evidenceState.mechanicallyVerified.coverage.expected} records</dd></div>
        <div><dt>Frozen dissent state</dt><dd className="break-words font-bold">{brief.unseenDissent.state}</dd></div>
      </dl>
      <a className="mt-2 inline-flex min-h-11 items-center font-bold underline" href="#brief-trace">Trace this brief to the frozen evidence</a>
      <div className="mt-3 grid items-start gap-4 lg:grid-cols-2">
        <section id="brief-human-review" aria-label="Brief human review" className="border-2 border-peat p-4">
          <BackToExecutiveSnapshot />
          <h3 className="text-xl font-bold">Human review</h3><p className="mt-2 font-bold">{brief.humanReview.epistemicClass}</p>
          <p>{brief.humanReview.scope}</p><p className="mt-2">{brief.humanReview.meaning}</p>
          <p className="mt-2">Recorded review state: {brief.humanReview.state}; ledger: {brief.humanReview.ledgerState}.</p>
          {brief.humanReview.disposition === null && <p className="font-bold">UNRESOLVED — No human disposition has been recorded.</p>}
          {brief.humanReview.rationale !== null && <p className="mt-3 whitespace-pre-wrap break-words">Saved rationale: {brief.humanReview.rationale}</p>}
          {brief.humanReview.revisedWording !== null && <><p className="mt-3 whitespace-pre-wrap break-words">Revised wording: {brief.humanReview.revisedWording}</p><p className="mt-2">{brief.humanReview.revisionAssessment}</p></>}
          <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Saved revision and history</summary><p>Ledger revision: {brief.humanReview.ledgerRevision ?? "ABSENT"}</p>
            <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(brief.humanReview.history, null, 2)}</pre></details>
        </section>
        <section aria-label="Brief unresolved boundaries" className="border-2 border-peat p-4">
          <h3 className="text-xl font-bold">UNRESOLVED — WHAT WAS NOT ESTABLISHED</h3>
          <p className="mt-2 font-bold">WITNESS: Verification must name its boundary.</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">{brief.unresolved.whatWasNotEstablished.map((limit, index) => <li key={index}>{limit}</li>)}</ul>
        </section>
      </div>
      <section id="brief-potential-dissent" aria-label="Brief potential unseen dissent" className="mt-5 border-t-2 border-peat pt-4">
        <BackToExecutiveSnapshot />
        <h3 className="text-xl font-bold">Potential unseen dissent</h3><p className="mt-2 font-bold">{brief.unseenDissent.epistemicClass} · {brief.unseenDissent.state}</p>
        {brief.unseenDissent.messages.map((message) => <p key={message}>{message}</p>)}
        <p className="mt-3">{brief.unseenDissent.boundary}</p>
        {brief.unseenDissent.challenge?.findings.map((item, index) => <div key={index} className="mt-4 border-t border-structure pt-3">
          <p className="font-mono text-sm">{item.status} · {item.sourceId}</p>
          <blockquote className="mt-2 whitespace-pre-wrap break-words border-l-4 border-peat pl-4">{item.quote}</blockquote>
          <p>UTF-16 offsets [{item.start}, {item.end}), zero-based, end exclusive.</p>
          <p className="mt-2">Original relationship: {item.originalRelationships.map(({ kind }) => kind).join(", ")}</p>
          <p className="mt-2">Model explanation: {item.explanation}</p><p className="mt-2">Model novelty explanation: {item.noveltyReason}</p>
          <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Complete challenged testimony — {item.sourceId}</summary><p className="whitespace-pre-wrap break-words">{item.originalTestimony}</p>
            <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(item.originalRelationships, null, 2)}</pre></details>
        </div>)}
        <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Challenge provenance and limitations</summary>
          {brief.unseenDissent.challenge && <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(brief.unseenDissent.challenge.provenance, null, 2)}</pre>}
          <ul className="list-disc pl-5">{[...brief.unseenDissent.limitations, ...(brief.unseenDissent.challenge?.limitations ?? [])].map((limit, index) => <li key={index}>{limit}</li>)}</ul>
        </details>
      </section>
      <section aria-label="Brief evidence state" className="mt-5 border-t-2 border-peat pt-4">
        <h3 className="text-xl font-bold">Evidence state</h3><p className="mt-2">{brief.evidenceState.mechanicallyVerified.scope}</p>
        <p className="mt-2 break-words">Source IDs: {brief.evidenceState.mechanicallyVerified.sourceIds.join(", ")}</p>
        <p className="mt-2">Original recorded assessment: {brief.evidenceState.assessment.status}. {brief.evidenceState.assessment.reason}</p>
        <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Inspect original relationships and exact complete testimony</summary>
          {brief.evidenceState.evidence.map((item, index) => <details key={index} className="border-t border-structure">
            <summary className="min-h-11 cursor-pointer py-3 font-bold">{item.sourceId} · {item.kind}</summary>
            {item.quote !== null && <><blockquote className="whitespace-pre-wrap break-words border-l-4 border-peat pl-4">{item.quote}</blockquote><p>UTF-16 offsets [{item.start}, {item.end}), zero-based, end exclusive.</p></>}
            <p className="mt-2">Original model explanation: {item.explanation}</p><p className="mt-2 whitespace-pre-wrap break-words">Complete testimony: {item.originalTestimony}</p>
          </details>)}
        </details>
      </section>
      <section id="brief-trace" aria-label="Trace this brief" className="mt-5 border-t-2 border-peat pt-4">
        <BackToExecutiveSnapshot />
        <h3 className="text-xl font-bold">Trace this brief</h3>
        <p className="mt-2 break-all font-mono text-sm">{brief.trace.snapshotPath}</p>
        <p>Frozen {brief.trace.createdAt} · {brief.trace.runId} · {brief.interpretation.candidateId}</p>
        <p className="mt-2 break-all font-mono text-sm">Snapshot SHA-256: {brief.trace.snapshotSha256}</p>
        {Object.entries(brief.trace.bindings).map(([key, digest]) => <p key={key} className="mt-2 break-all font-mono text-sm">{key} SHA-256: {digest ?? "ABSENT"}</p>)}
        <p className="mt-2">{brief.trace.portableValidity}. Hashes establish identity, not meaning or authorship.</p>
        {page.downloadHref && <a download={page.selectedName!} href={page.downloadHref} className="mt-3 inline-flex min-h-11 items-center border-2 border-peat px-4 py-2 font-bold">Download exact frozen BUILD-001D snapshot</a>}
        <details><summary className="min-h-11 cursor-pointer py-3 font-bold">Inspect full frozen BUILD-001D evidence</summary><SnapshotEvidence snapshot={brief.fullSnapshot} /></details>
      </section>
    </>}
  </section>
}
