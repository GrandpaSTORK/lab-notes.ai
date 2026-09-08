import { headers } from "next/headers"

import { ProvenanceLabel } from "@/components/site/provenance-label"
import { PolicyEvidenceReview } from "@/features/gaia/policy-evidence-review"
import { loadReviewPage } from "@/lib/gaia/policy-evidence-review-store"
import { loadDissent } from "@/lib/gaia/policy-evidence-dissent-store"
import { pageMetadata } from "@/lib/site"
import { saveReviewAction } from "./actions"
import { createSnapshotAction } from "./snapshot-actions"
import { TrustSnapshotPanel } from "@/features/gaia/policy-evidence-snapshot-panel"
import { loadSnapshotPage } from "@/lib/gaia/policy-evidence-snapshot-store"
import { loadDecisionBrief } from "@/lib/gaia/policy-evidence-brief-store"
import { DecisionEvidenceBrief } from "@/features/gaia/policy-evidence-brief"

export const runtime = "nodejs"
export const metadata = {
  ...pageMetadata({ path: "/gaia/policy-evidence", title: "GAIA Policy Evidence Proof", description: "Local review of synthetic interpretations, evidence and their boundaries." }),
  robots: { index: false, follow: false },
}

export default async function PolicyEvidencePage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  // Request-time loading: never bake ignored proof/review files into static pages.
  const host = (await headers()).get("host") ?? ""
  const query = await searchParams
  let loaded: ReturnType<typeof loadReviewPage> = null
  let issue: string | null = null
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) {
    issue = "This proof is available only through the local application."
  } else {
    try { loaded = loadReviewPage(process.cwd()) } catch {
      issue = "No usable proof could be loaded. Source integrity or artifact validation failed, or the local files could not be read."
    }
  }
  return (
    <article>
      <header className="border-y-2 border-peat bg-surface px-4 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="font-mono text-sm">BUILD-001B — Human Review</p>
          <h1 className="mt-4 font-display text-4xl leading-tight sm:text-6xl">GAIA Policy Evidence Proof</h1>
          <div className="mt-6 border-l-4 border-signal-strong pl-4">
            <ProvenanceLabel kind="synthetic" />
            <p className="mt-2 text-lg font-bold">Not real citizen testimony. Human judgment remains authoritative.</p>
          </div>
          <p className="mt-5 text-peat-muted">Built on <a className="font-bold underline" href="https://github.com/Hypership-Software/lab-notes.ai">Hypership’s lab-notes.ai</a> and its build-policy-evidence foundation.</p>
        </div>
      </header>
      {loaded && <div className="mx-auto max-w-6xl px-4 py-6 sm:px-8">
        <DecisionEvidenceBrief page={loadDecisionBrief(process.cwd(), loaded.runId, loaded.presentation.proofSha256, query.brief, query.briefRun)} />
      </div>}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
        {loaded ? <PolicyEvidenceReview key={loaded.presentation.proofSha256} initialPresentation={loaded.presentation}
          dissent={loadDissent(process.cwd(), loaded.runId, loaded.presentation.proofSha256)} storagePath={loaded.storagePath} warnings={loaded.warnings} reviewError={loaded.reviewError} saveAction={saveReviewAction} /> : (
          <section aria-labelledby="proof-unavailable" className="border-2 border-peat bg-surface p-6">
            <h2 id="proof-unavailable" className="text-2xl">No valid proof available</h2>
            <p className="mt-3" role={issue ? "alert" : undefined}>{issue ?? "No BUILD-001A proof artifact exists yet. No candidate data has been fabricated."}</p>
            <p className="mt-4">From the repository root, generate a proof, then reload this page:</p>
            <code className="mt-3 block break-words font-mono">npm.cmd run gaia:generate</code>
          </section>
        )}
      </div>
      {loaded && <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-8">
        <TrustSnapshotPanel key={`${loaded.runId}-${loaded.presentation.proofSha256}-${loaded.presentation.reviewRevision}`}
          page={loadSnapshotPage(process.cwd(), loaded.runId, loaded.presentation.proofSha256)} createAction={createSnapshotAction} />
      </div>}
    </article>
  )
}
