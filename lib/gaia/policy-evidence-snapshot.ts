import { z } from "zod"
import { SOURCE_PATH, sha256 } from "./policy-evidence"
import { emptyReviews, NOT_ESTABLISHED, reviewContext, reviewPresentation, validateReviews } from "./policy-evidence-review"
import { dissentContext, validateDissent } from "./policy-evidence-dissent"
import { DISSENT_BOUNDARY, DISSENT_LIMITATIONS } from "./policy-evidence-dissent-boundary"
import { SNAPSHOT_BOUNDARY, SNAPSHOT_LIMITATIONS, ZERO_DISSENT } from "./policy-evidence-snapshot-boundary"

export const SNAPSHOT_VERSION = "BUILD-001D/1"
export const runIdSchema = z.string().regex(/^run-[a-zA-Z0-9_-]+$/)
const hash = z.string().regex(/^[a-f0-9]{64}$/)
export const bindingsSchema = z.strictObject({ source: hash, proof: hash, reviews: hash.nullable(), dissent: hash.nullable() })
export type Bindings = z.infer<typeof bindingsSchema>
export type SnapshotBytes = { source: Uint8Array; proof: Uint8Array; reviews: Uint8Array | null; dissent: Uint8Array | null }
export const snapshotRequestSchema = z.strictObject({ runId: runIdSchema, candidateId: z.string().regex(/^CAND-\d{3}$/), expectedBindings: bindingsSchema })
export type SnapshotRequest = z.infer<typeof snapshotRequestSchema>
export function inputBindings(bytes: SnapshotBytes): Bindings {
  return { source: sha256(bytes.source), proof: sha256(bytes.proof), reviews: bytes.reviews === null ? null : sha256(bytes.reviews), dissent: bytes.dissent === null ? null : sha256(bytes.dissent) }
}
export function assertBindings(actual: Bindings, expected: Bindings) {
  for (const key of ["source", "proof", "reviews", "dissent"] as const) if (actual[key] !== expected[key]) throw new Error(`Snapshot input changed: ${key}. Reload before creating or displaying a snapshot.`)
}
const parse = (bytes: Uint8Array) => JSON.parse(Buffer.from(bytes).toString("utf8")) as unknown
export class SnapshotInputError extends Error {
  constructor(public readonly input: "reviews" | "dissent") { super(`Invalid ${input} artifact. Snapshot creation is blocked; no input was repaired and no zero-finding result is implied.`) }
}
export function validatedSnapshotInputs(bytes: SnapshotBytes) {
  const context = reviewContext(bytes.source, bytes.proof)
  const ledger = (() => {
    if (bytes.reviews === null) return emptyReviews(context)
    try { return validateReviews(context, parse(bytes.reviews)) } catch { throw new SnapshotInputError("reviews") }
  })()
  const dissent = (() => {
    if (bytes.dissent === null) return null
    try { return validateDissent(dissentContext(bytes.source, bytes.proof), parse(bytes.dissent)) } catch { throw new SnapshotInputError("dissent") }
  })()
  return { context, ledger, dissent }
}
function captured(path: string, bytes: Uint8Array | null) {
  return bytes === null ? { state: "ABSENT" as const, path, sha256: null, bytesBase64: null }
    : { state: "VALIDATED" as const, path, sha256: sha256(bytes), bytesBase64: Buffer.from(bytes).toString("base64") }
}
/** Composition only: upstream validators retain all examination and disposition authority. */
export function composeSnapshot(bytes: SnapshotBytes, requestInput: SnapshotRequest, createdAt: string) {
  const request = snapshotRequestSchema.parse(requestInput)
  z.iso.datetime().parse(createdAt)
  assertBindings(inputBindings(bytes), request.expectedBindings)
  const { context, ledger, dissent } = validatedSnapshotInputs(bytes)
  const candidate = reviewPresentation(context, ledger, null).candidates.find(({ id }) => id === request.candidateId)
  if (!candidate) throw new Error("Unknown snapshot candidate")
  const challenge = dissent?.challenges.find(({ candidateId }) => candidateId === candidate.id) ?? null
  const dir = `.local/gaia/policy-evidence/${request.runId}`
  return {
    schemaVersion: SNAPSHOT_VERSION, recordType: "Trust Evidence Snapshot", createdAt, runId: request.runId, candidateId: candidate.id,
    authority: "DERIVED_ONLY", disclosure: context.proof.disclosure, attribution: context.proof.attribution,
    boundary: SNAPSHOT_BOUNDARY,
    inputs: { source: captured(SOURCE_PATH, bytes.source), proof: captured(`${dir}/proof.json`, bytes.proof),
      reviews: captured(`${dir}/reviews.json`, bytes.reviews), dissent: captured(`${dir}/dissent.json`, bytes.dissent) },
    bindings: inputBindings(bytes),
    mechanicallyVerified: { epistemicClass: "MECHANICALLY VERIFIED", scope: "Artifact hashes, source IDs, exact quotations, offsets, faithful recorded relationships and the original deterministic assessment. No semantic correctness is verified.",
      sourceIds: context.proof.source.ids, coverage: candidate.coverage, checks: candidate.whatWasVerified },
    modelInterpreted: { epistemicClass: "MODEL-INTERPRETED", originalMachineWording: candidate.originalMachineWording,
      relevance: candidate.relevance, machineAssessment: candidate.machineAssessment, evidence: candidate.evidence,
      generationProvenance: context.proof.provenance, limitations: candidate.limitations },
    humanReview: { epistemicClass: candidate.review ? "HUMAN-REVIEWED" : "UNRESOLVED",
      scope: "Only the saved human disposition and rationale are recorded here. This class does not confirm model meaning, challenge materiality or participant meaning.",
      ledgerState: bytes.reviews === null ? "ABSENT" : "VALIDATED", state: candidate.reviewState,
      disposition: candidate.review?.disposition ?? null, rationale: candidate.review?.rationale ?? null,
      revisedWording: candidate.review?.revisedWording ?? null, meaning: candidate.reviewMeaning,
      revisionAssessment: candidate.revisionAssessment, ledgerRevision: bytes.reviews === null ? null : ledger.revision,
      currentEvent: candidate.review, history: candidate.history, historyReference: `${dir}/reviews.json`,
    },
    unseenDissent: { epistemicClass: challenge ? "MODEL-INTERPRETED" : "UNRESOLVED",
      state: challenge ? (challenge.findings.length ? "VALIDATED_FINDINGS" : "VALIDATED_ZERO_FINDINGS") : "ABSENT",
      boundary: DISSENT_BOUNDARY, messages: challenge ? (challenge.findings.length ? ["Potential unseen dissent remains unresolved until human review."] : [...ZERO_DISSENT]) : ["No dissent artifact is present. Challenge evidence is absent; no zero-finding result is established."],
      challenge, limitations: dissent?.limitations ?? [...DISSENT_LIMITATIONS],
    },
    unresolved: { epistemicClass: "UNRESOLVED", whatWasNotEstablished: [...NOT_ESTABLISHED, ...DISSENT_LIMITATIONS, ...SNAPSHOT_LIMITATIONS] },
  }
}
export type TrustSnapshot = ReturnType<typeof composeSnapshot>
const captureSchema = z.strictObject({ state: z.enum(["ABSENT", "VALIDATED"]), path: z.string(), sha256: hash.nullable(), bytesBase64: z.string().nullable() })
const snapshotSeedSchema = z.object({ createdAt: z.iso.datetime(), runId: runIdSchema, candidateId: z.string(),
  inputs: z.strictObject({ source: captureSchema, proof: captureSchema, reviews: captureSchema, dissent: captureSchema }) })
/** Portable validation uses embedded exact bytes; optional external bindings reject stale local inputs. */
export function validateSnapshot(input: unknown, expected?: { runId: string; candidateId?: string; bindings: Bindings }): TrustSnapshot {
  const seed = snapshotSeedSchema.parse(input)
  const decoded = (item: z.infer<typeof captureSchema>) => {
    if (item.state === "ABSENT") {
      if (item.sha256 !== null || item.bytesBase64 !== null) throw new Error("Absent input contains evidence")
      return null
    }
    if (item.bytesBase64 === null) throw new Error("Missing embedded bytes")
    const bytes = Buffer.from(item.bytesBase64, "base64")
    if (bytes.toString("base64") !== item.bytesBase64 || sha256(bytes) !== item.sha256) throw new Error("Embedded input fingerprint mismatch")
    return bytes
  }
  const source = decoded(seed.inputs.source), proof = decoded(seed.inputs.proof)
  if (source === null || proof === null) throw new Error("Source and proof are required")
  const bytes = { source, proof, reviews: decoded(seed.inputs.reviews), dissent: decoded(seed.inputs.dissent) }
  const bindings = inputBindings(bytes)
  if (expected) {
    if (expected.runId !== seed.runId || (expected.candidateId && expected.candidateId !== seed.candidateId)) throw new Error("Snapshot selection mismatch")
    assertBindings(bindings, expected.bindings)
  }
  const rebuilt = composeSnapshot(bytes, { runId: seed.runId, candidateId: seed.candidateId, expectedBindings: bindings }, seed.createdAt)
  if (JSON.stringify(input) !== JSON.stringify(rebuilt)) throw new Error("Snapshot differs from its validated inputs or contains unsupported authority fields")
  return rebuilt
}
