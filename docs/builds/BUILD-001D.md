# BUILD-001D — Trust Evidence Snapshot

GAIA composition extension built on **Hypership's lab-notes.ai and
build-policy-evidence foundation**. GAIA did not author that upstream foundation.
The starting branch is `gaia-policy-evidence`, at published BUILD-001C commit
`21db0ff8f7a0e05c72586953bf83c50838fb3ced`. The `build-001a-pass`,
`build-001b-pass` and `build-001c-pass` checkpoints remain intact.

## Purpose and authority boundaries

Freeze one selected candidate into a portable, inspectable evidence artifact while
preserving the original machine interpretation, human authority, potential unseen
dissent and unresolved meaning. This is composition only: no model is invoked,
no semantic examination is performed, and no upstream artifact is regenerated.

BUILD-001A remains the source of the original candidate, examination relationships,
coverage and deterministic machine assessment. BUILD-001B remains the authority for
the saved human disposition and history. CONFIRM, REVISE, REJECT and HOLD_DISSONANCE
are copied exactly. BUILD-001C remains potential challenge evidence, with model
bearing and novelty explanations. It never changes the human disposition.

The snapshot has `DERIVED_ONLY` authority. A CONFIRM can coexist with potential
unseen dissent. HOLD_DISSONANCE stays unresolved. Revised human wording does not
inherit the original machine assessment. Absent reviews do not become confirmation.
No human disposition is invented for an unreviewed candidate.

> Summary is not the product. The evidence trail is.

## Architecture

The framework-agnostic composition module receives exact source/proof/review/dissent
bytes, the selected run/candidate, expected fingerprints and an explicit timestamp.
It calls the existing `reviewContext`/`validateReviews` and
`dissentContext`/`validateDissent` paths. Upstream validator reconstruction is
mechanical validation of saved records, not a new model examination.

The storage module reads only the selected local run, validates it against the
existing latest-valid-proof selection, checks all four input bindings, composes
the artifact, revalidates it, and rechecks the inputs and selected proof before
writing. Only a new `trust-evidence-<candidate>-<UTC timestamp digits>.json` file is
written. Exclusive file creation rejects collisions. Earlier snapshots and all
source/proof/review/dissent files are preserved.

The local route adds a separate BUILD-001D section. It does not change the existing
BUILD-001B export, A/B/C domain modules, human-review actions or dissent interface.
The new Server Action accepts selection IDs and expected fingerprints, never
client-authored evidence or human dispositions. It applies the existing local-host
restriction and validates the request before composing from disk.

```powershell
npm.cmd run gaia:snapshot -- run-NSHiGl CAND-002
npm.cmd run gaia:snapshot -- --verify .local/gaia/policy-evidence/run-NSHiGl/trust-evidence-CAND-002-20260908163747161.json
```

The second command verifies the portable artifact from its embedded inputs, without
requiring the original filesystem layout. It does not assert that those inputs
are still the current local files. Local display additionally requires exact
agreement with the current selected run and all four current input fingerprints.

## BUILD-001D/1 schema

The typed schema and reconstruction validator live in
`lib/gaia/policy-evidence-snapshot.ts`.

| Field | Meaning |
| --- | --- |
| `schemaVersion`, `recordType`, `createdAt`, `runId`, `candidateId` | Version, record identity, creation time and selection |
| `authority`, `disclosure`, `attribution`, `boundary` | Derived authority, synthetic-data label, upstream attribution and WITNESS statement |
| `inputs` | Source, proof, reviews and dissent paths; VALIDATED or ABSENT; SHA-256 and exact bytes encoded as base64, or explicit nulls when absent |
| `bindings` | Four input fingerprints, with null for absent optional artifacts |
| `mechanicallyVerified` | Source IDs, examination coverage and the existing verification checks, with their limited scope |
| `modelInterpreted` | Original wording, relevance, original assessment/reason, every recorded relationship and source testimony, generation provenance and limitations |
| `humanReview` | Saved disposition, rationale, state, revised wording, revision-assessment boundary, ledger state/revision, current event, candidate history and history reference |
| `unseenDissent` | Validated findings, validated zero findings or absence; selected original challenge object, including source, quote, offsets, original relationships, model explanations, provenance and limitations |
| `unresolved` | Existing A/B/C limitations and explicit snapshot limitations |

The selected candidate supplies the readable projection. Exact complete input
artifacts are also embedded, including the complete source corpus and ledger,
so original context and history remain independently inspectable. These are local,
ignored files. The format is not a redacted public-publication format.

The four visible epistemic classes are:

- **MECHANICALLY VERIFIED:** artifact identity, source IDs, exact passage locations,
  faithful copying of recorded relationships and the original deterministic rule
  result. This does not validate the meaning of a relationship.
- **MODEL-INTERPRETED:** candidate wording, relationship explanations, possible
  challenging bearing and novelty. Potential findings remain
  POTENTIAL_UNSEEN_DISSENT.
- **HUMAN-REVIEWED:** the fact and content of a separately saved human disposition
  and rationale, including REVISE, REJECT and HOLD_DISSONANCE. This class does not
  certify the model interpretation or mean the candidate was confirmed; the exact
  disposition remains explicit. An unreviewed candidate is UNRESOLVED.
- **UNRESOLVED:** contestable meaning, materiality, missing evidence and all limits
  not established by the input artifacts.

## Validation and absent/invalid evidence

Every snapshot input must pass its original validator. Wrong corpus bytes,
invalid proofs, stale review/dissent associations, unknown candidates, changed
expected fingerprints or changed optional-file presence cause rejection.
There is no repair, normalization or fallback to a substitute artifact.

Portable validation decodes canonical base64, checks each embedded fingerprint,
reruns the A/B/C validators, and reconstructs the entire selected snapshot.
The stored object must exactly match the reconstructed object. Unsupported authority
fields and changes to copied wording, assessments, dispositions, evidence, offsets,
relationships, boundaries or limitations are rejected. Like the upstream validators,
the serialized object comparison is deliberately strict, including property order.

| Challenge input | Creation and presentation |
| --- | --- |
| Valid, with findings | VALIDATED_FINDINGS; findings remain potential and model-interpreted |
| Valid, no findings for this candidate | VALIDATED_ZERO_FINDINGS, with both adjacent boundary statements below |
| Absent | ABSENT; no fingerprint or challenge object, and no zero-finding claim |
| Invalid, stale, mismatched or unreadable | Creation blocked; INVALID or UNAVAILABLE displayed; no successful snapshot emitted or repaired |

Invalid dissent is deliberately a visible blocker rather than an embedded invalid
input: the build requires composition only from validated artifacts. No invalid
artifact is silently discarded to manufacture an absent or zero-finding snapshot.
Invalid reviews likewise block creation. A missing ledger is explicitly ABSENT;
a valid ledger without an event for the selected candidate remains UNREVIEWED.

For a validated zero-finding challenge the artifact and view carry, in order:

> No potential unseen dissent was surfaced by this challenge run.
>
> This does not establish that no dissent exists.

Stored snapshots whose inputs no longer match the selected local run are preserved
on disk but excluded with a warning. A portable historical snapshot can still
validate against its own embedded evidence; that is a different claim from matching
current local state. The client also checks source/proof/review/dissent fingerprints
before displaying or offering a saved snapshot download.

## Interface and evidence trail

The BUILD-001D section lets the reviewer select a candidate and freeze a new
artifact, inspect the most recent matching snapshot, and download its exact JSON.
The most recently created matching snapshot is selected initially when available.
The earlier BUILD-001B export remains separately available with its original meaning.

The frozen view shows the original machine wording and assessment reason, coverage,
all recorded evidence relationships, full expandable testimony, human disposition,
saved rationale, separate revision and history, potential unseen dissent, exact
quotations and UTF-16 offsets, original relationships, model bearing/novelty
explanations, provenance and input hashes. Native disclosures and existing tokens
keep the interface within the existing design.

Snapshots are visibly frozen as of their creation time, not live human-review state.
Unsaved drafts are excluded. After saving a human review or changing local files,
reload before another freeze; stale submissions fail instead of using changed inputs.
No snapshot action saves a human review or resolves dissent.

## Demonstration and preservation

A snapshot was created from the existing run for CAND-002:

`.local/gaia/policy-evidence/run-NSHiGl/trust-evidence-CAND-002-20260908163747161.json`

This final-verification artifact uses HUMAN-REVIEWED. The earlier pre-review
snapshot is preserved on disk without modification. Its superseded label fails
the current strict reconstruction check and it is excluded from the current view;
no silent migration or overwrite is performed. BUILD-001D/1 is still unsealed.

The exact human-review scope language is unchanged:

> Only the saved human disposition and rationale are recorded here. This class does not confirm model meaning, challenge materiality or participant meaning.

Thus the class does not establish participant-confirmed meaning, model semantic
correctness or challenge materiality. Tests assert both the corrected label and
this unchanged scope for all four dispositions.

It preserves the saved CONFIRM disposition and the existing CAND-002 / SYN-0004
POTENTIAL_UNSEEN_DISSENT finding together. The exact challenge quote is:

> The ambition is right and the timetable is not.

The original QUALIFICATION relationship and offsets `[0, 47)` for the challenge
remain unchanged. The model explanation and novelty explanation are copied, not
endorsed. No model call or new human judgment was made in BUILD-001D.

The generated snapshot passed portable revalidation using its embedded A/B/C inputs.
All generated snapshots remain covered by the existing `/.local/gaia/` Git ignore rule.

The SHA-256 values below were recorded before implementation and after snapshot
creation and revalidation. Each before/after pair is identical:

| Input | SHA-256, before = after |
| --- | --- |
| Original source corpus | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| run-NSHiGl/proof.json | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| run-NSHiGl/reviews.json | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |
| run-NSHiGl/dissent.json | `456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015` |

## Verification

Focused tests cover deterministic composition, portable revalidation, exact original
wording and assessment, all four human dispositions and rationales, separate revised
wording, HOLD_DISSONANCE, CONFIRM coexisting with potential dissent, exact source/
quote/offset/relationship preservation, missing and zero findings, invalid-input
blocking, every input fingerprint, stale B/C proof associations, authority-field
tampering, exclusive snapshot creation, upstream byte preservation, Git ignoring,
selected-proof binding, stale snapshot exclusion and visible UI evidence boundaries.

Final verification rerun on 2026-09-08 after the HUMAN-REVIEWED correction:

| Check | Result |
| --- | --- |
| Focused BUILD-001A/B/C/D tests | 96 passed across seven files; 14.89 seconds |
| Full repository suite | 235 passed, one failed across 31 files; 26.69 seconds |
| Typecheck | Passed |
| Lint | Passed |
| Production build | Passed; 65 generated routes/pages, with the local evidence route rendered dynamically |
| `git diff --check` | Passed |
| Portable snapshot verification | Passed against embedded exact A/B/C inputs |

The sole full-suite failure remains the known upstream Windows Claude-symlink
check in `tests/playbook-skills.test.ts:44`: the Claude discovery path resolves
to itself instead of the shared agent skill directory. No upstream behavior was
changed to hide it.

An earlier implementation-stage production HTTP inspection returned 200 and confirmed the rendered
CAND-002 snapshot includes CONFIRM, POTENTIAL_UNSEEN_DISSENT, all four epistemic
classes, the WITNESS evidence-trail statement, inspectable complete testimony,
the dissent fingerprint and the JSON download. The temporary verification server
was stopped. This does not establish browser accessibility acceptance.

The final rerun confirms source/proof/review/dissent hashes still match the
preservation table above. The exclusive-write and preservation tests pass: a
snapshot never overwrites an upstream artifact. Missing dissent remains ABSENT;
invalid dissent blocks creation and is never represented as validated zero findings.
The new portable snapshot was revalidated from its embedded bytes, without a model
call or changes to A/B/C. Browser release checks remain outstanding.

```powershell
npm.cmd test -- lib/gaia features/gaia
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
git diff --check
```

Initial sandbox attempts hit Windows `spawn EPERM` for the test/tsx runners and
could not reach the existing Google Fonts build dependencies. Approved execution
outside the sandbox was used; upstream font behavior was not modified. An initial
new UI test had an incorrectly shaped invalid-state fixture; it was corrected.

## Limitations and WITNESS boundary

WITNESS remains witness to the claim–evidence boundary:

> Verification must name its boundary.
>
> Summary is not the product. The evidence trail is.

Mechanical success establishes reproducible composition and traceability against
the supplied bytes. It does not establish truth, semantic correctness, materiality,
novelty, consensus, representativeness, policy sufficiency, organisational
effectiveness, participant-confirmed meaning or complete detection of dissent.
All source testimony is synthetic. The operational consultation purpose and
accountable policy owner remain unknown.

Hashes are not signatures. They do not independently attest authorship, human
identity or creation time, and cannot prevent someone rewriting a whole consistent
bundle and all its hashes. External expected fingerprints are needed to establish
identity against a separately trusted record. This is local file storage, not
transactional multi-process storage; repeated input checks narrow but do not claim
to eliminate all external concurrent-write races. There is no deployment,
authentication, database or production-service claim.

Browser release review remains required for complete flows, keyboard/focus, mobile
width, 200% zoom, reduced motion and forced colours. No automated browser harness
is added. No claim of browser accessibility acceptance is made from unit tests.

## Exact changed files

- `DESIGN.md`
- `PRODUCT.md`
- `app/gaia/policy-evidence/page.tsx`
- `app/gaia/policy-evidence/snapshot-actions.ts`
- `docs/builds/BUILD-001D.md`
- `features/gaia/policy-evidence-snapshot-panel.tsx`
- `features/gaia/policy-evidence-snapshot.test.tsx`
- `features/gaia/policy-evidence-snapshot.tsx`
- `lib/gaia/policy-evidence-snapshot-boundary.ts`
- `lib/gaia/policy-evidence-snapshot-store.ts`
- `lib/gaia/policy-evidence-snapshot.test-support.ts`
- `lib/gaia/policy-evidence-snapshot.test.ts`
- `lib/gaia/policy-evidence-snapshot.ts`
- `scripts/gaia/create-policy-snapshot.ts`
- `package.json`

No commit, tag, push or deployment is included. BUILD-001E has not begun.
Implementation and mechanical verification are ready for SMITH review, with the
semantic and browser-review limitations above still explicit.
