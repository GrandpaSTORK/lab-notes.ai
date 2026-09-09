import { sha256 } from "./policy-evidence"
import { projectDecisionBrief, type BriefIdentity } from "./policy-evidence-brief"
import { validateDecisionRecord, type HumanDecisionRecord } from "./policy-evidence-decision"
import { validateDecisionChangeNotice, type CurrentEvidence } from "./policy-evidence-change"
import { inputBindings, validatedSnapshotInputs, type SnapshotBytes } from "./policy-evidence-snapshot"
import { SNAPSHOT_LIMITATIONS } from "./policy-evidence-snapshot-boundary"

export const EXECUTIVE_PRINCIPLE = "The snapshot orients the leader. The evidence trail proves the snapshot."
export const EXECUTIVE_AUTHORITY = "BUILD-001H may organize already-established evidence into a decision-facing view. It may not invent new evidence, upgrade interpretation, manufacture consensus, or make the decision."
export const EXECUTIVE_DISCLOSURE = "Synthetic working data. This dataset does not represent a real consultation, public mandate or policy recommendation."
export const THEME_BOUNDARY = "Theme counts describe the supplied synthetic records. They do not establish representativeness, importance or consensus."
export const QUESTION_BOUNDARY = "GAIA DECISION QUESTIONS — Derived presentation prompts; not participant testimony or policy recommendations."
export const MATCH_BOUNDARY = "Matching evidence identities do not establish that the decision remains correct or appropriate."
export const PRESENTATION_BOUNDARY = "Presentation availability only; not evidence quality, trust, confidence or decision readiness."

export type ThemeSource = { id: string; text: string; theme?: unknown }
/** Exact metadata, in first-record occurrence order. No label rewriting, merging or ranking. */
export function aggregateStoredThemes(records: readonly ThemeSource[]) {
  const groups = new Map<string, string[]>(), missingSourceIds: string[] = []
  for (const record of records) {
    if (typeof record.theme !== "string" || record.theme.trim().length === 0) { missingSourceIds.push(record.id); continue }
    const ids = groups.get(record.theme) ?? []
    ids.push(record.id); groups.set(record.theme, ids)
  }
  return { themes: Array.from(groups, ([label, sourceIds]) => ({ label, count: sourceIds.length, sourceIds })), missingSourceIds,
    limitation: missingSourceIds.length ? "Theme metadata is incomplete. Records without a usable stored label are listed separately; no label was inferred." : null }
}
export type ExecutiveOptional = { decision?: unknown; change?: unknown; changeCurrent?: CurrentEvidence | null }
type Availability = "AVAILABLE" | "UNAVAILABLE" | "INVALID" | "NOT_ASSOCIATED"
type DecisionContext = { availability: Availability; state: "RECORDED" | null; decisionId: string | null; message: string }
type ChangeContext = { availability: Availability; state: string | null; runId: string | null; message: string }

function coreProjection(snapshotBytes: Uint8Array, identity: BriefIdentity, current: SnapshotBytes) {
  validatedSnapshotInputs(current)
  const bindings = inputBindings(current)
  const brief = projectDecisionBrief(snapshotBytes, identity, { runId: identity.runId, bindings })
  if (brief.trace.localAgreement !== "MATCHES_SELECTED_LOCAL_INPUTS") throw new Error("Selected frozen evidence is not current")
  // This parse follows exact source/proof validation. No runtime metadata substitutions are accepted.
  const records = (JSON.parse(Buffer.from(current.source).toString("utf8")) as { records: ThemeSource[] }).records
  const sourceIds = new Set(brief.evidenceState.mechanicallyVerified.sourceIds)
  const examined = records.filter((record) => sourceIds.has(record.id)).length
  if (examined !== brief.evidenceState.mechanicallyVerified.coverage.examined) throw new Error("Coverage mismatch")
  const metadata = aggregateStoredThemes(records)
  const allLimits = brief.unresolved.whatWasNotEstablished
  // Select whole existing sentences by exact identity, retaining their original meaning and location.
  const limitations = [SNAPSHOT_LIMITATIONS[1], SNAPSHOT_LIMITATIONS[3], SNAPSHOT_LIMITATIONS[4], SNAPSHOT_LIMITATIONS[5]].map((text) => {
    const index = allLimits.indexOf(text)
    if (index === -1) throw new Error("Expected frozen boundary missing")
    return { text, reference: `snapshot.unresolved.whatWasNotEstablished[${index}]` }
  })
  const questions = [
    { text: "What evidence would be needed to assess representativeness for the decision being considered?", basis: "snapshot.unresolved.whatWasNotEstablished", href: "#executive-limitations" },
    { text: "Which unresolved meanings or potentially missing perspectives need human examination?", basis: "snapshot.unresolved.whatWasNotEstablished", href: "#executive-limitations" },
    ...(brief.unseenDissent.challenge?.findings.length ? [{ text: "Does the potential dissent materially affect this interpretation?", basis: "snapshot.unseenDissent.challenge.findings", href: "#decision-evidence-brief" }] : []),
  ]
  const findings = brief.unseenDissent.challenge?.findings ?? null
  return { brief, core: {
    runId: identity.runId, candidateId: brief.interpretation.candidateId,
    interpretation: { wording: brief.interpretation.wording, epistemicClass: "MODEL-INTERPRETED" as const },
    responses: { examined, supplied: records.length },
    humanReview: { epistemicClass: brief.humanReview.epistemicClass, state: brief.humanReview.state,
      disposition: brief.humanReview.disposition, scope: brief.humanReview.scope },
    dissent: { state: brief.unseenDissent.state, count: findings === null ? null : findings.length,
      messages: brief.unseenDissent.messages, boundary: brief.unseenDissent.boundary,
      firstFinding: findings?.[0] ? { status: findings[0].status, sourceId: findings[0].sourceId, quote: findings[0].quote } : null },
    ...metadata, limitations, questions,
    sources: records.map((record) => ({ id: record.id, text: record.text, theme: typeof record.theme === "string" ? record.theme : null })),
  } }
}

export function projectExecutiveSnapshot(snapshotBytes: Uint8Array, identity: BriefIdentity, current: SnapshotBytes, optional: ExecutiveOptional = {}) {
  const { brief, core } = coreProjection(snapshotBytes, identity, current)
  const expected = { runId: identity.runId, candidateId: identity.candidateId, snapshotName: identity.name,
    snapshotSha256: identity.sha256, briefSha256: sha256(JSON.stringify(projectDecisionBrief(snapshotBytes, identity))), bindings: brief.trace.bindings }
  const decision: DecisionContext = { availability: "UNAVAILABLE", state: null, decisionId: null, message: "No validated associated decision context is available. This does not establish that no decision exists." }
  const change: ChangeContext = { availability: "UNAVAILABLE", state: null, runId: null, message: "No validated associated current-evidence notice is available. Agreement has not been established." }
  let record: HumanDecisionRecord | null = null
  if (optional.decision !== undefined) {
    try {
      const valid = validateDecisionRecord(optional.decision)
      if (JSON.stringify(valid.trace.selection) !== JSON.stringify(expected)) {
        decision.availability = "NOT_ASSOCIATED"; decision.message = "The selected decision belongs to different frozen evidence. It is not applied here."
      } else {
        record = valid; decision.availability = "AVAILABLE"; decision.state = valid.decisionStatus; decision.decisionId = valid.decisionId
        decision.message = "GAIA did not make, recommend, approve or validate the decision."
      }
    } catch { decision.availability = "INVALID"; decision.message = "The associated decision could not be validated. Earlier validated evidence remains visible." }
  }
  if (record && optional.change !== undefined) {
    try {
      const notice = validateDecisionChangeNotice(optional.change, record, optional.changeCurrent ?? null)
      change.availability = "AVAILABLE"; change.state = notice.state; change.runId = notice.currentRunId
      change.message = notice.presentation.messages.join(" ")
    } catch { change.availability = "INVALID"; change.message = "The associated change notice could not be validated against this decision and its current comparison inputs." }
  }
  return { version: "BUILD-001H/1" as const,
    availability: decision.availability === "AVAILABLE" && change.availability === "AVAILABLE" && core.missingSourceIds.length === 0 ? "READY" as const : "PARTIAL" as const,
    issue: null, core, decision, change }
}
export type ExecutiveProjection = ReturnType<typeof projectExecutiveSnapshot>
export type ExecutivePage = ExecutiveProjection | { version: "BUILD-001H/1"; availability: "BLOCKED"; issue: string; core: null; decision: null; change: null }
export function blockedExecutive(issue = "The selected frozen interpretation and its current evidence could not be validated together. The executive projection is blocked; inspect the available detailed evidence below."): ExecutivePage {
  return { version: "BUILD-001H/1", availability: "BLOCKED", issue, core: null, decision: null, change: null }
}
/** A projection check, not a new evidence validator or persistent artifact format. */
export function validateExecutiveProjection(input: unknown, snapshot: Uint8Array, identity: BriefIdentity, current: SnapshotBytes, optional: ExecutiveOptional = {}) {
  const rebuilt = projectExecutiveSnapshot(snapshot, identity, current, optional)
  if (JSON.stringify(input) !== JSON.stringify(rebuilt)) throw new Error("Executive presentation contains unsupported or altered evidence/authority fields")
  return rebuilt
}
