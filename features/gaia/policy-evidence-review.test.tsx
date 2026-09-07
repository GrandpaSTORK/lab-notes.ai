import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { DISPOSITIONS, emptyReviews, recordReview, reviewPresentation, type ReviewActionResult, type ReviewRequest } from "@/lib/gaia/policy-evidence-review"
import { reviewFixture } from "@/lib/gaia/policy-evidence-review.test-support"
import { PolicyEvidenceReview } from "./policy-evidence-review"

function setup(reviewError: string | null = null) {
  const fixture = reviewFixture()
  let ledger = emptyReviews(fixture.context)
  const presentation = () => reviewPresentation(fixture.context, ledger, "What does the evidence establish?")
  const saveAction = vi.fn(async (request: ReviewRequest): Promise<ReviewActionResult> => {
    ledger = recordReview(fixture.context, ledger, request, "2026-09-07T13:00:00.000Z")
    return { ok: true, presentation: presentation() }
  })
  render(<PolicyEvidenceReview initialPresentation={presentation()} storagePath=".local/gaia/policy-evidence/run-test/reviews.json"
    warnings={[]} reviewError={reviewError} saveAction={saveAction} />)
  return { fixture, saveAction, user: userEvent.setup() }
}

describe("Human review interface", () => {
  it("does not preselect or privilege any disposition; boundaries are visible before disclosure opens", () => {
    setup()
    expect(screen.getAllByText("UNREVIEWED")).toHaveLength(3)
    for (const radio of screen.getAllByRole("radio")) expect(radio).not.toBeChecked()
    const choices = within(screen.getByRole("form", { name: "Human review CAND-001" })).getAllByRole("radio")
    expect(choices).toHaveLength(4)
    expect(new Set(choices.map((radio) => radio.parentElement!.className)).size).toBe(1)
    for (const boundary of screen.getAllByRole("heading", { name: "WHAT WAS NOT ESTABLISHED" })) expect(boundary).toBeVisible()
    expect(screen.queryByRole("link", { name: "Download Trust Evidence Snapshot" })).not.toBeInTheDocument()
  })

  it("renders exact validated quotes, full testimony and absence of contradiction", async () => {
    const { fixture, user } = setup()
    await user.click(screen.getByText("WHY THIS INSIGHT? — CAND-001"))
    const candidate = screen.getByRole("region", { name: "CAND-001" })
    expect(within(candidate).getByText("No direct contradiction was recorded.")).toBeVisible()
    expect(within(candidate).getByText("TRACEABILITY VERIFIED")).toBeVisible()
    expect(within(candidate).getByText("SEMANTIC RELATIONSHIP REMAINS CONTESTABLE")).toBeVisible()
    const support = within(candidate).getByRole("region", { name: "SUPPORT CAND-001" })
    expect(support.querySelector("blockquote")!.textContent).toBe(fixture.context.sources[0].text)
    await user.click(within(support).getByText("Read full original testimony — SYN-0001"))
    expect(within(support).getAllByText(fixture.context.sources[0].text)).toHaveLength(2)
    expect(within(candidate).getByText("Quotation matching does not establish semantic correctness.")).toBeVisible()
  })

  it.each(DISPOSITIONS)("saves %s with required rationale and retains original evidence in export", async (disposition) => {
    const { user, saveAction } = setup()
    const form = screen.getByRole("form", { name: "Human review CAND-001" })
    await user.click(within(form).getByRole("radio", { name: disposition.replaceAll("_", " ") }))
    if (disposition === "REVISE") await user.type(within(form).getByLabelText("Separate human revision — CAND-001"), "Human revised wording.")
    await user.click(within(form).getByRole("button"))
    expect(saveAction).not.toHaveBeenCalled()
    await user.type(within(form).getByLabelText("Human rationale — CAND-001 (required)"), "Keep the unresolved evidence visible.")
    await user.click(within(form).getByRole("button"))
    expect(saveAction).toHaveBeenCalledOnce()
    const candidate = screen.getByRole("region", { name: "CAND-001" })
    const state = { CONFIRM: "CONFIRMED", REVISE: "REVISED", REJECT: "REJECTED", HOLD_DISSONANCE: "HELD_DISSONANCE" }[disposition]
    expect(within(candidate).getByText(state)).toBeVisible()
    expect(within(candidate).getByText("Test-only candidate 1. No semantic ground truth is asserted.")).toBeVisible()
    if (disposition === "REVISE") {
      expect(within(candidate).getByText("Human revised wording.")).toBeVisible()
      expect(within(candidate).getByText("REQUIRES_NEW_ASSESSMENT_OR_REVIEW")).toBeVisible()
    }
    if (disposition === "HOLD_DISSONANCE") expect(within(candidate).getByText(/^Unresolved\. No consensus/)).toBeVisible()
    const download = screen.getByRole("link", { name: "Download Trust Evidence Snapshot" })
    const snapshot = JSON.parse(decodeURIComponent(download.getAttribute("href")!.split(",")[1]))
    expect(snapshot.candidates[0].review.disposition).toBe(disposition)
    expect(snapshot.candidates[0].evidence.some((item: { kind: string }) => item.kind === "QUALIFICATION")).toBe(true)
    expect(snapshot.candidates[1].reviewState).toBe("UNREVIEWED")
    expect(snapshot.unreviewedCount).toBe(2)
    expect(snapshot.candidates[0].whatWasNotEstablished).toContain("CONTESTED does not prove genuine disagreement.")
  })

  it("supports a keyboard-only HOLD DISSONANCE review", async () => {
    const { user, saveAction } = setup()
    const form = screen.getByRole("form", { name: "Human review CAND-001" })
    const hold = within(form).getByRole("radio", { name: "HOLD DISSONANCE" })
    hold.focus()
    await user.keyboard(" ")
    expect(hold).toBeChecked()
    await user.tab()
    expect(within(form).getByLabelText("Human rationale — CAND-001 (required)")).toHaveFocus()
    await user.keyboard("The competing readings remain unresolved.")
    await user.tab()
    expect(within(form).getByRole("button")).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(saveAction).toHaveBeenCalledOnce()
    expect(screen.getByText("HELD_DISSONANCE")).toBeVisible()
  })

  it("retains a draft and does not claim success when a stale proof is rejected", async () => {
    const { user, saveAction } = setup()
    saveAction.mockResolvedValueOnce({ ok: false, message: "The proof changed. Reload before reviewing." })
    const form = screen.getByRole("form", { name: "Human review CAND-001" })
    await user.click(within(form).getByRole("radio", { name: "REJECT" }))
    await user.type(within(form).getByLabelText("Human rationale — CAND-001 (required)"), "My unsaved reasoning.")
    await user.click(within(form).getByRole("button"))
    expect(screen.getByRole("alert")).toHaveTextContent("The proof changed")
    expect(within(form).getByLabelText("Human rationale — CAND-001 (required)")).toHaveValue("My unsaved reasoning.")
    expect(screen.getAllByText("UNREVIEWED")).toHaveLength(3)
  })

  it("visibly blocks invalid stored review associations", () => {
    setup("Stored review history belongs to a different proof fingerprint. Saving is disabled.")
    expect(screen.getByRole("alert")).toHaveTextContent("different proof fingerprint")
    for (const radio of screen.getAllByRole("radio")) expect(radio).toBeDisabled()
    expect(screen.queryByRole("link", { name: "Download Trust Evidence Snapshot" })).not.toBeInTheDocument()
  })
})
