// SYNTHETIC TEST FIXTURE — no real citizen testimony, person or policy decision. No model calls.
import { sha256 } from "./policy-evidence"
import { projectDecisionBrief } from "./policy-evidence-brief"
import { createDecisionRecord } from "./policy-evidence-decision"
import { decisionFixture } from "./policy-evidence-decision.test-support"
import { composeSnapshot, inputBindings, type SnapshotBytes } from "./policy-evidence-snapshot"
import { SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"
import { availableCurrentEvidence } from "./policy-evidence-change"

export function changeFixture(optionalAbsent = false, findings = true) {
  const f = decisionFixture(findings ? "findings" : "zero", "HOLD_DISSONANCE")
  const bytes: SnapshotBytes = { ...f.bytes, reviews: optionalAbsent ? null : f.bytes.reviews, dissent: optionalAbsent ? null : f.bytes.dissent }
  const snapshot = composeSnapshot(bytes, { ...f.request, expectedBindings: inputBindings(bytes) }, SNAPSHOT_TEST_TIME)
  const snapshotBytes = Buffer.from(JSON.stringify(snapshot, null, 2))
  const identity = { ...f.identity, sha256: sha256(snapshotBytes) }, brief = projectDecisionBrief(snapshotBytes, identity)
  const request = { ...f.decisionRequest, selection: { ...f.decisionRequest.selection, snapshotSha256: identity.sha256,
    briefSha256: sha256(JSON.stringify(brief)), bindings: inputBindings(bytes) } }
  const record = createDecisionRecord(snapshotBytes, request, { runId: request.selection.runId, bindings: inputBindings(bytes) }, SNAPSHOT_TEST_TIME)
  return { ...f, bytes, snapshot, snapshotBytes, record, current: availableCurrentEvidence(record.runId, bytes) }
}
