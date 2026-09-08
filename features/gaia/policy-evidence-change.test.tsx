import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it } from "vitest"
import { compareDecisionEvidence, availableCurrentEvidence, CHANGE_AUTHORITY, CHANGE_HISTORY, CHANGE_RULE } from "@/lib/gaia/policy-evidence-change"
import type { ChangePage } from "@/lib/gaia/policy-evidence-change-store"
import { changeFixture } from "@/lib/gaia/policy-evidence-change.test-support"
import { DecisionEvidenceChange } from "./policy-evidence-change"

function page(state: "match" | "changed" | "invalid" | "unavailable" = "match", absent = false, findings = true) {
  const f = changeFixture(absent, findings)
  const current = state === "unavailable" ? null : availableCurrentEvidence(f.record.runId, state === "match" ? f.bytes
    : { ...f.bytes, reviews: state === "invalid" ? Buffer.from("{}") : Buffer.concat([f.bytes.reviews!, Buffer.from(" ")]) })
  const notice = compareDecisionEvidence(f.record, current)
  const value: ChangePage = { notice, issue: null, warnings: [], choices: [{ runId: f.record.runId, decisionId: f.record.decisionId }],
    recordPath: ".local/gaia/policy-evidence/run-test/human-decision-test.json", recordSha256: "a".repeat(64),
    recordDownload: "data:application/json;base64,e30=", comparisonRunId: f.record.runId }
  return { ...f, page: value }
}
it("shows matching state, four recorded/current rows and all canonical boundaries without judgment controls", () => {
  const f = page()
  render(<DecisionEvidenceChange page={f.page} />)
  expect(screen.getByRole("heading", { name: "BUILD-001G — Decision Evidence Change Notice" })).toBeVisible()
  expect(screen.getByRole("heading", { name: "CURRENT EVIDENCE CHECK — MATCHES RECORDED EVIDENCE" })).toBeVisible()
  for (const text of [CHANGE_AUTHORITY, CHANGE_HISTORY, CHANGE_RULE]) expect(screen.getByText(text)).toBeVisible()
  expect(screen.getByText("This does not revalidate the correctness, quality or continuing appropriateness of the decision.")).toBeVisible()
  const table = within(screen.getByRole("table", { name: "Recorded and current evidence bindings" }))
  expect(table.getAllByRole("row")).toHaveLength(5)
  for (const key of ["source", "proof", "reviews", "dissent"] as const) {
    const row = within(table.getByRole("rowheader", { name: `${key} MATCH` }).closest("tr")!)
    expect(row.getAllByText(f.record.trace.bindings[key]!)).toHaveLength(2)
  }
  expect(screen.queryByRole("button")).not.toBeInTheDocument()
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
})
it.each(["changed", "invalid", "unavailable"] as const)("keeps historical decision and full embedded evidence inspectable when current is %s", async (state) => {
  const f = page(state)
  render(<DecisionEvidenceChange page={f.page} />)
  expect(screen.getByRole("heading", { name: f.page.notice!.presentation.heading })).toBeVisible()
  const history = within(screen.getByRole("article", { name: "Historical human decision" }))
  expect(history.getByRole("heading", { name: "Original Human Decision Record · RECORDED" })).toBeVisible()
  for (const text of [f.record.humanDecision.decisionText, f.record.humanDecision.rationale, f.record.humanDecision.decisionMaker,
    f.record.humanDecision.role, f.record.humanDecision.decisionAuthority]) expect(history.getByText(text, { normalizer: (value) => value })).toBeVisible()
  expect(history.getByText("Frozen review: HOLD_DISSONANCE · HUMAN-REVIEWED")).toBeVisible()
  expect(history.getAllByText("POTENTIAL_UNSEEN_DISSENT · SYN-0001")[0]).toBeVisible()
  expect(history.getByText(`Snapshot SHA-256: ${f.record.trace.snapshotSha256}`)).toBeVisible()
  await userEvent.click(history.getByText("Inspect frozen snapshot, complete testimony and unresolved limitations"))
  const snapshot = within(history.getByRole("article", { name: "Frozen evidence CAND-001" }))
  expect(snapshot.getByText("WITNESS: Verification must name its boundary.")).toBeVisible()
  await userEvent.click(snapshot.getByText("Inspect every examined source and original relationship"))
  await userEvent.click(snapshot.getByText("Full source testimony — SYN-0020"))
  expect(snapshot.getByText(f.snapshot.modelInterpreted.evidence[19].originalTestimony)).toBeVisible()
})
it("states the human reassessment boundary on differences without asserting materiality", () => {
  render(<DecisionEvidenceChange page={page("changed").page} />)
  expect(screen.getByText("This does not establish that the decision is wrong or that the changed evidence is materially relevant. Human reassessment is needed before representing this decision as based on the current evidence.")).toBeVisible()
  expect(screen.getByText("The original decision and its evidence remain unchanged.")).toBeVisible()
})
it("shows invalid current input fingerprints as unvalidated rather than changed or absent", () => {
  const f = page("invalid")
  render(<DecisionEvidenceChange page={f.page} />)
  const row = within(screen.getByRole("rowheader", { name: "reviews NOT_COMPARED" }).closest("tr")!)
  expect(row.getByText("INVALID")).toBeVisible()
  expect(row.queryByText("ABSENT")).not.toBeInTheDocument()
  expect(screen.getByText("The historical Human Decision Record remains inspectable against its frozen evidence. No claim about agreement with current evidence is made.")).toBeVisible()
  expect(screen.queryByText("CURRENT_EVIDENCE_DIFFERS")).not.toBeInTheDocument()
})
it("keeps frozen zero statements adjacent and optional absence distinct", () => {
  const { rerender } = render(<DecisionEvidenceChange page={page("match", false, false).page} />)
  const history = within(screen.getByRole("article", { name: "Historical human decision" }))
  expect(history.getAllByText("No potential unseen dissent was surfaced by this challenge run.")[0].nextElementSibling?.textContent).toBe("This does not establish that no dissent exists.")
  rerender(<DecisionEvidenceChange page={page("match", true).page} />)
  expect(screen.getByText("Frozen dissent: ABSENT")).toBeVisible()
  expect(screen.queryByText("No potential unseen dissent was surfaced by this challenge run.")).not.toBeInTheDocument()
  const row = within(screen.getByRole("rowheader", { name: "dissent MATCH" }).closest("tr")!)
  expect(row.getAllByText("ABSENT")).toHaveLength(4)
})
it("blocks a tampered historical record without fabricating a comparison or hiding selection access", () => {
  const f = page()
  render(<DecisionEvidenceChange page={{ ...f.page, notice: null, issue: "Comparison blocked: invalid historical record." }} />)
  expect(screen.getByRole("alert")).toHaveTextContent("invalid historical record")
  expect(screen.queryByRole("table")).not.toBeInTheDocument()
  expect(screen.queryByRole("article", { name: "Historical human decision" })).not.toBeInTheDocument()
  expect(screen.getByText("Choose a saved historical decision")).toBeVisible()
})
