"use server"

import { headers } from "next/headers"
import { decisionRequestSchema } from "@/lib/gaia/policy-evidence-decision"
import { saveDecision, type DecisionActionResult } from "@/lib/gaia/policy-evidence-decision-store"

export async function saveDecisionAction(input: unknown): Promise<DecisionActionResult> {
  const host = (await headers()).get("host") ?? ""
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return { ok: false, message: "Decision recording is available only through the local application." }
  try { return { ok: true, saved: saveDecision(process.cwd(), decisionRequestSchema.parse(input)) } } catch {
    return { ok: false, message: "Decision recording could not be confirmed. Required human fields may be missing, evidence may be invalid or changed, or this decision ID may already exist. Your draft is retained. Reload to inspect saved records before retrying. No upstream artifact or existing decision record was overwritten." }
  }
}
