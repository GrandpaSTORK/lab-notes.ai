import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { decisionIdSchema, validateDecisionRecord } from "./policy-evidence-decision"
import { runIdSchema } from "./policy-evidence-snapshot"
import { compareDecisionEvidence, type CurrentEvidence, type DecisionChangeNotice, type EvidenceRead } from "./policy-evidence-change"

const runsPath = ".local/gaia/policy-evidence"
export type DecisionChoice = { runId: string; decisionId: string }
export type ChangePage = { notice: DecisionChangeNotice | null; issue: string | null; warnings: string[]; choices: DecisionChoice[];
  recordPath: string | null; recordSha256: string | null; recordDownload: string | null; comparisonRunId: string | null }

/** Read precisely the named run; never fall back to an older valid proof when these bytes are invalid. */
export function readCurrentDecisionEvidence(root: string, runIdInput: string): CurrentEvidence {
  const runId = runIdSchema.parse(runIdInput)
  const read = (path: string, optional = false): EvidenceRead => {
    try { return { state: "PRESENT", bytes: readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, path)) } } catch (error) {
      return { state: optional && (error as NodeJS.ErrnoException).code === "ENOENT" ? "ABSENT" : "UNAVAILABLE" }
    }
  }
  const dir = `${runsPath}/${runId}`
  return { runId, inputs: { source: read(SOURCE_PATH), proof: read(`${dir}/proof.json`),
    reviews: read(`${dir}/reviews.json`, true), dissent: read(`${dir}/dissent.json`, true) } }
}
function readIdentity(current: CurrentEvidence) {
  return JSON.stringify(Object.entries(current.inputs).map(([key, value]) => [key, value.state, value.state === "PRESENT" ? sha256(value.bytes) : null]))
}

/** Historical discovery is independent of the current A/B/C proof gate and never writes an artifact. */
export function loadDecisionChangePage(root: string, requestedRun?: unknown, requestedDecision?: unknown, requestedCurrentRun?: unknown): ChangePage {
  const page: ChangePage = { notice: null, issue: null, warnings: [], choices: [], recordPath: null, recordSha256: null, recordDownload: null, comparisonRunId: null }
  try {
    for (const runId of readdirSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, runsPath)).filter((name) => runIdSchema.safeParse(name).success).sort()) {
      try {
        for (const name of readdirSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, runsPath, runId)).sort()) {
          if (!name.startsWith("human-decision-") || !name.endsWith(".json")) continue
          const id = decisionIdSchema.safeParse(name.slice("human-decision-".length, -5))
          if (id.success) page.choices.push({ runId, decisionId: id.data })
        }
      } catch { page.warnings.push(`${runId}: decision inventory could not be read.`) }
    }
  } catch { page.warnings.push("The local decision inventory could not be read. An explicit record may still be inspected.") }
  try {
    let choice = page.choices[0]
    if (requestedRun !== undefined || requestedDecision !== undefined) {
      choice = { runId: runIdSchema.parse(requestedRun), decisionId: decisionIdSchema.parse(requestedDecision) }
    }
    if (!choice) return { ...page, issue: "No saved Human Decision Record was selected. No comparison or decision was fabricated." }
    const path = `${runsPath}/${choice.runId}/human-decision-${choice.decisionId}.json`
    const file = join(/* turbopackIgnore: true */ root, path)
    const recordBytes = readFileSync(/* turbopackIgnore: true */ file), digest = sha256(recordBytes)
    const record = validateDecisionRecord(JSON.parse(recordBytes.toString("utf8")))
    if (record.runId !== choice.runId || record.decisionId !== choice.decisionId) throw new Error("Historical record selection mismatch")
    // Default scope is explicit: current files in the decision's original run. Another run must be named.
    const comparisonRunId = runIdSchema.parse(requestedCurrentRun ?? record.runId)
    const current = readCurrentDecisionEvidence(root, comparisonRunId)
    let notice = compareDecisionEvidence(record, current)
    if (readIdentity(readCurrentDecisionEvidence(root, comparisonRunId)) !== readIdentity(current)) {
      notice = compareDecisionEvidence(record, null)
      page.warnings.push("Current evidence changed during the read. No current agreement claim is made; reload to check again.")
    }
    if (sha256(readFileSync(/* turbopackIgnore: true */ file)) !== digest) throw new Error("Historical record changed while reading")
    return { ...page, notice, recordPath: path, recordSha256: digest, recordDownload: `data:application/json;base64,${recordBytes.toString("base64")}`, comparisonRunId }
  } catch {
    return { ...page, issue: "Comparison blocked: the selected Human Decision Record, its embedded frozen evidence, or requested selection could not be validated. No current evidence was substituted and no artifact was repaired." }
  }
}
