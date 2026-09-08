import { z } from "zod"
import { isUint8Array } from "node:util/types"
import { sha256, verifyBaseline } from "./policy-evidence"
import { reviewContext, validateReviews, type ReviewContext } from "./policy-evidence-review"
import { dissentContext, validateDissent } from "./policy-evidence-dissent"
import { decisionEvidence, validateDecisionRecord } from "./policy-evidence-decision"
import { runIdSchema, type SnapshotBytes } from "./policy-evidence-snapshot"

export const CHANGE_RULE = "GAIA may detect that the evidence changed. GAIA may not decide whether the decision should change."
export const CHANGE_HISTORY = "The original Human Decision Record remains unchanged. New evidence does not rewrite an old decision."
export const CHANGE_AUTHORITY = "This notice compares evidence identities and validated states, not meanings. Evidence change does not establish that the recorded decision is wrong, insufficient, or must be reversed."
export const CHANGE_COPY = {
  RECORDED_EVIDENCE_MATCHES_CURRENT: {
    heading: "CURRENT EVIDENCE CHECK — MATCHES RECORDED EVIDENCE",
    messages: ["The current local source, proof, review and dissent fingerprints matched the evidence recorded with this decision at page load.", "This does not revalidate the correctness, quality or continuing appropriateness of the decision."],
  },
  CURRENT_EVIDENCE_DIFFERS: {
    heading: "CURRENT EVIDENCE CHECK — EVIDENCE HAS CHANGED",
    messages: ["At least one current evidence binding differs from the evidence recorded when this decision was made.", "The original decision and its evidence remain unchanged.", "This does not establish that the decision is wrong or that the changed evidence is materially relevant. Human reassessment is needed before representing this decision as based on the current evidence."],
  },
  CURRENT_EVIDENCE_INVALID: {
    heading: "CURRENT EVIDENCE CHECK — CURRENT EVIDENCE COULD NOT BE VALIDATED",
    messages: ["The historical Human Decision Record remains inspectable against its frozen evidence. No claim about agreement with current evidence is made."],
  },
  CURRENT_EVIDENCE_NOT_CHECKED: {
    heading: "CURRENT EVIDENCE CHECK — NOT CHECKED",
    messages: ["Current evidence was unavailable or could not be checked completely. The historical Human Decision Record remains inspectable against its frozen evidence. No claim about agreement with current evidence is made."],
  },
} as const
const keys = ["source", "proof", "reviews", "dissent"] as const
const readSchema = z.discriminatedUnion("state", [
  z.strictObject({ state: z.literal("PRESENT"), bytes: z.custom<Uint8Array>(isUint8Array) }),
  z.strictObject({ state: z.literal("ABSENT") }),
  z.strictObject({ state: z.literal("UNAVAILABLE") }),
])
export type EvidenceRead = z.infer<typeof readSchema>
const currentSchema = z.strictObject({ runId: runIdSchema,
  inputs: z.strictObject({ source: readSchema, proof: readSchema, reviews: readSchema, dissent: readSchema }) })
export type CurrentEvidence = z.infer<typeof currentSchema>
type CurrentState = "VALIDATED" | "ABSENT" | "INVALID" | "UNAVAILABLE" | "NOT_VALIDATED"
type BindingRow = { input: typeof keys[number]; recorded: { state: "VALIDATED" | "ABSENT"; sha256: string | null };
  current: { state: CurrentState; sha256: string | null }; comparison: "MATCH" | "CHANGED" | "NOT_COMPARED" }

export function availableCurrentEvidence(runId: string, bytes: SnapshotBytes): CurrentEvidence {
  const read = (value: Uint8Array | null): EvidenceRead => value === null ? { state: "ABSENT" } : { state: "PRESENT", bytes: value }
  return { runId, inputs: { source: read(bytes.source), proof: read(bytes.proof), reviews: read(bytes.reviews), dissent: read(bytes.dissent) } }
}

/** Validate historical D/E/F first. Current evidence never replaces historical bytes or meaning. */
export function compareDecisionEvidence(recordInput: unknown, currentInput: CurrentEvidence | null) {
  const record = validateDecisionRecord(recordInput)
  const frozenBrief = decisionEvidence(Buffer.from(record.frozenEvidence.snapshotBytesBase64, "base64"), record.trace.selection)
  const current = currentInput === null ? null : currentSchema.parse(currentInput)
  const rows: BindingRow[] = keys.map((input) => {
    const read = current?.inputs[input], digest = record.trace.bindings[input]
    return { input, recorded: { state: digest === null ? "ABSENT" : "VALIDATED", sha256: digest },
      current: { state: !read ? "UNAVAILABLE" : read.state === "PRESENT" ? "NOT_VALIDATED"
        : read.state === "ABSENT" && (input === "source" || input === "proof") ? "UNAVAILABLE" : read.state,
      sha256: read?.state === "PRESENT" ? sha256(read.bytes) : null }, comparison: "NOT_COMPARED" }
  })
  const row = (key: typeof keys[number]) => rows.find((item) => item.input === key)!
  const bytes = (key: typeof keys[number]) => { const read = current?.inputs[key]; return read?.state === "PRESENT" ? read.bytes : null }
  const source = bytes("source"), proof = bytes("proof")
  let context: ReviewContext | null = null
  if (source) {
    try { verifyBaseline(source); row("source").current.state = "VALIDATED" } catch { row("source").current.state = "INVALID" }
  }
  if (proof && row("source").current.state === "VALIDATED") {
    try { context = reviewContext(source!, proof); row("proof").current.state = "VALIDATED" } catch { row("proof").current.state = "INVALID" }
  }
  for (const key of ["reviews", "dissent"] as const) {
    const raw = bytes(key)
    if (!raw || !context) continue
    try {
      const parsed: unknown = JSON.parse(Buffer.from(raw).toString("utf8"))
      if (key === "reviews") validateReviews(context, parsed)
      else validateDissent(dissentContext(source!, proof!), parsed)
      row(key).current.state = "VALIDATED"
    } catch { row(key).current.state = "INVALID" }
  }
  const invalid = rows.some((item) => item.current.state === "INVALID")
  const complete = rows.every((item) => item.current.state === "VALIDATED" || item.current.state === "ABSENT")
  if (complete) for (const item of rows) item.comparison = item.recorded.sha256 === item.current.sha256 ? "MATCH" : "CHANGED"
  const state = invalid ? "CURRENT_EVIDENCE_INVALID" : !complete ? "CURRENT_EVIDENCE_NOT_CHECKED"
    : rows.some((item) => item.comparison === "CHANGED") ? "CURRENT_EVIDENCE_DIFFERS" : "RECORDED_EVIDENCE_MATCHES_CURRENT"
  return { version: "BUILD-001G/1" as const, state, rule: CHANGE_RULE, historicalRule: CHANGE_HISTORY, authority: CHANGE_AUTHORITY,
    historicalValidity: "VALIDATED_AGAINST_EMBEDDED_BYTES" as const, recordedRunId: record.runId, currentRunId: current?.runId ?? null,
    rows, presentation: CHANGE_COPY[state], historicalRecord: record, frozenBrief }
}
export type DecisionChangeNotice = ReturnType<typeof compareDecisionEvidence>

/** Request-time output only; reject additions or semantic/authority upgrades rather than accepting them. */
export function validateDecisionChangeNotice(input: unknown, record: unknown, current: CurrentEvidence | null) {
  const rebuilt = compareDecisionEvidence(record, current)
  if (JSON.stringify(input) !== JSON.stringify(rebuilt)) throw new Error("Notice differs from validated comparison or contains unsupported authority fields")
  return rebuilt
}
