# BUILD-001F — Human Decision Record

GAIA extension built on **Hypership's lab-notes.ai and build-policy-evidence
foundation**. GAIA did not author the upstream foundation.

## Checkpoint and preservation gate

Before any file change, the working tree was clean on `gaia-policy-evidence`.
HEAD and `build-001e-pass` both resolved to
`564d9b3bd497fe47bb50c236f71e813ab0e56eba`. The five required input hashes were
recorded before implementation. HEAD and the tag still resolve to that checkpoint.

PRODUCT.md, DESIGN.md, the A/B/C/D/E records, existing policy-evidence modules,
the build-policy-evidence skill and its domain context were inspected. The A
record is the existing `docs/builds/BUILD-001.md`, headed BUILD-001A; it was not
renamed. Relevant installed Next.js Server Component and Server Action guidance
was read. The requested synthetic demonstration is the selected build direction;
the real consultation purpose and accountable policy owner remain unknown.

No source, proof, review, dissent or frozen snapshot was modified, regenerated,
migrated or normalized. BUILD-001E remains a projection with no separate evidence
file. No A/B/C/D/E domain module or validator was changed. No model was invoked.

## Purpose and authority boundary

Record supplied human decision text and rationale against one exact frozen brief
and snapshot, preserving the complete evidence trail and unresolved meaning.

> The brief informs a decision. The human makes the decision. The Decision Record preserves what was decided and why.
>
> This record preserves a human decision made with reference to the identified evidence. GAIA did not make, recommend, approve, or validate the decision.
>
> Recording a decision does not resolve dissent, establish semantic correctness, or upgrade the evidence supporting it.

The local demonstration accepts explicitly synthetic decision, rationale, maker,
role and authority values. None is prefilled or inferred. All are labelled
synthetic test data, not an accountable real-world policy decision. No real-world
owner was invented and no decision was entered on behalf of the human steward.

CONFIRM, REVISE, REJECT and HOLD_DISSONANCE remain exactly as saved in BUILD-001B.
A recorded decision does not add a review event, change a disposition or endorse
the original machine assessment. CONFIRM may coexist with potential dissent;
HOLD_DISSONANCE stays unresolved.

## Architecture and schema

`policy-evidence-decision.ts` provides framework-independent deterministic
construction and portable reconstruction validation. `BUILD-001F/1` has these
fields and responsibilities:

| Field | Meaning |
| --- | --- |
| schemaVersion / recordType | BUILD-001F/1 / Human Decision Record |
| decisionId / createdAt | UUID and recorded timestamp; supplied explicitly for deterministic tests |
| runId / candidateId | Exact frozen selection |
| decisionStatus | RECORDED only, never APPROVED or a review disposition |
| disclosure / authority / boundary / evidenceBoundary / principle | Fixed synthetic and epistemic boundaries |
| humanDecision | Verbatim decisionText, rationale, decisionMaker, role and decisionAuthority; synthetic marker and unauthenticated-identity boundary |
| unresolvedAcknowledgement | Required literal true plus the exact acknowledgement statement |
| trace.selection | Run, candidate, snapshot filename/SHA-256, canonical brief SHA-256 and all four frozen input bindings |
| trace | Brief identity/version/hash scope, snapshot path/hash, source/proof/review/dissent path/state/hash references, creation-time check scope |
| frozenEvidence | Base64 of the exact original snapshot bytes, including its exact embedded A/B/C inputs |
| humanReview / unseenDissent / unresolved | Unchanged values reconstructed from that frozen snapshot |

Human text must be nonblank and at most 12,000 characters per field. Validation
does not trim, summarize or normalize the stored values. The submitted request is
strict: extra authority, recommendation, confidence, trust, readiness or consensus
fields fail. Full record reconstruction rejects extra fields at any level and
altered statuses, scope, relationships, review or dissent. It follows the sealed
validators' exact JSON reconstruction conventions rather than migrating inputs.

The canonical brief fingerprint is SHA-256 of `JSON.stringify(projectDecisionBrief(...))`
without current-local comparison metadata. That existing E projection reports
NOT_CHECKED in this canonical form. This gives the same evidence projection a
stable identity during historical validation. Current-local agreement is checked
separately before recording; the displayed current brief must also equal the
projection from those current bindings. The hash scope is explicitly stored.

`policy-evidence-decision-store.ts` rereads the selected snapshot and current
source/proof/reviews/dissent. It validates the latest selected proof and the
existing A/B/C validation paths, compares all fingerprints, and validates D/E
against exact embedded bytes. It repeats the current-input and snapshot checks
before writing. A changed selection, proof, source, review, dissent, snapshot or
brief fingerprint blocks creation. Missing required human input, false or absent
acknowledgement, invalid embedded dissent, malformed states and run/candidate
mismatches also block creation. No repair, fallback or substitution occurs.

Each successful save exclusively creates:

```text
.local/gaia/policy-evidence/<run>/human-decision-<uuid>.json
```

The write uses `wx`. An existing target fails even if the requested content is
identical. One draft retains its UUID across uncertain-response retries. No
upstream filename is a legal decision target. Generated decisions are covered
by the existing `/.local/gaia/` Git ignore rule, confirmed with `git check-ignore`.
Local filesystem reads/writes added by F are excluded from deployment tracing.

## Historical versus current evidence

`validateDecisionRecord` reconstructs the record from its embedded exact snapshot
using the existing D/E validators. This establishes portable historical integrity
only. Optional external expected selection metadata rejects mismatched bindings.

A saved record can remain valid against embedded evidence after local evidence
changes. The loader labels it HISTORICAL_OR_NOT_CHECKED and disables new recording
as current. It never transfers a record to another snapshot, filename, candidate
or brief fingerprint. Invalid records remain untouched on disk with a visible
warning; they are not displayed as validated. An invalid selected snapshot blocks
both recording and selected-record display.

The creation-check statement records a check made when saving. It is not a live
claim about the current files. Reload to compare again. A fresh explicit selection
may validate newly inspected bytes, but an old browser draft still fails against
its former fingerprints.

## Dissent and WITNESS

| Frozen challenge state | Decision behavior |
| --- | --- |
| VALIDATED_FINDINGS | Retain POTENTIAL_UNSEEN_DISSENT, exact source/quote/offset/original relationship, model explanations, provenance and limitations |
| VALIDATED_ZERO_FINDINGS | Retain both adjacent statements below in order |
| ABSENT | Remain ABSENT with a null dissent binding; no zero-finding claim |
| Invalid embedded dissent | Block recording; never coerce to zero findings |

> No potential unseen dissent was surfaced by this challenge run.
>
> This does not establish that no dissent exists.

WITNESS remains witness to the claim–evidence boundary:

> Verification must name its boundary.
>
> Summary is not the product. The evidence trail is.

Observed material is the supplied synthetic corpus. MECHANICALLY VERIFIED covers
identity, exact bytes, source IDs, quotations, offsets and faithful recorded
relationships; it does not establish materiality. MODEL-INTERPRETED wording,
relationships, bearing and novelty remain model interpretations. HUMAN-REVIEWED
means only the separately saved review disposition and rationale, with its exact
scope preserved. The new human decision does not upgrade that class. UNRESOLVED
limitations remain visible with equal structural emphasis.

## Interface and local use

The existing local `/gaia/policy-evidence` route loads the brief once and places a
separate F section immediately after it. It shows the exact snapshot and brief
identity, required blank native text controls, synthetic maker/role/authority
fields and an unchecked required unresolved-evidence acknowledgement. A small
client boundary handles input, pending/error status and the returned frozen record.
Failure retains the draft; no disposition or wording is suggested.

The local-host Server Action validates the untrusted request and rereads evidence
on the server. It does not call a model, review action, snapshot writer or challenge
generator. After saving, the frozen decision, rationale, supplied authority,
acknowledgement, unchanged review/dissent and limitations are inspectable. The
trace shows Decision → Brief → Snapshot → original evidence with all fingerprints,
a link to the exact selected brief and full D testimony view, and a native
disclosure of the complete saved record including embedded snapshot bytes.

No decision was saved in the selected local run during this build because no
human-authored decision/rationale was supplied. Save/reload and preservation were
exercised using labelled synthetic fixtures in temporary test directories. There
is no fabricated decision in normal runtime evidence. No PDF, database,
authentication, deployment, external storage or new model dependency was added.

## Preservation hashes

Recorded before implementation and after verification; each pair is identical:

| Input | SHA-256, before = after |
| --- | --- |
| content/playbooks/policy-evidence/policy-evidence.data.json | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| run-NSHiGl/proof.json | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| run-NSHiGl/reviews.json | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |
| run-NSHiGl/dissent.json | `456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015` |
| run-NSHiGl/trust-evidence-CAND-002-20260908163747161.json | `a60b252f387d3c140f588bdbbbe35338cc272904f04e7b62167561c3366a88cf` |

The selected run files are under `.local/gaia/policy-evidence/`. The older invalid
snapshot was retained without repair. No A/B/C/D/E artifact was written.

## Verification results

Final verification on 2026-09-08:

| Command/check | Result |
| --- | --- |
| `npm.cmd test -- lib/gaia features/gaia` | 169 passed across 11 files; 19.69 seconds |
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed; 65 generated pages, dynamic local evidence route; no broad-file-tracing warnings |
| `npm.cmd test` | 308 passed, one failed across 35 files; 26.52 seconds |
| `git diff --check` | Passed |
| Existing `gaia:snapshot -- --verify` command | Selected CAND-002 snapshot passed portable revalidation from embedded exact A/B/C bytes |
| Preservation and Git ignore checks | All five before/after hashes match; decision path is ignored |

The sole final repository-suite failure is the unchanged upstream Windows
Claude-symlink test, `tests/playbook-skills.test.ts:44`: the Claude discovery path
resolves to itself rather than the shared agent skill directory. No upstream
behavior or test was modified to mask it.

The 44 new domain/component tests cover determinism, verbatim human inputs, all
four review dispositions, exact trace and dissent preservation, zero/absent/invalid
states, every current binding, stale browser selections, historical validity,
unsupported authority fields, corrupt records, exclusive-create/no overwrite,
unchanged upstream bytes, network-free saving, blank mandatory form fields,
acknowledgement, failed-save draft/ID retention and inspectable evidence links.
Code inspection confirms no model or subprocess invocation in the F paths.

An initial new assertion incorrectly expected a freshly reselected, valid snapshot
with changed formatting to stay blocked; it was corrected to test the stale
displayed identity separately. The first full run reported a new form-test timeout
and a subsequent form assertion failure while tests typed long strings character
by character. The tests now use paste interactions and await result feedback;
the final full and focused runs pass all F tests. No product validation or upstream
test was weakened. Tests and build used approved execution outside the sandbox
where required by Windows worker spawning.

Production HTTP inspection returned 200 for the selected valid snapshot, with the
F section after the E brief, exact snapshot hash, blank decision form, authority
statement and preserved potential dissent. Selecting the older invalid snapshot
returned a visible recording blocker and no decision form. The temporary local
server was stopped. HTTP and component checks do not establish browser acceptance.

## Limitations and what this demonstrates

This build demonstrates deterministic recording, exact evidence traceability,
explicit human input, preservation of review and unresolved dissent, rejection
of stale/invalid inputs and exclusive local file creation. It does not demonstrate
that a decision is correct, justified, approved or made by an authenticated person.

Hashes are not signatures. Identity, authority, authorship and timestamps are not
independently attested. A consistently rewritten bundle and its hashes require
separately trusted fingerprints to detect. Local files are not an immutable
multi-process audit service. Repeated reads narrow but do not eliminate external
concurrent-write races. An interrupted exclusive write can leave an invalid file;
it is retained and rejected rather than repaired or overwritten.

No recommendation, confidence/trust/readiness score, consensus, semantic
correctness, participant-confirmed meaning, dissent materiality, complete dissent
detection, representativeness, policy sufficiency or organisational effectiveness
is established. All corpus testimony is synthetic; test success establishes no
performance on real consultation evidence. Existing WITNESS limitations are
preserved in full, not resolved by the human decision.

Human-led save/reload acceptance was completed on 2026-09-08. The valid CAND-002 snapshot reloaded with the separately saved Human Decision Record, exact human-authored decision and rationale, HUMAN-REVIEWED / CONFIRM state, preserved POTENTIAL_UNSEEN_DISSENT, unresolved limitations and Decision → Brief → Snapshot → original evidence trace. The older invalid snapshot produced a visible validation blocker and no valid decision-recording path. Browser/release review remains required for keyboard/focus, mobile width, 200% zoom, reduced motion and forced colours. Unit,
component, type, build and HTTP checks alone do not establish accessibility
acceptance. No automated browser harness was added.

## Exact changed files

- `DESIGN.md`
- `PRODUCT.md`
- `app/gaia/policy-evidence/page.tsx`
- `app/gaia/policy-evidence/decision-actions.ts`
- `docs/builds/BUILD-001F.md`
- `features/gaia/policy-evidence-decision-panel.tsx`
- `features/gaia/policy-evidence-decision.test.tsx`
- `features/gaia/policy-evidence-decision.tsx`
- `lib/gaia/policy-evidence-decision-boundary.ts`
- `lib/gaia/policy-evidence-decision-store.ts`
- `lib/gaia/policy-evidence-decision.test-support.ts`
- `lib/gaia/policy-evidence-decision.test.ts`
- `lib/gaia/policy-evidence-decision.ts`

Final working tree: three modified tracked files and ten new untracked files listed
above; nothing staged. Ready for SMITH implementation review with the limitations
and browser review still explicit. No commit, tag, push or deployment.
BUILD-001G has not begun.
