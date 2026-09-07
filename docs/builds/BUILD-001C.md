# BUILD-001C — Unseen Dissent Test

GAIA extension built on **Hypership's lab-notes.ai and build-policy-evidence
foundation**. GAIA did not author that upstream foundation. This build continues
BUILD-001A (`de264d3`, `build-001a-pass`) and BUILD-001B (`ebe6dd4`,
`build-001b-pass`) on `gaia-policy-evidence`. No commit, tag, push, deployment,
or BUILD-001D is included.

## Purpose and authority

Search for evidence that might materially challenge, qualify, complicate, or limit
an interpretation even though the original examination did not adequately surface
it as challenging evidence. Original relationships are model interpretations,
including SUPPORT and NO_RELEVANT_BEARING. A complete examination inventory does
not prove complete understanding.

The human steward retains interpretation authority. No challenge changes an
assessment, review disposition, accepted wording, review history, or Trust Evidence
Snapshot status. There is no trust score, consensus mechanism, runtime model call,
database, authentication, production pipeline, or real citizen testimony.

## Architecture and process

The unchanged corpus and BUILD-001A proof are validated first. A separate CLI call
for each original candidate receives the complete source texts, original candidate
ID and wording, and all original examination relationships. It explicitly challenges
the first examination, including passages within already challenging sources.
The model must explain possible bearing and why that bearing was not already
adequately represented anywhere in the original challenging relationships.

The prompt permits an empty findings array. No source ID is supplied as a hidden
target. Structured output requires source ID, exact quote, explanation, novelty
reason, and limitations. Complete input delivery is mechanically inspectable;
attention to or comprehension of every meaning is not observable.

```powershell
npm.cmd run gaia:dissent -- run-NSHiGl
npm.cmd run gaia:dissent -- run-NSHiGl --validate
npm.cmd run gaia:dissent -- --fixture
```

The generator uses the existing ChatGPT-authenticated Codex CLI, an ephemeral
session per candidate, a separate temporary working directory, read-only sandbox,
and the existing BUILD-001A model choice. It supplies no API keys and has no API
fallback. It refuses to overwrite an existing dissent artifact. Failed calls retain
ignored diagnostic files and do not publish a successful challenge artifact.
Source, proof and any existing reviews are checked again before publishing.

## Artifact and validation

The normal artifact is `.local/gaia/policy-evidence/<run>/dissent.json`.
All generated artifacts and runner diagnostics remain under the existing Git ignore
rule. No source, proof, or review file is written by the challenge process.

`BUILD-001C/1` binds the artifact to the SHA-256 of the exact source and proof
bytes. Each candidate retains its ID, original wording, requested and reported
model, provider, CLI and Node runtime versions, session ID, start/end timestamps,
exact prompt hash, response hash, output-schema hash, and raw response text.
Exact prompts, output schemas, responses, invocation parameters, stdout, stderr,
and exit information also remain in separate local diagnostic directories.

Every finding retains the original relationship objects, including their original
quotes, explanations and locations. These are derived from the proof, never
accepted as challenger-authored replacements. Offsets are derived from unique,
exact matches and use zero-based UTF-16 positions with an exclusive end. Missing
or ambiguous quotes fail validation. Unknown sources/candidates, incomplete
candidate challenge sets, changed bindings, altered wording, offsets, relationships,
status, validation flags, responses or unsupported artifact fields are rejected.

Reloading reconstructs the artifact and compares it with the stored object.
Prompt and response hashes are checked, and all candidates must have one challenge,
including candidates with zero findings. The hashes provide integrity bindings,
not signed provenance or protection against a party rewriting every local file.
Reported model metadata is retained from CLI output, not independently attested.

## Controlled synthetic fixture

`policy-evidence-dissent.test-support.ts` supplies four fictional sources, a
candidate asserting completion without assisted access, and an intentionally
flawed baseline. TEST-B is SUPPORT based on “The new screen is clearer.” while
the baseline omits a following qualification. Every baseline explanation is the
same; no source is identified to the model as the target.

All fixture artifacts carry **SYNTHETIC TEST FIXTURE — NOT REAL CITIZEN TESTIMONY**.
The explicit `--fixture` CLI mode uses a separate `fixture-*` directory, stores its
fixture context, and never creates a normal BUILD-001A proof. The route only selects
validated `run-*` proofs bound to the original 20-record corpus, so this fixture
cannot enter normal review evidence. Unit tests use an authored response to test
validation; that alone is not a model-generation result.

An actual independent fixture model call was also run on 2026-09-07 using
`gpt-6-astra`, provider `openai`, `codex-cli 0.153.4`, Node `v24.19.0`.
Its separately stored result is in `.local/gaia/policy-evidence/fixture-8u73PQ/`.
It surfaced one item, TEST-CAND-1 / TEST-B, offsets `[27, 131)`:

> I could finish only because the library adviser entered the answers for me; that desk closes next month.

The model interpreted dependence on assistance and impending loss of that assistance
as potential challenges. It identified the baseline's screen-clarity quotation as
omitting those bearings. SUPPORT remains unchanged. The full prompt includes all
four sources and no separate hidden-source hint or answer key.

## Existing-corpus challenge result

An actual separate model challenge ran against all three candidates of the existing
20-record BUILD-001A proof, using the same model/provider/CLI/runtime listed above.
The artifact is `.local/gaia/policy-evidence/run-NSHiGl/dissent.json` and revalidated
successfully. CAND-001 and CAND-003 returned zero findings. This does not establish
that no dissent exists for either candidate.

CAND-002 / SYN-0004 returned one POTENTIAL_UNSEEN_DISSENT item, offsets `[0, 47)`:

> The ambition is right and the timetable is not.

Model challenge explanation:

> Approval of the ambition coexists with an explicit objection to implementation timing. This potentially qualifies the candidate by identifying readiness and scheduling as concerns alongside meaningful judgment and accountable responses. The source does not specify a suitable timetable.

Model novelty explanation:

> The original QUALIFICATION for this source addresses unequal access caused by unreliable broadband, but does not surface the explicit rejection of the timetable. Across the examination, training timing and additional workload are acknowledged, but neither adequately captures this source’s distinction between endorsing the ambition and rejecting its schedule.

The preserved original QUALIFICATION quotes the broadband passage at `[48, 183)`.
The challenging source need not have been SUPPORT or NO_RELEVANT_BEARING: a distinct
possible bearing inside an already qualifying source is in scope. Whether the timing
passage is materially relevant or genuinely novel remains unresolved for human review.

## UI and WITNESS boundary

Each candidate has a separate UNSEEN DISSENT CHALLENGE section in the existing local
review interface. It shows counts, source IDs, exact quotations, original relationship
kinds, model bearing/novelty explanations, validated locations, expandable complete
testimony and relationship objects, provenance, and limitations. The original
candidate wording remains visible above it.

Missing and invalid artifacts are distinct from a validated zero-finding run.
An invalid challenge does not disable otherwise valid human-review records or silently
apply any findings. A valid zero-finding run displays these adjacent statements:

> No potential unseen dissent was surfaced by this challenge run.
>
> This does not establish that no dissent exists.

WITNESS remains witness to the claim–evidence boundary:

> Verification must name its boundary.
>
> Surfacing this passage does not establish that it materially contradicts or qualifies the interpretation. Its semantic bearing remains contestable until human review.
>
> “This quotation matches the source” does not mean “This quotation materially challenges the interpretation.”

Observed: supplied synthetic text. Mechanically verified: exact passage locations,
bindings and faithful original relationships. Model-interpreted: possible bearing
and novelty. Human-confirmed: only separately saved human review, not a machine
challenge's materiality. Unresolved: semantic correctness and meaning.

The existing snapshot remains the BUILD-001B snapshot; it does not incorporate this
separate challenge artifact. Reload the page to see externally generated challenges.

## Verification and preservation

- Focused BUILD-001A/B/C tests: 67 passed across five files.
- Full repository suite: 206 passed, one failed across 29 files. The sole failure
  remains the known Windows Claude-symlink check in `tests/playbook-skills.test.ts:44`
  (the Claude discovery path resolves to itself instead of the shared agent skill).
  No upstream behavior was changed to mask it.
- Typecheck, lint, production build and `git diff --check` passed.
- Local production HTTP route inspection returned 200 with the challenge heading,
  real generated quotation, zero-finding boundary and semantic boundary present;
  the controlled fixture candidate was absent. This is not a browser accessibility review.
- Original BUILD-001A validator revalidated three candidates against 20 unchanged sources.
- Initial sandbox attempts hit Windows `spawn EPERM`; approved runs outside the
  sandbox were used. An initial new test omitted its required review timestamp;
  it was fixed before final verification.
- No automated browser-test harness was added. Browser release review remains
  required for complete flows, keyboard/focus, mobile width, 200% zoom, reduced
  motion and forced colours. No manual human review was saved by this build.

SHA-256 before and after implementation and both real model runs:

| Preserved file | SHA-256 |
| --- | --- |
| Original source corpus | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| BUILD-001A run-NSHiGl/proof.json | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| BUILD-001B run-NSHiGl/reviews.json | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |

## Explicit limitations

- A challenge model finding does not establish semantic correctness.
- Failure to surface dissent does not establish absence of dissent.
- Exact quotation validation establishes traceability, not materiality.
- A second model is not independent human judgment.
- The challenge may reproduce biases or blind spots of the original model.
- Complete record examination does not prove complete meaning comprehension.
- Synthetic test success does not prove performance on real citizen testimony.
- No claim of prevalence or representativeness is established.
- No participant-confirmed meaning is established.
- No policy sufficiency or organisational effectiveness is established.

This build demonstrates separate challenge generation, conservative findings,
mechanical traceability, original-relationship preservation, explicit zero-finding
boundaries, and retained human authority. It does not establish detection recall,
semantic truth, genuine disagreement, misclassification, model error, policy
sufficiency, or performance on real testimony. The actual consultation purpose
and accountable policy owner remain unknown; no operational policy analysis is claimed.

## Exact changed files

- `DESIGN.md`
- `PRODUCT.md`
- `app/gaia/policy-evidence/page.tsx`
- `docs/builds/BUILD-001C.md`
- `features/gaia/policy-evidence-review.tsx`
- `features/gaia/policy-evidence-dissent.tsx`
- `features/gaia/policy-evidence-dissent.test.tsx`
- `lib/gaia/policy-evidence-dissent.ts`
- `lib/gaia/policy-evidence-dissent-boundary.ts`
- `lib/gaia/policy-evidence-dissent-store.ts`
- `lib/gaia/policy-evidence-dissent.test-support.ts`
- `lib/gaia/policy-evidence-dissent.test.ts`
- `scripts/gaia/generate-policy-dissent.ts`
- `package.json`
