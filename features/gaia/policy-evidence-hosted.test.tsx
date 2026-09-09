import { render, screen } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { packagedDemo } from "@/lib/gaia/policy-evidence-demo.test-support"
import { HOSTED_READ_ONLY } from "@/lib/gaia/policy-evidence-hosted-mode"
import { ExecutiveTrustEvidence } from "./policy-evidence-executive"
import { HumanDecisionPanel } from "./policy-evidence-decision-panel"
import { PolicyEvidenceReview } from "./policy-evidence-review"
import { TrustSnapshotPanel } from "./policy-evidence-snapshot-panel"

it("shows packaged READY evidence and saved decision while omitting every hosted write control", () => {
  const p = packagedDemo(), save = vi.fn()
  const { container } = render(<>
    <ExecutiveTrustEvidence page={p.executive} />
    <HumanDecisionPanel page={p.decisions} readOnly saveAction={save} />
    <PolicyEvidenceReview initialPresentation={p.review.presentation} storagePath={p.review.storagePath} warnings={p.review.warnings}
      reviewError={p.review.reviewError} dissent={p.dissent} readOnly saveAction={save} />
    <TrustSnapshotPanel page={p.snapshots} readOnly createAction={save} />
  </>)
  expect(screen.getByText("Presentation: READY.")).toBeVisible()
  expect(screen.getByText(HOSTED_READ_ONLY)).toBeVisible()
  expect(container.querySelector("form, textarea")).toBeNull()
  expect(screen.queryByRole("button", { name: "Record human decision" })).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Freeze a new snapshot" })).not.toBeInTheDocument()
  expect(container.textContent).toContain(p.decisions.saved[0].record.humanDecision.decisionText)
  expect(container.textContent).toContain("RECORDED_EVIDENCE_MATCHES_CURRENT")
  expect(save).not.toHaveBeenCalled()
})
