import { afterEach, expect, it, vi } from "vitest"
import { HOSTED_READ_ONLY } from "./policy-evidence-hosted-mode"
import { saveDecisionAction } from "@/app/gaia/policy-evidence/decision-actions"
import { saveReviewAction } from "@/app/gaia/policy-evidence/actions"
import { createSnapshotAction } from "@/app/gaia/policy-evidence/snapshot-actions"
import { saveDecision } from "./policy-evidence-decision-store"
import { saveLocalReview } from "./policy-evidence-review-store"
import { saveSnapshot } from "./policy-evidence-snapshot-store"

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers({ host: "localhost:3000" })) }))
vi.mock("./policy-evidence-decision-store", () => ({ saveDecision: vi.fn() }))
vi.mock("./policy-evidence-review-store", () => ({ saveLocalReview: vi.fn() }))
vi.mock("./policy-evidence-snapshot-store", () => ({ saveSnapshot: vi.fn() }))
afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks() })
it.each(["VERCEL", "GAIA_HOSTED_DEMO"])("blocks every server write in %s mode even with a localhost Host header", async (name) => {
  vi.stubEnv("VERCEL", "0"); vi.stubEnv("GAIA_HOSTED_DEMO", "0"); vi.stubEnv(name, "1")
  expect(await saveDecisionAction({})).toEqual({ ok: false, message: HOSTED_READ_ONLY })
  expect(await saveReviewAction({})).toMatchObject({ ok: false })
  expect(await createSnapshotAction({})).toMatchObject({ ok: false })
  expect(saveDecision).not.toHaveBeenCalled()
  expect(saveLocalReview).not.toHaveBeenCalled()
  expect(saveSnapshot).not.toHaveBeenCalled()
})
