import { createHash } from "node:crypto"
import { z } from "zod"

export const SOURCE_PATH = "content/playbooks/policy-evidence/policy-evidence.data.json"
export const BASELINE_SHA256 = "4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b"
export const SOURCE_IDS = Array.from({ length: 20 }, (_, index) => `SYN-${String(index + 1).padStart(4, "0")}`)
export const SCHEMA_VERSION = "BUILD-001A/1"
export const RULE_VERSION = "GAIA-assessment/1"
export const METHOD_VERSION = "GAIA-generation/1"
export const MODEL = "gpt-6-astra"

export function sha256(value: string | Uint8Array): string {
  return createHash("sha256").update(value).digest("hex")
}

const nonempty = z.string().min(1).refine((value) => value.trim().length > 0)
const sourceSchema = z.strictObject({
  disclosure: z.literal("Synthetic working data"),
  description: nonempty,
  records: z.array(z.strictObject({ id: nonempty, text: nonempty, theme: nonempty, stance: nonempty })),
})

export type Source = { id: string; text: string }

/** Explicit expected IDs keep the validator reusable for a later synthetic dissent test. */
export function parseSources(bytes: Uint8Array, expectedIds: readonly string[] = SOURCE_IDS): Source[] {
  const corpus = sourceSchema.parse(JSON.parse(Buffer.from(bytes).toString("utf8")))
  const ids = corpus.records.map(({ id }) => id)
  if (new Set(expectedIds).size !== expectedIds.length || ids.length !== expectedIds.length ||
      new Set(ids).size !== ids.length || expectedIds.some((id) => !ids.includes(id))) {
    throw new Error("Source IDs must match the complete expected set without duplicates")
  }
  // Only this projection is passed to the model. Never infer relationships from authored labels.
  return corpus.records.map(({ id, text }) => ({ id, text }))
}

export function verifyBaseline(bytes: Uint8Array): Source[] {
  const sources = parseSources(bytes)
  if (sha256(bytes) !== BASELINE_SHA256) throw new Error("Original Hypership corpus bytes changed")
  return sources
}

export const candidateSchema = z.strictObject({
  interpretation: nonempty,
  relevance: nonempty,
  limitations: z.array(nonempty).min(1),
})
export const candidatesSchema = z.strictObject({ candidates: z.array(candidateSchema).max(3) })

const relationshipSchema = z.strictObject({
  kind: z.enum(["SUPPORT", "CONTRADICTION", "QUALIFICATION", "AMBIGUITY", "NO_RELEVANT_BEARING"]),
  quote: nonempty.nullable(),
  explanation: nonempty,
})
export const examinationSchema = z.strictObject({
  records: z.array(z.strictObject({
    sourceId: nonempty,
    relationships: z.array(relationshipSchema).min(1),
  })).min(1),
  limitations: z.array(nonempty).min(1),
})

/** Validate everything before assessing; offsets are derived only from unique exact matches. */
export function examine(sources: readonly Source[], input: unknown) {
  const examination = examinationSchema.parse(input)
  const ids = examination.records.map(({ sourceId }) => sourceId)
  if (new Set(sources.map(({ id }) => id)).size !== sources.length ||
      ids.length !== sources.length || new Set(ids).size !== ids.length ||
      sources.some(({ id }) => !ids.includes(id))) {
    throw new Error("Examination must cover every source ID exactly once")
  }
  const records = examination.records.map((record) => {
    const source = sources.find(({ id }) => id === record.sourceId)!
    const relationships = record.relationships.map((relationship) => {
      if (relationship.kind === "NO_RELEVANT_BEARING") {
        if (relationship.quote !== null || record.relationships.length !== 1) {
          throw new Error("No relevant bearing must stand alone with a null quote")
        }
        return { ...relationship, start: null, end: null }
      }
      if (relationship.quote === null) throw new Error("Substantive relationship requires a quote")
      const start = source.text.indexOf(relationship.quote)
      if (start < 0 || source.text.indexOf(relationship.quote, start + 1) !== -1) {
        throw new Error(`Quote must match exactly one passage in ${source.id}`)
      }
      return { ...relationship, start, end: start + relationship.quote.length }
    })
    return { sourceId: source.id, relationships }
  })
  const kinds = new Set(records.flatMap(({ relationships }) => relationships.map(({ kind }) => kind)))
  let status: "SUPPORTED" | "CONTESTED" | "INSUFFICIENT"
  let reason: string
  if (!kinds.has("SUPPORT")) {
    status = "INSUFFICIENT"
    reason = "No verified supporting passage was recorded."
  } else if (kinds.has("CONTRADICTION") || kinds.has("QUALIFICATION")) {
    status = "CONTESTED"
    reason = "Support and at least one material contradiction or qualification were recorded."
  } else if (kinds.has("AMBIGUITY")) {
    status = "INSUFFICIENT"
    reason = "Support exists, but unresolved ambiguity remains."
  } else {
    status = "SUPPORTED"
    reason = "Support was recorded with no material challenge in the completed examination."
  }
  return {
    records,
    limitations: examination.limitations,
    coverage: { expected: sources.length, examined: records.length, allSourcesExamined: true as const },
    assessment: { status, reason, ruleVersion: RULE_VERSION },
  }
}

const digest = z.string().regex(/^[a-f0-9]{64}$/)
export const callSchema = z.strictObject({
  stage: nonempty,
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  cliVersion: nonempty,
  reportedModel: z.literal(MODEL),
  reportedProvider: z.literal("openai"),
  sessionId: nonempty,
  promptSha256: digest,
  outputSchemaSha256: digest,
  responseSha256: digest,
  exitCode: z.literal(0),
})
const provenanceSchema = z.strictObject({
  startedAt: z.iso.datetime(),
  endedAt: z.iso.datetime(),
  requestedModel: z.literal(MODEL),
  cliVersion: nonempty,
  methodVersion: z.literal(METHOD_VERSION),
  promptVersion: nonempty,
  promptSha256: digest,
  generationCodeSha256: digest,
  domainCodeSha256: digest,
  skillSha256: digest,
  calls: z.array(callSchema).min(1).max(4),
})
export type Provenance = z.infer<typeof provenanceSchema>
const proofInputSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  disclosure: z.literal("Synthetic working data"),
  attribution: nonempty,
  source: z.strictObject({ path: z.literal(SOURCE_PATH), sha256: digest, ids: z.array(nonempty), count: z.literal(20) }),
  provenance: provenanceSchema,
  candidateCount: z.number().int().min(0).max(3),
  limitations: z.array(nonempty).min(1),
  candidates: z.array(z.strictObject({
    id: nonempty,
    candidate: candidateSchema,
    examination: examinationSchema,
    // Recomputed below; stored assessments/offsets are never trusted.
    validated: z.unknown(),
  })).max(3),
})

export const PROOF_LIMITATIONS = [
  "AI-authored synthetic testimony is not real citizen evidence or a basis for policy decisions.",
  "The actual consultation purpose and accountable policy owner are unknown.",
  "Complete coverage means an entry for every supplied record; it does not prove correct reading or absence of missed language.",
  "Exact quotations establish traceability, not the correctness or materiality of the AI relationship classifications.",
  "Machine assessment is deterministic over AI-authored relationships, not an independent factual or human judgement.",
  "No prevalence, priority, representativeness, operational effectiveness, or real-corpus completeness is established.",
]

export function buildProof(bytes: Uint8Array, generated: unknown, examinations: unknown[], provenance: Provenance) {
  const sources = verifyBaseline(bytes)
  const { candidates } = candidatesSchema.parse(generated)
  if (examinations.length !== candidates.length) throw new Error("One separate examination is required per candidate")
  return {
    schemaVersion: SCHEMA_VERSION,
    disclosure: "Synthetic working data",
    attribution: "GAIA extension built on Hypership's lab-notes.ai and build-policy-evidence foundation.",
    source: { path: SOURCE_PATH, sha256: sha256(bytes), ids: sources.map(({ id }) => id), count: sources.length },
    provenance: provenanceSchema.parse(provenance),
    candidateCount: candidates.length,
    limitations: PROOF_LIMITATIONS,
    candidates: candidates.map((candidate, index) => ({
      id: `CAND-${String(index + 1).padStart(3, "0")}`,
      candidate,
      examination: examinationSchema.parse(examinations[index]),
      validated: examine(sources, examinations[index]),
    })),
  }
}

/** Revalidate serialized artifacts against source bytes, recomputing offsets and assessments. */
export function validateProof(bytes: Uint8Array, input: unknown) {
  const parsed = proofInputSchema.parse(input)
  const rebuilt = buildProof(bytes, { candidates: parsed.candidates.map(({ candidate }) => candidate) },
    parsed.candidates.map(({ examination }) => examination), parsed.provenance)
  if (parsed.provenance.calls.length !== parsed.candidateCount + 1 ||
      parsed.provenance.calls.some((call, index) => call.stage !== (index === 0 ? "candidates" : `examination-${index}`))) {
    throw new Error("Generation provenance must contain candidate generation and every examination call")
  }
  if (JSON.stringify(parsed) !== JSON.stringify(rebuilt)) {
    throw new Error("Artifact differs from validated source, evidence, coverage, or deterministic assessment")
  }
  return rebuilt
}
