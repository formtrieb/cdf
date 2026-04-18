# Big-DS Primer Port — Session Brief

**Status:** Operational handoff for the third Big-DS pass.
**Assumes:** draft.7 has landed (see
[`specs/2026-04-17-draft7-plan.md`](./specs/2026-04-17-draft7-plan.md)).
If it has not, **stop and land draft.7 first** — this brief cites the
Token-Driven-Principle prose that T2/T3/T4 introduce.

**Companion docs:**
- [`BIG-DS-SHADCN-BRIEF.md`](./BIG-DS-SHADCN-BRIEF.md) — prior pass,
  same (γ)-bridge strategy, different ownership story.
- [`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md) — the
  findings this pass builds on. Read the F-shadcn-3 reframe before
  authoring; it is the principle draft.7 now enforces.
- [`BIG-DS-RADIX-BRIEF.md`](./BIG-DS-RADIX-BRIEF.md) — first pass,
  headless, no tokens.

## Mission (one paragraph)

Primer is GitHub's design system and ships `@primer/primitives` as a
**real DTCG token package** — `$value`, `$type`, `$description`,
`$extensions`, multi-theme file layout. shadcn stressed the
token-bridge when tokens were *not really tokens* (consumer-owned CSS
vars). Primer stresses it the opposite way: the tokens ARE tokens, the
DS owns them, the format is exactly the one CDF claims to support. This
pass answers *"does the γ-bridge work when the source is the ideal
happy path it was designed for?"* — and by extension: **does draft.7's
newly explicit Token-Driven Principle describe Primer correctly
without bending?** Output is two component specs and a `findings.md`
focused on real-DTCG adoption plus multi-theme mapping.

## Setup

```
primerTests/
  primer.profile.yaml         ← adopts @primer/primitives tokens via (γ)
  .cdf.config.yaml            ← prefix `pr`, theme axis semantic
  specs/
    button.component.yaml     ← canonical Primer component, all axes
    label.component.yaml      ← small component, pair-pattern check
  findings.md
```

**Source-of-truth for Primer:**
- Local tokens (after Step 0): `primerTests/.primer-primitives/src/tokens/**/*.json`
- Upstream repo (reference only): https://github.com/primer/primitives
- Docs: https://primer.style/foundations/primitives
- Button docs: https://primer.style/components/button
- Label docs: https://primer.style/components/label
- Primer uses DTCG 2025.10 format. Confirm by reading any `*.json` in
  `.primer-primitives/src/tokens/functional/color/light/` — top-level
  keys use `$value`, `$type`, `$description`, `$extensions`. If the
  format differs (e.g. legacy `value`/`type` without `$`), log as
  F-primer-0; the (γ)-bridge assumes real DTCG.

## γ-Bridge strategy (pre-committed)

**Use (γ) again.** shadcn findings already proved (γ) absorbs a foreign
token surface with 0 format changes. The question this pass answers is
whether (γ) holds when the source format is *richer* than shadcn's
CSS-var dump — specifically, whether DTCG metadata (`$type`,
`$description`) can be mirrored into `standalone_tokens` prose, or
whether (γ) leaks when the token surface becomes self-documenting.

**Do NOT reopen the (γ)/(β) debate unless** you hit one of these:
- Primer's `$extensions` carries semantics CDF needs to preserve but
  has no slot for (e.g. mode-mapping metadata that the Profile must
  read to validate theme coverage)
- Per-token `$type` conflicts with CDF's own token-grammar types in a
  way that cannot be reconciled in prose

Either of these is a genuine format gap worth logging as F-primer-0
and escalating. Anything else is within (γ)'s reach.

## Working sources to consult

- `shadcnTests/shadcn.profile.yaml` — start by copying this. Primer's
  bridge strategy is the same; only the token paths and theme
  mechanics change.
- `specs/v1.0.0-draft/CDF-PROFILE-SPEC.md` §6.11 (`standalone_tokens`),
  §6 intro (Build-Time-Enumerability, new in draft.7)
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` §1.1 Principle #2
  (Token-Driven, reformulated in draft.7), §13 intro (Build-Time
  Resolution, new in draft.7)
- `formtrieb.profile.yaml` — reference for deep token-grammar shape
  (Formtrieb's 5-level paths). Primer's depth is similar (3–4 levels);
  this is the first third-party DS whose depth is *close* to Formtrieb's.

## Step-by-step

### Step 0 — Provision Primer (≈2 min)

Clone `@primer/primitives` into the test directory so subsequent steps
can `Glob`/`Read` the token JSONs locally instead of paying a WebFetch
roundtrip per file.

```bash
mkdir -p primerTests
git clone --depth 1 https://github.com/primer/primitives.git \
  primerTests/.primer-primitives

# Record the pinned commit in findings.md for replay
cd primerTests/.primer-primitives && git rev-parse HEAD
echo "/.primer-primitives/" >> primerTests/.gitignore
```

Verify the expected layout exists:

```
primerTests/.primer-primitives/src/tokens/
  base/          ← primitive tokens (colors, type-scale, spacing)
  functional/    ← semantic mappings per theme
    color/
      light/
      dark/
      light_colorblind/   ← note for F-primer-2 theme-axis decision
      dark_colorblind/
      light_tritanopia/
      dark_tritanopia/
      light_high_contrast/
      dark_high_contrast/
```

If the layout differs (Primer reorganises their token tree from time
to time), log as F-primer-0 and adapt the token-surface target in
Step 1. Do NOT rely on npm-installed `@primer/primitives` — the
published package ships compiled outputs and may omit the raw source
JSONs this pass needs.

Record in `findings.md`:
- Primer commit SHA
- Date of clone
- Any layout deviations from the tree above

### Step 1 — Profile (≈60 min)

Start from `shadcnTests/shadcn.profile.yaml`. Replace content, keep
structure.

Tasks:
- **Identify the token subset.** Full Primer primitives is large; for
  two components, target `color.btn.*` (Button) and `color.fg.*` /
  `color.bg.*` (Label). Enumerate only what the two components touch.
  Budget: **≤25 `standalone_tokens`**. If the bridge needs more to
  stay honest, log as F-primer-1 before pushing past 25.
- **Theme axis mapping.** Primer ships multiple theme files: `light`,
  `dark`, `light_colorblind`, `light_tritanopia`, `dark_colorblind`,
  `dark_tritanopia`, `light_high_contrast`, `dark_high_contrast`.
  CDF's `theming.modifiers` has one semantic axis by default.
  Decision to make early: does Primer's theme matrix map to
  **one axis (semantic) with eight values**, or **two axes
  (semantic × vision-accommodation)**? Neither is wrong; pick based
  on which makes the CDF Profile legible. Document the choice as
  F-primer-2 with rationale.
- **Vocabulary for `variant`.** Primer Button: `[default, primary,
  danger, invisible, link]`. Label: `[default, primary, secondary,
  accent, success, attention, severe, danger, done, sponsors]`
  (confirm against current Label docs — the set changes).
- **Vocabulary for `size`** (Button only): `[small, medium, large]`.
- **`interaction_patterns`** — reuse `pressable` from the Radix
  profile. Primer Button states are rest/hover/active/disabled.
- **Prose ownership.** Each `standalone_tokens` entry SHOULD cite
  its Primer origin in `description:` — e.g. *"from
  @primer/primitives v{N}, src/tokens/functional/color/light/button/
  primary.json. DTCG $type: color."*  This is the (γ) evidence
  mechanism; it also doubles as the regression anchor if Primer
  renames paths.

Watch for:
- **DTCG `$type` vs. CDF token-grammar types.** CDF groups token
  paths by semantic family (`color.controls.*` etc.) and doesn't
  require per-token typing. Primer's DTCG tokens carry explicit
  `$type`. Decide whether Profile prose should mirror the `$type`
  (redundant but discoverable) or leave it to the source. F-primer-3
  if the mismatch is more than cosmetic.
- **`$extensions.org.primer.mode` or similar.** Primer uses
  `$extensions` to declare which modes a token participates in.
  CDF Profile has no slot for this. Ask: does the Profile need to
  encode mode-participation, or can it trust that theme files are
  parallel? If the latter: prose note. If the former: F-primer-0
  candidate (genuine format gap).

### Step 2 — Button (≈1h)

Primer Button is the canonical interactive surface. Same shape as
shadcn Button structurally; different ownership story.

Component surface:
- `variant: [default, primary, danger, invisible, link]`
- `size: [small, medium, large]`
- `disabled: boolean` (maps to states.disabled)
- States: `default, hover, active, disabled, focus`
- `loading: boolean` — Primer Button has a native loading state with
  spinner. Decide: model as `states.pending`, or as a boolean
  property with its own tokens? Look at how the Formtrieb Button handles
  loading for consistency. F-primer-4 if neither maps cleanly.

`tokens:` block:
- Each variant × state cell references a `color.btn.*` token path
- Primer DOES have distinct tokens for hover/active/disabled — unlike
  shadcn's runtime-opacity. This is the **ideal case** for CDF's
  token-driven principle. Every state cell should bind cleanly;
  CDF-CON-006 should never fire. If it does, that is a Primer token
  the (γ) bridge failed to surface — F-primer-5 candidate.

Watch for:
- **Focus ring.** Primer uses a `focus-visible` outline token.
  §13.5-compatible? Cross-check with shadcn's F-shadcn-5 (single-ring
  pattern) — this is the second data point. If both Primer and
  shadcn document `focus` the same way, draft.8 can codify the
  pattern.
- **Pair pattern (bg + fg).** Same as shadcn. Primer is explicit:
  `color.btn.primary.bg` + `color.btn.primary.text`. The
  Component spec should bind both sides; confirm the pair is
  legible in the token block output.

### Step 3 — Label (≈30 min)

Small surface: ~10 variants, no sizes, no interactive states.
Primarily exercises the variant → (bg, fg) pair across a long enum.

Watch for:
- **Variant count.** Label has more variants than Button. Does the
  `standalone_tokens` block balloon? If it does, re-evaluate whether
  enumerating variant × side (20 entries) vs. declaring a
  token-grammar with `variant` as a dimension is cleaner.
  Cosmetic-vs-structural decision — F-primer-6 if the prose-only
  approach visibly strains.
- **Consistency with Button.** Primer names Button variants
  `primary/danger/invisible`, Label variants
  `primary/secondary/accent/success/attention/severe/danger/done`.
  Overlap is small. The Profile's vocabularies will be separate per
  property scope, not one global `variant` — test that CDF's vocab
  scoping handles this cleanly (it should).

### Step 4 — Validate + decide

Same triage as shadcn:
- Real format gap → `findings.md` with proposed patch
- Validator behind spec → cdf-core TODO
- My misunderstanding → fix the spec

**Run CDF-CON-006 explicitly** (draft.7's new rule). Expected: zero
hits across both components. Primer is token-driven by design; if
CDF-CON-006 fires, either (a) a Primer token was missed in the
Profile, or (b) draft.7's prose has a loophole.

**Format-change budget for Primer pass: ≤2 new optional fields, ≤1
new toggle.** Same as shadcn. The hypothesis under test is that
draft.6 + draft.7 together absorb DTCG natively with zero structural
growth. A third 0/2 pass would be strong evidence.

If the budget is exceeded, **stop, write up, defer Material 3**.

### Step 5 (optional) — LLM cross-test

If time permits, hand a fresh LLM the Primer Profile + Button spec +
Primer's public Button docs. Compare its reading of the token
bindings against the authored spec. Same goal as prior passes:
ambiguity detection.

Extra Primer-specific angle: ask the LLM to trace one token (e.g.
`color.btn.primary.bg.hover`) from the Component spec through the
Profile's `standalone_tokens` entry back to the `@primer/primitives`
JSON file. If any step in that chain is ambiguous, the prose-ownership
pattern has a legibility gap worth fixing.

## findings.md format

Same template as shadcn. F-primer-N numbering. F-primer-0 reserved
for the (γ)/(β) escalation question (expected resolution: "(γ) held;
no escalation").

Carry-over findings from Radix and shadcn stay in their own files —
don't re-log unless Primer surfaces a new dimension of the same
friction. F-shadcn-2 (utility-class-owned axes) is NOT expected to
re-appear (Primer doesn't use utility classes), so this pass provides
no new data for it. Material 3 still carries that question.

## What you are NOT doing in this session

- **Not porting the rest of Primer** (Box, Stack, Dialog, Autocomplete,
  etc.). Two components is the whole job.
- **Not building a real Primer toolchain.** The Profile describes the
  adoption; we don't generate or consume real Primer components.
- **Not auditing `@primer/primitives` itself.** Take Primer's tokens
  as given. If a token is surprising, note it and move on — that's a
  Primer question, not a CDF question.
- **Not extending the Validator beyond draft.7.** Log; don't fix.
- **Not re-opening F-Radix-3 (asChild).** Primer's `asChild` equivalent
  is Primer's own `as` prop with different mechanics; skip it.
- **Not mapping all eight Primer theme variants.** Pick light + dark
  as the canonical axis; log vision-accommodation variants as
  future-scope in F-primer-2.

## When you're done

Hand back with:

1. Files in `primerTests/` (profile, two specs, findings.md)
2. Write `docs/BIG-DS-PRIMER-FINDINGS.md` — the summary doc with
   format-budget tally, top-3 frictions, and a verdict:
   - "γ-bridge absorbed real DTCG; go to Material 3 next" OR
   - "γ-bridge strained at the `$extensions` / mode-mapping layer;
     draft.8 decides before Material 3"
3. One commit per major step.

The headline question this brief answers — *does draft.6+draft.7
describe real DTCG without bending?* — gets a clear yes/no/qualified-
yes from the findings doc.

## Why Primer before Material 3

Four-rung ladder now:
- Radix tests **headless** (no tokens at all)
- shadcn tests **token-bridge-external** (tokens exist but are
  consumer-owned, shipped as CSS vars)
- **Primer** tests **token-bridge-DTCG** (tokens exist, DS-owned, in
  the format CDF explicitly claims to support)
- Material 3 tests **token-bridge-exotic** (rich tokens, non-DTCG
  format, own toolchain)

Skipping Primer and going directly to Material 3 means jumping from
shadcn's "no real DTCG" case to Material 3's "rich, non-DTCG" case
without ever testing the ideal case in between. If Primer surfaces a
gap, the gap is in draft.7's explicit principle — a fixable prose
problem. If the same gap first surfaces in Material 3, it mixes with
Material-specific frictions and becomes hard to attribute.

Primer is also the **smallest legitimate DTCG test**: it publishes
real tokens, the repo is public and small, and two components can be
authored end-to-end in one session. Material 3 cannot promise that.

## Success signal

Three foreign-DS passes with **0/2 and 0/1** format-change budgets
would be decisive evidence that the CDF format, at draft.7, is
stable across the practical range of DS architectures from headless
through DTCG. That's the signal that unblocks draft.7 → draft.8 as a
refinement pass rather than a growth pass. Anything less than 0/2
and 0/1 is useful data, not a failure — but the delta is what
decides whether Material 3 opens with confidence or with caution.
