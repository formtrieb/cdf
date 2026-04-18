# Big-DS USWDS Port — Findings Summary

**One-page summary** of the fifth (and final) Big-DS foreign-DS
validation pass — USWDS (United States Web Design System) as the
*accessibility-first* stress test: WCAG 2.1 AA by design, OS-signal-
driven accessibility preferences, intent-driven conditional ARIA.
See [`BIG-DS-USWDS-BRIEF.md`](./BIG-DS-USWDS-BRIEF.md) for the
mission, [`BIG-DS-MATERIAL3-FINDINGS.md`](./BIG-DS-MATERIAL3-FINDINGS.md)
/ [`BIG-DS-PRIMER-FINDINGS.md`](./BIG-DS-PRIMER-FINDINGS.md) /
[`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md) /
[`BIG-DS-RADIX-FINDINGS.md`](./BIG-DS-RADIX-FINDINGS.md) for the
prior four passes this one builds on, and
[`../uswdsTests/findings.md`](../uswdsTests/findings.md) for the
full per-step friction log.

## What shipped

| File | Status |
|------|--------|
| `uswdsTests/uswds.profile.yaml` | Parses clean; 34 `standalone_tokens` (flat USWDS Sass-key mirror — `color.primary-dark`, `color.emergency`, etc.), 6 vocabularies, **empty `theming.modifiers: {}`** — first across the series |
| `uswdsTests/.cdf.config.yaml` | Prefix `us`, empty `theme_axes` |
| `uswdsTests/specs/button.component.yaml` | **0 errors / 0 warnings / 0 info** — 8 variants × 4 states × 3 CSS properties = 96 cells bound via hybrid §13.2 modifier + §13.3 value-map form |
| `uswdsTests/specs/alert.component.yaml` | **0 errors / 0 warnings / 0 info** — five-intent conditional ARIA expressed via §15.3 narrative list |
| `uswdsTests/findings.md` | 10 findings logged (F-uswds-provisioning + 0 through 9) |
| `uswdsTests/.uswds/` | Cloned at `e3a67d19fc98193c753a445b568f99e939ae8342`, sampled 2026-04-16, gitignored |

## Format-change budget used

| Budget line item | Limit | Used | Note |
|---|---|---|---|
| New optional CDF fields | ≤2 | **0** | (γ)-principle held via `standalone_tokens`. Fifth ownership model observed (DS-owned, consumer-overridable via Sass-variable forks at compile time) — absorbed via prose annotation, no new format field. |
| New Category/Property toggles | ≤1 | **0** | No toggles introduced. |

**Budget stance:** 0/2 and 0/1 — **five foreign-DS passes in a row,
total structural format change zero**. Radix (headless) + shadcn
(token-bridge-external) + Primer (token-bridge-DTCG) + Material 3
(token-bridge-exotic) + USWDS (accessibility-first) all absorbed
without format-field additions. This is the **unambiguous go-signal**
the five-pass ladder was designed to produce.

## Top 3 frictions by impact

1. **F-primer-2 — CLOSED: accessibility-preference axes split by
   who-owns-the-switch, CDF draft.8 houses both.**
   The deferred-through-two-passes question re-opened on the one
   DS built to answer it. USWDS ships with NO DS-owned runtime
   theme axes (`theming.modifiers: {}` empty — a first across the
   series) because its accessibility preferences are
   OS-signal-driven CSS media queries (`@media (forced-colors:
   active)`, `@media (prefers-reduced-motion)`) inside per-component
   Sass mixins. The F-primer-2 verdict concretises:

   > *"Accessibility-preference axes split into two categories
   > by who owns the runtime switch. DS-OWNED switches (Material
   > 3's `contrast: [standard, medium, high]`, data-attribute-
   > selected) belong in `theming.modifiers`. OS-SIGNAL switches
   > (USWDS's forced-colors, reduced-motion, plus any future
   > `prefers-contrast`, `prefers-color-scheme`) belong in §14.4
   > `css:` escape hatch — they are CSS-generation directives the
   > browser evaluates at paint time. CDF draft.8 already houses
   > both cleanly. No new format category needed."*

   F-primer-2 converts from **deferred twice** to **resolved**.

2. **F-Radix-4 — RESOLVED: conditional ARIA absorbs into §15.3
   narrative format.**
   USWDS Alert's five intents × two ARIA roles × three politeness
   levels × one invariant × one decorative rule — the richest
   conditional-ARIA matrix in the series — expressed via eight
   §15.3 narrative `aria:` entries. The format's free-form
   narrative-with-trigger-condition pattern (`aria-{attr}: {value}
   — {trigger}`) scales to five-intent matrices without structural
   friction. Validator silent.

   F-Radix-4 converts from **deferred** to **resolved-via-prose**.
   A future structured-ARIA grammar (reserved for v1.0.0 final per
   §15.3) would be additional machine-checkability, NOT a
   prerequisite for correctness or legibility. Draft.9 doc-polish
   candidate: add USWDS Alert as §15.8 example.

3. **F-uswds-state-expression + F-uswds-touch-target — two small
   doc-polish-class observations.**
   - Hybrid §13.2 modifier-override + §13.3 value-map combination
     validates cleanly and reads legibly for flat-token DSes like
     USWDS (96 cells bound without grammar placeholders). Draft.9
     one-line doc-polish would bless this idiom explicitly.
   - USWDS Button's `size` axis has no bindings but is NOT
     `target_only: true` — the axis resolves to arithmetic
     `padding + font-size` in the DS source, not to Target-layer
     utilities. A different category of missing binding from
     shadcn / Primer / Material 3's three-DS target_only evidence.
     One-DS observation; insufficient to justify a second flag.
     Narrow draft.9 doc-polish candidate.

## Also logged (F-uswds-0, -1, -3, -5, -6, -7, -9 — lower impact)

- **F-uswds-0** — (γ) bridge held via `standalone_tokens`; NEW
  ownership model observed (DS-owned, consumer-overridable at Sass
  compile time). Fifth variant after headless / consumer-CSS-vars /
  DS-DTCG / DS-toolchain-generated. Prose-annotated; format-neutral.
- **F-uswds-1 (F-uswds-theming)** — Empty `theming.modifiers: {}`
  legal and correct encoding for a DS that genuinely owns zero
  runtime theme axes. First across the series.
- **F-uswds-3 (F-uswds-aria-vocabularies)** — Profile-level
  `role_status_or_alert` + `aria_live_politeness` vocabularies
  declared to support §15 narrative; not structurally required,
  useful for reuse across any future live-region-shaped component
  (Toast, Snackbar).
- **F-uswds-5 (F-uswds-inverse-variant)** — Context-dependent
  variant modelled as flat expansion; §7.10 `conditional:` grammar
  would also work for future multi-modifier compositions.
- **F-uswds-6 (F-uswds-forced-colors)** — `@media (forced-colors:
  active)` inside §14.4 `css:` strings works; draft.9 doc-polish
  to bless `@media (prefers-*)` + `@media (forced-colors: active)`
  as legal `css:` content.
- **F-uswds-7 (F-uswds-static-states)** — Validator enforces ≥2
  state values; static components omit `states:` entirely. Draft.9
  §8.1 one-line clarification.
- **F-uswds-9 (F-uswds-validation)** — Full-suite 0/0/0 on both
  specs; CDF-CON-008 silent (fifth-DS Token-Driven Principle
  confirmation); single-ring focus fourth-DS confirmation.

## Recommendation

**Ship v1.0.0-draft.8 as v1.0.0 final.**

Rationale: The brief's headline question — *"does CDF at draft.8
describe an accessibility-first DS (USWDS) without format surface
additions, and does it resolve F-primer-2 + F-Radix-4?"* — gets a
**clean yes on all three axes**:

- **Format surface additions: zero.** 0/2 fields + 0/1 toggles.
- **F-primer-2: resolved.** Accessibility-preference axes split by
  ownership; `theming.modifiers` + §14.4 `css:` is the already-
  existing two-mechanism split, validated on a DS built around
  accessibility.
- **F-Radix-4: resolved via prose.** §15.3 narrative format
  scales to USWDS Alert's five-intent × three-axis conditional
  ARIA matrix.

The (γ) bridge — now a tested principle across four mechanism
variants (shadcn: flat `standalone_tokens`; Primer: grammar
`token_grammar`; Material 3: MIXED; USWDS: flat `standalone_tokens`
with new ownership model) — absorbed USWDS's fifth ownership
architecture without a new format field. The Token-Driven Principle
(draft.7 §1.1 #2, §13 intro) described USWDS's state variation
correctly: each variant × state cell resolves to a discrete Sass-
key token at compile time, no runtime opacity math, no CSS
variables, CDF-CON-008 silent on both specs. Fifth-DS
Token-Driven Principle confirmation.

**Verdict:** *"Format absorbed USWDS without bending; F-primer-2
closed, F-Radix-4 resolved; CDF v1.0.0-draft.8 is ready to ship
as v1.0.0 final."*

## Draft.9 doc-polish candidates (all optional, none blocking)

Five small doc-polish items surfaced across USWDS + the four prior
passes; none require a format surface change and none block v1.0.0
final:

1. **§13.2 doc-polish** — bless hybrid §13.2 + §13.3 form for
   flat-token DSes (F-uswds-state-expression).
2. **§14.4 doc-polish** — bless `@media (prefers-*)` +
   `@media (forced-colors: active)` as legal `css:` content when
   the signal is OS/browser-driven (F-uswds-forced-colors).
3. **§15.8 example addition** — USWDS Alert as a conditional-ARIA
   five-intent example (F-Radix-4-resolution).
4. **§8.1 clarification** — static-pattern Components omit
   `states:` entirely; don't declare a one-value axis
   (F-uswds-static-states).
5. **§7.12 clarification** — `target_only` trigger condition:
   target-layer utility classes vs. DS-source arithmetic are
   different categories of missing-binding (F-uswds-touch-target).

These could land as a "draft.9 doc-polish" sweep alongside or
after v1.0.0 final — refinement only, not a growth round.

## Commits

Recommended sequence for reviewer replay:

1. `docs(uswds): Step 0 — provision USWDS tokens + findings.md skel`
2. `docs(uswds): Step 1 — Profile + .cdf.config.yaml for Button+Alert`
3. `docs(uswds): Step 2 — port USWDS Button spec`
4. `docs(uswds): Step 3 — port USWDS Alert spec (§15 stress test)`
5. `docs(uswds): Step 4 — findings + summary` (this commit, pending)

Each commit independently revertable; findings accumulate in
`uswdsTests/findings.md` on each step.

## The five-rung ladder — complete and clean

| DS | Architecture | Budget | Outcome |
|----|--------------|--------|---------|
| Radix | headless (no tokens) | 0/2 + 0/1 | absorbed |
| shadcn | token-bridge-external (consumer CSS vars) | 0/2 + 0/1 | absorbed |
| Primer | token-bridge-DTCG (DS-owned real DTCG) | 0/2 + 0/1 | absorbed |
| Material 3 | token-bridge-exotic (DS-owned non-DTCG, state-layered, multi-axis-themed) | 0/2 + 0/1 | absorbed |
| **USWDS** | **accessibility-first (WCAG-native, OS-signal preferences, intent-driven conditional ARIA)** | **0/2 + 0/1** | **absorbed; F-primer-2 closed; F-Radix-4 resolved** |

**The hypothesis the series tested:**

> *"CDF v1.0.0-draft.8 describes the practical range of design
> system architectures **including accessibility-preference axes**
> without structural format change."*

**Confirmed.** Five passes, five 0/2 + 0/1 results, two deferred
questions converted to resolved on the DS purpose-built to stress
them. The strongest test (USWDS, accessibility-first with the
richest ARIA matrix in the series) produced the same budget
outcome as the simplest (Radix, headless). Combined with the
fourth-pass Material 3 evidence, the format-stability claim is
now load-bearing across five structurally distinct DS
architectures.

## What this unlocks

**v1.0.0 final.** The five-pass ladder was designed to answer
*"refinement or growth?"* after Material 3; USWDS's 0/2 + 0/1
outcome is the clean cut. Beyond USWDS, further passes would test
repetition (another DTCG DS, another token-bridge DS) rather than
new categories — diminishing returns, no new structural evidence
to gather.

The natural next step is the v1.0.0-final synthesis pass:
doc-polish sweep from the five findings docs, version bump
(`draft.8` → `1.0.0`), PUBLIC-SPEC freeze. The one-to-five doc-
polish items above can all land in that pass without reopening
any format mechanic.

## Success signal

Five foreign-DS passes with **0/2 and 0/1** budgets is the
clearest-possible evidence the format is general, not
Formtrieb-tailored. Each pass targeted a structurally distinct DS
architecture; each pass validated the previous passes' findings
against a fresh context; USWDS — the only pass DESIGNED to
stress a specific deferred question (F-primer-2) — produced the
same 0/2 + 0/1 outcome as the simplest exploratory pass (Radix).

The hypothesis holds. CDF v1.0.0-draft.8 is stable across the
practical range of DS architectures *including accessibility-
preference axes*. **Ship.**
