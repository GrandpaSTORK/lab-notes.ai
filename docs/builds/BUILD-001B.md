# BUILD-001B — Human Review

GAIA extends Hypership's lab-notes.ai and build-policy-evidence foundation.
BUILD-001A at tag `build-001a-pass` remains recoverable. Its validators, tests,
generation command, corpus and proof artifacts are unchanged by this phase.

## Local use

```powershell
npm.cmd run dev -- --hostname 127.0.0.1
```

Open `http://127.0.0.1:3000/gaia/policy-evidence`. The route and save action accept
local hostnames only. Keep the server bound to loopback. No account, model call,
external review service, database or deployment is part of this proof.

The page revalidates BUILD-001A artifacts and chooses the most recent valid
generation timestamp. Invalid runs are skipped with a visible notice. If none
is valid, it displays `npm.cmd run gaia:generate` without fabricating candidates.
The question is read only from a method record whose hash matches the proof.
No proof data is statically rendered at build time.

## Human authority

No disposition is preselected. CONFIRM, REVISE, REJECT and HOLD DISSONANCE use the
same controls and save operation. All require a non-blank rationale. REVISE also
requires separate human wording; the original assessment is never transferred
to it. Rejected and held interpretations remain visible. Holding dissonance
explicitly remains unresolved. Further reviews append events rather than deleting
previous judgments. No personal reviewer identity is recorded.

The always-visible WHAT WAS NOT ESTABLISHED boundary distinguishes exact source
matching from semantic correctness. WHY THIS INSIGHT? shows exact quotes,
locations, model explanations, full original testimony, separately labelled
support/contradiction/qualification/ambiguity and mechanically verified facts.
The complete examination includes records assigned no relevant bearing.

## Storage and export

Reviews are saved in `.local/gaia/policy-evidence/<selected-run>/reviews.json`.
Schema `BUILD-001B/1` binds them to the exact proof SHA-256 and records global
review revision numbers with an append-only event list. Each event preserves the
original wording/assessment, disposition, rationale, optional revision and time.
The application never writes `proof.json` or the original corpus.

Saving reloads and validates the latest proof, submitted fingerprint and review
revision. Changed proof associations fail visibly. Corrupt or stale stored reviews
are not applied or overwritten; saving/export is disabled until the local file
is inspected and separately preserved. Older runs retain their own histories;
reviews are never transferred automatically to a newer run.

Writes use a temporary file and rename. This is a single local Node-process proof,
not an authenticated, tamper-proof audit system or multi-process storage service.
The interface updates after a successful save; it does not poll for external file
changes. A stale browser save fails and retains its draft.

The Trust Evidence Snapshot contains every candidate, original assessment,
evidence relationship, full testimony, boundary, limitation, current review state
and history, unreviewed count and generation provenance. It is enabled after a
valid review; unsaved drafts are excluded. Export is a local JSON download, not
a recommendation, trust score, consent record or proof of effectiveness.
Revisions remain subject to new assessment/review.

## Verification

```powershell
npm.cmd run test -- lib/gaia/policy-evidence.test.ts lib/gaia/policy-evidence-review.test.ts features/gaia/policy-evidence-review.test.tsx
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test
```

Tests exercise the WITNESS distinction without inventing semantic ground truth:
an exact quotation may be traceable while its asserted relationship remains
contestable. Fixture candidates exist only in test support, never in the page.
Storage tests use temporary directories and verify proof/source byte preservation.
An optional local test revalidates the original real BUILD-001A artifact when
available. Manual release review still covers keyboard use, 200% zoom, mobile
width, reduced motion and forced colours. No browser-test harness is added.

The upstream Windows Claude-symlink checkout failure, if present, is reported
separately. No BUILD-001C or Unseen Dissent Test is included in this phase.
