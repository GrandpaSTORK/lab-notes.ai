// Test-only. Never imported by the application or normal evidence generator.
import { z } from "zod"
import { examine, sha256 } from "./policy-evidence"
import { buildChallenge, buildDissent, challengePrompt, challengeResponseSchema, type ChallengeContext } from "./policy-evidence-dissent"

export const FIXTURE_LABEL = "SYNTHETIC TEST FIXTURE — NOT REAL CITIZEN TESTIMONY"
export function blindDissentFixture(): ChallengeContext {
  const sources = [
    { id: "TEST-A", text: "The online form saved a trip and was easy to complete." },
    { id: "TEST-B", text: "The new screen is clearer. I could finish only because the library adviser entered the answers for me; that desk closes next month." },
    { id: "TEST-C", text: "The confirmation arrived the same afternoon." },
    { id: "TEST-D", text: "The letter has a new reference number." },
  ]
  const baseline = examine(sources, { records: sources.map((source, index) => ({ sourceId: source.id, relationships: [{
    kind: index === 0 || index === 1 ? "SUPPORT" : "NO_RELEVANT_BEARING",
    quote: index === 0 ? source.text : index === 1 ? "The new screen is clearer." : null,
    explanation: "Intentionally flawed synthetic baseline: no challenging bearing recorded.",
  }] })), limitations: [FIXTURE_LABEL] })
  const candidates = [{ id: "TEST-CAND-1", wording: "The online form lets people complete applications without assisted access.", records: baseline.records }]
  return { disclosure: FIXTURE_LABEL, sourceSha256: sha256(JSON.stringify({ disclosure: FIXTURE_LABEL, sources })), proofSha256: sha256(JSON.stringify(candidates)), sources, candidates }
}
export function testChallenge(context = blindDissentFixture(), findings: unknown[] = [{ sourceId: "TEST-B", quote: "I could finish only because the library adviser entered the answers for me; that desk closes next month.", explanation: "Completion depended on assistance that may disappear.", noveltyReason: "The baseline quotes screen clarity as support but does not surface dependence on assistance." }], candidateId = context.candidates[0].id) {
  const responseText = JSON.stringify({ findings, limitations: [FIXTURE_LABEL, "Test response is authored, not model generation."] })
  const candidate = context.candidates.find(({ id }) => id === candidateId)!
  return buildChallenge(context, candidateId, responseText, { requestedModel: "test-only", reportedModel: "test-only", provider: "test-only", cliVersion: "test-only", runtimeVersion: "test-only", sessionId: "test-only", startedAt: "2026-09-07T12:00:00.000Z", endedAt: "2026-09-07T12:00:01.000Z", promptSha256: sha256(challengePrompt(context, candidate)), responseSha256: sha256(responseText), outputSchemaSha256: sha256(JSON.stringify(z.toJSONSchema(challengeResponseSchema))) })
}
export function testDissent(context = blindDissentFixture()) {
  return buildDissent(context, context.candidates.map(({ id }) => testChallenge(context, [], id)))
}
