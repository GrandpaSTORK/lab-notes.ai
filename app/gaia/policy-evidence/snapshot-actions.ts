"use server"

import { headers } from "next/headers"
import { snapshotRequestSchema } from "@/lib/gaia/policy-evidence-snapshot"
import { saveSnapshot, type SnapshotActionResult } from "@/lib/gaia/policy-evidence-snapshot-store"
import { hostedDemoMode } from "@/lib/gaia/policy-evidence-hosted-mode"

export async function createSnapshotAction(input: unknown): Promise<SnapshotActionResult> {
  if (hostedDemoMode()) return { ok: false, message: "Hosted demonstration — read-only. Snapshot creation is disabled." }
  const host = (await headers()).get("host") ?? ""
  if (!/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(host)) return { ok: false, message: "Snapshot creation is available only through the local application." }
  try { return { ok: true, saved: saveSnapshot(process.cwd(), snapshotRequestSchema.parse(input)) } } catch {
    return { ok: false, message: "Snapshot creation could not be confirmed. Inputs may be invalid or changed, or a snapshot may already exist. Reload to inspect the saved artifacts before retrying. No upstream artifact was repaired or overwritten." }
  }
}
