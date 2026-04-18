# Big-DS shadcn/ui Port — Findings Summary

**One-page summary** of the shadcn/ui foreign-DS validation pass
(token-bridge focus). See
[`BIG-DS-SHADCN-BRIEF.md`](./BIG-DS-SHADCN-BRIEF.md) for the mission,
[`BIG-DS-RADIX-FINDINGS.md`](./BIG-DS-RADIX-FINDINGS.md) for the prior
pass this one builds on, and
[`../shadcnTests/findings.md`](../shadcnTests/findings.md) for the full
friction log with per-finding reasoning.

## What shipped

| File | Status |
|------|--------|
| `shadcnTests/shadcn.profile.yaml` | Parses clean; 20 `standalone_tokens` implementing the (γ) bridge |
| `shadcnTests/.cdf.config.yaml` | Mirrors radixTests shape; prefix `sh`, Light/Dark theme axis |
| `shadcnTests/specs/button.component.yaml` | Validates clean (0 errors / 0 warnings) after `type: enum` workaround for F-shadcn-1 |
| `shadcnTests/specs/badge.component.yaml` | Validates clean (0 errors / 0 warnings) |
| `shadcnTests/findings.md` | 7 findings logged (F-shadcn-0 through 6) |

## Format-change budget used

| Budget line item | Limit | Used | Note |
|---|---|---|---|
| New optional CDF fields | ≤2 | **0** | (γ) strategy designed to avoid new fields. `standalone_tokens` + prose-annotated descriptions carried the entire shadcn token surface. |
| New Category/Property toggles | ≤1 | **0** | No toggles introduced; two candidates (`property.target_only`, `anatomy.element_polymorphic`) deliberately deferred to multi-DS evidence. |

**Budget stance:** 0/2 and 0/1 — same as Radix. Two foreign-DS ports
now in the books, total structural format change: **zero**. This is
the "draft.6 absorbs headless AND token-bridge without growing"
signal the brief was looking for.

## Top 3 frictions by impact

1. **F-shadcn-3 — shadcn's runtime-opacity state model diverges from
   CDF's token-driven principle** *(reframed post-session, see
   shadcnTests/findings.md for the full reasoning).*
   shadcn expresses hover/disabled as Tailwind opacity modifiers
   (`hover:bg-primary/90`), computed at CSS runtime. CDF is
   **token-driven by principle** — each property binds to one token
   path, which resolves to one DTCG value at build time. For a
   token-driven DS (Formtrieb), the hover state is its own token with
   alpha baked into the value (`color.primary.hover: lch(… / 0.9)`).
   shadcn is *not* token-driven at the state level; the alpha lives
   only in the stylesheet. **This is a shadcn architectural choice
   that doesn't map cleanly to CDF, not a CDF gap.** The earlier
   "extend §13.6 with derivation expressions" suggestion is
   withdrawn — that would import runtime math into a build-time
   format. The honest fix is a §13 prose note: DSes that rely on
   CSS-runtime modifiers MUST declare the divergence explicitly in
   token descriptions, and Component specs for such DSes will leave
   state-level token slots empty by design.

2. **F-shadcn-1 — Validator rejects Profile-vocabulary `type:`
   shorthand that the spec mandates.**
   Spec §7.2: *"A `type:` value that matches a Profile vocabulary
   key is shorthand for `type: enum` + `values: […]`, profile-aware
   validators MUST resolve these at validation time."* Cdf-core's
   `property-type-valid` does not implement it — every Button /
   Badge property that tried to reference the Profile's `variant`
   vocabulary had to fall back to inline-enum duplication. Same
   category as F-Radix-1 (spec right, validator behind). Small-
   effort fix with meaningful ergonomic payoff for any DS that
   leans on vocabularies.

3. **F-shadcn-2 — Utility-class-owned axes have no format handshake.**
   Button's `size` property (default/sm/lg/icon) has NO DS tokens —
   shadcn ships it as Tailwind utility bundles. The Component
   honestly declares `size` as a property but the `tokens:` block
   is silent about it. A generator reading the spec has no way to
   distinguish "forgotten bindings" from "intentionally Target-
   owned." Cosmetic today; a structural question when Material 3's
   density scale / elevation tiers land in the same trap.

## Also logged (F-shadcn 0, 4–6, lower impact)

- **F-shadcn-0** — (γ) token-bridge strategy choice; resolved
  post-authoring as "held, no escalation to (β) needed"
- **F-shadcn-4** — shadcn's own destructive-foreground inconsistency
  (Button uses `text-white`, Badge uses the pair); not a CDF gap
- **F-shadcn-5** — single-ring focus pattern vs. §13.5 focus block;
  doc clarification for draft.7
- **F-shadcn-6** — pair pattern duplicates literally across Button
  and Badge; accepted as cosmetic (per-component autonomy > shared
  mixin), defer until a third component forces the question

## Recommendation

**Go to Material 3 next.**

Rationale: Budget clean across two foreign-DS passes now. The (γ)
bridge absorbed shadcn's token surface without structural format
change. F-shadcn-3 after the reframing is no longer a format
tension — it is a principle difference between shadcn and CDF, and
the correct CDF-port response is to **declare state tokens
explicitly at build time** rather than to extend the format. F-
shadcn-2 (utility-class-owned axes) remains the single genuine
structural question, and Material 3's density/elevation scales
will provide the second data point to decide whether a
`property.target_only` flag is justified. Single-pass evidence is
too narrow; a second data point from Material 3 decides it.

The token-bridge hypothesis from the brief — *"can CDF describe a
DS that delegates its values to consumer-owned config?"* — answers
**yes, qualified**: the description-prose signalling of "external"
ownership is legible and traceable, BUT the format has no machine-
readable signal for this (no `token_provider` field, no per-token
`external: true` flag). A sufficiently strict generator can still
derive correct output from (γ) today; a curious LLM or reviewer
needs the prose to land the context. That is the right trade for
two components of evidence.

**Do NOT reopen the (γ)/(β) decision.** The (γ) choice was the
brief's recommended path and it held across 20 tokens × 2
components. Escalating to (β) now would be over-engineering on
thin evidence. The door stays open if Material 3 produces a
qualitatively different ownership story (e.g. a DS where the DS
owns MOST values but delegates a few dynamically).

## Commits

Recommended sequence for reviewer replay:

1. `docs(shadcn): scaffold shadcnTests/ profile + config`
2. `docs(shadcn): port Button`
3. `docs(shadcn): port Badge`
4. `docs(shadcn): summarise findings`

Each commit independently revertable; findings accumulate in
`shadcnTests/findings.md` on each step.

## What this unlocks for Material 3

Material 3's CDF port will stress:
- **Rich tokens** (motion, elevation, typography scale, state layers,
  shape surfaces) — tests whether `token_grammar` + `standalone_tokens`
  + `token_layers` compose at scale. **State layers will NOT stress
  the CDF format** the way the initial F-shadcn-3 framing suggested
  — they will stress the token toolchain, which must pre-compute
  the overlay alphas and emit them as discrete DTCG tokens. CDF's
  token-driven principle holds; Material's "12% on hover" rule
  becomes a token-build-time transformation, not a CDF spec
  feature.
- **Theme mechanics** (dynamic colour / user seed → full palette) —
  tests `theming.set_mapping` under real load, which neither Radix
  nor shadcn exercised
- **Accessibility semantics** (state layers ARE a11y signals) —
  re-opens F-Radix-4 (conditional ARIA) with structural weight

The two prior passes prepared the ground; draft.6 survived both.
Material 3 is the test that decides whether draft.7's agenda is
format-growth or format-refinement.
