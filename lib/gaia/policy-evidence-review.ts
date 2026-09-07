import { z } from "zod"

import { sha256, validateProof, verifyBaseline } from "./policy-evidence"

export const REVIEW_VERSION = "BUILD-001B/1"
export const DISPOSITIONS = ["CONFIRM", "REVISE", "REJECT", "HOLD_DISSONANCE"] as const
export type Disposition = typeof DISPOSITIONS[number]
export type Proof = ReturnType<typeof validateProof>
export type MachineAssessment = Proof["candidates"][number]["validated"]["assessment"]

const text = z.string().min(1).max(20_000).refine((value) => value.trim().length > 0)
const fingerprint = z.string().regex(/^[a-f0-9]{64}$/)
export const reviewRequestSchema = z.strictObject({
  proofSha256: fingerprint,
  expectedRevision: z.number().int().min(0),
  candidateId: text,
  disposition: z.enum(DISPOSITIONS),
  rationale: text,
  revisedWording: text.nullable(),
}).superRefine((value, context) => {
  if ((value.disposition === "REVISE") !== (value.revisedWording !== null)) {
    context.addIssue({ code: "custom", message: "Only REVISE requires separate revised wording", path: ["revisedWording"] })
  }
})
export type ReviewRequest = z.infer<typeof reviewRequestSchema>

const eventSchema = z.strictObject({
  candidateId: text,
  originalMachineWording: z.string().min(1),
  originalMachineAssessment: z.strictObject({
    status: z.enum(["SUPPORTED", "CONTESTED", "INSUFFICIENT"]),
    reason: z.string().min(1), ruleVersion: z.string().min(1),
  }),
  disposition: z.enum(DISPOSITIONS),
  rationale: text,
  revisedWording: text.nullable(),
  reviewedAt: z.iso.datetime(),
  reviewRevision: z.number().int().positive(),
})
export const ledgerSchema = z.strictObject({
  schemaVersion: z.literal(REVIEW_VERSION),
  proofSha256: fingerprint,
  revision: z.number().int().min(0),
  events: z.array(eventSchema),
})
export type ReviewEvent = z.infer<typeof eventSchema>
export type ReviewLedger = z.infer<typeof ledgerSchema>

/** This is the sole input boundary for the review layer; BUILD-001A is unchanged. */
export function reviewContext(sourceBytes: Uint8Array, proofBytes: Uint8Array) {
  return {
    proof: validateProof(sourceBytes, JSON.parse(Buffer.from(proofBytes).toString("utf8"))),
    proofSha256: sha256(proofBytes),
    sources: verifyBaseline(sourceBytes),
  }
}
export type ReviewContext = ReturnType<typeof reviewContext>

export function emptyReviews(context: ReviewContext): ReviewLedger {
  return { schemaVersion: REVIEW_VERSION, proofSha256: context.proofSha256, revision: 0, events: [] }
}

export function validateReviews(context: ReviewContext, input: unknown): ReviewLedger {
  const ledger = ledgerSchema.parse(input)
  if (ledger.proofSha256 !== context.proofSha256) throw new Error("Stored reviews belong to a different proof fingerprint. They have not been applied.")
  if (ledger.revision !== ledger.events.length) throw new Error("Review history revision is invalid")
  ledger.events.forEach((event, index) => {
    const candidate = context.proof.candidates.find(({ id }) => id === event.candidateId)
    if (!candidate || event.reviewRevision !== index + 1 ||
        event.originalMachineWording !== candidate.candidate.interpretation ||
        JSON.stringify(event.originalMachineAssessment) !== JSON.stringify(candidate.validated.assessment)) {
      throw new Error("Review history does not match the original candidate and assessment")
    }
    reviewRequestSchema.parse({ ...eventRequest(event), proofSha256: ledger.proofSha256, expectedRevision: index })
  })
  return ledger
}

function eventRequest(event: ReviewEvent) {
  return { candidateId: event.candidateId, disposition: event.disposition,
    rationale: event.rationale, revisedWording: event.revisedWording }
}

export function recordReview(context: ReviewContext, inputLedger: unknown, inputRequest: unknown, timestamp: string): ReviewLedger {
  const request = reviewRequestSchema.parse(inputRequest)
  const ledger = validateReviews(context, inputLedger)
  if (request.proofSha256 !== context.proofSha256) throw new Error("The proof changed. Reload before reviewing; your draft has not been saved.")
  if (request.expectedRevision !== ledger.revision) throw new Error("Review history changed. Reload before saving; your draft has not been saved.")
  const candidate = context.proof.candidates.find(({ id }) => id === request.candidateId)
  if (!candidate) throw new Error("Unknown candidate")
  const event: ReviewEvent = {
    candidateId: candidate.id,
    originalMachineWording: candidate.candidate.interpretation,
    originalMachineAssessment: { ...candidate.validated.assessment },
    disposition: request.disposition, rationale: request.rationale,
    revisedWording: request.revisedWording, reviewedAt: timestamp, reviewRevision: ledger.revision + 1,
  }
  return validateReviews(context, { ...ledger, revision: event.reviewRevision, events: [...ledger.events, event] })
}

export const NOT_ESTABLISHED = [
  "Quotation matching does not establish semantic correctness.",
  "Relationship classification remains a model interpretation; semantic relationships remain contestable.",
  "CONTESTED does not prove genuine disagreement.",
  "Complete record coverage does not prove all relevant meaning was understood.",
  "Synthetic testimony cannot establish real citizen views.",
  "Prevalence and representativeness are not established.",
  "Evidence sufficiency for an accountable policy decision is not established.",
  "Participant-confirmed meaning has not been obtained; these records are fictional.",
]

const states = { CONFIRM: "CONFIRMED", REVISE: "REVISED", REJECT: "REJECTED", HOLD_DISSONANCE: "HELD_DISSONANCE" } as const
const meanings = {
  CONFIRM: "Original wording confirmed by the reviewer. Counter-evidence and limitations remain.",
  REVISE: "Human revision recorded. New assessment/review required; the original machine assessment applies only to the original wording.",
  REJECT: "Rejected by the reviewer; excluded from accepted interpretations and retained in evidence history.",
  HOLD_DISSONANCE: "Unresolved. No consensus, acceptance, rejection or resolution is implied.",
} as const

/** All evidence preparation and snapshot computation happens server-side. */
export function reviewPresentation(context: ReviewContext, inputLedger: unknown, question: string | null) {
  const ledger = validateReviews(context, inputLedger)
  const candidates = context.proof.candidates.map((candidate) => {
    const history = ledger.events.filter(({ candidateId }) => candidateId === candidate.id)
    const review = history[history.length - 1] ?? null
    const evidence = candidate.validated.records.flatMap((record) => record.relationships.map((relationship) => ({
      ...relationship, sourceId: record.sourceId,
      originalTestimony: context.sources.find(({ id }) => id === record.sourceId)!.text,
    })))
    return {
      id: candidate.id,
      originalMachineWording: candidate.candidate.interpretation,
      relevance: candidate.candidate.relevance,
      machineAssessment: candidate.validated.assessment,
      coverage: candidate.validated.coverage,
      evidence,
      limitations: [...context.proof.limitations, ...candidate.candidate.limitations, ...candidate.validated.limitations],
      whatWasVerified: {
        sourceFingerprintMatched: true,
        expectedSourceIdsValidated: true,
        exactQuotesAndLocationsValidated: true,
        expectedRecordCount: candidate.validated.coverage.expected,
        examinedRecordCount: candidate.validated.coverage.examined,
        generationMetadataRetained: true,
        deterministicRuleApplied: candidate.validated.assessment.ruleVersion,
      },
      whatWasNotEstablished: NOT_ESTABLISHED,
      traceability: "TRACEABILITY VERIFIED",
      semanticBoundary: "SEMANTIC RELATIONSHIP REMAINS CONTESTABLE",
      reviewState: review ? states[review.disposition] : "UNREVIEWED",
      reviewMeaning: review ? meanings[review.disposition] : "No human disposition has been recorded.",
      // Revision does not automatically inherit machine support or acceptance of the original.
      acceptedOriginal: review?.disposition === "CONFIRM",
      revisionAssessment: review?.disposition === "REVISE" ? "REQUIRES_NEW_ASSESSMENT_OR_REVIEW" : null,
      review,
      history,
    }
  })
  return {
    schemaVersion: REVIEW_VERSION,
    recordType: "Trust Evidence Snapshot",
    disclosure: "Synthetic working data. Not real citizen testimony. Human judgment remains authoritative.",
    boundary: "An evidence record, not a policy recommendation, trust score, proof of consultation validity, participant consent or organisational effectiveness.",
    attribution: context.proof.attribution,
    proofSha256: context.proofSha256,
    source: context.proof.source,
    generationProvenance: context.proof.provenance,
    explorationQuestion: question,
    reviewRevision: ledger.revision,
    reviewedCount: candidates.filter(({ review }) => review !== null).length,
    unreviewedCount: candidates.filter(({ review }) => review === null).length,
    candidates,
  }
}
export type ReviewPresentation = ReturnType<typeof reviewPresentation>
export type ReviewActionResult = { ok: true; presentation: ReviewPresentation } | { ok: false; message: string }
