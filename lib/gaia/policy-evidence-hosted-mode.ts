export const HOSTED_READ_ONLY = "Hosted demonstration — read-only. Decision recording is disabled."

/** Server environment selects deployment mode; never a request header or query. */
export function hostedDemoMode(env: Record<string, string | undefined> = process.env) {
  return env.VERCEL === "1" || env.GAIA_HOSTED_DEMO === "1"
}
