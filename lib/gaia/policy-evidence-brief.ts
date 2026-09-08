import { z } from "zod"
import { sha256 } from "./policy-evidence"
import { bindingsSchema, runIdSchema, validateSnapshot, type Bindings } from "./policy-evidence-snapshot"

export const BRIEF_RULE = "The brief may organize evidence. It may not upgrade evidence."
export const BRIEF_AUTHORITY = "This brief is derived from a frozen Trust Evidence Snapshot. It introduces no new model interpretation or human judgment. Every substantive element remains traceable to the frozen snapshot and its embedded source evidence."
export const snapshotNameSchema = z.string().regex(/^trust-evidence-CAND-\d{3}-\d+\.json$/)
const identitySchema = z.strictObject({ runId: runIdSchema, candidateId: z.string().regex(/^CAND-\d{3}$/), name: snapshotNameSchema,
  sha256: z.string().regex(/^[a-f0-9]{64}$/) })
export type BriefIdentity = z.infer<typeof identitySchema>
export type LocalEvidenceIdentity = { runId: string; bindings: Bindings }

/** One exact frozen snapshot only. No model, filesystem mutation, or inferred evidence. */
export function projectDecisionBrief(bytes: Uint8Array, identityInput: BriefIdentity, current?: LocalEvidenceIdentity) {
  const identity = identitySchema.parse(identityInput)
  if (sha256(bytes) !== identity.sha256) throw new Error("Snapshot fingerprint mismatch")
  const snapshot = validateSnapshot(JSON.parse(Buffer.from(bytes).toString("utf8")))
  if (snapshot.runId !== identity.runId || snapshot.candidateId !== identity.candidateId || !identity.name.startsWith(`trust-evidence-${identity.candidateId}-`)) throw new Error("Brief run/candidate selection mismatch")
  if (current) { runIdSchema.parse(current.runId); bindingsSchema.parse(current.bindings) }
  const matches = current && current.runId === snapshot.runId &&
    (["source", "proof", "reviews", "dissent"] as const).every((key) => current.bindings[key] === snapshot.bindings[key])
  const localAgreement = !current ? "NOT_CHECKED" : matches ? "MATCHES_SELECTED_LOCAL_INPUTS" : "HISTORICAL_INPUTS_DIFFER"
  return {
    version: "BUILD-001E/1", principle: snapshot.boundary, rule: BRIEF_RULE, authority: BRIEF_AUTHORITY,
    interpretation: { candidateId: snapshot.candidateId, wording: snapshot.modelInterpreted.originalMachineWording },
    humanReview: snapshot.humanReview,
    evidenceState: { mechanicallyVerified: snapshot.mechanicallyVerified, evidence: snapshot.modelInterpreted.evidence, assessment: snapshot.modelInterpreted.machineAssessment },
    unseenDissent: snapshot.unseenDissent, unresolved: snapshot.unresolved,
    trace: { snapshotPath: `.local/gaia/policy-evidence/${identity.runId}/${identity.name}`, snapshotSha256: identity.sha256,
      runId: snapshot.runId, createdAt: snapshot.createdAt, bindings: snapshot.bindings,
      portableValidity: "VALIDATED_AGAINST_EMBEDDED_BYTES", localAgreement,
      localBoundary: !current ? "Agreement with current local evidence was not checked. This brief must not be treated as current local evidence."
        : matches ? "Frozen input fingerprints match the selected local run at load time. This does not establish semantic correctness."
          : "Historical snapshot: valid against its embedded inputs, but those inputs do not match the selected local run. This is not current local evidence." },
    fullSnapshot: snapshot,
  }
}
export type DecisionBrief = ReturnType<typeof projectDecisionBrief>
