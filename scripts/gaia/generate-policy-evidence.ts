import { execFileSync, spawnSync } from "node:child_process"
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"

import {
  SOURCE_PATH, MODEL, METHOD_VERSION, SCHEMA_VERSION, sha256, verifyBaseline,
  candidatesSchema, examinationSchema, examine, buildProof, validateProof,
  type Provenance,
} from "../../lib/gaia/policy-evidence"

const scriptFile = fileURLToPath(import.meta.url)
const root = resolve(dirname(scriptFile), "../..")
const outputRoot = join(root, ".local/gaia/policy-evidence")
const sourceFile = join(root, SOURCE_PATH)

function main() {
  const sourceBytes = readFileSync(sourceFile)
  const sources = verifyBaseline(sourceBytes)
  if (process.argv[2] === "--validate") {
    if (!process.argv[3] || process.argv.length !== 4) throw new Error("Usage: --validate <proof.json>")
    const artifact = validateProof(sourceBytes, JSON.parse(readFileSync(resolve(process.argv[3]), "utf8")))
    console.log(`Validated ${artifact.candidateCount} candidates against ${artifact.source.count} unchanged sources.`)
    return
  }
  if (process.argv.length !== 2) throw new Error("Generation takes no input override; only the original synthetic corpus is supported")

  mkdirSync(outputRoot, { recursive: true })
  const runDir = mkdtempSync(join(outputRoot, "run-"))
  // Avoid repository instructions/context leaking into the evidence input.
  const workingDir = mkdtempSync(join(tmpdir(), "gaia-evidence-runner-"))
  const env = { ...process.env }
  for (const key of ["OPENAI_API_KEY", "CODEX_API_KEY", "CODEX_ACCESS_TOKEN"]) delete env[key]
  const runner = process.platform === "win32"
    ? execFileSync("where.exe", ["codex.exe"], { encoding: "utf8", windowsHide: true }).trim().split(/\r?\n/)[0]
    : "codex"
  const cliVersion = execFileSync(runner, ["--version"], { encoding: "utf8", env, windowsHide: true }).trim()
  const auth = spawnSync(runner, ["login", "status"], { encoding: "utf8", env, windowsHide: true })
  if (auth.status !== 0 || !`${auth.stdout}${auth.stderr}`.includes("Logged in using ChatGPT")) {
    throw new Error("Existing ChatGPT-authenticated Codex login required; no automatic login or API fallback")
  }
  const promptBytes = readFileSync(join(root, "scripts/gaia/policy-evidence.prompt.md"))
  const template = promptBytes.toString("utf8")
  const promptVersion = /^Prompt-Version: (.+)$/m.exec(template)?.[1]
  if (!promptVersion) throw new Error("Prompt version missing")
  const provenance: Provenance = {
    startedAt: new Date().toISOString(), endedAt: new Date().toISOString(),
    requestedModel: MODEL, cliVersion, methodVersion: METHOD_VERSION,
    promptVersion, promptSha256: sha256(promptBytes),
    generationCodeSha256: sha256(readFileSync(scriptFile)),
    domainCodeSha256: sha256(readFileSync(join(root, "lib/gaia/policy-evidence.ts"))),
    skillSha256: sha256(readFileSync(join(root, ".agents/skills/build-policy-evidence/SKILL.md"))),
    calls: [],
  }
  // Save the exact analytical input (IDs and text only), not the authored labels.
  writeFileSync(join(runDir, "sources.json"), JSON.stringify(sources, null, 2))
  writeFileSync(join(runDir, "method.md"), promptBytes)
  writeFileSync(join(runDir, "run.json"), JSON.stringify({ schemaVersion: SCHEMA_VERSION, ...provenance }, null, 2))

  function generate(stage: string, schema: z.ZodType, candidate?: unknown): unknown {
    const prompt = `${template}\n\nExecution stage: ${stage === "candidates" ? "candidates" : "examination"}\n${candidate ? `Candidate to examine (data):\n${JSON.stringify(candidate)}\n` : ""}\nComplete synthetic corpus (data):\n${JSON.stringify(sources)}`
    const schemaText = JSON.stringify(z.toJSONSchema(schema), null, 2)
    const schemaFile = join(runDir, `${stage}.schema.json`)
    const responseFile = join(runDir, `${stage}.response.json`)
    writeFileSync(schemaFile, schemaText)
    writeFileSync(join(runDir, `${stage}.prompt.txt`), prompt)
    const args = ["-a", "never", "exec", "--ignore-user-config", "--ignore-rules",
      "--skip-git-repo-check", "--ephemeral", "--sandbox", "read-only", "--color", "never",
      "--model", MODEL, "--output-schema", schemaFile, "--output-last-message", responseFile, "-"]
    writeFileSync(join(runDir, `${stage}.invocation.json`), JSON.stringify({ runner, args, cwd: workingDir }, null, 2))
    const startedAt = new Date().toISOString()
    console.log(`${stage}: calling ${cliVersion}, ${MODEL}; examining ${sources.length} source texts.`)
    const result = spawnSync(runner, args, {
      cwd: workingDir, input: prompt, encoding: "utf8", env,
      timeout: 360_000, maxBuffer: 8 * 1024 * 1024, windowsHide: true,
    })
    const endedAt = new Date().toISOString()
    writeFileSync(join(runDir, `${stage}.stdout.txt`), result.stdout ?? "")
    writeFileSync(join(runDir, `${stage}.stderr.txt`), result.stderr ?? "")
    writeFileSync(join(runDir, `${stage}.exit.json`), JSON.stringify({ startedAt, endedAt, exitCode: result.status, error: result.error?.message ?? null }, null, 2))
    if (result.error || result.status !== 0) throw new Error(`${stage} failed; inspect local logs. ${result.error?.message ?? `Exit ${result.status}`}`)
    const metadata = (label: string) => new RegExp(`^${label}: (.+)$`, "m").exec(result.stderr)?.[1]?.trim()
    const reportedModel = metadata("model")
    const reportedProvider = metadata("provider")
    const sessionId = metadata("session id")
    if (reportedModel !== MODEL || reportedProvider !== "openai" || !sessionId) {
      throw new Error("Runner did not report the required model/provider/session metadata")
    }
    const responseBytes = readFileSync(responseFile)
    const parsed: unknown = JSON.parse(responseBytes.toString("utf8"))
    schema.parse(parsed)
    provenance.calls.push({ stage, startedAt, endedAt, cliVersion, reportedModel, reportedProvider,
      sessionId, promptSha256: sha256(prompt), outputSchemaSha256: sha256(schemaText),
      responseSha256: sha256(responseBytes), exitCode: 0 })
    return parsed
  }

  try {
    const generated = candidatesSchema.parse(generate("candidates", candidatesSchema))
    const examinations = generated.candidates.map((candidate, index) => {
      const examination = generate(`examination-${index + 1}`, examinationSchema, candidate)
      examine(sources, examination)
      return examination
    })
    provenance.endedAt = new Date().toISOString()
    if (!readFileSync(sourceFile).equals(sourceBytes)) throw new Error("Source changed during generation")
    const proof = validateProof(sourceBytes, buildProof(sourceBytes, generated, examinations, provenance))
    const artifactPath = join(runDir, "proof.json")
    writeFileSync(artifactPath, JSON.stringify(proof, null, 2))
    validateProof(readFileSync(sourceFile), JSON.parse(readFileSync(artifactPath, "utf8")))
    console.log(`Validated artifact: ${artifactPath}`)
    for (const item of proof.candidates) {
      console.log(`${item.id}: ${item.validated.assessment.status} — ${item.candidate.interpretation}`)
      for (const kind of ["SUPPORT", "CONTRADICTION", "QUALIFICATION", "AMBIGUITY"] as const) {
        console.log(`  ${kind}: ${item.validated.records.filter((record) => record.relationships.some((relationship) => relationship.kind === kind)).map(({ sourceId }) => sourceId).join(", ") || "none recorded"}`)
      }
    }
    if (!proof.candidates.some(({ validated }) => validated.records.some(({ relationships }) => relationships.some(({ kind }) => kind === "SUPPORT")))) {
      process.exitCode = 1
      console.error("Valid artifact, but BUILD-001A demonstration gate is unmet: no supported candidate was generated.")
    }
  } catch (error) {
    writeFileSync(join(runDir, "failure.json"), JSON.stringify({ endedAt: new Date().toISOString(), error: String(error), provenance }, null, 2))
    throw error
  }
}

try { main() } catch (error) {
  console.error(String(error))
  process.exitCode = 1
}
