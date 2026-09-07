import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { SOURCE_PATH } from "./policy-evidence"
import { dissentContext, validateDissent, type Dissent } from "./policy-evidence-dissent"

export function loadDissent(root: string, runId: string, expectedProofSha256?: string): { artifact: Dissent | null; issue: string | null } {
  if (!/^run-[a-zA-Z0-9_-]+$/.test(runId)) throw new Error("Invalid run ID")
  const dir = join(root, ".local/gaia/policy-evidence", runId)
  if (!existsSync(join(dir, "dissent.json"))) return { artifact: null, issue: null }
  try {
    const context = dissentContext(readFileSync(join(root, SOURCE_PATH)), readFileSync(join(dir, "proof.json")))
    if (expectedProofSha256 && context.proofSha256 !== expectedProofSha256) throw new Error("Selected review proof changed before challenge loading")
    return { artifact: validateDissent(context, JSON.parse(readFileSync(join(dir, "dissent.json"), "utf8"))), issue: null }
  } catch {
    return { artifact: null, issue: "The stored challenge failed validation. No challenge findings were applied. Preserve dissent.json for inspection; this is not a zero-finding result." }
  }
}
