// SYNTHETIC TEST FIXTURE — NOT REAL CITIZEN TESTIMONY OR A REAL HUMAN POLICY DECISION.
import { sha256 } from "./policy-evidence"
import { projectDecisionBrief } from "./policy-evidence-brief"
import { composeSnapshot, inputBindings } from "./policy-evidence-snapshot"
import { snapshotFixture, SNAPSHOT_TEST_TIME } from "./policy-evidence-snapshot.test-support"
import type { DecisionRequest } from "./policy-evidence-decision"
import type { Disposition } from "./policy-evidence-review"

export function decisionFixture(state: "findings" | "zero" | "absent" = "findings", disposition: Disposition = "CONFIRM") {
  const fixture = snapshotFixture(disposition, state === "findings")
  if (state === "absent") fixture.bytes.dissent = null
  const current = { runId: fixture.request.runId, bindings: inputBindings(fixture.bytes) }
  const snapshot = composeSnapshot(fixture.bytes, { ...fixture.request, expectedBindings: current.bindings }, SNAPSHOT_TEST_TIME)
  const snapshotBytes = Buffer.from(JSON.stringify(snapshot, null, 2))
  const identity = { runId: snapshot.runId, candidateId: snapshot.candidateId,
    name: `trust-evidence-${snapshot.candidateId}-20260908120000000.json`, sha256: sha256(snapshotBytes) }
  const brief = projectDecisionBrief(snapshotBytes, identity)
  const request: DecisionRequest = { decisionId: "10000000-0000-4000-8000-000000000001",
    selection: { runId: identity.runId, candidateId: identity.candidateId, snapshotName: identity.name,
      snapshotSha256: identity.sha256, briefSha256: sha256(JSON.stringify(brief)), bindings: current.bindings },
    decisionText: "  SYNTHETIC TEST DECISION: defer this fictional step.\nRetain unresolved evidence.  ",
    rationale: "  SYNTHETIC TEST RATIONALE: this demonstration records a choice,\nnot semantic correctness.  ",
    decisionMaker: "SYNTHETIC TEST MAKER 01", role: "SYNTHETIC TEST ROLE", decisionAuthority: "SYNTHETIC TEST AUTHORITY — no real-world authority",
    unresolvedAcknowledged: true, demonstration: "SYNTHETIC_TEST_DATA" }
  return { ...fixture, snapshot, snapshotBytes, current, identity, brief, decisionRequest: request }
}
