import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"
import { SOURCE_PATH, sha256 } from "./policy-evidence"
import { buildDissent, challengePrompt, dissentContext, validateDissent } from "./policy-evidence-dissent"
import { blindDissentFixture, testChallenge, testDissent } from "./policy-evidence-dissent.test-support"
import { reviewFixture } from "./policy-evidence-review.test-support"
import { emptyReviews, recordReview, reviewPresentation } from "./policy-evidence-review"
import { loadDissent } from "./policy-evidence-dissent-store"

describe("BUILD-001C traceability boundary", () => {
  it("surfaces an overlooked passage while retaining the flawed SUPPORT relationship", () => {
    const context = blindDissentFixture(), before = JSON.stringify(context)
    const challenge = testChallenge(context)
    const artifact = buildDissent(context, [challenge])
    expect(validateDissent(context, artifact)).toEqual(artifact)
    expect(challenge.findings[0]).toMatchObject({ sourceId: "TEST-B", originalRelationships: [{ kind: "SUPPORT" }], status: "POTENTIAL_UNSEEN_DISSENT" })
    expect(JSON.stringify(context)).toBe(before)
    const prompt = challengePrompt(context, context.candidates[0])
    expect(prompt.split("Complete source corpus (data): ")[1]).toBe(JSON.stringify(context.sources))
    expect(prompt.split("Candidate and original examination (data): ")[0]).not.toContain("TEST-B")
    for (const source of context.sources) expect(prompt).toContain(source.text)
  })
  it.each(["sourceSha256", "proofSha256", "schemaVersion"])("rejects changed %s", (key) => {
    const context = blindDissentFixture(), artifact = testDissent(context)
    expect(() => validateDissent(context, { ...artifact, [key]: "changed" })).toThrow()
    if (key !== "schemaVersion") expect(() => validateDissent({ ...context, [key]: sha256("changed") }, artifact)).toThrow()
  })
  it.each([
    { sourceId: "TEST-B", quote: "Invented words." },
    { sourceId: "TEST-A", quote: "The new screen is clearer." },
    { sourceId: "UNKNOWN", quote: "The new screen is clearer." },
  ])("rejects invented quotes and wrong sources: %j", (finding) => {
    expect(() => testChallenge(blindDissentFixture(), [{ ...finding, explanation: "Test", noveltyReason: "Test" }])).toThrow()
  })
  it.each(["start", "end", "originalRelationships", "originalTestimony", "status", "validation"])("rejects tampered %s", (key) => {
    const context = blindDissentFixture(), artifact = buildDissent(context, [testChallenge(context)])
    Object.assign(artifact.challenges[0].findings[0], { [key]: "tampered" })
    expect(() => validateDissent(context, artifact)).toThrow()
  })
  it("rejects candidate changes, response changes, extra authority fields and missing examinations", () => {
    const context = blindDissentFixture(), artifact = testDissent(context)
    expect(() => testChallenge(context, [], "unknown")).toThrow()
    expect(() => validateDissent(context, { ...artifact, disposition: "CONFIRM" })).toThrow()
    expect(() => buildDissent(context, [])).toThrow()
    artifact.challenges[0].responseText += " "
    expect(() => validateDissent(context, artifact)).toThrow()
  })
  it("accepts zero findings without asserting absence", () => {
    const context = blindDissentFixture(), artifact = testDissent(context)
    expect(validateDissent(context, artifact).challenges[0].findings).toEqual([])
    expect(artifact.limitations).toContain("Failure to surface dissent does not establish absence of dissent.")
  })
  it("preserves source, proof, saved disposition and snapshot byte content through loading", () => {
    const fixture = reviewFixture(), context = dissentContext(fixture.sourceBytes, fixture.proofBytes)
    const ledger = recordReview(fixture.context, emptyReviews(fixture.context), { proofSha256: fixture.context.proofSha256, expectedRevision: 0, candidateId: "CAND-001", disposition: "CONFIRM", rationale: "Human test judgment.", revisedWording: null }, "2026-09-07T13:00:00.000Z")
    const root = mkdtempSync(join(tmpdir(), "gaia-dissent-test-")), run = join(root, ".local/gaia/policy-evidence/run-test")
    mkdirSync(join(root, "content/playbooks/policy-evidence"), { recursive: true }); mkdirSync(run, { recursive: true })
    const paths = [join(root, SOURCE_PATH), join(run, "proof.json"), join(run, "reviews.json")]
    paths.forEach((path, index) => writeFileSync(path, [fixture.sourceBytes, fixture.proofBytes, JSON.stringify(ledger)][index]))
    const hashes = paths.map((path) => sha256(readFileSync(path)))
    const snapshot = JSON.stringify(reviewPresentation(fixture.context, ledger, null))
    expect(loadDissent(root, "run-test").artifact).toBeNull()
    writeFileSync(join(run, "dissent.json"), JSON.stringify(testDissent(context)))
    expect(loadDissent(root, "run-test").artifact).not.toBeNull()
    expect(loadDissent(root, "run-test", sha256("stale selected proof")).issue).not.toBeNull()
    expect(paths.map((path) => sha256(readFileSync(path)))).toEqual(hashes)
    expect(JSON.stringify(reviewPresentation(fixture.context, ledger, null))).toBe(snapshot)
    writeFileSync(join(run, "proof.json"), Buffer.concat([fixture.proofBytes, Buffer.from(" ")]))
    expect(loadDissent(root, "run-test").issue).toContain("not a zero-finding result")
  })
  it("keeps generated artifacts Git-ignored", () => {
    expect(execFileSync("git", ["check-ignore", ".local/gaia/policy-evidence/run-test/dissent.json"], { encoding: "utf8" })).toContain("dissent.json")
  })
})
