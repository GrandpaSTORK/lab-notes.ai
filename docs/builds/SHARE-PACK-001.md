# SHARE-PACK-001 — Hosted Synthetic Builders Night Demo

## Starting checkpoint and purpose

Before changes, branch `builders-night-demo`, HEAD and `build-001h-pass` were
verified. HEAD and tag both resolved to
`5ff6a927b1a709bcce92c29bf4bf4bc91fea8e1e`; the working tree was clean.
The existing build-policy-evidence skill, product/design contracts, route,
read/write paths and installed Next.js output-file-tracing guide were inspected.

> The hosted demo must use the same frozen synthetic evidence as the sealed
> local demonstration. Deployment must not regenerate, repair or reinterpret it.

This is packaging and a read-only deployment adapter, not BUILD-001I. The
demonstration remains built on Hypership's lab-notes.ai foundation. No A–H
validator, interpretation, stored theme, review, dissent, decision, association,
epistemic state or G comparison rule changed.

## Exact package and preservation

`content/demo/policy-evidence/` is a separate evidence root. It mirrors the
original logical paths so existing loaders and embedded trace references do not
need rewriting:

```text
content/demo/policy-evidence/
  content/playbooks/policy-evidence/policy-evidence.data.json
  .local/gaia/policy-evidence/run-NSHiGl/
    proof.json
    reviews.json
    dissent.json
    trust-evidence-CAND-002-20260908163747161.json
    human-decision-a41cb8d3-6c37-4eec-be5c-4b330c764de2.json
```

These are six exact byte copies, created exclusively after checking the original
hashes. The nested `.local` name is part of the portable loader-root layout; it
is not the ignored workstation evidence directory. Git sees all six package
files. `.gitattributes` disables text conversion for the package so checkout
cannot normalize their bytes. The original source file and ignored local run
remain unchanged. The older intentionally invalid snapshot, generation scripts,
runtime logs, method files, environment files and credentials were not packaged.

The same SHA-256 value below applies to the original before copying, the packaged
copy after copying and the originals/copies checked after verification:

| Artifact | Exact SHA-256 |
| --- | --- |
| Source | `4eddb75d3c8e1611d9646940cc0f35bf8756b2c8f8ad59a71cb281110104ad1b` |
| Proof | `e2f418191c8e23b29919bf197b121103cee3621a1cc713c0f1fc060c6833531e` |
| Reviews | `3ebc24f13b850b215b140ec1e3e5ccb80c2850620c6d88fdb5b686fb8f7dd7c8` |
| Dissent | `456cc0aaac56b342016869d310b240db295a81ab65074c9ba9aec7cd1c94e015` |
| D snapshot | `a60b252f387d3c140f588bdbbbe35338cc272904f04e7b62167561c3366a88cf` |
| F decision | `6215c631eddd52f202abff315ecfc398ae99ff3425b7e41a82bb7c1a0040fe20` |

The source remains visibly synthetic; the saved F maker, role, authority and
decision are explicitly synthetic demonstration values. Packaged JSON and
decoded embedded evidence were inspected, with an additional check for obvious
credential/personal-path markers returning none. This bounded inspection is not
a general secret-detection guarantee. No private testimony or real consultation
dataset was introduced.

## Read-root adapter and failure behavior

`evidenceLocation` selects one root from server environment only:

- Normal local mode: repository root, retaining the existing source path and
  `.local/gaia/policy-evidence` behavior.
- `GAIA_HOSTED_DEMO=1` or `VERCEL=1`: the packaged evidence root, even when local
  evidence also exists. Vercel mode cannot be disabled by setting the demo flag
  to zero. Request hosts and query strings do not select write permissions.

Hosted mode checks all six pinned identities before calling existing loaders.
Missing or changed packaged bytes block the hosted projection. It does not try
local data, manufacture zero dissent, repair artifacts or regenerate evidence.
Existing validators still validate the A–H evidence chain; the package identity
check adds no semantic judgment. Explicit invalid brief selections retain the
existing failure behavior.

The route remains `/gaia/policy-evidence`. H is still the first GAIA content.
Local host restrictions remain for ordinary local mode; hosted mode permits
public read access to the exact synthetic package. The frozen paths shown in
evidence are original logical paths relative to the selected evidence root,
not claims that a hosted server is reading the workstation's ignored directory.

`next.config.ts` explicitly includes the two mirrored package subtrees in the
route's server trace and excludes the original root `.local` tree. Production
trace inspection found all six unique packaged artifacts and zero original
local artifacts. The source occurred under two equivalent resolved trace entries;
deduplicating resolved paths confirmed six unique files. No evidence was changed
to adjust tracing. The package is server evidence, not a `public/` asset folder.

## Hosted read-only enforcement

The hosted view visibly states:

> Hosted demonstration — read-only. Decision recording is disabled.

Review saving and snapshot creation are also visibly disabled. The F form and B
review forms are omitted, and D's freeze button is omitted. Saved review,
snapshot and decision evidence remain inspectable; presentation flags do not
change the saved evidence state or F's `RECORDED` status.

All three existing server actions independently reject hosted mode before
parsing input, consulting request headers or calling a writer. A forged localhost
Host header does not enable writes in hosted mode. Client handler guards also
refuse read-only submissions. No action writes into the package or creates
serverless evidence files. Local development keeps its original controls and
local-only action gates. No database, authentication, model dependency, model
call, new policy recommendation or new decision was added.

## Running and preparing deployment

Use the existing Next.js project and build command. Configure
`GAIA_HOSTED_DEMO=1` in the hosted deployment environment explicitly; `VERCEL=1`
also selects and enforces hosted mode. No API key or evidence-generation step is
required. Commit the reviewed package/configuration before deploying so all six
trackable files are present; this work stops before that release step.

For a local production-mode inspection in PowerShell:

```powershell
npm.cmd run build
$env:GAIA_HOSTED_DEMO = "1"
npm.cmd run start -- --hostname 127.0.0.1 --port 3118
```

Open `/gaia/policy-evidence`. Unset the flag in a new/local development shell to
return to ordinary local evidence selection. Do not regenerate evidence during
deployment. A missing or invalid package must be investigated as an integrity
failure, not worked around with another snapshot.

## Verification

The 13 new tests cover canonical identities and exact local/copy equality when
the ignored counterparts are available, immutable reads, isolated local/hosted
root selection, all six corrupt-package cases, validated packaged H READY,
20 responses/six exact themes, original CAND-002 wording, HUMAN-REVIEWED/CONFIRM,
unchanged potential dissent, RECORDED F, recomputed matching G, no model-process
or fetch call, server action rejection even with localhost headers, and omitted
hosted write controls with saved evidence still visible.

The initial focused run passed 257 tests before adding the explicit no-call test.
Typecheck exposed a weak environment-object type, corrected to a string-keyed
environment record. A default-worker final focused run had 256 passes and two
timeouts: the existing snapshot interaction test and a new expensive deep-byte
comparison. The latter was replaced with exact `Buffer.equals`, preserving the
check. The reduced-worker focused rerun passed all 258 tests. No upstream test or
timeout setting was modified.

| Check | Exact result |
| --- | --- |
| `npm.cmd test -- lib/gaia features/gaia` | 256 passed, two timeouts across 19 files; 30.52 seconds |
| `npm.cmd test -- lib/gaia features/gaia --maxWorkers=2` | Final focused run: 258 passed across 19 files; 50.48 seconds |
| `npm.cmd run typecheck` | Passed after the environment type correction |
| `npm.cmd run lint` | Passed |
| `npm.cmd run build` | Passed; Next.js 16.3.1, 65 static pages; policy-evidence remains dynamic |
| `npm.cmd test` | 396 passed, two failed across 43 files; 43.91 seconds |
| `npm.cmd test -- --maxWorkers=2` | 397 passed, one failed across 43 files; 87.14 seconds |
| `git diff --check` | Passed |
| Packaged D/F validation and G recomputation | Existing loaders/validators pass; F RECORDED, G RECORDED_EVIDENCE_MATCHES_CURRENT |
| Bundle inspection | Six unique packaged artifacts, zero original local artifacts |
| Preservation | All six originals and all six copies match the expected hashes after verification |

The default full-suite failures were the unchanged Windows Claude-symlink
assertion at `tests/playbook-skills.test.ts:44` and a timeout in the unchanged
snapshot interaction test at `features/gaia/policy-evidence-snapshot.test.tsx:55`.
With two workers, the snapshot test passed and the sole remaining failure was
the known Claude path resolving to itself instead of `.agents/skills`. No
upstream test, symlink, discovery behavior or timeout setting was changed to
mask either result. Approved execution outside the sandbox was used for Windows
test/build workers and read-only TypeScript validation commands.

The production server ran locally with `GAIA_HOSTED_DEMO=1` after the production
build. `/gaia/policy-evidence` returned HTTP 200 using both a localhost Host header
and a non-local demonstration Host header. Actual rendered HTML showed H READY,
20 responses/six themes, CAND-002, CONFIRM, POTENTIAL_UNSEEN_DISSENT, RECORDED and
RECORDED_EVIDENCE_MATCHES_CURRENT. The read-only notice was present; no evidence
write forms, textareas, decision-record or snapshot-freeze buttons were present.
Every H fragment link resolved to one rendered ID. The temporary server was
stopped. These are production HTTP/DOM checks, not browser accessibility or
actual Vercel acceptance.

## Boundaries and review status

> Verification must name its boundary.
>
> Summary is not the product. The evidence trail is.

Matching packaged hashes establishes byte identity and preserved traceability,
not truth, materiality, semantic correctness, participant-confirmed meaning,
representativeness, consensus, policy sufficiency, decision correctness or
organisational effectiveness. Human review and the synthetic decision keep their
existing authority boundaries. Potential dissent remains potential. No claim of
complete dissent detection or real consultation performance is established.

This checks a local production server and its deployment trace. Actual Vercel
deployment, remote runtime behavior and browser/release acceptance are separate
checks after review. No deployment was performed. Keyboard/focus, mobile width,
200% zoom, reduced motion and forced colours are not accepted by unit/HTTP checks.
The read-only application policy is not an external signature or an operating
system immutability claim; the package still relies on controlled repository and
deployment contents. Existing filesystem race and historical-signature limits
remain unchanged.

## Exact changed files

Modified tracked files (11), including the decision action and policy-evidence route:

- `.gitattributes`
- `DESIGN.md`
- `PRODUCT.md`
- `next.config.ts`
- `app/gaia/policy-evidence/actions.ts`
- `app/gaia/policy-evidence/decision-actions.ts`
- `app/gaia/policy-evidence/page.tsx`
- `app/gaia/policy-evidence/snapshot-actions.ts`
- `features/gaia/policy-evidence-decision-panel.tsx`
- `features/gaia/policy-evidence-review.tsx`
- `features/gaia/policy-evidence-snapshot-panel.tsx`

New files (13):

- `features/gaia/policy-evidence-hosted.test.tsx`
- `lib/gaia/policy-evidence-demo-root.ts`
- `lib/gaia/policy-evidence-demo-root.test.ts`
- `lib/gaia/policy-evidence-demo.test-support.ts`
- `lib/gaia/policy-evidence-hosted-mode.ts`
- `lib/gaia/policy-evidence-hosted-actions.test.ts`
- `content/demo/policy-evidence/content/playbooks/policy-evidence/policy-evidence.data.json`
- `content/demo/policy-evidence/.local/gaia/policy-evidence/run-NSHiGl/proof.json`
- `content/demo/policy-evidence/.local/gaia/policy-evidence/run-NSHiGl/reviews.json`
- `content/demo/policy-evidence/.local/gaia/policy-evidence/run-NSHiGl/dissent.json`
- `content/demo/policy-evidence/.local/gaia/policy-evidence/run-NSHiGl/trust-evidence-CAND-002-20260908163747161.json`
- `content/demo/policy-evidence/.local/gaia/policy-evidence/run-NSHiGl/human-decision-a41cb8d3-6c37-4eec-be5c-4b330c764de2.json`
- `docs/builds/SHARE-PACK-001.md`

Stop for SMITH review. No merge to `gaia-policy-evidence`, commit, tag, push or
deployment. `build-001h-pass` is unchanged. BUILD-001I has not begun.

Final working tree: 11 modified tracked files and 13 new files (including the
six Git-trackable evidence copies); nothing staged. All changes remain available
for review on `builders-night-demo`.
