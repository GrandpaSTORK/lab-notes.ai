import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it } from "vitest"
import { sha256 } from "@/lib/gaia/policy-evidence"
import { composeSnapshot, inputBindings } from "@/lib/gaia/policy-evidence-snapshot"
import { projectDecisionBrief } from "@/lib/gaia/policy-evidence-brief"
import { snapshotFixture, SNAPSHOT_TEST_TIME } from "@/lib/gaia/policy-evidence-snapshot.test-support"
import type { BriefPage } from "@/lib/gaia/policy-evidence-brief-store"
import { DecisionEvidenceBrief } from "./policy-evidence-brief"

function page(snapshot = snapshotFixture().snapshot): BriefPage {
  const bytes = Buffer.from(JSON.stringify(snapshot)), name = `trust-evidence-${snapshot.candidateId}-20260908120000000.json`
  return { brief: projectDecisionBrief(bytes, { name, runId: snapshot.runId, candidateId: snapshot.candidateId, sha256: sha256(bytes) }, { runId: snapshot.runId, bindings: snapshot.bindings }),
    issue: null, names: [name], runId: snapshot.runId, selectedName: name, downloadHref: `data:application/json;base64,${bytes.toString("base64")}` }
}
it("shows the four epistemic classes, first-view facts and evidence-trail authority", () => {
  const loaded = page(), brief = loaded.brief!
  render(<DecisionEvidenceBrief page={loaded} />)
  expect(screen.getByRole("heading", { name: "BUILD-001E — Decision Evidence Brief" })).toBeVisible()
  expect(screen.getAllByText(brief.interpretation.wording)[0]).toBeVisible()
  expect(screen.getByText("CONFIRM")).toBeVisible()
  expect(screen.getByText("20/20 records")).toBeVisible()
  expect(screen.getAllByText("VALIDATED_FINDINGS")[0]).toBeVisible()
  expect(screen.getAllByText("MODEL-INTERPRETED")[0]).toBeVisible()
  expect(screen.getByText("Examination coverage · MECHANICALLY VERIFIED")).toBeVisible()
  expect(within(screen.getByRole("region", { name: "Brief human review" })).getByText("HUMAN-REVIEWED")).toBeVisible()
  expect(within(screen.getByRole("region", { name: "Brief unresolved boundaries" })).getByRole("heading", { name: "UNRESOLVED — WHAT WAS NOT ESTABLISHED" })).toBeVisible()
  expect(screen.getByText(brief.rule)).toBeVisible()
  expect(screen.getByText(brief.authority)).toBeVisible()
  expect(screen.getByText(`Snapshot SHA-256: ${brief.trace.snapshotSha256}`)).toBeVisible()
})
it("preserves exact dissent and opens complete original testimony and full snapshot evidence", async () => {
  const loaded = page(), brief = loaded.brief!
  render(<DecisionEvidenceBrief page={loaded} />)
  const dissent = within(screen.getByRole("region", { name: "Brief potential unseen dissent" }))
  expect(dissent.getByText("POTENTIAL_UNSEEN_DISSENT · SYN-0001")).toBeVisible()
  expect(dissent.getAllByText(brief.unseenDissent.challenge!.findings[0].quote)[0]).toBeVisible()
  expect(dissent.getByText("Original relationship: SUPPORT")).toBeVisible()
  await userEvent.click(dissent.getByText("Complete challenged testimony — SYN-0001"))
  expect(dissent.getAllByText(brief.unseenDissent.challenge!.findings[0].originalTestimony)).toHaveLength(2)
  await userEvent.click(screen.getByText("Inspect original relationships and exact complete testimony"))
  await userEvent.click(within(screen.getByRole("region", { name: "Brief evidence state" })).getByText("SYN-0020 · NO_RELEVANT_BEARING"))
  expect(screen.getByText(`Complete testimony: ${brief.evidenceState.evidence[19].originalTestimony}`)).toBeVisible()
  await userEvent.click(screen.getByText("Inspect full frozen BUILD-001D evidence"))
  expect(screen.getByRole("article", { name: "Frozen evidence CAND-001" })).toBeVisible()
})
it("shows the zero-finding boundary adjacent and distinguishes absent dissent", () => {
  const fixture = snapshotFixture("HOLD_DISSONANCE", false)
  const { rerender } = render(<DecisionEvidenceBrief page={page(fixture.snapshot)} />)
  const dissent = within(screen.getByRole("region", { name: "Brief potential unseen dissent" }))
  expect(dissent.getByText("No potential unseen dissent was surfaced by this challenge run.").nextElementSibling?.textContent).toBe("This does not establish that no dissent exists.")
  expect(screen.getByText("HOLD_DISSONANCE")).toBeVisible()
  const absent = { ...fixture.bytes, dissent: null, reviews: null }
  rerender(<DecisionEvidenceBrief page={page(composeSnapshot(absent, { ...fixture.request, expectedBindings: inputBindings(absent) }, SNAPSHOT_TEST_TIME))} />)
  expect(within(screen.getByRole("region", { name: "Brief potential unseen dissent" })).queryByText("No potential unseen dissent was surfaced by this challenge run.")).not.toBeInTheDocument()
  expect(screen.getByText("dissent SHA-256: ABSENT")).toBeVisible()
  expect(screen.getByText("reviews SHA-256: ABSENT")).toBeVisible()
})
it("visibly blocks invalid dissent without a brief or download", () => {
  render(<DecisionEvidenceBrief page={{ brief: null, issue: "Invalid dissent: brief blocked. Not zero findings.", names: [], runId: "run-test", selectedName: null, downloadHref: null }} />)
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid dissent")
  expect(screen.queryByRole("heading", { name: /Interpretation under review/ })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Download exact frozen BUILD-001D snapshot" })).not.toBeInTheDocument()
})
it("marks a valid historical snapshot as historical rather than current", () => {
  const fixture = snapshotFixture(), loaded = page(fixture.snapshot), bytes = Buffer.from(JSON.stringify(fixture.snapshot))
  loaded.brief = projectDecisionBrief(bytes, { runId: fixture.snapshot.runId, candidateId: fixture.snapshot.candidateId, name: loaded.selectedName!, sha256: sha256(bytes) },
    { runId: fixture.snapshot.runId, bindings: { ...fixture.snapshot.bindings, reviews: sha256("new review") } })
  render(<DecisionEvidenceBrief page={loaded} />)
  expect(screen.getByText(/HISTORICAL_INPUTS_DIFFER: Historical snapshot/)).toBeVisible()
  expect(screen.queryByText(/MATCHES_SELECTED_LOCAL_INPUTS/)).not.toBeInTheDocument()
})
