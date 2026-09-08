# BUILD-001G — Decision Evidence Change Notice

GAIA extension built on **Hypership's lab-notes.ai and build-policy-evidence
foundation**. GAIA did not author the upstream foundation.

## Starting checkpoint

Before changing files, HEAD and `build-001f-pass` both resolved to
`1406d0cd96e169d1a13d62ad96428d7a7e0da8ee` on `gaia-policy-evidence`.
The working tree was clean. All six preservation hashes below were recorded
before implementation. HEAD and the tag still resolve to that checkpoint.

PRODUCT.md, DESIGN.md, the existing A–F build records, current policy-evidence
modules and build-policy-evidence skill/domain context were inspected. The A
record remains `docs/builds/BUILD-001.md`, headed BUILD-001A. Installed Next.js
Server Component guidance was inspected. The explicit build direction is a local,
read-only mechanical comparison. The real consultation purpose and accountable
policy owner remain unknown; no ownership or policy response is inferred.

No A/B/C/D/E/F evidence artifact, validator or domain module was modified. The
existing route only gains composition of the separate G view. No model call,
decision creation, decision revision or upstream artifact write occurred.

## Purpose and authority

> GAIA may detect that the evidence changed. GAIA may not decide whether the decision should change.
>
> The original Human Decision Record remains unchanged. New evidence does not rewrite an old decision.
>
> This notice compares evidence identities and validated states, not meanings. Evidence change does not establish that the recorded decision is wrong, insufficient, or must be reversed.

G accepts one valid BUILD-001F/1 record and first reconstructs it with the existing
F validator. Its exact embedded D snapshot and canonical E projection are validated
through the sealed D/E/F paths. Current local evidence is read and validated
separately. It is never substituted into the historical record or frozen brief.

## Architecture and validation

`policy-evidence-change.ts` is a deterministic domain comparison. Its four binding
rows are always source, proof, reviews and dissent. Each row contains the recorded
state/hash, current state/hash and a mechanical comparison result. Historical
record validity is a separate field and is not inferred from current agreement.

The current source uses the existing fixed-corpus validator. The current proof
uses the existing A/B review-context validator; current reviews and dissent use
the existing B and C validators against that current source/proof context.
No original relationship or semantic examination is recomputed by a model.

| Top-level state | Meaning |
| --- | --- |
| RECORDED_EVIDENCE_MATCHES_CURRENT | All required current validation succeeded, and all four fingerprints/absence states match |
| CURRENT_EVIDENCE_DIFFERS | All required current validation succeeded, and at least one binding differs |
| CURRENT_EVIDENCE_INVALID | An available current input failed its existing validator; no agreement claim |
| CURRENT_EVIDENCE_NOT_CHECKED | Current evidence is unavailable, incomplete or changed during the read; no agreement claim |

Current rows distinguish VALIDATED, ABSENT, INVALID, UNAVAILABLE and NOT_VALIDATED.
NOT_VALIDATED means a present input could not be validated because a required
source/proof context was unavailable or invalid. Invalidity takes precedence over
differences. Until the whole current check succeeds, all rows say NOT_COMPARED.
Hashes of invalid or unvalidated bytes identify observations only, not validated
evidence. No absent or zero-finding result is fabricated from invalid content.

Optional input behavior is explicit:

| Recorded → current optional input | Result after successful current validation |
| --- | --- |
| ABSENT → ABSENT | MATCH |
| ABSENT → valid present | CHANGED |
| Valid present → ABSENT | CHANGED |
| Valid present → different valid present bytes | CHANGED |
| Any → invalid present | CURRENT_EVIDENCE_INVALID, never coerced to CHANGED or ABSENT |

Only an ENOENT read of an optional reviews/dissent file establishes ABSENT. Other
read failures are UNAVAILABLE. Missing required source/proof inputs prevent a
complete check. Schema- or binding-invalid available inputs remain invalid.

The notice has a BUILD-001G/1 in-memory version, canonical statements, four-row
comparison, historical record and reconstructed frozen brief. No G artifact is
written. `validateDecisionChangeNotice` deterministically reconstructs this output
and rejects additional semantic/authority fields or altered output states.

## Comparison scope and historical selection

`policy-evidence-change-store.ts` independently inventories saved decision files
without requiring a valid current proof. It validates the selected record and
its filename/run/decision identity, reads the four current files, and rechecks
both the current read identities and selected decision bytes before returning.
An unstable current read becomes NOT_CHECKED while history stays inspectable.
A changed or invalid historical record blocks that selection without repair or
fallback to another record.

The default comparison target is the **current files in the decision's original
run**. Its run ID is visible beside the result. G does not silently choose another
valid proof when that run is invalid and does not claim that the target is the
newest run. The working review's automatic selection is separate from this named
comparison scope. An explicit `evidenceRun` query parameter can name another run.

```text
/gaia/policy-evidence?decisionRun=run-NSHiGl&decision=a41cb8d3-6c37-4eec-be5c-4b330c764de2#decision-evidence-change
```

The native historical-decision disclosure offers exact record links. With no
explicit record, the default is the first filename in sorted run/decision order;
the UI explains that this ordering implies neither priority nor recency. Explicit
invalid selections do not fall back. Malformed, repeated and unsafe query values
are rejected. Another run is never inferred from a decision filename.

The historical view needs only the saved F file and its embedded bytes. It remains
available when the current proof, reviews, dissent or source is invalid/unreadable,
and when the standalone D snapshot no longer exists. The route loads G outside
the earlier current-proof gate, preserving that gate's existing behavior for A–F.
New filesystem calls are read-only and excluded from deployment tracing.

## Interface and preserved evidence

The existing local policy-evidence page adds the G section associated with the
selected saved decision. It uses the current design tokens, native table headings,
row labels, links and disclosures. The four canonical headings and their boundary
copy distinguish matching, changed, invalid and not-checked states.

The original decision, rationale, synthetic maker, role and authority values remain
verbatim and visible beside historical validity. RECORDED remains RECORDED.
HOLD_DISSONANCE remains HOLD_DISSONANCE. Potential dissent remains labelled
POTENTIAL_UNSEEN_DISSENT; a decision does not resolve it or change a human review.

Frozen zero findings retain these adjacent statements, in order:

> No potential unseen dissent was surfaced by this challenge run.
>
> This does not establish that no dissent exists.

Frozen ABSENT remains ABSENT. Current dissent validation never replaces the frozen
challenge. The Decision → Brief → Snapshot → original evidence trace shows the
exact record path/SHA-256, frozen brief identity/hash scope, snapshot identity/hash,
and complete frozen evidence through the existing D presentation. Complete testimony,
quotes, offsets, original relationships, provenance, review history and unresolved
limitations remain inspectable. The exact unchanged F bytes can be downloaded;
the download includes its embedded snapshot and original evidence.

There is no reverse, approve, reopen, update-decision or recommendation control.
There is no model invocation, new API/action, database, external storage, new
decision, revision or persistent G artifact.

## Preservation hashes

Recorded before implementation and after verification; all six pairs are identical.
The run-relative paths below are under `.local/gaia/policy-evidence/`.

| Input | SHA-256, before = after |
| --- | --- |
| content/playbooks/policy-evidence/policy-evidence.data.json | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| run-NSHiGl/proof.json | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| run-NSHiGl/reviews.json | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |
| run-NSHiGl/dissent.json | `456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015` |
| run-NSHiGl/trust-evidence-CAND-002-20260908163747161.json | `a60b252f387d3c140f588bdbbbe35338cc272904f04e7b62167561c3366a88cf` |
| run-NSHiGl/human-decision-a41cb8d3-6c37-4eec-be5c-4b330c764de2.json | `6215c631eddd52f202abff315ecfc398ae99ff3425b7e41a82bb7c1a0040fe20` |

The selected D snapshot and saved F decision were revalidated from their embedded
bytes through the installed TypeScript runtime and existing validators. The G
comparison for that saved decision returned RECORDED_EVIDENCE_MATCHES_CURRENT
against current files in run-NSHiGl. No current run input was changed to manufacture
a difference or invalid state. Such tests use isolated temporary synthetic fixtures.

## Verification results

Final verification on 2026-09-08:

| Check | Result |
| --- | --- |
| `npm.cmd test -- lib/gaia features/gaia` | 210 passed across 13 files; 20.50 seconds |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed; 65 generated pages, dynamic local evidence route, no broad-file-tracing warnings |
| `npm.cmd test` | 349 passed, one failed across 37 files; 29.61 seconds |
| `git diff --check` | Passed |
| Selected D/F portable revalidation | Passed; historical validity checked separately from current agreement |
| Preservation | All six exact before/after hashes match |

The sole final repository-suite failure is the unchanged upstream Windows
Claude-symlink test at `tests/playbook-skills.test.ts:44`. The Claude discovery path
resolves to itself instead of the shared `.agents/skills` folder. No upstream
behavior, test, symlink or discovery configuration was changed to conceal it.

The 41 new tests cover deterministic matching, changes to individual inputs,
optional absence transitions, invalid/unavailable inputs, stale dependent bindings,
historical access without the standalone snapshot/current proof, verbatim human
fields, HOLD_DISSONANCE, RECORDED, potential/zero/absent dissent, tampered historical
structure/embedded bytes, unsupported notice authority fields, selection safety,
unchanged file hashes/directory entries and inspectable UI traceability.

The fixed A source fingerprint is intentional: a source-only byte change fails
the existing validator and therefore yields INVALID, not a valid difference.
A valid proof-only byte-formatting change is tested with optional review/dissent
absent; retaining those files with the old proof hash correctly yields INVALID.
Review/dissent byte-formatting changes can validate yet differ, demonstrating why
fingerprint differences do not establish a change of meaning or materiality.

Initial new tests exposed a byte-array check that did not accept Node buffers
across the test environment's JavaScript realms, a duplicate-text assertion and
missing word separation in table row labels. These were corrected with the Node
byte-array predicate, scoped assertions and explicit spacing. Lint also required
escaping a JSX apostrophe. No upstream validator was weakened. Approved execution
outside the sandbox was used where Windows test/build workers required it.

Production HTTP inspection returned 200 for the selected saved decision and
confirmed the G heading, matching state, authority statement, four-row binding
table, historical decision, exact F hash and frozen-evidence disclosure. The
temporary local server was stopped. This was not browser accessibility acceptance.

## WITNESS boundary and limitations

> Verification must name its boundary.
>
> Summary is not the product. The evidence trail is.

Observed current bytes may have fingerprints before their validation succeeds.
Mechanical verification covers identities, validated artifact structures and
bindings only. Model interpretations remain model interpretations. HUMAN-REVIEWED
retains the existing scope of a separately saved review. Human decisions remain
human decisions; unresolved evidence remains unresolved.

No comparison state establishes decision correctness/incorrectness, continuing
appropriateness, materiality, a recommendation, consensus, participant-confirmed
meaning, semantic correctness, representativeness, policy sufficiency,
organisational effectiveness or a trust/confidence/readiness score. All testimony
is synthetic. Complete detection of dissent and performance on real evidence
remain unestablished.

Historical validation is the sealed F structural/embedded-evidence validation,
not an independent signature or attestation. Hashes do not authenticate identity,
authority, authorship or timestamps. A consistently rewritten bundle, including
well-formed replacement human text, requires an externally trusted fingerprint
or signature to establish that it differs from an independently trusted record.
G does not invent such authority. It detects changes during its own reads and
compares only the four specified current bindings.

Repeated reads narrow but do not eliminate concurrent filesystem races. This is
a page-load comparison, not a live monitor or continuing validity guarantee.
Reload to compare again. File inventories and historical validity do not establish
which run an organisation considers operationally current.

Browser/release review remains outstanding for keyboard/focus, mobile width,
200% zoom, reduced motion and forced colours, including complete historical
inspection flows. Unit/component/HTTP checks do not establish accessibility
acceptance. No automated browser harness was added.

## Exact changed files and stop boundary

- `DESIGN.md`
- `PRODUCT.md`
- `app/gaia/policy-evidence/page.tsx`
- `docs/builds/BUILD-001G.md`
- `features/gaia/policy-evidence-change.test.tsx`
- `features/gaia/policy-evidence-change.tsx`
- `lib/gaia/policy-evidence-change-store.ts`
- `lib/gaia/policy-evidence-change.test-support.ts`
- `lib/gaia/policy-evidence-change.test.ts`
- `lib/gaia/policy-evidence-change.ts`

Working tree: three modified tracked files and seven new untracked files listed
above; nothing staged. Ready for SMITH implementation review with the semantic
and browser limitations explicit. No commit, tag, push or deployment.
BUILD-001H has not begun.
