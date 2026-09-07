// Test-only artifacts. The application never imports this module or fabricates candidates.
import { readFileSync } from "node:fs"
import { buildProof, MODEL, METHOD_VERSION, SOURCE_PATH, sha256, verifyBaseline, type Provenance } from "./policy-evidence"
import { reviewContext } from "./policy-evidence-review"

export function reviewFixture(endedAt = "2026-09-07T12:00:00.000Z") {
  const sourceBytes = readFileSync(SOURCE_PATH)
  const sources = verifyBaseline(sourceBytes)
  const method = "The exploration question\nis: What does this test establish? The real consultation purpose is unknown."
  const hash = sha256(method)
  const provenance: Provenance = {
    startedAt: endedAt, endedAt, requestedModel: MODEL, cliVersion: "test-only",
    methodVersion: METHOD_VERSION, promptVersion: "test-only", promptSha256: hash,
    generationCodeSha256: hash, domainCodeSha256: hash, skillSha256: hash,
    calls: ["candidates", "examination-1", "examination-2", "examination-3"].map((stage) => ({
      stage, startedAt: endedAt, endedAt, cliVersion: "test-only", reportedModel: MODEL,
      reportedProvider: "openai", sessionId: "test-only", promptSha256: hash,
      outputSchemaSha256: hash, responseSha256: hash, exitCode: 0,
    })),
  }
  const examination = {
    records: sources.map((source, index) => ({ sourceId: source.id, relationships: [{
      kind: index === 0 ? "SUPPORT" : index === 1 ? "QUALIFICATION" : "NO_RELEVANT_BEARING",
      quote: index < 2 ? source.text : null,
      explanation: "Model-supplied test relationship; semantic correctness is not established.",
    }] })),
    limitations: ["Test examination cannot establish meaning."],
  }
  const artifact = buildProof(sourceBytes, { candidates: [1, 2, 3].map((index) => ({
    interpretation: `Test-only candidate ${index}. No semantic ground truth is asserted.`,
    relevance: "Test traceability and human authority boundaries.", limitations: ["Test-only interpretation."],
  })) }, [examination, examination, examination], provenance)
  const proofBytes = Buffer.from(JSON.stringify(artifact, null, 2))
  return { sourceBytes, proofBytes, method, context: reviewContext(sourceBytes, proofBytes) }
}
