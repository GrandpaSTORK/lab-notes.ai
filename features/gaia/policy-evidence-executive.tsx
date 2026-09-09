import type { ReactNode } from "react"
import { BackToExecutiveSnapshot } from "./policy-evidence-navigation"
import { EXECUTIVE_AUTHORITY, EXECUTIVE_DISCLOSURE, EXECUTIVE_PRINCIPLE, MATCH_BOUNDARY,
  PRESENTATION_BOUNDARY, QUESTION_BOUNDARY, THEME_BOUNDARY, type ExecutivePage } from "@/lib/gaia/policy-evidence-executive"

/** Audience-facing projection only: no raw evidence bundle, serialized JSON, fingerprint or base64 view. */
export function ExecutiveTrustEvidence({ page }: { page: ExecutivePage }) {
  const core = page.core
  return <section aria-labelledby="executive-title" className="border-y-2 border-peat bg-surface px-4 py-5 sm:px-8">
    <div className="mx-auto max-w-6xl">
      <header>
        <h1 id="executive-title" className="font-display text-3xl leading-tight sm:text-4xl">GAIA Trust Evidence Snapshot</h1>
        <p className="mt-1 text-lg font-bold">Policy Evidence Demonstration</p>
        <p className="mt-3 border-l-4 border-signal-strong pl-3 font-bold">{EXECUTIVE_DISCLOSURE}</p>
        <p className="mt-2 text-sm">{EXECUTIVE_PRINCIPLE}</p>
      </header>
      {page.issue && <p role="alert" className="mt-5 border-2 border-peat p-4">{page.issue}</p>}
      {core && <>
        <div className="mt-4 grid gap-5 lg:grid-cols-[3fr_2fr]">
          <section aria-label="Executive interpretation">
            <p className="font-bold"><span className="font-display text-3xl">{core.responses.examined}</span> synthetic source responses examined · {core.responses.supplied} supplied</p>
            <h2 className="mt-3 text-xl font-bold">What GAIA currently sees in the evidence</h2>
            <p className="font-mono text-xs">{core.interpretation.epistemicClass} · {core.candidateId}</p>
            <p className="mt-2 whitespace-pre-wrap break-words text-lg leading-snug">{core.interpretation.wording}</p>
            <a href="#decision-evidence-brief" className="mt-2 inline-flex min-h-11 items-center font-bold underline">Why This Insight?</a>
            <section aria-labelledby="executive-context-title" className="mt-2 border-t border-line pt-3">
              <h3 id="executive-context-title" className="font-bold">What people are talking about</h3>
              <dl className="mt-2 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
                {core.themes.map((theme) => <div key={theme.label} className="flex items-baseline justify-between gap-2">
                  <dt className="break-words">{theme.label}</dt><dd className="font-bold">{theme.count}</dd>
                </div>)}
              </dl>
              <p className="mt-2 text-sm">{core.responses.supplied} synthetic responses across {core.themes.length === 6 ? "six" : core.themes.length} stored source themes. Theme frequency does not establish importance or consensus.</p>
            </section>
          </section>
          <div className="space-y-3">
            <section aria-label="Executive human review" className="border-l-2 border-peat pl-4">
              <h2 className="font-bold">Human review</h2>
              <p className="font-mono text-xs">{core.humanReview.epistemicClass}</p>
              <p className="font-bold">{core.humanReview.disposition ?? "No human disposition has been recorded."}</p>
              <p className="text-sm">Saved state: {core.humanReview.state}</p>
              <p className="mt-1 text-sm">{core.humanReview.scope}</p>
              <a href="#brief-human-review" className="inline-flex min-h-11 items-center text-sm font-bold underline">Human Review</a>
            </section>
            <section aria-label="Executive frozen dissent" className="border-l-2 border-peat pl-4">
              <h2 className="font-bold">Frozen dissent</h2>
              <p className="break-words font-mono text-xs">{core.dissent.state}</p>
              <p className="font-bold">{core.dissent.count === null ? "Challenge evidence absent; no finding count established." : `${core.dissent.count} potential unseen dissent ${core.dissent.count === 1 ? "item" : "items"}`}</p>
              {core.dissent.firstFinding && <>
                <p className="mt-1 break-words font-mono text-xs">{core.dissent.firstFinding.status} · {core.dissent.firstFinding.sourceId}</p>
                <blockquote className="mt-1 whitespace-pre-wrap break-words">{core.dissent.firstFinding.quote}</blockquote>
                {core.dissent.count! > 1 && <p className="text-sm">First finding in recorded order. All findings remain in the detailed evidence.</p>}
              </>}
              {core.dissent.messages.map((message) => <p className="mt-1 text-sm" key={message}>{message}</p>)}
              <p className="mt-1 text-sm">{core.dissent.boundary}</p>
              <a href="#brief-potential-dissent" className="inline-flex min-h-11 items-center text-sm font-bold underline">Potential Dissent</a>
            </section>
          </div>
        </div>
        <div className="mt-4 grid gap-5 border-t-2 border-peat pt-4 lg:grid-cols-2">
          <section aria-label="Executive source themes">
            <h2 className="text-lg font-bold">Stored source themes</h2>
            <ul className="mt-2 grid gap-x-4 sm:grid-cols-2">{core.themes.map((theme) => <li key={theme.label}>
              <details className="border-b border-line">
                <summary className="min-h-11 cursor-pointer py-2 text-sm"><span className="break-words">{theme.label}</span> · <strong>{theme.count}</strong></summary>
                <p className="text-xs">Supporting source IDs</p>
                <ul className="flex flex-wrap gap-x-3">{theme.sourceIds.map((id) => <li key={id}><a href={`#executive-source-${id}`} className="inline-flex min-h-11 items-center font-mono text-xs underline">{id}</a></li>)}</ul>
              </details>
            </li>)}</ul>
            <p className="mt-2 text-sm">{THEME_BOUNDARY}</p>
            <a href="#executive-source-evidence" className="inline-flex min-h-11 items-center text-sm font-bold underline">View Original Testimony</a>
            {core.limitation && <p className="mt-2 text-sm">{core.limitation} {core.missingSourceIds.join(", ")}</p>}
          </section>
          <section id="executive-limitations" aria-label="Executive limitations">
            <h2 className="text-lg font-bold">What was not established</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{core.limitations.map((limit) => <li key={limit.reference}>{limit.text}</li>)}</ul>
            <a href="#brief-trace" className="inline-flex min-h-11 items-center text-sm font-bold underline">Inspect the complete frozen evidence and limitations</a>
          </section>
        </div>
        <section aria-label="Executive decision context" className="mt-3 grid gap-4 border-t-2 border-peat pt-3 lg:grid-cols-2">
          <div>
            <h2 className="font-bold">Human Decision Record</h2>
            <p className="break-words font-mono text-xs">{page.decision!.state ?? page.decision!.availability}</p>
            <p className="mt-1 text-sm">{page.decision!.message}</p>
            {page.decision!.availability === "AVAILABLE" && <a href="#human-decision-title" className="inline-flex min-h-11 items-center text-sm font-bold underline">Inspect Human Decision Record</a>}
          </div>
          <div>
            <h2 className="font-bold">Current-evidence check</h2>
            <p className="break-words font-mono text-xs">{page.change!.state ?? page.change!.availability}</p>
            {page.change!.runId && <p className="text-xs">Comparison run: {page.change!.runId}</p>}
            {(page.change!.availability !== "AVAILABLE" || page.change!.state !== "RECORDED_EVIDENCE_MATCHES_CURRENT") && <p className="mt-1 text-sm">{page.change!.message}</p>}
            <p className="mt-1 text-sm">{MATCH_BOUNDARY}</p>
            {page.change!.availability === "AVAILABLE" && <a href="#decision-evidence-change" className="inline-flex min-h-11 items-center text-sm font-bold underline">Has the Evidence Changed?</a>}
          </div>
        </section>
        <section aria-label="Executive presentation questions" className="mt-3 border-t-2 border-peat pt-3">
          <h2 className="text-lg font-bold">Questions leadership should examine</h2>
          <p className="mt-1 text-xs">{QUESTION_BOUNDARY}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{core.questions.map((question) => <li key={question.text}><a className="underline" href={question.href}>{question.text}</a></li>)}</ul>
        </section>
      </>}
      <footer className="mt-4 border-t border-line pt-3 text-xs">
        <p><strong>Presentation: {page.availability}.</strong> {PRESENTATION_BOUNDARY}</p>
        <p className="mt-2">{EXECUTIVE_AUTHORITY}</p>
        <a href="#policy-evidence-detail" className="mt-1 inline-flex min-h-11 items-center text-sm font-bold underline">Inspect the detailed policy evidence</a>
      </footer>
    </div>
  </section>
}

/** Explicit layout boundary keeps H ahead of proof machinery in every availability state. */
export function ExecutiveEvidenceLayout({ page, children }: { page: ExecutivePage; children: ReactNode }) {
  return <><ExecutiveTrustEvidence page={page} />{children}</>
}

export function ExecutiveSourceEvidence({ page }: { page: ExecutivePage }) {
  if (!page.core) return null
  return <section id="executive-source-evidence" aria-label="Executive theme source evidence" className="mx-auto max-w-6xl border-t-2 border-peat px-4 py-6 sm:px-8">
    <h2 className="text-2xl font-bold">Exact source metadata and testimony</h2>
    <BackToExecutiveSnapshot />
    <p className="mt-2">{EXECUTIVE_DISCLOSURE}</p>
    <p className="mt-2">Labels and testimony are copied from the validated source records examined against this selected interpretation.</p>
    {page.core.sources.map((source) => <details className="mt-3 border-t border-line" key={source.id}>
      <summary id={`executive-source-${source.id}`} className="min-h-11 cursor-pointer py-3 font-bold">{source.id} · {source.theme ?? "Theme metadata unavailable"}</summary>
      <p className="whitespace-pre-wrap break-words">{source.text}</p>
      <BackToExecutiveSnapshot />
    </details>)}
    <a href="#decision-evidence-brief" className="mt-3 inline-flex min-h-11 items-center font-bold underline">Inspect original relationships and quotations for this interpretation</a>
  </section>
}
