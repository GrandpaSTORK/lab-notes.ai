import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, it, vi } from "vitest"
import { composeSnapshot, inputBindings } from "@/lib/gaia/policy-evidence-snapshot"
import type { SnapshotPage } from "@/lib/gaia/policy-evidence-snapshot-store"
import { snapshotFixture, SNAPSHOT_TEST_TIME } from "@/lib/gaia/policy-evidence-snapshot.test-support"
import { SnapshotEvidence } from "./policy-evidence-snapshot"
import { TrustSnapshotPanel } from "./policy-evidence-snapshot-panel"

function pageFixture(): SnapshotPage {
  const { snapshot, request } = snapshotFixture()
  return { runId: request.runId, bindings: request.expectedBindings, candidates: [{ id: snapshot.candidateId, wording: snapshot.modelInterpreted.originalMachineWording }],
    reviewsState: "VALIDATED", reviewRevision: 1, dissentState: "VALIDATED", saved: [{ path: ".local/gaia/policy-evidence/run-test/trust-evidence-CAND-001-test.json", snapshot }], warnings: [], issue: null }
}
it("exposes machine evidence, human authority, potential dissent, provenance and WITNESS", async () => {
  const { snapshot } = snapshotFixture()
  render(<SnapshotEvidence snapshot={snapshot} />)
  expect(screen.getByText("Summary is not the product. The evidence trail is.")).toBeVisible()
  expect(screen.getByText("MECHANICALLY VERIFIED")).toBeVisible()
  expect(screen.getByText("MODEL-INTERPRETED")).toBeVisible()
  expect(screen.getByText("HUMAN-REVIEWED")).toBeVisible()
  expect(screen.getByText("UNRESOLVED — WHAT WAS NOT ESTABLISHED")).toBeVisible()
  expect(screen.getByText(snapshot.modelInterpreted.originalMachineWording)).toBeVisible()
  expect(screen.getByText("Human disposition: CONFIRM")).toBeVisible()
  expect(screen.getByText(`Saved human rationale: ${snapshot.humanReview.rationale}`)).toBeVisible()
  const dissent = within(screen.getByRole("region", { name: "Frozen unseen dissent" }))
  expect(dissent.getByText("POTENTIAL_UNSEEN_DISSENT · SYN-0001")).toBeVisible()
  expect(dissent.getByText("Original relationship: SUPPORT")).toBeVisible()
  await userEvent.click(dissent.getByText("Full challenged testimony — SYN-0001"))
  expect(dissent.getAllByText(snapshot.unseenDissent.challenge!.findings[0].quote).every((element) => element.textContent.length > 0)).toBe(true)
  await userEvent.click(screen.getByText("Inspect every examined source and original relationship"))
  await userEvent.click(screen.getByText("Full source testimony — SYN-0020"))
  expect(screen.getByText(snapshot.modelInterpreted.evidence[19].originalTestimony)).toBeVisible()
  await userEvent.click(screen.getByText("Exact input artifacts and fingerprints"))
  expect(screen.getByText(`SHA-256: ${snapshot.bindings.dissent}`)).toBeVisible()
})
it("keeps zero-finding boundary adjacent and missing artifacts explicitly unresolved", () => {
  const { bytes, request, snapshot } = snapshotFixture("HOLD_DISSONANCE", false)
  const { rerender } = render(<SnapshotEvidence snapshot={snapshot} />)
  expect(screen.getByText("Human disposition: HOLD_DISSONANCE")).toBeVisible()
  expect(screen.getByText("No potential unseen dissent was surfaced by this challenge run.").nextElementSibling?.textContent).toBe("This does not establish that no dissent exists.")
  const absent = { ...bytes, reviews: null, dissent: null }
  rerender(<SnapshotEvidence snapshot={composeSnapshot(absent, { ...request, expectedBindings: inputBindings(absent) }, SNAPSHOT_TEST_TIME)} />)
  expect(screen.queryByText("No potential unseen dissent was surfaced by this challenge run.")).not.toBeInTheDocument()
  expect(screen.getByText(/No dissent artifact is present/)).toBeVisible()
  expect(screen.getByText("Human disposition: No human disposition has been recorded.")).toBeVisible()
})
it("blocks invalid dissent visibly without offering freeze or download", () => {
  const page = pageFixture()
  render(<TrustSnapshotPanel page={{ ...page, bindings: null, candidates: [], reviewRevision: null, saved: [], dissentState: "INVALID", issue: "Invalid dissent artifact. Not a zero-finding result." }} createAction={vi.fn()} />)
  expect(screen.getByRole("alert")).toHaveTextContent("Invalid dissent")
  expect(screen.queryByRole("button", { name: "Freeze a new snapshot" })).not.toBeInTheDocument()
  expect(screen.queryByRole("link", { name: "Download frozen Trust Evidence Snapshot" })).not.toBeInTheDocument()
})
it("freezes using all four expected bindings and exposes the exact portable JSON", async () => {
  const page = pageFixture(), saved = page.saved[0]
  const createAction = vi.fn().mockResolvedValue({ ok: true, saved })
  render(<TrustSnapshotPanel page={{ ...page, saved: [] }} createAction={createAction} />)
  await userEvent.click(screen.getByRole("button", { name: "Freeze a new snapshot" }))
  expect(createAction).toHaveBeenCalledWith({ runId: page.runId, candidateId: "CAND-001", expectedBindings: page.bindings })
  const link = screen.getByRole("link", { name: "Download frozen Trust Evidence Snapshot" })
  expect(JSON.parse(decodeURIComponent(link.getAttribute("href")!.split(",")[1]))).toEqual(saved.snapshot)
})
it.each(["proof", "reviews", "dissent"] as const)("does not display a snapshot with another %s binding and reports action failure", async (key) => {
  const page = pageFixture()
  page.saved[0].snapshot.bindings[key] = "a".repeat(64)
  render(<TrustSnapshotPanel page={page} createAction={vi.fn().mockResolvedValue({ ok: false, message: "Inputs changed. Reload." })} />)
  expect(screen.queryByRole("link", { name: "Download frozen Trust Evidence Snapshot" })).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole("button", { name: "Freeze a new snapshot" }))
  expect(screen.getByRole("alert")).toHaveTextContent("Inputs changed")
})
