// SYNTHETIC TEST FIXTURE — NOT REAL CITIZEN TESTIMONY. No model calls.
import { reviewFixture } from "./policy-evidence-review.test-support"
import { emptyReviews, recordReview, type Disposition } from "./policy-evidence-review"
import { buildDissent, dissentContext } from "./policy-evidence-dissent"
import { testChallenge } from "./policy-evidence-dissent.test-support"
import { composeSnapshot, inputBindings, type SnapshotBytes } from "./policy-evidence-snapshot"

export const SNAPSHOT_TEST_TIME = "2026-09-08T12:00:00.000Z"
export function snapshotFixture(disposition: Disposition = "CONFIRM", findings = true) {
  const fixture = reviewFixture(), context = dissentContext(fixture.sourceBytes, fixture.proofBytes)
  const ledger = recordReview(fixture.context, emptyReviews(fixture.context), { candidateId: "CAND-001", disposition,
    proofSha256: fixture.context.proofSha256, expectedRevision: 0, rationale: "Preserve my judgment alongside unresolved evidence.",
    revisedWording: disposition === "REVISE" ? "Separate human wording." : null }, "2026-09-08T11:00:00.000Z")
  const dissent = buildDissent(context, context.candidates.map(({ id }) => testChallenge(context, findings && id === "CAND-001" ? [{
    sourceId: context.sources[0].id, quote: context.sources[0].text, explanation: "Test model bearing, not semantic ground truth.", noveltyReason: "Test model novelty remains contestable.",
  }] : [], id)))
  const bytes: SnapshotBytes = { source: fixture.sourceBytes, proof: fixture.proofBytes, reviews: Buffer.from(JSON.stringify(ledger)), dissent: Buffer.from(JSON.stringify(dissent)) }
  const request = { runId: "run-test", candidateId: "CAND-001", expectedBindings: inputBindings(bytes) }
  return { ...fixture, bytes, request, dissent, ledger, snapshot: composeSnapshot(bytes, request, SNAPSHOT_TEST_TIME) }
}
