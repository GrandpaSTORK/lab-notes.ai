import { existsSync, readFileSync, readdirSync, renameSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { SOURCE_PATH, sha256, verifyBaseline } from "./policy-evidence"
import {
  emptyReviews, recordReview, reviewContext, reviewPresentation, validateReviews,
  type ReviewContext, type ReviewLedger,
} from "./policy-evidence-review"

export const RUNS_PATH = ".local/gaia/policy-evidence"

type LoadedProof = {
  context: ReviewContext
  runId: string
  question: string | null
  warnings: string[]
}

/** Only direct run directories are read; no user-controlled paths or proof writes. */
export function latestProof(root: string): LoadedProof | null {
  const sourceBytes = readFileSync(join(root, SOURCE_PATH))
  verifyBaseline(sourceBytes)
  const runRoot = join(root, RUNS_PATH)
  if (!existsSync(runRoot)) return null
  const valid: LoadedProof[] = []
  const warnings: string[] = []
  for (const entry of readdirSync(runRoot, { withFileTypes: true })) {
    if (!entry.isDirectory() || !/^run-[a-zA-Z0-9_-]+$/.test(entry.name)) continue
    const proofPath = join(runRoot, entry.name, "proof.json")
    if (!existsSync(proofPath)) continue
    try {
      const context = reviewContext(sourceBytes, readFileSync(proofPath))
      let question: string | null = null
      const methodPath = join(runRoot, entry.name, "method.md")
      if (existsSync(methodPath)) {
        const methodBytes = readFileSync(methodPath)
        if (sha256(methodBytes) === context.proof.provenance.promptSha256) {
          question = /exploration question\s+is:\s*([\s\S]*?)\s+The real consultation/i.exec(methodBytes.toString("utf8"))?.[1].replace(/\s+/g, " ") ?? null
        } else {
          warnings.push(`${entry.name}: method fingerprint did not match; its question was not loaded.`)
        }
      }
      valid.push({ context, runId: entry.name, question, warnings: [] })
    } catch {
      warnings.push(`${entry.name}: invalid proof skipped; no review was attached to it.`)
    }
  }
  // Generation timestamp defines newest; filesystem copying/touching does not select a run.
  valid.sort((a, b) => b.context.proof.provenance.endedAt.localeCompare(a.context.proof.provenance.endedAt) || b.runId.localeCompare(a.runId))
  if (!valid.length) {
    if (warnings.length) throw new Error("No valid BUILD-001A proof artifact was found. Invalid artifacts were not loaded.")
    return null
  }
  const selected = valid[0]
  if (valid.slice(1).some(({ runId }) => existsSync(join(runRoot, runId, "reviews.json")))) {
    warnings.push("Earlier runs have separate review histories. Those reviews have not been applied to this proof.")
  }
  return { ...selected, warnings }
}

function storedReviews(root: string, loaded: LoadedProof): ReviewLedger {
  const path = join(root, RUNS_PATH, loaded.runId, "reviews.json")
  return existsSync(path)
    ? validateReviews(loaded.context, JSON.parse(readFileSync(path, "utf8")))
    : emptyReviews(loaded.context)
}

export function loadReviewPage(root: string) {
  const loaded = latestProof(root)
  if (!loaded) return null
  let ledger = emptyReviews(loaded.context)
  let reviewError: string | null = null
  try { ledger = storedReviews(root, loaded) } catch {
    reviewError = "Stored review history is invalid or belongs to a different proof fingerprint. It has not been applied. Saving and export are disabled; preserve the file for inspection."
  }
  return {
    presentation: reviewPresentation(loaded.context, ledger, loaded.question),
    runId: loaded.runId,
    storagePath: `${RUNS_PATH}/${loaded.runId}/reviews.json`,
    warnings: loaded.warnings,
    reviewError,
  }
}

/** Synchronous read/validate/write bounds this to one local Node process; no production concurrency claim. */
export function saveLocalReview(root: string, request: unknown, timestamp = new Date().toISOString()) {
  const loaded = latestProof(root)
  if (!loaded) throw new Error("No valid proof is available. Generate a proof before reviewing.")
  const ledger = recordReview(loaded.context, storedReviews(root, loaded), request, timestamp)
  const runDir = join(root, RUNS_PATH, loaded.runId)
  // Recheck proof and source immediately before writing the separate review artifact.
  if (sha256(readFileSync(join(runDir, "proof.json"))) !== loaded.context.proofSha256) throw new Error("The proof changed. Reload before saving.")
  verifyBaseline(readFileSync(join(root, SOURCE_PATH)))
  const temporary = join(runDir, `reviews-${randomUUID()}.tmp`)
  writeFileSync(temporary, JSON.stringify(ledger, null, 2), { flag: "wx" })
  renameSync(temporary, join(runDir, "reviews.json"))
  return reviewPresentation(loaded.context, storedReviews(root, loaded), loaded.question)
}
