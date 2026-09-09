import { readFileSync } from "node:fs"
import { join } from "node:path"
import { sha256, SOURCE_PATH } from "./policy-evidence"
import { hostedDemoMode } from "./policy-evidence-hosted-mode"

export const DEMO_ROOT = "content/demo/policy-evidence"
export const DEMO_RUN = ".local/gaia/policy-evidence/run-NSHiGl"
/** Exact release identities, not new evidence or a semantic validation substitute. */
export const DEMO_FILES = [
  [SOURCE_PATH, "4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b"],
  [`${DEMO_RUN}/proof.json`, "e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e"],
  [`${DEMO_RUN}/reviews.json`, "3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8"],
  [`${DEMO_RUN}/dissent.json`, "456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015"],
  [`${DEMO_RUN}/trust-evidence-CAND-002-20260908163747161.json`, "a60b252f387d3c140f588bdbbbe35338cc272904f04e7b62167561c3366a88cf"],
  [`${DEMO_RUN}/human-decision-a41cb8d3-6c37-4eec-be5c-4b330c764de2.json`, "6215c631eddd52f202abff315ecfc398ae99ff3425b7e41a82bb7c1a0040fe20"],
] as const

/** Mirrored logical paths allow every sealed loader/validator to remain unchanged. */
export function evidenceLocation(root: string, env: Parameters<typeof hostedDemoMode>[0] = process.env) {
  const hosted = hostedDemoMode(env)
  return { hosted, root: hosted ? join(root, DEMO_ROOT) : root }
}

export function assertDemoPackage(root: string) {
  for (const [relative, expected] of DEMO_FILES) {
    const bytes = readFileSync(/* turbopackIgnore: true */ join(/* turbopackIgnore: true */ root, relative))
    if (sha256(bytes) !== expected) throw new Error("Packaged demonstration identity mismatch")
  }
}
