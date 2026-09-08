import { z } from "zod"
import { sha256 } from "./policy-evidence"
import { projectDecisionBrief, snapshotNameSchema, type LocalEvidenceIdentity } from "./policy-evidence-brief"
import { assertBindings, bindingsSchema, runIdSchema } from "./policy-evidence-snapshot"
import { DECISION_ACKNOWLEDGEMENT, DECISION_AUTHORITY, DECISION_BOUNDARY, DECISION_DISCLOSURE, DECISION_LIMIT } from "./policy-evidence-decision-boundary"

const hash = z.string().regex(/^[a-f0-9]{64}$/)
export const decisionIdSchema = z.string().uuid()
const humanText = z.string().max(12000).refine((value) => value.trim().length > 0, "Human-authored text is required")
export const decisionSelectionSchema = z.strictObject({
  runId: runIdSchema, candidateId: z.string().regex(/^CAND-\d{3}$/), snapshotName: snapshotNameSchema,
  snapshotSha256: hash, briefSha256: hash, bindings: bindingsSchema,
})
export const decisionRequestSchema = z.strictObject({
  decisionId: decisionIdSchema, selection: decisionSelectionSchema,
  decisionText: humanText, rationale: humanText, decisionMaker: humanText, role: humanText, decisionAuthority: humanText,
  unresolvedAcknowledged: z.literal(true), demonstration: z.literal("SYNTHETIC_TEST_DATA"),
})
export type DecisionSelection = z.infer<typeof decisionSelectionSchema>
export type DecisionRequest = z.infer<typeof decisionRequestSchema>

/** Canonical E projection omits current-local comparison. Its hash is stable historically. */
export function decisionEvidence(snapshotBytes: Uint8Array, selectionInput: DecisionSelection) {
  const selection = decisionSelectionSchema.parse(selectionInput)
  const brief = projectDecisionBrief(snapshotBytes, { runId: selection.runId, candidateId: selection.candidateId,
    name: selection.snapshotName, sha256: selection.snapshotSha256 })
  assertBindings(brief.trace.bindings, selection.bindings)
  if (sha256(JSON.stringify(brief)) !== selection.briefSha256) throw new Error("Selected brief fingerprint changed")
  return brief
}

function assemble(snapshotBytes: Uint8Array, request: DecisionRequest, createdAt: string) {
  z.iso.datetime().parse(createdAt)
  const brief = decisionEvidence(snapshotBytes, request.selection)
  return {
    schemaVersion: "BUILD-001F/1" as const, recordType: "Human Decision Record" as const, decisionId: request.decisionId, createdAt,
    runId: request.selection.runId, candidateId: request.selection.candidateId, decisionStatus: "RECORDED" as const,
    disclosure: DECISION_DISCLOSURE, authority: DECISION_AUTHORITY, boundary: DECISION_BOUNDARY,
    evidenceBoundary: DECISION_LIMIT, principle: brief.principle,
    humanDecision: { decisionText: request.decisionText, rationale: request.rationale, decisionMaker: request.decisionMaker,
      role: request.role, decisionAuthority: request.decisionAuthority, demonstration: request.demonstration,
      identityBoundary: "These are supplied demonstration values. Identity, role, authority, authorship and decision correctness are not authenticated or verified." },
    unresolvedAcknowledgement: { acknowledged: request.unresolvedAcknowledged, statement: DECISION_ACKNOWLEDGEMENT },
    trace: { selection: request.selection, briefVersion: brief.version,
      briefIdentity: `${brief.version}:${request.selection.briefSha256}`,
      briefHashScope: "SHA-256 of JSON.stringify of the BUILD-001E projection without current-local comparison; no separate BUILD-001E artifact exists.",
      snapshotPath: brief.trace.snapshotPath, snapshotSha256: brief.trace.snapshotSha256, bindings: brief.trace.bindings,
      creationCheck: "Selected local run and all frozen input fingerprints matched when recording. This is not a continuing current-evidence claim.",
      inputReferences: Object.fromEntries(Object.entries(brief.fullSnapshot.inputs).map(([key, value]) => [key, { path: value.path, state: value.state, sha256: value.sha256 }])) },
    frozenEvidence: { snapshotBytesBase64: Buffer.from(snapshotBytes).toString("base64") },
    humanReview: brief.humanReview, unseenDissent: brief.unseenDissent, unresolved: brief.unresolved,
  }
}
export type HumanDecisionRecord = ReturnType<typeof assemble>

/** Human-supplied fields only. Mandatory current identity is supplied by the validating store. */
export function createDecisionRecord(snapshotBytes: Uint8Array, input: DecisionRequest, current: LocalEvidenceIdentity, createdAt: string): HumanDecisionRecord {
  const request = decisionRequestSchema.parse(input)
  if (runIdSchema.parse(current.runId) !== request.selection.runId) throw new Error("Historical brief cannot be recorded as current")
  assertBindings(bindingsSchema.parse(current.bindings), request.selection.bindings)
  return assemble(snapshotBytes, request, createdAt)
}

const seedSchema = z.object({ decisionId: decisionIdSchema, createdAt: z.iso.datetime(),
  trace: z.object({ selection: decisionSelectionSchema }),
  humanDecision: z.object({ decisionText: humanText, rationale: humanText, decisionMaker: humanText, role: humanText,
    decisionAuthority: humanText, demonstration: z.literal("SYNTHETIC_TEST_DATA") }),
  unresolvedAcknowledgement: z.object({ acknowledged: z.literal(true) }),
  frozenEvidence: z.strictObject({ snapshotBytesBase64: z.string() }),
})
/** Portable historical validity only; unsupported fields fail full deterministic reconstruction. */
export function validateDecisionRecord(input: unknown, expected?: DecisionSelection): HumanDecisionRecord {
  const seed = seedSchema.parse(input), encoded = seed.frozenEvidence.snapshotBytesBase64
  const bytes = Buffer.from(encoded, "base64")
  if (bytes.toString("base64") !== encoded) throw new Error("Noncanonical embedded snapshot bytes")
  if (expected && JSON.stringify(decisionSelectionSchema.parse(expected)) !== JSON.stringify(seed.trace.selection)) throw new Error("Decision selection changed")
  const request = decisionRequestSchema.parse({ decisionId: seed.decisionId, selection: seed.trace.selection,
    decisionText: seed.humanDecision.decisionText, rationale: seed.humanDecision.rationale,
    decisionMaker: seed.humanDecision.decisionMaker, role: seed.humanDecision.role, decisionAuthority: seed.humanDecision.decisionAuthority,
    demonstration: seed.humanDecision.demonstration, unresolvedAcknowledged: seed.unresolvedAcknowledgement.acknowledged })
  const rebuilt = assemble(bytes, request, seed.createdAt)
  if (JSON.stringify(input) !== JSON.stringify(rebuilt)) throw new Error("Decision record differs from its frozen evidence or contains unsupported authority fields")
  return rebuilt
}
