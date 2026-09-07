import { execFileSync, spawnSync } from "node:child_process"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { z } from "zod"
import { MODEL, SOURCE_PATH, sha256 } from "../../lib/gaia/policy-evidence"
import { buildChallenge, buildDissent, challengePrompt, challengeResponseSchema, dissentContext, validateDissent } from "../../lib/gaia/policy-evidence-dissent"
import { blindDissentFixture, FIXTURE_LABEL } from "../../lib/gaia/policy-evidence-dissent.test-support"

function main() {
  const runId = process.argv[2]
  const fixtureMode = runId === "--fixture"
  if (!runId || (!fixtureMode && !/^run-[a-zA-Z0-9_-]+$/.test(runId)) || process.argv.length > 4 || (process.argv[3] && (fixtureMode || process.argv[3] !== "--validate"))) throw new Error("Usage: npm.cmd run gaia:dissent -- <run-id> [--validate], or --fixture")
  const root = process.cwd()
  const outputRoot = resolve(root, ".local/gaia/policy-evidence")
  mkdirSync(outputRoot, { recursive: true })
  const runDir = fixtureMode ? mkdtempSync(join(outputRoot, "fixture-")) : resolve(outputRoot, runId)
  const sourceBytes = readFileSync(join(root, SOURCE_PATH))
  const proofBytes = fixtureMode ? null : readFileSync(join(runDir, "proof.json"))
  const context = proofBytes ? dissentContext(sourceBytes, proofBytes) : blindDissentFixture()
  if (fixtureMode) writeFileSync(join(runDir, "fixture.json"), JSON.stringify({ disclosure: FIXTURE_LABEL, context }, null, 2))
  const output = join(runDir, "dissent.json")
  if (process.argv[3] === "--validate") {
    const artifact = validateDissent(context, JSON.parse(readFileSync(output, "utf8")))
    console.log(JSON.stringify(artifact.challenges.map(({ candidateId, findings }) => ({ candidateId, findings })), null, 2))
    return
  }
  if (existsSync(output)) throw new Error("Existing dissent.json preserved; generation refuses to overwrite it")
  const reviewPath = join(runDir, "reviews.json")
  const reviewBytes = existsSync(reviewPath) ? readFileSync(reviewPath) : null
  const diagnostics = mkdtempSync(join(runDir, "dissent-run-"))
  const workingDir = mkdtempSync(join(tmpdir(), "gaia-dissent-runner-"))
  const env = { ...process.env }
  for (const key of ["OPENAI_API_KEY", "CODEX_API_KEY", "CODEX_ACCESS_TOKEN"]) delete env[key]
  const runner = process.platform === "win32" ? execFileSync("where.exe", ["codex.exe"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/)[0] : "codex"
  const cliVersion = execFileSync(runner, ["--version"], { encoding: "utf8", env, windowsHide: true }).trim()
  const auth = spawnSync(runner, ["login", "status"], { encoding: "utf8", env, windowsHide: true })
  if (auth.status !== 0 || !`${auth.stdout}${auth.stderr}`.includes("Logged in using ChatGPT")) throw new Error("Existing ChatGPT-authenticated Codex login required; no API fallback")
  const challenges = context.candidates.map((candidate) => {
    const dir = join(diagnostics, candidate.id)
    mkdirSync(dir)
    const prompt = challengePrompt(context, candidate)
    const schemaText = JSON.stringify(z.toJSONSchema(challengeResponseSchema))
    const schemaFile = join(dir, "schema.json")
    const responseFile = join(dir, "response.json")
    writeFileSync(schemaFile, schemaText)
    writeFileSync(join(dir, "prompt.txt"), prompt)
    const args = ["-a", "never", "exec", "--ignore-user-config", "--ignore-rules", "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only", "--color", "never", "--model", MODEL, "--output-schema", schemaFile, "--output-last-message", responseFile, "-"]
    writeFileSync(join(dir, "invocation.json"), JSON.stringify({ args, cliVersion, runtimeVersion: process.version }))
    const startedAt = new Date().toISOString()
    console.log(`Challenging ${candidate.id} against all ${context.sources.length} source texts using ${MODEL}.`)
    const result = spawnSync(runner, args, { cwd: workingDir, input: prompt, encoding: "utf8", env, timeout: 360_000, maxBuffer: 8 * 1024 * 1024, windowsHide: true })
    const endedAt = new Date().toISOString()
    writeFileSync(join(dir, "stdout.txt"), result.stdout ?? "")
    writeFileSync(join(dir, "stderr.txt"), result.stderr ?? "")
    writeFileSync(join(dir, "exit.json"), JSON.stringify({ startedAt, endedAt, status: result.status, error: result.error?.message ?? null }))
    if (result.error || result.status !== 0) throw new Error("Challenge failed; local diagnostics retained, no dissent artifact published")
    const metadata = (label: string) => new RegExp(`^${label}: (.+)$`, "m").exec(result.stderr)?.[1]?.trim()
    const reportedModel = metadata("model"), provider = metadata("provider"), sessionId = metadata("session id")
    if (reportedModel !== MODEL || provider !== "openai" || !sessionId) throw new Error("Required model/provider/session metadata missing")
    const responseText = readFileSync(responseFile, "utf8")
    return buildChallenge(context, candidate.id, responseText, { requestedModel: MODEL, reportedModel, provider, sessionId,
      cliVersion, runtimeVersion: process.version, startedAt, endedAt, promptSha256: sha256(prompt), responseSha256: sha256(responseText), outputSchemaSha256: sha256(schemaText) })
  })
  if (!readFileSync(join(root, SOURCE_PATH)).equals(sourceBytes) || (proofBytes && !readFileSync(join(runDir, "proof.json")).equals(proofBytes)) ||
      (reviewBytes ? !existsSync(reviewPath) || !readFileSync(reviewPath).equals(reviewBytes) : existsSync(reviewPath))) throw new Error("Source, proof or reviews changed during challenge; no artifact published")
  const artifact = validateDissent(context, buildDissent(context, challenges))
  writeFileSync(output, JSON.stringify(artifact, null, 2), { flag: "wx" })
  console.log(`Validated separate dissent.json: ${artifact.challenges.reduce((sum, item) => sum + item.findings.length, 0)} potential items. Semantic bearing remains unverified.`)
  console.log(`Local output directory: ${runDir}`)
}
try { main() } catch (error) { console.error(String(error)); process.exitCode = 1 }
