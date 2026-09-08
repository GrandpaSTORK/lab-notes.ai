import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { createDecisionRecord } from "@/lib/gaia/policy-evidence-decision"
import { decisionFixture } from "@/lib/gaia/policy-evidence-decision.test-support"
import { SNAPSHOT_TEST_TIME } from "@/lib/gaia/policy-evidence-snapshot.test-support"
import type { DecisionPage, SavedDecision } from "@/lib/gaia/policy-evidence-decision-store"
import { DECISION_ACKNOWLEDGEMENT, DECISION_AUTHORITY, DECISION_BOUNDARY, DECISION_LIMIT } from "@/lib/gaia/policy-evidence-decision-boundary"
import { sha256 } from "@/lib/gaia/policy-evidence"
import { DecisionRecordEvidence } from "./policy-evidence-decision"
import { HumanDecisionPanel } from "./policy-evidence-decision-panel"

function fixture(state: "findings" | "zero" | "absent" = "findings") {
  const f = decisionFixture(state), record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
  const saved: SavedDecision = { record, path: `.local/gaia/policy-evidence/run-test/human-decision-${record.decisionId}.json`,
    sha256: sha256(JSON.stringify(record, null, 2)), localAgreement: "MATCHES_SELECTED_LOCAL_INPUTS" }
  const page: DecisionPage = { selection: f.decisionRequest.selection, canRecord: true, issue: null, warnings: [], saved: [] }
  return { ...f, saved, page }
}
it("shows human authority boundaries, blank required fields and the exact frozen selection", () => {
  const f = fixture(), save = vi.fn()
  render(<HumanDecisionPanel page={f.page} saveAction={save} />)
  expect(screen.getByRole("heading", { name: "BUILD-001F — Human Decision Record" })).toBeVisible()
  for (const text of [DECISION_AUTHORITY, DECISION_BOUNDARY, DECISION_LIMIT]) expect(screen.getByText(text)).toBeVisible()
  expect(screen.getByText(`Snapshot SHA-256: ${f.identity.sha256}`)).toBeVisible()
  expect(screen.getByText(`BUILD-001E brief SHA-256: ${f.decisionRequest.selection.briefSha256}`)).toBeVisible()
  for (const name of ["Decision text (synthetic)", "Rationale (synthetic)", "Decision maker (synthetic)", "Role (synthetic)", "Decision authority (synthetic)"]) {
    expect(screen.getByRole("textbox", { name })).toHaveValue("")
    expect(screen.getByRole("textbox", { name })).toBeRequired()
  }
  expect(screen.getByRole("checkbox", { name: DECISION_ACKNOWLEDGEMENT })).not.toBeChecked()
  expect(screen.getByRole("checkbox")).toBeRequired()
  expect(save).not.toHaveBeenCalled()
})
it("submits only verbatim human inputs and explicit acknowledgement, then displays the saved frozen record", async () => {
  const f = fixture(), save = vi.fn().mockResolvedValue({ ok: true, saved: f.saved }), user = userEvent.setup()
  render(<HumanDecisionPanel page={f.page} saveAction={save} />)
  const inputs = [
    ["Decision text (synthetic)", f.decisionRequest.decisionText], ["Rationale (synthetic)", f.decisionRequest.rationale],
    ["Decision maker (synthetic)", f.decisionRequest.decisionMaker], ["Role (synthetic)", f.decisionRequest.role],
    ["Decision authority (synthetic)", f.decisionRequest.decisionAuthority],
  ]
  for (const [name, text] of inputs) { await user.click(screen.getByRole("textbox", { name })); await user.paste(text) }
  await user.click(screen.getByRole("button", { name: "Record human decision" }))
  expect(save).not.toHaveBeenCalled()
  await user.click(screen.getByRole("checkbox"))
  await user.click(screen.getByRole("button", { name: "Record human decision" }))
  expect(save).toHaveBeenCalledExactlyOnceWith({ ...f.decisionRequest, decisionId: expect.any(String) })
  expect(await screen.findByRole("status")).toHaveTextContent("GAIA did not validate the decision")
  expect(screen.getByRole("article", { name: `Recorded decision ${f.saved.record.decisionId}` })).toBeVisible()
  expect(screen.queryByRole("button", { name: "Record human decision" })).not.toBeInTheDocument()
})
it("retains the draft and decision ID on a failed or uncertain save", async () => {
  const f = fixture(), save = vi.fn().mockResolvedValue({ ok: false, message: "Evidence changed. Draft retained." }), user = userEvent.setup()
  render(<HumanDecisionPanel page={f.page} saveAction={save} />)
  for (const input of screen.getAllByRole("textbox")) { await user.click(input); await user.paste("Synthetic test value") }
  await user.click(screen.getByRole("checkbox"))
  await user.click(screen.getByRole("button", { name: "Record human decision" }))
  expect(await screen.findByRole("alert")).toHaveTextContent("Evidence changed")
  expect(screen.getByRole("textbox", { name: "Decision text (synthetic)" })).toHaveValue("Synthetic test value")
  await user.click(screen.getByRole("button", { name: "Record human decision" }))
  expect(save.mock.calls[1][0].decisionId).toBe(save.mock.calls[0][0].decisionId)
})
it("shows preserved human review, potential dissent, exact quote/offsets/relationship/testimony and full trace", async () => {
  const f = fixture(), finding = f.saved.record.unseenDissent.challenge!.findings[0]
  render(<DecisionRecordEvidence saved={f.saved} />)
  expect(screen.getByText("CONFIRM")).toBeVisible()
  expect(screen.getByText(f.saved.record.humanReview.scope)).toBeVisible()
  expect(screen.getByText("Frozen challenge · VALIDATED_FINDINGS")).toBeVisible()
  await userEvent.click(screen.getByText(`POTENTIAL_UNSEEN_DISSENT · ${finding.sourceId}`))
  expect(screen.getByText(finding.quote)).toBeVisible()
  expect(screen.getByText(`Validated UTF-16 location: [${finding.start}, ${finding.end})`)).toBeVisible()
  expect(screen.getByText("Original relationship: SUPPORT")).toBeVisible()
  expect(screen.getByText(`Complete testimony: ${finding.originalTestimony}`)).toBeVisible()
  expect(screen.getByRole("heading", { name: "UNRESOLVED — WHAT WAS NOT ESTABLISHED" })).toBeVisible()
  const trace = within(screen.getByRole("region", { name: "Decision evidence trace" }))
  expect(trace.getByText(`Snapshot SHA-256: ${f.identity.sha256}`)).toBeVisible()
  for (const [key, digest] of Object.entries(f.current.bindings)) expect(trace.getByText(`${key} SHA-256: ${digest}`)).toBeVisible()
  expect(trace.getByRole("link", { name: "Inspect this frozen brief, complete testimony and full BUILD-001D evidence" })).toHaveAttribute("href", "#decision-evidence-brief")
  await userEvent.click(trace.getByText("Inspect complete saved record and embedded exact snapshot bytes"))
  expect(trace.getByText(/"snapshotBytesBase64":/)).toBeVisible()
})
it("keeps zero statements adjacent and absent distinct in a recorded decision", () => {
  const zero = fixture("zero"), absent = fixture("absent")
  const { rerender } = render(<DecisionRecordEvidence saved={zero.saved} />)
  expect(screen.getByText("No potential unseen dissent was surfaced by this challenge run.").nextElementSibling?.textContent).toBe("This does not establish that no dissent exists.")
  rerender(<DecisionRecordEvidence saved={absent.saved} />)
  expect(screen.getByText("Frozen challenge · ABSENT")).toBeVisible()
  expect(screen.queryByText("No potential unseen dissent was surfaced by this challenge run.")).not.toBeInTheDocument()
  expect(screen.getByText("dissent SHA-256: ABSENT")).toBeVisible()
})
it("blocks invalid or historical evidence without decision controls; historical saved records remain explicit", () => {
  const f = fixture()
  const { rerender } = render(<HumanDecisionPanel page={{ ...f.page, canRecord: false, selection: null, issue: "Invalid dissent blocks recording; not zero findings." }} saveAction={vi.fn()} />)
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid dissent")
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
  rerender(<HumanDecisionPanel page={{ ...f.page, canRecord: false, issue: "Historical evidence cannot be recorded as current.", saved: [{ ...f.saved, localAgreement: "HISTORICAL_OR_NOT_CHECKED" }] }} saveAction={vi.fn()} />)
  expect(screen.getByText(/HISTORICAL_OR_NOT_CHECKED: this record/)).toBeVisible()
  expect(screen.queryByRole("button", { name: "Record human decision" })).not.toBeInTheDocument()
})
