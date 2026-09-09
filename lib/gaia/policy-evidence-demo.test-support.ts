import { join } from "node:path"
import { DEMO_ROOT, assertDemoPackage } from "./policy-evidence-demo-root"
import { loadReviewPage } from "./policy-evidence-review-store"
import { loadDecisionBrief } from "./policy-evidence-brief-store"
import { loadDecisionPage } from "./policy-evidence-decision-store"
import { loadDecisionChangePage } from "./policy-evidence-change-store"
import { loadExecutivePage } from "./policy-evidence-executive-store"
import { loadSnapshotPage } from "./policy-evidence-snapshot-store"
import { loadDissent } from "./policy-evidence-dissent-store"

/** Exact packaged synthetic demonstration; uses sealed loaders, never generates evidence. */
export function packagedDemo(root = join(process.cwd(), DEMO_ROOT)) {
  assertDemoPackage(root)
  const review = loadReviewPage(root)!
  const brief = loadDecisionBrief(root, review.runId, review.presentation.proofSha256)
  const decisions = loadDecisionPage(root, brief), change = loadDecisionChangePage(root)
  return { review, brief, decisions, change, executive: loadExecutivePage(root, brief, decisions, change),
    snapshots: loadSnapshotPage(root, review.runId, review.presentation.proofSha256),
    dissent: loadDissent(root, review.runId, review.presentation.proofSha256) }
}
