import { render } from "@testing-library/react"
import { expect, it, vi } from "vitest"
import { sha256 } from "@/lib/gaia/policy-evidence"
import { executiveFixture } from "@/lib/gaia/policy-evidence-executive.test-support"
import { blockedExecutive, projectExecutiveSnapshot } from "@/lib/gaia/policy-evidence-executive"
import { ExecutiveEvidenceLayout, ExecutiveSourceEvidence } from "./policy-evidence-executive"
import { DecisionEvidenceBrief } from "./policy-evidence-brief"
import { HumanDecisionPanel } from "./policy-evidence-decision-panel"
import { DecisionEvidenceChange } from "./policy-evidence-change"
import { BackToExecutiveSnapshot } from "./policy-evidence-navigation"

// SYNTHETIC TEST FIXTURE. Render real E/F/G views and H's actual layout, not placeholder anchor targets.
it.each(["findings", "zero", "absent", "partial", "blocked"] as const)("resolves every H anchor to a unique visible destination in the integrated %s demo", (state) => {
  const f = executiveFixture(state === "zero" || state === "absent" ? state : "findings")
  const h = state === "blocked" ? blockedExecutive() : projectExecutiveSnapshot(f.snapshotBytes, f.identity, f.bytes, state === "partial" ? {} : f.optional)
  const save = vi.fn()
  const { container } = render(<ExecutiveEvidenceLayout page={h}>
    <header id="policy-evidence-detail"><h2>GAIA Policy Evidence Proof</h2><BackToExecutiveSnapshot /></header>
    <DecisionEvidenceBrief page={{ brief: f.brief, issue: null, names: [f.identity.name], runId: f.identity.runId, selectedName: f.identity.name, downloadHref: null }} />
    {state !== "partial" && <>
      <HumanDecisionPanel saveAction={save} page={{ selection: f.decisionRequest.selection, canRecord: true, issue: null, warnings: [], saved: [{ record: f.record,
        path: `human-decision-${f.record.decisionId}.json`, sha256: sha256(JSON.stringify(f.record)), localAgreement: "MATCHES_SELECTED_LOCAL_INPUTS" }] }} />
      <DecisionEvidenceChange page={{ notice: f.optional.change, issue: null, warnings: [], choices: [], recordPath: `human-decision-${f.record.decisionId}.json`,
        recordSha256: sha256(JSON.stringify(f.record)), recordDownload: null, comparisonRunId: f.record.runId }} />
    </>}
    <ExecutiveSourceEvidence page={h} />
  </ExecutiveEvidenceLayout>)
  const cockpit = container.querySelector('[aria-labelledby="executive-title"]')!
  const links = cockpit.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
  expect(links.length).toBeGreaterThan(0)
  const ids = new Map<string, HTMLElement[]>()
  container.querySelectorAll<HTMLElement>("[id]").forEach((element) => ids.set(element.id, [...(ids.get(element.id) ?? []), element]))
  const visible = new Set<string>()
  const targetFor = (link: HTMLAnchorElement) => {
    const id = decodeURIComponent(link.getAttribute("href")!.slice(1))
    const targets = ids.get(id) ?? []
    expect(targets, `${link.textContent} → #${id}`).toHaveLength(1)
    if (!visible.has(id)) { expect(targets[0]).toBeVisible(); visible.add(id) }
    return targets[0]
  }
  links.forEach(targetFor)
  const returns = container.querySelectorAll<HTMLAnchorElement>('a[href="#executive-title"]')
  expect(returns.length).toBeGreaterThan(0)
  returns.forEach((link) => {
    expect(link).toHaveTextContent("Back to GAIA Trust Evidence Snapshot")
    expect(targetFor(link)).toBe(container.querySelector("h1#executive-title"))
  })
  if (h.core) {
    const destinations = [
      ["Why This Insight?", "Interpretation under review"], ["Human Review", "Saved rationale:"],
      ["Potential Dissent", f.brief.unseenDissent.state], ["View Original Testimony", "Exact source metadata and testimony"],
      ["Inspect the complete frozen evidence and limitations", "Inspect full frozen BUILD-001D evidence"],
      ...(state !== "partial" ? [["Inspect Human Decision Record", "BUILD-001F"], ["Has the Evidence Changed?", "BUILD-001G"]] : []),
    ]
    for (const [label, content] of destinations) {
      const link = Array.from(links).find((element) => element.textContent === label)
      expect(link, label).toBeDefined()
      const target = targetFor(link!)
      expect(target.textContent).toContain(content)
    }
    for (const source of h.core.sources) {
      const summary = container.querySelector(`[id="executive-source-${source.id}"]`)!
      expect(summary.tagName).toBe("SUMMARY")
      expect(summary.parentElement?.textContent).toContain(source.text)
    }
  }
  expect(save).not.toHaveBeenCalled()
})
