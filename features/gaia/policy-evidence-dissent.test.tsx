import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it } from "vitest"
import { buildDissent } from "@/lib/gaia/policy-evidence-dissent"
import { blindDissentFixture, testChallenge, testDissent } from "@/lib/gaia/policy-evidence-dissent.test-support"
import { UnseenDissent } from "./policy-evidence-dissent"

it("shows potential evidence, original relationship, accessible testimony and WITNESS boundary", async () => {
  const context = blindDissentFixture(), challenge = testChallenge(context)
  render(<UnseenDissent candidateId="TEST-CAND-1" dissent={{ artifact: buildDissent(context, [challenge]), issue: null }} />)
  expect(screen.getByText("UNSEEN DISSENT CHALLENGE")).toBeVisible()
  expect(screen.getByText(challenge.findings[0].quote)).toBeVisible()
  expect(screen.getByText("Original BUILD-001A relationship: SUPPORT")).toBeVisible()
  expect(screen.getByText(/Surfacing this passage does not establish/)).toBeVisible()
  expect(screen.getByText(/This quotation materially challenges/)).toBeVisible()
  await userEvent.click(screen.getByText("Read full original testimony — TEST-B"))
  expect(screen.getByText(context.sources[1].text)).toBeVisible()
})
it("places the absence boundary immediately after zero findings", () => {
  render(<UnseenDissent candidateId="TEST-CAND-1" dissent={{ artifact: testDissent(), issue: null }} />)
  expect(screen.getByText("No potential unseen dissent was surfaced by this challenge run.").nextElementSibling?.textContent).toBe("This does not establish that no dissent exists.")
})
it("does not present missing or invalid artifacts as zero findings", () => {
  render(<UnseenDissent candidateId="TEST-CAND-1" dissent={{ artifact: null, issue: "Invalid artifact" }} />)
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid artifact")
  expect(screen.queryByText("No potential unseen dissent was surfaced by this challenge run.")).not.toBeInTheDocument()
})
