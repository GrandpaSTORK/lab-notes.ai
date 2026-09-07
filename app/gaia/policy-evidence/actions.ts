"use server"

import { headers } from "next/headers"
import { ZodError } from "zod"

import { saveLocalReview } from "@/lib/gaia/policy-evidence-review-store"
import type { ReviewActionResult } from "@/lib/gaia/policy-evidence-review"

export async function saveReviewAction(request: unknown): Promise<ReviewActionResult> {
  const host = (await headers()).get("host") ?? ""
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) {
    return { ok: false, message: "Human review is available only through the local application." }
  }
  try {
    return { ok: true, presentation: saveLocalReview(process.cwd(), request) }
  } catch (error) {
    if (error instanceof ZodError) return { ok: false, message: "Choose a disposition and provide a non-blank rationale. REVISE also requires separate wording. Review text must be at most 20,000 characters." }
    const message = error instanceof Error ? error.message : ""
    if (/^(The proof changed|Review history changed|Stored reviews belong|Review history does not match|Review history revision|Unknown candidate|No valid proof)/.test(message)) {
      return { ok: false, message }
    }
    return { ok: false, message: "Review could not be saved. No success is claimed. Check the local proof and review files, then reload; your draft remains here." }
  }
}
