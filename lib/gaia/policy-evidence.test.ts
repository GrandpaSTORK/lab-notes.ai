import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
  BASELINE_SHA256, SOURCE_PATH, MODEL, METHOD_VERSION, SOURCE_IDS,
  sha256, parseSources, verifyBaseline, candidatesSchema, examine, buildProof, validateProof,
  type Provenance,
} from "./policy-evidence"

const bytes = readFileSync(SOURCE_PATH)
const sources = verifyBaseline(bytes)

// Test-only relationships exercise invariants; production candidates come only from Codex.
function evidence(kind: "SUPPORT" | "CONTRADICTION" | "QUALIFICATION" | "AMBIGUITY" | "NO_RELEVANT_BEARING" = "NO_RELEVANT_BEARING", index = 0) {
  return {
    records: sources.map((source, position) => ({
      sourceId: source.id,
      relationships: [{
        kind: position === index ? kind : "NO_RELEVANT_BEARING",
        quote: position === index && kind !== "NO_RELEVANT_BEARING" ? source.text : null,
        explanation: "Test relationship, not a generated analytical finding.",
      }],
    })),
    limitations: ["Synthetic test data."],
  }
}

describe("GAIA source and evidence integrity", () => {
  it("pins unchanged Hypership source bytes and excludes theme/stance from input", () => {
    const before = Buffer.from(bytes)
    expect(sha256(bytes)).toBe(BASELINE_SHA256)
    expect(sources.map(({ id }) => id)).toEqual(SOURCE_IDS)
    expect(sources.every((source) => Object.keys(source).join(",") === "id,text")).toBe(true)
    examine(sources, evidence("SUPPORT"))
    expect(bytes.equals(before)).toBe(true)
    expect(readFileSync(SOURCE_PATH).equals(before)).toBe(true)
    expect(() => verifyBaseline(Buffer.concat([bytes, Buffer.from("\n")]))).toThrow("bytes changed")
  })

  it.each(["duplicate", "missing", "invented"])("rejects %s source IDs", (mutation) => {
    const corpus = JSON.parse(bytes.toString("utf8"))
    if (mutation === "duplicate") corpus.records[1].id = corpus.records[0].id
    if (mutation === "missing") corpus.records.pop()
    if (mutation === "invented") corpus.records[0].id = "SYN-9999"
    expect(() => parseSources(Buffer.from(JSON.stringify(corpus)))).toThrow("Source IDs")
  })

  it.each(["duplicate", "missing", "invented"])("rejects %s examination coverage", (mutation) => {
    const input = evidence()
    if (mutation === "duplicate") input.records[1].sourceId = input.records[0].sourceId
    if (mutation === "missing") input.records.pop()
    if (mutation === "invented") input.records[0].sourceId = "SYN-9999"
    expect(() => examine(sources, input)).toThrow("every source ID exactly once")
  })

  it("rejects fabricated or changed quotations rather than repairing them", () => {
    const input = evidence("SUPPORT")
    input.records[0].relationships[0].quote = "An invented quotation."
    expect(() => examine(sources, input)).toThrow("Quote must match")
  })

  it("rejects missing substantive quotes and malformed relationships", () => {
    const input = evidence("SUPPORT")
    input.records[0].relationships[0].quote = null
    expect(() => examine(sources, input)).toThrow("requires a quote")
    expect(() => examine(sources, { ...input, assessment: "SUPPORTED" })).toThrow()
  })

  it("rejects ambiguous quote locations and mixed no-bearing relationships", () => {
    const input = evidence("SUPPORT")
    const repeated = sources.map((source) => ({ ...source, text: `${source.text} ${source.text}` }))
    expect(() => examine(repeated, input)).toThrow("exactly one passage")
    input.records[1].relationships.push(input.records[0].relationships[0])
    expect(() => examine(sources, input)).toThrow("stand alone")
  })

  it("derives verified UTF-16 offsets and complete coverage", () => {
    const output = examine(sources, evidence("SUPPORT"))
    const passage = output.records[0].relationships[0]
    expect(sources[0].text.slice(passage.start!, passage.end!)).toBe(passage.quote)
    expect(output.coverage).toEqual({ expected: 20, examined: 20, allSourcesExamined: true })
  })

  it("accepts zero to three candidates but rejects more or AI-declared status", () => {
    const candidate = { interpretation: "Test", relevance: "Test", limitations: ["Test"] }
    expect(candidatesSchema.parse({ candidates: [] }).candidates).toHaveLength(0)
    expect(() => candidatesSchema.parse({ candidates: Array(4).fill(candidate) })).toThrow()
    expect(() => candidatesSchema.parse({ candidates: [{ ...candidate, status: "SUPPORTED" }] })).toThrow()
  })
})

describe("GAIA deterministic assessment", () => {
  it("produces the same supported result independently of examination order", () => {
    const input = evidence("SUPPORT")
    const before = JSON.stringify(input)
    expect(examine(sources, input).assessment.status).toBe("SUPPORTED")
    expect(examine(sources, input).assessment).toEqual(examine(sources, { ...input, records: [...input.records].reverse() }).assessment)
    expect(JSON.stringify(input)).toBe(before)
  })

  it.each(["CONTRADICTION", "QUALIFICATION"] as const)("one material %s produces CONTESTED", (kind) => {
    const input = evidence("SUPPORT")
    input.records[1] = evidence(kind, 1).records[1]
    expect(examine(sources, input).assessment.status).toBe("CONTESTED")
  })

  it("unresolved ambiguity with support produces INSUFFICIENT", () => {
    const input = evidence("SUPPORT")
    input.records[1] = evidence("AMBIGUITY", 1).records[1]
    expect(examine(sources, input).assessment.status).toBe("INSUFFICIENT")
    input.records[2] = evidence("QUALIFICATION", 2).records[2]
    expect(examine(sources, input).assessment.status).toBe("CONTESTED")
  })

  it("no support produces INSUFFICIENT even when counter-evidence exists", () => {
    expect(examine(sources, evidence()).assessment.status).toBe("INSUFFICIENT")
    expect(examine(sources, evidence("CONTRADICTION")).assessment.status).toBe("INSUFFICIENT")
  })

  it("revalidates exported assessment, source digest, coverage and generation provenance", () => {
    const stamp = "2026-09-07T00:00:00.000Z"
    const provenance: Provenance = {
      startedAt: stamp, endedAt: stamp, requestedModel: MODEL, cliVersion: "test-only",
      methodVersion: METHOD_VERSION, promptVersion: "test-only", promptSha256: BASELINE_SHA256,
      generationCodeSha256: BASELINE_SHA256, domainCodeSha256: BASELINE_SHA256, skillSha256: BASELINE_SHA256,
      calls: ["candidates", "examination-1"].map((stage) => ({
        stage, startedAt: stamp, endedAt: stamp, cliVersion: "test-only", reportedModel: MODEL,
        reportedProvider: "openai", sessionId: "test-only", promptSha256: BASELINE_SHA256,
        outputSchemaSha256: BASELINE_SHA256, responseSha256: BASELINE_SHA256, exitCode: 0,
      })),
    }
    const proof = buildProof(bytes, { candidates: [{ interpretation: "Test only", relevance: "Test only", limitations: ["Test only"] }] }, [evidence("SUPPORT")], provenance)
    expect(validateProof(bytes, JSON.parse(JSON.stringify(proof)))).toEqual(proof)
    for (const change of [
      (copy: typeof proof) => { copy.candidates[0].validated.assessment.status = "CONTESTED" },
      (copy: typeof proof) => { copy.source.sha256 = "0".repeat(64) },
      (copy: typeof proof) => { copy.candidates[0].validated.coverage.examined = 19 },
      (copy: typeof proof) => { copy.provenance.calls.pop() },
    ]) {
      const copy = structuredClone(proof)
      change(copy)
      expect(() => validateProof(bytes, copy)).toThrow()
    }
    expect(readFileSync(SOURCE_PATH).equals(bytes)).toBe(true)
  })
})
