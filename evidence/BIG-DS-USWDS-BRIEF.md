# Big-DS USWDS Port — Session Brief

**Status:** Release-validation handoff for the fifth (and final)
Big-DS pass before v1.0.0.
**Assumes:** draft.8 has landed (commit `0ee61d0`) AND the Material 3
pass is complete (commits `89cdfbf`…`2b43282`).

**Companion docs:**
- [`BIG-DS-MATERIAL3-BRIEF.md`](./BIG-DS-MATERIAL3-BRIEF.md) +
  [`BIG-DS-MATERIAL3-FINDINGS.md`](./BIG-DS-MATERIAL3-FINDINGS.md) —
  prior pass. F-material-1 (two-axis theming) and F-material-0
  (state-as-token) are the patterns this pass builds on.
- [`BIG-DS-PRIMER-FINDINGS.md`](./BIG-DS-PRIMER-FINDINGS.md) —
  F-primer-2 (vision-accommodation deferred) is THE deferred question
  this pass re-opens on a DS built to answer it.
- [`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md) —
  F-shadcn-0 footnote ((γ) is principle, not mechanism). USWDS is
  architecturally shadcn-nearest; expect the same flat-CSS-vars
  bridge via `standalone_tokens`.
- [`BIG-DS-RADIX-BRIEF.md`](./BIG-DS-RADIX-BRIEF.md) — first pass,
  headless reference.

## Mission (one paragraph)

USWDS (U.S. Web Design System) is the federal government's design
system, built to WCAG 2.1 AA as a minimum and to actively used
accessibility practice as the norm. Architecturally it is closest to
shadcn — tokens ship as Sass maps that compile to CSS Custom
Properties — but it is the **first DS in the series designed from the
ground up around accessibility-preference axes**: high-contrast mode,
reduced-motion, density, enlarged touch targets, and explicit
WCAG-grade colour contrast. Previous passes validated format stability;
**this pass is narrower**: it answers one specific deferred question —
*F-primer-2: can CDF's `theming.modifiers` carry accessibility-
preference axes as first-class without a new format category?* — on a
DS built to exercise it. Output is two component specs and a
`findings.md` focused on the vision-accommodation / preference-axis
question. If USWDS lands clean, F-primer-2 converts from deferred to
**resolved**.

## Setup

```
uswdsTests/
  uswds.profile.yaml          ← adopts USWDS tokens via (γ)-flat
  .cdf.config.yaml            ← prefix `us`, likely multi-axis theming
  specs/
    button.component.yaml     ← canonical interactive surface
    alert.component.yaml      ← accessibility-canonical status component
  findings.md
```

**Source-of-truth for USWDS:**

1. **USWDS GitHub repo** (`uswds/uswds`) — Sass tokens at
   `packages/uswds-core/src/styles/tokens/`, generated CSS at
   `dist/css/uswds.css`. Pin the commit SHA in findings.md for replay.
2. **Official design docs** (`designsystem.digital.gov`) — component
   behaviour, accessibility contracts, ARIA expectations.
3. **USWDS v3 token exports** — `@uswds/uswds` npm package ships
   compiled CSS variables alongside Sass. Use whichever surface is
   cleaner to enumerate; prose-annotate the source in `description:`.

## γ-Bridge strategy (pre-committed)

**Use (γ) via `standalone_tokens` as the default mechanism.** USWDS
tokens are semantically flat — e.g. `--usa-button-primary-default`,
`--usa-alert-info-background`. No grammar-shaped hierarchy at the
source level. This matches shadcn's shape, not Primer's or
Material 3's.

Per the F-shadcn-0 footnote clarification ((γ) is a principle, not a
mechanism), standalone_tokens is the honest choice. Do NOT:

- Try to force USWDS's flat names into a `token_grammar` with
  placeholders unless the Profile can articulate a genuine grammar
  shape (e.g. if `usa-{component}-{variant}-{state}` naturally
  emerges as a pattern across components — possible but not
  pre-committed).
- Escalate to (β) (`token_provider` field) — USWDS does ship a
  Sass-generated token tree and owns the values. `standalone_tokens`
  + `description:` prose covers it.

Budget tripwire: if a flat-standalone_tokens enumeration for Button +
Alert passes 35 entries, pause and re-evaluate whether a narrow
`token_grammar` (e.g. `color.{component}.{variant}.{state}`) would be
honest. Material 3's pass established the precedent for mixed
adoption within one Profile.

## What this pass uniquely tests — the three accessibility questions

1. **Contrast axis (WCAG AA vs AAA vs high-contrast mode).**
   Material 3's `contrast: [standard, medium, high]` axis is the
   prior art. USWDS has something similar in v3's "high-contrast
   theme pack" but exposes it differently. Does `theming.modifiers`
   with an axis like `contrast: [standard, high]` cover USWDS
   cleanly? Does it need different values or a different
   SEMANTIC from Material's?

2. **Reduced-motion preference.**
   USWDS respects `prefers-reduced-motion` — animation durations
   collapse to zero, transitions disable. Open question: is this a
   TOKEN concern (a `motion.duration.{preference}` axis) or a
   BEHAVIOR concern (live media query in generated CSS, outside
   Component spec)? F-primer-2 wrote this as theme-axis-candidate;
   the reality may be that reduced-motion is a CSS-generation
   directive, not a token surface. Findings should pick a lane and
   justify.

3. **Touch-target / density axis.**
   USWDS emphasises minimum tap targets (44×44 CSS pixels per WCAG
   2.5.5). Does this interact with draft.8's `property.target_only`
   pattern (size axes without modelled token bindings) or with
   multi-axis theming (a `density`-like modifier)? Third-DS
   crossover with Material's density — interesting data point
   either way.

The three questions together map to F-primer-2's deferred concern.
**If all three answer "no new format surface needed", F-primer-2 can
be formally closed. If even one produces a structural gap, that is
the pre-v1.0.0 signal draft.9 was keeping the door open for.**

## Working sources to consult

- `shadcnTests/shadcn.profile.yaml` — nearest architectural
  precedent; start from this shape, not Primer's or Material's.
- `material3Tests/material3.profile.yaml` — reference for two-axis
  theming (semantic × contrast) modelling.
- `specs/v1.0.0-draft/CDF-PROFILE-SPEC.md` §8 (theming modifiers)
  with Material 3's semantic-×-contrast as the worked example.
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` §15 (accessibility) —
  USWDS is the DS that most deeply exercises the accessibility
  section; the ARIA + keyboard + focus contracts should surface
  any §15 gaps. If §15 feels incomplete for USWDS-Alert, that's a
  finding.
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` §14.4 (CSS block) —
  reduced-motion may land here if it's a CSS-generation concern.
- `formtrieb.profile.yaml` — reference for multi-axis theme
  modifier declaration.

## Step-by-step

### Step 0 — Provision USWDS tokens (≈5 min)

Clone USWDS for readable source access:

```bash
mkdir -p uswdsTests
git clone --depth 1 https://github.com/uswds/uswds.git \
  uswdsTests/.uswds

cd uswdsTests/.uswds && git rev-parse HEAD
echo "/.uswds/" >> uswdsTests/.gitignore
```

Verify the token source layout:

```
uswdsTests/.uswds/packages/uswds-core/src/styles/tokens/
  ← Sass maps: colors, spacing, typography, etc.
uswdsTests/.uswds/packages/usa-button/src/
  ← Button component styles
uswdsTests/.uswds/packages/usa-alert/src/
  ← Alert component styles
uswdsTests/.uswds/dist/css/uswds.css
  ← generated CSS with all --usa-* variables resolved
```

Record in `findings.md`:
- USWDS commit SHA
- Date of clone
- Whether to source from Sass (`packages/*/src/styles/`) or from
  generated CSS (`dist/css/uswds.css`); whichever is cleaner for
  enumeration. Both are honest; document the choice.

### Step 1 — Profile (≈60 min)

Start from `shadcnTests/shadcn.profile.yaml` as the structural base
(flat CSS vars → `standalone_tokens`). Add USWDS-specific surface:

- **Color tokens.** USWDS uses a "theme tokens" layer
  (`--usa-primary`, `--usa-primary-dark`, `--usa-base-darkest`, …)
  plus per-component tokens where they diverge
  (`--usa-button-primary-hover`, `--usa-alert-info-background`).
  Enumerate as `standalone_tokens`, prose-annotate "from
  @uswds/uswds v3.x, packages/uswds-core/src/styles/tokens/".
- **Semantic vocabulary for Alert.** USWDS's Alert variants are
  `[info, success, warning, error, emergency]` — five status-shaped
  values. Declare as a Profile vocabulary `alert_intent`.
- **Theming axes — THE KEY DECISION.** Propose:
  - `semantic: [Light, Dark]` — USWDS v3 supports both (confirm in
    `.uswds` source; USWDS's Dark mode is newer and may be
    incomplete)
  - `contrast: [standard, high]` — USWDS's high-contrast theme
    pack.
  - **Open:** `motion_preference: [standard, reduced]`? — Only if
    reduced-motion is actually a TOKEN-level axis in USWDS (i.e.
    distinct motion duration tokens per preference). If USWDS
    handles reduced-motion purely via CSS `@media (prefers-reduced-
    motion)`, then it's NOT a theme axis and belongs in §14.4
    (CSS block) or §14 (behavior). Investigate first, commit
    second.
- **ARIA role vocabularies.** Alert-specific ARIA (`role="alert"`,
  `aria-live="polite|assertive"`, `aria-atomic`) are behaviour
  semantics. CDF Component §15 should carry them. Profile may
  declare a vocabulary `aria_live_politeness: [off, polite,
  assertive]` to reuse across any live-region-shaped component.

Watch for:

- **USWDS's "theme customization" vs tokens.** USWDS is designed for
  agencies to customise via Sass variables. This is a fifth
  ownership model — closer to shadcn's fork-model than anything
  else — but with the USWDS team providing strong guidance on
  what's "safe" to override. The Profile prose should note this
  honestly in each `standalone_tokens` entry (e.g. "external —
  consumer-overridable Sass variable, see USWDS customisation
  guidelines"). F-uswds-0 if this signalling becomes insufficient.
- **Focus indicators.** USWDS mandates thick (2px), high-contrast
  outline rings. Plain `outline-color` binding per draft.8 §13.5.1
  — this is the FOURTH-DS data point for the single-ring pattern
  (after shadcn, Primer, Material 3). Silent finding expected; if
  USWDS uses something more complex, note it.

### Step 2 — Button (≈60 min)

USWDS Button variants: `default` (primary), `secondary`, `accent-cool`,
`accent-warm`, `base`, `outline`, `inverse` (for dark backgrounds),
`unstyled`. Sizes: default, `big`. Widths: default, `full`.
Accessibility attributes: standard button semantics, no specialised
ARIA beyond button-default. Focus: thick outline, high-contrast token.

`tokens:` block:

- Each variant × state cell binds to a `standalone_tokens` path.
- Per-variant hover/active states bind to DISCRETE tokens (USWDS
  pre-composes these into the Sass maps — not runtime math).
  CDF-CON-008 should be silent, confirming fourth-DS principle
  survival.
- `inverse` variant is interesting — it's a variant that applies
  only on dark backgrounds. How does the spec model context-
  dependent variants? Investigate and document.

Watch for:

- **Touch-target minimum.** USWDS requires ≥44×44 CSS pixels. Is
  this a token, a CSS rule, or a derived value? USWDS's own source
  handles it via padding + line-height math. In the CDF Button
  spec, this is probably a `derived` value or a direct CSS-block
  invariant. F-uswds-touch-target if modelling is awkward.
- **`inverse` variant's semantic model.** Unique to USWDS in this
  series. Possibly authors as a `variant: inverse` with a prose
  note "applies when parent background uses dark tokens", with no
  special format surface. But if this forces a new mechanism —
  logged.

### Step 3 — Alert (≈45 min)

USWDS Alert variants: `info, success, warning, error, emergency`.
Each has an icon slot, heading, body text, optional close button.
Slim variant (reduces vertical padding). No-icon variant. Validation
variant (appears inline in forms).

`tokens:` block:

- Per-intent colour tokens (background, border, icon, text) via
  `standalone_tokens`.
- Close button is an embedded Button — tests CDF composition /
  inheritance if fully modelled, or just referenced if not.

**Accessibility surface — this is the heart of the USWDS test.**
Alert's §15 (accessibility) block exercises:
- `role="alert"` (for `error` / `emergency` / `warning` variants)
  vs `role="status"` (for `info` / `success`) — conditional ARIA
  role, tests §15 conditional-ARIA handling.
- `aria-live="assertive"` for emergency, `"polite"` for others.
- Dismissible Alert has a close button with `aria-label="Close"`.
- Icons in Alerts are decorative, `aria-hidden="true"`.

If §15 feels incomplete or awkward when expressing these (e.g.
conditional ARIA by intent), log F-uswds-aria. This is a HIGH-value
potential finding — §15 hasn't been stress-tested on a DS this
accessibility-rich.

Watch for:

- **Conditional role/live-politeness by intent.** F-Radix-4 first
  surfaced conditional-ARIA as an open question. USWDS Alert
  re-opens it with real teeth — five variants, two distinct ARIA
  role mappings, three distinct live-politeness levels. If the
  current §15 shape cannot express this cleanly, it is a
  legitimate draft.9 candidate.
- **Dismissible behaviour.** Close button triggers Alert dismissal.
  Is this a Component-§9 event, a derived state, or composition?
  Probably §9 events, but confirm.

### Step 4 — Validate + decide

Same triage as prior passes:
- Real format gap → `findings.md` with proposed patch (draft.9
  candidate — but be strict: "genuine format gap" must mean the
  current format cannot express the need, not "a new field would
  be nicer")
- Validator behind spec → cdf-core TODO
- My misunderstanding → fix the spec

**Run the full validator** on both specs. Expect:
- CDF-CON-008 silent (USWDS is token-driven like every prior pass)
- `target_only` exercises: TBD (USWDS may or may not need it;
  fourth-DS data point either way)
- Single-ring focus exercise: fourth-DS data point confirmed

**Format-change budget: ≤2 new optional fields, ≤1 new toggle.**
Same as prior four passes. **Four-in-a-row 0/2 + 0/1 is the prior;
a fifth 0/2 + 0/1 closes F-primer-2.** A single field surfaced in
USWDS that multi-DS evidence supports would be the rarest outcome —
the pre-v1.0.0 signal that draft.9 exists for.

If the budget is exceeded, **stop, write up, surface the specific
accessibility pattern that required the surface**. This is the pass
where an exceeded budget would be most credible because it was
designed to stress accessibility-axis modelling specifically.

### Step 5 (optional) — LLM cross-test

Same idea as prior passes, focused on accessibility surface:

- Hand a fresh LLM the Profile + Alert spec + USWDS's Alert docs
  (designsystem.digital.gov/components/alert).
- Ask it to predict: "If I set variant=emergency, what aria-live
  value should the DOM element have?"
- Correct answer: `"assertive"`. Test whether the Component spec's
  §15 block makes this derivable.
- If the LLM says "polite" or "I can't tell" from the spec alone,
  that's a §15 expressivity gap worth logging.

## findings.md format

Same template. F-uswds-N numbering. F-uswds-0 reserved for (γ) bridge
mechanism (expected: `standalone_tokens`, no escalation).

Carry-over findings from Radix / shadcn / Primer / Material 3 stay in
their files; re-log only if USWDS surfaces a NEW dimension. Specifically:

- **F-primer-2 (vision-accommodation)** — this pass's primary
  question. Findings must explicitly answer whether `theming.modifiers`
  with USWDS's accessibility axes (contrast, possibly motion) works
  without format change. Close OR concretize — deferred is no
  longer an acceptable verdict.
- **F-Radix-4 (conditional ARIA)** — Alert's intent-driven role /
  aria-live gives real two-DS evidence (Radix first surfaced it,
  USWDS confirms). If §15 shape can express conditional ARIA
  cleanly, F-Radix-4 converts from deferred to resolved. If not,
  draft.9 candidate.
- **draft.8 T1 `target_only`** — fourth-DS data point (already
  three-DS confirmed by Material; USWDS either adds a fourth point
  or produces no target_only usage, both are informative).
- **draft.8 T2 single-ring focus** — fourth-DS data point.

## What you are NOT doing in this session

- **Not porting the rest of USWDS.** Two components. Banner / Form /
  Table / Card / Accordion all wait.
- **Not auditing USWDS's accessibility compliance.** USWDS is WCAG
  2.1 AA by design — take that as given. We audit whether CDF can
  *describe* it honestly, not whether USWDS itself is accessible.
- **Not modelling all eight vision-accommodation modes.** USWDS's
  contrast mode is binary (standard / high). If a future DS ships
  finer-grained accommodation, that opens an additive axis; this
  pass stays scoped to USWDS's actual axes.
- **Not extending the Validator beyond draft.8.** Log; don't fix.
- **Not solving F-Radix-3 (asChild).** USWDS has no analogue in
  Button or Alert; same deferral.
- **Not shipping v1.0.0 final in this session.** That's the
  follow-up pass (synthesis + doc polish + version-bump).

## When you're done

Hand back with:

1. Files in `uswdsTests/` (profile, two specs, findings.md,
   `.uswds/` gitignored)
2. Write `docs/BIG-DS-USWDS-FINDINGS.md` — the summary with budget
   tally, top-3 frictions, and a verdict:
   - **"Format absorbed USWDS without bending; F-primer-2 closed,
     F-Radix-4 resolved or clarified; v1.0.0 ready to ship"** OR
   - **"USWDS surfaced N structural concerns affecting accessibility
     modelling; draft.9 patch plan needed before v1.0.0"**
3. One commit per major step, mirroring Material 3's sequence.

The headline question: *"Does CDF at draft.8 describe an accessibility-
first DS (USWDS) without format surface additions, and does it
resolve F-primer-2 + F-Radix-4?"* — gets a clear yes / qualified-yes /
no from the findings doc.

## Why USWDS as the fifth (and final) pass

Five-rung ladder complete:

- Radix: **headless** (no tokens at all) — 0/2 + 0/1
- shadcn: **token-bridge-external** (consumer-owned CSS vars) — 0/2 + 0/1
- Primer: **token-bridge-DTCG** (DS-owned real DTCG) — 0/2 + 0/1
- Material 3: **token-bridge-exotic** (rich toolchain-generated,
  state-layered, multi-axis) — 0/2 + 0/1
- **USWDS**: **accessibility-first** (WCAG-native, preference-
  axis-aware, ARIA-rich)

USWDS is intentionally NOT a new architectural direction — it's
architecturally shadcn-adjacent. What it uniquely tests is the
ACCESSIBILITY dimension that the first four passes touched but did
not stress. F-primer-2 was deferred twice (Primer, Material 3) on
the grounds that a dedicated accessibility-first DS would be the
right forcing-function. USWDS is that DS.

After this pass, the ladder covers:
- The token-source-shape spectrum (4 variants)
- The accessibility-preference spectrum (1 anchor)
- Five practical DS architectures, five 0/2 + 0/1 passes (target)

This is the clean cut at which v1.0.0 ships with overwhelming
empirical foundation. Beyond USWDS, further passes would test
repetition (another DTCG DS, another non-DTCG DS) rather than new
categories — diminishing returns.

## Success signal

If USWDS lands 0/2 + 0/1:

> *"CDF v1.0.0-draft.8 describes the practical range of design
> system architectures **including accessibility-preference axes**
> without structural format change. F-primer-2 closed. F-Radix-4
> resolved."*

That is the unambiguous go-signal for v1.0.0 final.

If USWDS surfaces one or two structural concerns, those concerns
are the exact last-chance patches draft.9 exists for — and coming
from an accessibility-rich DS, they are the RIGHT kind of last-
chance finding to land before freezing the format.

Either outcome is a win. The pass exists to separate "yes, ship"
from "wait, one more patch". After it, the ambiguity is gone.
