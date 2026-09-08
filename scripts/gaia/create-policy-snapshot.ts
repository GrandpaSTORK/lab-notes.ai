import { readFileSync } from "node:fs"
import { inputBindings, validateSnapshot } from "../../lib/gaia/policy-evidence-snapshot"
import { readSnapshotInputs, saveSnapshot } from "../../lib/gaia/policy-evidence-snapshot-store"

try {
  const [runId, candidateId] = process.argv.slice(2)
  if (process.argv.length !== 4) throw new Error("Usage: npm.cmd run gaia:snapshot -- <run-id> <candidate-id>, or --verify <snapshot.json>")
  if (runId === "--verify") {
    const snapshot = validateSnapshot(JSON.parse(readFileSync(candidateId, "utf8")))
    console.log(`Portable snapshot revalidated: ${snapshot.runId}/${snapshot.candidateId}. Embedded evidence traceability only; current disk state and semantic correctness are not asserted.`)
  } else {
    const bytes = readSnapshotInputs(process.cwd(), runId)
    const saved = saveSnapshot(process.cwd(), { runId, candidateId, expectedBindings: inputBindings(bytes) })
    console.log(`Snapshot created: ${saved.path}`)
    console.log(`Disposition: ${saved.snapshot.humanReview.disposition ?? "No human disposition recorded"}; challenge: ${saved.snapshot.unseenDissent.state}. No model was invoked.`)
  }
} catch (error) { console.error(String(error)); process.exitCode = 1 }
