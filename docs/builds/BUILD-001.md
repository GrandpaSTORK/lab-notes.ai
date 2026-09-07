# BUILD-001A: Policy Evidence evidence spine

GAIA extends Hypership's lab-notes.ai and build-policy-evidence foundation.
The original skill, published-source register, synthetic dataset, attribution,
and licence remain unchanged. This phase adds generation, passage validation,
coverage validation and deterministic assessment only. No review UI is included.

## Run

Prerequisite: the installed Codex CLI authenticated through ChatGPT (RUNNER-001
tested version 0.153.4). The CLI invokes OpenAI-hosted inference; this is not
offline processing. No separately supplied API key or alternative provider is
used. The runner explicitly requests `gpt-6-astra`, ignores user configuration
and execution rules, uses a read-only sandbox, and never prompts for approval.
An outer restricted agent sandbox may require permission to launch the process.

```powershell
npm run gaia:generate
npm run gaia:generate -- --validate .local/gaia/policy-evidence/run-<id>/proof.json
npm run test -- lib/gaia/policy-evidence.test.ts
```

Each run creates a separate ignored directory beneath
`.local/gaia/policy-evidence/`. It retains prompts, schemas, raw responses,
stdout/stderr, invocation metadata and execution results. It writes `proof.json`
only after every candidate's evidence passes validation. Failure is explicit;
there is no automatic repair or provider fallback. Failed runs retain diagnostics.
A valid zero-candidate artifact is allowed, but generation exits unsuccessfully
if no candidate has supporting testimony: the demonstration gate remains unmet.

The source bytes are pinned to SHA-256
`4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b`.
Generation requires the original 20 unique IDs. Only IDs and text reach the model;
the original theme/stance labels are excluded. Neither this command nor the
domain functions writes the original corpus. Source integrity is checked again
before writing the proof and on subsequent validation.

## Method and interpretation

One schema-constrained Codex call generates zero to three unranked candidates.
Each candidate then receives a separate exhaustive examination call containing
all source texts. Every source must occur exactly once in the examination.
Substantive relationships require exact contiguous quotes and explanations.
GAIA derives zero-based UTF-16 start/end-exclusive offsets from unique matches;
it rejects missing, fabricated or ambiguous quotations. A response may carry
multiple relationships. No-relevant-bearing entries must stand alone.

CONTRADICTION and QUALIFICATION mean material challenges to the actual candidate
wording. AMBIGUITY means unresolved relevant meaning. These are AI judgements;
the validator verifies traceability, not semantic correctness or materiality.

Rules, in order:

1. Invalid or incomplete evidence: reject; no assessment.
2. No support: INSUFFICIENT.
3. Support plus any contradiction or qualification: CONTESTED.
4. Support plus ambiguity without those challenges: INSUFFICIENT.
5. Otherwise, with support: SUPPORTED.

There is no voting, confidence threshold, sentiment count, ranking or AI-assigned
machine status. Evidence limitations remain beside each candidate. Human review,
dispositions, snapshots and the Unseen Dissent Test are deferred. The domain
coverage validator accepts an explicit expected synthetic ID set so that a later
controlled dissent test can reuse it; the generation CLI permits no corpus override.

## Provenance and limits

The proof records source hash/IDs/count, candidate count, per-candidate expected
and examined counts, schema/method/rule versions, prompt version/hash, generator
and domain-code hashes, and a hash identifying the upstream skill. The skill hash
identifies the design foundation; the model receives the checked-in prompt, not
the full skill. Each call records CLI version, requested/reported model, provider,
session ID, timestamps, actual prompt/schema/response hashes and exit status.
Actual invocation arguments and raw runner metadata are retained beside the proof.

Recorded inputs make generation rerunnable, not bit-for-bit deterministic. The
service exposes a model identifier, not an immutable model-build digest. Missing
or mismatched runner metadata fails generation. Logs can include local paths;
all generated files must remain ignored and must not be committed.

Synthetic records are AI-authored stand-ins, not citizen testimony. A complete
examination does not prove understanding, recall, fairness, real-corpus
completeness or usefulness. The actual consultation purpose and accountable
policy owner remain unknown. Neither themes nor machine status authorise a
policy response. Human interpretation remains authoritative in the later phase.

## BUILD-001A gate

Unit tests must cover source integrity, IDs, coverage, quotations, assessment
precedence and artifact revalidation. A real generation must produce at least
one AI-authored candidate with verified supporting passages, complete examination,
limitations and a deterministic assessment. Report all supporting/challenging IDs.
Run repository quality gates; stop before building Tuesday's UI.
