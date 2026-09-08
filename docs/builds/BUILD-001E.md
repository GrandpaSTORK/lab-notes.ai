# BUILD-001E — Decision Evidence Brief

GAIA extension built on **Hypership's lab-notes.ai and build-policy-evidence
foundation**. GAIA did not author the upstream foundation.

## Starting checkpoint and preservation gate

Before any file change, HEAD and `build-001d-pass` both resolved to
`c9390af90fba0a57117a71bc28bba54078cafa49` on `gaia-policy-evidence`.
`git status --porcelain=v1` was empty. Implementation began only after that gate
passed and preservation hashes were recorded.

PRODUCT.md, DESIGN.md, the A/B/C/D build records and current policy-evidence modules
were inspected. There is no `docs/builds/BUILD-001A.md` in the sealed checkout;
`docs/builds/BUILD-001.md`, headed “BUILD-001A: Policy Evidence evidence spine”,
is the existing A record and was used without renaming it.

No A/B/C/D evidence artifact was created, rewritten, migrated, normalized or
regenerated. No model call occurred. No upstream validator, review action,
snapshot composer or generation command was modified.

## Purpose and authority

The brief organizes one validated BUILD-001D/1 frozen snapshot into a short
decision-facing reading view. It is a deterministic projection, not a new
recommendation, semantic examination, human judgment or evidence artifact.

> Summary is not the product. The evidence trail is.
>
> The brief may organize evidence. It may not upgrade evidence.
>
> This brief is derived from a frozen Trust Evidence Snapshot. It introduces no new model interpretation or human judgment. Every substantive element remains traceable to the frozen snapshot and its embedded source evidence.

The frozen Trust Evidence Snapshot remains the evidence-bearing artifact. Exact
wording and recorded human dispositions are copied without upgrading their authority.
CONFIRM, REVISE, REJECT and HOLD_DISSONANCE remain unchanged; revised wording and
review history remain inspectable. CONFIRM can coexist with potential unseen dissent.

## Architecture and input validation

`projectDecisionBrief` accepts the exact bytes of one snapshot and its expected
identity: run, candidate, filename and SHA-256. It checks the fingerprint and uses
the existing `validateSnapshot` function to validate the complete frozen object
against its embedded exact source/proof/review/dissent bytes. It then checks run,
candidate and filename agreement.

Unsupported fields, malformed states, corrupted JSON, altered embedded bytes,
fingerprint mismatches, invalid embedded dissent and selection mismatches are
rejected. No older schema or label is migrated. The projection's substantive
values all come from that one snapshot; optional current-local fingerprints
inform only the separate current-versus-historical comparison.

The projection contains exact frozen interpretation, human review, original
coverage and evidence, potential dissent, unresolved limitations and trace
metadata. It has no clock-dependent output, semantic scoring, summary generation,
model invocation or write operation. Identical bytes, identity and comparison
metadata produce an identical projection.

`loadDecisionBrief` reads the selected snapshot without writing files. It checks
the selected local proof, validates run/filename syntax, fingerprints exact
snapshot bytes and rechecks both the snapshot and local selection before returning.
The new snapshot reads are explicitly excluded from Turbopack deployment tracing:
ignored local evidence is read at request time, not bundled by those calls.

The existing `/gaia/policy-evidence` route renders the brief as a Server Component
before the working review. It adds no client component, model dependency, API,
database, authentication, external storage, PDF generator or deployment feature.

## Selection and current versus historical evidence

The default selection is the most recent timestamp-named snapshot in the selected
run. The native “Choose a frozen snapshot” disclosure offers explicit file links.
An invalid selected file blocks the brief; the loader does not silently substitute
an older valid snapshot. Paths and repeated/malformed query parameters are rejected.

An explicit historical run may be addressed with `briefRun`, and a file with `brief`:

```text
/gaia/policy-evidence?briefRun=run-NSHiGl&brief=trust-evidence-CAND-002-20260908163747161.json#decision-evidence-brief
```

The trace distinguishes:

| Claim | Meaning |
| --- | --- |
| VALIDATED_AGAINST_EMBEDDED_BYTES | The frozen snapshot passed the existing portable validator |
| MATCHES_SELECTED_LOCAL_INPUTS | Run and all four fingerprints match the selected local inputs at load time |
| HISTORICAL_INPUTS_DIFFER | The portable snapshot is valid, but at least one current fingerprint or selected run differs; it is visibly not current evidence |
| NOT_CHECKED | Current-local comparison is unavailable; no current-evidence claim is made |

Current local bytes are never substituted into the brief. Changes to a current
review or dissent file cannot rewrite frozen testimony or human judgment. If current
optional files differ from the frozen ones, including invalid replacement bytes,
the valid frozen snapshot is historical rather than evidence about that replacement.
Invalid dissent **inside the selected frozen snapshot** always blocks the brief.
If the selected local proof itself cannot be validated, the route's existing proof
gate applies; no current brief is fabricated.

Historical snapshots are preserved, including the earlier pre-review snapshot
whose superseded label fails the sealed BUILD-001D validator. Selecting that file
shows an explicit blocker rather than repairing it.

## Brief presentation and epistemic classes

The initial brief area shows exact interpretation and candidate ID, human
disposition, examination coverage, frozen dissent state, current/historical
boundary and a direct trace link. Human review and unresolved limitations use
the same border, heading size and visual emphasis. Complete WITNESS limitations
remain visible, not reduced to a score or omitted for brevity.

- **MECHANICALLY VERIFIED:** coverage, source identity, exact quotation locations
  and faithful recorded relationships. This does not verify their semantic meaning.
- **MODEL-INTERPRETED:** frozen candidate wording, original relationships, challenge
  explanations and novelty explanations.
- **HUMAN-REVIEWED:** only the saved disposition and rationale. The exact preserved
  scope says: “Only the saved human disposition and rationale are recorded here.
  This class does not confirm model meaning, challenge materiality or participant
  meaning.” An unreviewed candidate remains UNRESOLVED.
- **UNRESOLVED:** the complete frozen “what was not established” limitations,
  including semantic correctness, materiality and participant-confirmed meaning.

The evidence state shows all source IDs and the original assessment and reason.
Native disclosures retain original relationships, exact quotations, UTF-16
zero-based/end-exclusive offsets and exact complete testimony. Dissent findings
retain POTENTIAL_UNSEEN_DISSENT, source IDs, quotes, offsets, original relationship
objects, model explanations, novelty reasons, provenance and limitations.

The trace shows the snapshot path, creation time, run/candidate identity, exact
snapshot SHA-256 and all four embedded input fingerprints. Missing optional inputs
are explicitly ABSENT. A disclosure opens the existing full BUILD-001D evidence
view, and a download returns the exact original snapshot bytes as base64-backed
JSON, preserving formatting as well as content. No new brief artifact is written.

The layout targets a short 3–5 minute reading pass with optional deeper inspection;
reading time and usefulness have not been measured with users.

## Zero, absent and invalid dissent

| Frozen dissent condition | Brief behavior |
| --- | --- |
| Validated findings | Preserve the exact state and potential findings; no materiality judgment |
| Validated zero findings | Preserve both adjacent statements below, in order |
| ABSENT | Remains ABSENT with no dissent fingerprint and no zero-finding claim |
| INVALID, corrupted or inconsistent | Portable validation fails; a visible blocker replaces the brief and download |

> No potential unseen dissent was surfaced by this challenge run.
>
> This does not establish that no dissent exists.

## Preservation hashes

Before and after implementation/verification, the following exact files retain
identical SHA-256 values. Both existing snapshot files are retained; neither was
rewritten or replaced.

| File | SHA-256, before = after |
| --- | --- |
| Source corpus | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| run-NSHiGl/proof.json | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| run-NSHiGl/reviews.json | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |
| run-NSHiGl/dissent.json | `456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015` |
| trust-evidence-CAND-002-20260908163747161.json (selected) | `a60b252f387d3c140f588bdbbbe35338cc272904f04e7b62167561c3366a88cf` |
| trust-evidence-CAND-002-20260908160932579.json (older, invalid under sealed validator) | `4e4f9db00dfdf1c60bc0b2470bce7aa86199163ec3f071ba4e5f1a1cde31a755` |

## Tests and verification

New tests cover deterministic projection, exact wording and all four dispositions,
saved rationale/revision/history and scope, potential dissent without materiality
upgrade, zero/absent/invalid distinctions, complete testimony, quote/offset/source/
original-relationship preservation, all four epistemic classes, unsupported fields,
corrupted bytes, selection mismatches, historical/current separation, exact snapshot
download, byte/hash preservation, unchanged directory entries and no fallback repair.
Test-only filesystem setup writes are confined to temporary fixture directories.

Commands run:

```powershell
npm.cmd test -- lib/gaia features/gaia
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd test
git diff --check
```

Final results:

| Check | Result |
| --- | --- |
| Focused BUILD-001A/B/C/D/E tests | 125 passed across nine files; 14.88 seconds |
| Full repository suite | 264 passed, one failed across 33 files; 24.29 seconds |
| Typecheck | Passed |
| Lint | Passed |
| Production build | Passed; 65 generated pages, dynamic local evidence route, no broad-file-tracing warnings in the final build |
| `git diff --check` | Passed |

The sole full-suite failure remains the unchanged upstream Windows Claude-symlink
test at `tests/playbook-skills.test.ts:44`. It resolves the Claude discovery path
to itself rather than the shared agent skill directory. No upstream behavior was
changed to mask this failure.

Initial UI assertions matched duplicate evidence text in both the brief and its
expandable full snapshot. They were scoped to the intended brief regions; no
evidence was removed to satisfy the tests. An initial build warned about broad
dynamic-file tracing; request-time-only annotations were added for the new local
snapshot reads. No upstream behavior was modified to mask test or build results.

Local production HTTP inspection returned 200 and confirmed the selected CAND-002
brief rendered HUMAN-REVIEWED, CONFIRM, POTENTIAL_UNSEEN_DISSENT, current-input
agreement and both canonical boundary statements. Selecting the older invalid
snapshot blocked the brief and full-evidence trace without migration. This is
not browser accessibility acceptance.

## Limitations and release boundary

Successful validation establishes mechanical identity, traceability and faithful
projection only. It does not establish truth, semantic correctness, participant
meaning, materiality or novelty of dissent, consensus, representativeness, policy
sufficiency, organisational effectiveness, a recommendation, or a trust/confidence/
readiness score. Complete dissent detection is not established. All testimony is
synthetic. The operational consultation purpose and accountable policy owner remain
unknown. Hypership attribution and upstream evidence boundaries remain intact.

Hashes are not signatures or independent attestation of authorship/time. Local
comparison is a load-time check, not a live guarantee or a multi-process transaction.
The read-only brief does not poll for later changes; reload to compare again.

Browser accessibility/release review remains explicitly outstanding:
keyboard/focus, mobile width, 200% zoom, reduced motion and forced colours.
Unit, component and HTTP checks do not establish browser accessibility acceptance.
No automated browser harness or PDF generation was added.

## Exact changed files

- `DESIGN.md`
- `PRODUCT.md`
- `app/gaia/policy-evidence/page.tsx`
- `docs/builds/BUILD-001E.md`
- `features/gaia/policy-evidence-brief.tsx`
- `features/gaia/policy-evidence-brief.test.tsx`
- `lib/gaia/policy-evidence-brief.ts`
- `lib/gaia/policy-evidence-brief-store.ts`
- `lib/gaia/policy-evidence-brief.test.ts`

Stop for SMITH review. No commit, tag, push or deployment. BUILD-001F has not begun.
