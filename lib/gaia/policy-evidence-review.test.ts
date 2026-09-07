import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { BASELINE_SHA256, SOURCE_PATH, sha256 } from "./policy-evidence"
import { DISPOSITIONS, emptyReviews, recordReview, reviewContext, reviewPresentation, validateReviews, type Disposition } from "./policy-evidence-review"
import { latestProof, loadReviewPage, RUNS_PATH, saveLocalReview } from "./policy-evidence-review-store"
import { reviewFixture } from "./policy-evidence-review.test-support"

const stamp = "2026-09-07T13:00:00.000Z"
const fixture = reviewFixture()
function request(disposition: Disposition, candidateId = "CAND-001", expectedRevision = 0) {
  return { proofSha256: fixture.context.proofSha256, candidateId, expectedRevision, disposition,
    rationale: "Human test rationale.", revisedWording: disposition === "REVISE" ? "Separate human test wording." : null }
}

describe("Human authority and evidence boundaries", () => {
  it("validates BUILD-001A before preparing a view and preserves source bytes", () => {
    const before = Buffer.from(fixture.sourceBytes)
    expect(sha256(before)).toBe(BASELINE_SHA256)
    const invalid = JSON.parse(fixture.proofBytes.toString("utf8"))
    invalid.candidates[0].examination.records[0].relationships[0].quote = "Invented quotation."
    expect(() => reviewContext(before, Buffer.from(JSON.stringify(invalid)))).toThrow()
    expect(readFileSync(SOURCE_PATH).equals(before)).toBe(true)
  })

  it("has no disposition by default", () => {
    const presentation = reviewPresentation(fixture.context, emptyReviews(fixture.context), null)
    expect(presentation.unreviewedCount).toBe(3)
    expect(presentation.candidates.every((candidate) => candidate.review === null && candidate.reviewState === "UNREVIEWED")).toBe(true)
  })

  it.each(DISPOSITIONS)("records %s separately, retaining exact original evidence and assessment", (disposition) => {
    const before = JSON.stringify(fixture.context)
    const ledger = recordReview(fixture.context, emptyReviews(fixture.context), request(disposition), stamp)
    expect(ledger.events[0].disposition).toBe(disposition)
    const presentation = reviewPresentation(fixture.context, ledger, null)
    const candidate = presentation.candidates[0]
    const original = fixture.context.proof.candidates[0]
    expect(candidate.originalMachineWording).toBe(original.candidate.interpretation)
    expect(candidate.machineAssessment).toEqual(original.validated.assessment)
    expect(candidate.limitations).toContain(original.candidate.limitations[0])
    expect(candidate.evidence.some(({ kind }) => kind === "QUALIFICATION")).toBe(true)
    expect(JSON.stringify(fixture.context)).toBe(before)
    if (disposition === "HOLD_DISSONANCE") {
      expect(candidate.reviewState).toBe("HELD_DISSONANCE")
      expect(candidate.reviewMeaning).toContain("Unresolved")
      expect(candidate.acceptedOriginal).toBe(false)
    }
    if (disposition === "REJECT") {
      expect(candidate.reviewState).toBe("REJECTED")
      expect(candidate.acceptedOriginal).toBe(false)
      expect(candidate.history).toHaveLength(1)
    }
    if (disposition === "REVISE") {
      expect(candidate.review!.revisedWording).toBe("Separate human test wording.")
      expect(candidate.revisionAssessment).toBe("REQUIRES_NEW_ASSESSMENT_OR_REVIEW")
      expect(candidate.reviewMeaning).toContain("only to the original wording")
    }
  })

  it.each(DISPOSITIONS)("requires a non-blank rationale for %s", (disposition) => {
    for (const rationale of ["", " \n "]) {
      expect(() => recordReview(fixture.context, emptyReviews(fixture.context), { ...request(disposition), rationale }, stamp)).toThrow()
    }
  })

  it("requires revised wording only for REVISE and rejects unknown candidates", () => {
    expect(() => recordReview(fixture.context, emptyReviews(fixture.context), { ...request("REVISE"), revisedWording: null }, stamp)).toThrow()
    expect(() => recordReview(fixture.context, emptyReviews(fixture.context), { ...request("CONFIRM"), revisedWording: "Changed" }, stamp)).toThrow()
    expect(() => recordReview(fixture.context, emptyReviews(fixture.context), request("REJECT", "invented"), stamp)).toThrow("Unknown candidate")
  })

  it("rejects stale proof fingerprints and stale review revisions", () => {
    const ledger = recordReview(fixture.context, emptyReviews(fixture.context), request("CONFIRM"), stamp)
    const changed = reviewContext(fixture.sourceBytes, Buffer.concat([fixture.proofBytes, Buffer.from("\n")]))
    expect(() => validateReviews(changed, ledger)).toThrow("different proof fingerprint")
    expect(() => recordReview(changed, emptyReviews(changed), request("REJECT"), stamp)).toThrow("proof changed")
    expect(() => recordReview(fixture.context, ledger, request("REJECT"), stamp)).toThrow("history changed")
  })

  it("WITNESS: exact quotation matching never establishes semantic support", () => {
    const candidate = reviewPresentation(fixture.context, emptyReviews(fixture.context), null).candidates[0]
    const passage = candidate.evidence[0]
    expect(passage.originalTestimony.slice(passage.start!, passage.end!)).toBe(passage.quote)
    expect(candidate.traceability).toBe("TRACEABILITY VERIFIED")
    expect(candidate.semanticBoundary).toBe("SEMANTIC RELATIONSHIP REMAINS CONTESTABLE")
    expect(candidate.whatWasNotEstablished).toContain("Quotation matching does not establish semantic correctness.")
    expect(candidate.whatWasVerified).toEqual({
      sourceFingerprintMatched: true, expectedSourceIdsValidated: true, exactQuotesAndLocationsValidated: true,
      expectedRecordCount: 20, examinedRecordCount: 20, generationMetadataRetained: true,
      deterministicRuleApplied: "GAIA-assessment/1",
    })
  })

  it("snapshot retains rejected, held, revised and unreviewed states across current state and history", () => {
    let ledger = emptyReviews(fixture.context)
    ledger = recordReview(fixture.context, ledger, request("CONFIRM"), stamp)
    ledger = recordReview(fixture.context, ledger, request("REVISE", "CAND-001", 1), stamp)
    ledger = recordReview(fixture.context, ledger, request("HOLD_DISSONANCE", "CAND-001", 2), stamp)
    ledger = recordReview(fixture.context, ledger, request("REJECT", "CAND-002", 3), stamp)
    const snapshot = reviewPresentation(fixture.context, ledger, "Test question")
    expect(snapshot.candidates.map(({ reviewState }) => reviewState)).toEqual(["HELD_DISSONANCE", "REJECTED", "UNREVIEWED"])
    expect(snapshot.candidates[0].history.map(({ disposition }) => disposition)).toEqual(["CONFIRM", "REVISE", "HOLD_DISSONANCE"])
    expect(snapshot.candidates[0].history[1].revisedWording).toBe("Separate human test wording.")
    expect(snapshot.unreviewedCount).toBe(1)
    expect(snapshot.generationProvenance).toEqual(fixture.context.proof.provenance)
    expect(snapshot.proofSha256).toBe(fixture.context.proofSha256)
    expect(snapshot.candidates.every(({ whatWasNotEstablished }) => whatWasNotEstablished.length >= 8)).toBe(true)
  })
})

const temporaryRoots: string[] = []
function temporaryRoot() {
  const root = mkdtempSync(join(tmpdir(), "gaia-review-test-"))
  temporaryRoots.push(root)
  mkdirSync(dirname(join(root, SOURCE_PATH)), { recursive: true })
  writeFileSync(join(root, SOURCE_PATH), fixture.sourceBytes)
  return root
}
function writeRun(root: string, name: string, value = fixture) {
  const directory = join(root, RUNS_PATH, name)
  mkdirSync(directory, { recursive: true })
  writeFileSync(join(directory, "proof.json"), value.proofBytes)
  writeFileSync(join(directory, "method.md"), value.method)
  return directory
}
afterEach(() => {
  for (const root of temporaryRoots.splice(0)) {
    if (resolve(root).startsWith(resolve(tmpdir()) + "\\gaia-review-test-") || resolve(root).startsWith(resolve(tmpdir()) + "/gaia-review-test-")) {
      rmSync(root, { recursive: true, force: true })
    }
  }
})

describe("Local proof and review files", () => {
  it("shows empty when no proof exists and rejects invalid-only runs", () => {
    const root = temporaryRoot()
    expect(loadReviewPage(root)).toBeNull()
    const directory = writeRun(root, "run-bad")
    writeFileSync(join(directory, "proof.json"), "{}")
    expect(() => loadReviewPage(root)).toThrow("No valid BUILD-001A")
  })

  it("selects newest valid generation, warns about invalid artifacts and binds method question to its hash", () => {
    const root = temporaryRoot()
    writeRun(root, "run-old")
    const newest = reviewFixture("2026-09-07T14:00:00.000Z")
    const directory = writeRun(root, "run-new", newest)
    const bad = writeRun(root, "run-bad")
    writeFileSync(join(bad, "proof.json"), "{}")
    expect(latestProof(root)?.runId).toBe("run-new")
    expect(loadReviewPage(root)?.presentation.explorationQuestion).toBe("What does this test establish?")
    expect(loadReviewPage(root)?.warnings.join(" ")).toContain("invalid proof skipped")
    writeFileSync(join(directory, "method.md"), "Invented question")
    expect(loadReviewPage(root)?.presentation.explorationQuestion).toBeNull()
  })

  it("persists all four dispositions without changing source or proof; survives reload", () => {
    const root = temporaryRoot()
    const directory = writeRun(root, "run-original")
    DISPOSITIONS.forEach((disposition, index) => saveLocalReview(root, request(disposition, "CAND-001", index), stamp))
    const reloaded = loadReviewPage(root)!
    expect(reloaded.presentation.candidates[0].reviewState).toBe("HELD_DISSONANCE")
    expect(reloaded.presentation.candidates[0].history).toHaveLength(4)
    expect(readFileSync(join(directory, "proof.json")).equals(fixture.proofBytes)).toBe(true)
    expect(readFileSync(join(root, SOURCE_PATH)).equals(fixture.sourceBytes)).toBe(true)
    expect(JSON.parse(readFileSync(join(directory, "reviews.json"), "utf8")).proofSha256).toBe(fixture.context.proofSha256)
  })

  it("visibly invalidates a changed proof association without rewriting reviews", () => {
    const root = temporaryRoot()
    const directory = writeRun(root, "run-original")
    saveLocalReview(root, request("REJECT"), stamp)
    const reviewBytes = readFileSync(join(directory, "reviews.json"))
    writeFileSync(join(directory, "proof.json"), Buffer.concat([fixture.proofBytes, Buffer.from("\n")]))
    expect(loadReviewPage(root)?.reviewError).toContain("different proof fingerprint")
    expect(() => saveLocalReview(root, request("CONFIRM", "CAND-001", 1), stamp)).toThrow()
    expect(readFileSync(join(directory, "reviews.json")).equals(reviewBytes)).toBe(true)
  })

  it("never transfers reviews to a newer run or saves against a stale browser proof", () => {
    const root = temporaryRoot()
    writeRun(root, "run-original")
    saveLocalReview(root, request("CONFIRM"), stamp)
    writeRun(root, "run-new", reviewFixture("2026-09-07T14:00:00.000Z"))
    expect(loadReviewPage(root)?.presentation.unreviewedCount).toBe(3)
    expect(loadReviewPage(root)?.warnings.join(" ")).toContain("not been applied")
    expect(() => saveLocalReview(root, request("REJECT", "CAND-001", 1), stamp)).toThrow("proof changed")
  })

  it.skipIf(!existsSync(join(RUNS_PATH, "run-NSHiGl/proof.json")))("revalidates the real BUILD-001A artifact without modifying it", () => {
    const path = join(RUNS_PATH, "run-NSHiGl/proof.json")
    const before = readFileSync(path)
    const context = reviewContext(readFileSync(SOURCE_PATH), before)
    expect(context.proof.candidateCount).toBe(3)
    expect(context.proofSha256).toBe("e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e")
    expect(readFileSync(path).equals(before)).toBe(true)
  })
})
