// SYNTHETIC TEST FIXTURE — no real citizen testimony, human identity or policy decision. No model calls.
import { decisionFixture } from "./policy-evidence-decision.test-support"
import { createDecisionRecord } from "./policy-evidence-decision"
import { availableCurrentEvidence, compareDecisionEvidence } from "./policy-evidence-change"
import { SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"

export function executiveFixture(state: "findings" | "zero" | "absent" = "findings") {
  const f = decisionFixture(state)
  const record = createDecisionRecord(f.snapshotBytes, f.decisionRequest, f.current, SNAPSHOT_TEST_TIME)
  const changeCurrent = availableCurrentEvidence(f.snapshot.runId, f.bytes)
  const optional = { decision: record, change: compareDecisionEvidence(record, changeCurrent), changeCurrent }
  return { ...f, record, optional }
}
