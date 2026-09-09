import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { expect, it, vi } from "vitest"
import childProcess from "node:child_process"
import { sha256 } from "./policy-evidence"
import { DEMO_FILES, DEMO_ROOT, assertDemoPackage, evidenceLocation } from "./policy-evidence-demo-root"
import { packagedDemo } from "./policy-evidence-demo.test-support"

it("packages only the six exact sealed identities and preserves packaged and available local bytes", () => {
  const root = join(process.cwd(), DEMO_ROOT)
  const paths = DEMO_FILES.map(([path]) => join(root, path))
  const local = DEMO_FILES.map(([path]) => join(process.cwd(), path)).filter(existsSync)
  const before = [...paths, ...local].map((path) => sha256(readFileSync(path)))
  expect(readdirSync(root, { recursive: true }).filter((name) => String(name).endsWith(".json"))).toHaveLength(6)
  for (const [path, hash] of DEMO_FILES) {
    expect(sha256(readFileSync(join(root, path)))).toBe(hash)
    if (existsSync(join(process.cwd(), path))) expect(readFileSync(join(root, path)).equals(readFileSync(join(process.cwd(), path)))).toBe(true)
  }
  assertDemoPackage(root)
  packagedDemo(root)
  expect([...paths, ...local].map((path) => sha256(readFileSync(path)))).toEqual(before)
})
it("uses one explicit evidence root: local stays local and Vercel/explicit hosted mode use the package", () => {
  const root = mkdtempSync(join(tmpdir(), "share-pack-selection-"))
  expect(evidenceLocation(root, {})).toEqual({ root, hosted: false })
  expect(evidenceLocation(root, { GAIA_HOSTED_DEMO: "1" })).toEqual({ root: join(root, DEMO_ROOT), hosted: true })
  expect(evidenceLocation(root, { VERCEL: "1", GAIA_HOSTED_DEMO: "0" }).hosted).toBe(true)
  // Different complete roots remain separately selected, not chosen by a fallback on missing data.
  cpSync(join(process.cwd(), DEMO_ROOT), root, { recursive: true })
  expect(packagedDemo(evidenceLocation(root, {}).root).executive.availability).toBe("READY")
  expect(() => assertDemoPackage(evidenceLocation(root, { VERCEL: "1" }).root)).toThrow()
})
it("validates packaged A–H with exact reviewed CAND-002 and matching current frozen identities", () => {
  const value = packagedDemo(), h = value.executive
  expect(h.availability).toBe("READY")
  expect(h.core?.responses).toEqual({ examined: 20, supplied: 20 })
  expect(h.core?.themes.map(({ label, count }) => [label, count])).toEqual([
    ["access-to-services", 4], ["workforce-capability", 4], ["data-governance", 4],
    ["accountability", 3], ["procurement-and-reuse", 3], ["environmental-cost", 2],
  ])
  expect(h.core?.candidateId).toBe("CAND-002")
  expect(h.core?.interpretation.wording).toBe(value.brief.brief!.fullSnapshot.modelInterpreted.originalMachineWording)
  expect(h.core?.humanReview).toMatchObject({ epistemicClass: "HUMAN-REVIEWED", disposition: "CONFIRM" })
  expect(h.core?.dissent).toMatchObject({ state: "VALIDATED_FINDINGS", count: 1, firstFinding: { status: "POTENTIAL_UNSEEN_DISSENT", sourceId: "SYN-0004", quote: "The ambition is right and the timetable is not." } })
  expect(h.decision?.state).toBe("RECORDED")
  expect(h.change?.state).toBe("RECORDED_EVIDENCE_MATCHES_CURRENT")
  expect(value.decisions.saved[0].record.humanDecision).toEqual(value.change.notice!.historicalRecord.humanDecision)
})
it.each(DEMO_FILES)("rejects changed packaged %s without repairing or falling back", (path) => {
  const root = mkdtempSync(join(tmpdir(), "share-pack-invalid-"))
  cpSync(join(process.cwd(), DEMO_ROOT), root, { recursive: true })
  writeFileSync(join(root, path), "{}")
  expect(() => packagedDemo(root)).toThrow("identity mismatch")
  expect(readFileSync(join(root, path), "utf8")).toBe("{}")
})
it("loads the frozen demo without a model process or network call", () => {
  const spawn = vi.spyOn(childProcess, "spawn").mockImplementation(() => { throw new Error("Process calls forbidden") })
  const exec = vi.spyOn(childProcess, "execFileSync").mockImplementation(() => { throw new Error("Process calls forbidden") })
  const fetch = vi.fn(() => { throw new Error("Network calls forbidden") })
  vi.stubGlobal("fetch", fetch)
  try {
    expect(packagedDemo().executive.availability).toBe("READY")
    expect(spawn).not.toHaveBeenCalled(); expect(exec).not.toHaveBeenCalled(); expect(fetch).not.toHaveBeenCalled()
  } finally { spawn.mockRestore(); exec.mockRestore(); vi.unstubAllGlobals() }
})
