# Big-DS Radix Port — Findings Summary

**One-page summary** of the Radix foreign-DS validation pass. See
[`BIG-DS-RADIX-BRIEF.md`](./BIG-DS-RADIX-BRIEF.md) for the mission,
[`BIG-DS-RADIX-SKETCH.md`](./BIG-DS-RADIX-SKETCH.md) for the pre-port
hypotheses, and
[`../radixTests/findings.md`](../radixTests/findings.md) for the full
friction log.

## What shipped

| File | Status |
|------|--------|
| `radixTests/radix.profile.yaml` | Validates clean |
| `radixTests/specs/separator.component.yaml` | Validates clean (0 errors / 0 warnings) |
| `radixTests/specs/toggle.component.yaml` | Validates clean (after applying `binds_to: pressable` + `[false, true]` toggleable axis) |
| `radixTests/findings.md` | 8 findings logged |

## Format-change budget used

| Budget line item | Limit | Used | Note |
|---|---|---|---|
| New optional CDF fields | ≤1 | **0** | None introduced; empty-object shapes (`tokens: {}`, `token_grammar: {}`, `theming: {}`) carried the port. |
| New Category toggles | ≤1 | **0** | `visual_contract: false` was proposed (F-Radix-2 option b) but not needed — validator accepts `tokens: {}`. |

**Budget stance:** under limit. The draft.5 format absorbed both
primitives without structural change. Every finding is either a
documentation clarification, a validator-vs-spec drift, or an
accepted tension.

## Top 3 frictions by impact

1. **F-Radix-3 — `asChild` polymorphism has no model.**
   Runtime element override is Radix's core composition primitive.
   CDF assumes `anatomy.container.element` is the rendered tag; Radix
   says it's *a default* that consumers override. The minimal honest
   fix is an optional `element_polymorphic: true` anatomy flag that
   relaxes Tier-4 cross-layer element-match checks. Biggest of the
   three because it shapes every remaining Radix primitive (Dialog,
   Popover, ToggleGroup, …) — it will not go away.

2. **F-Radix-2 — "`tokens:` REQUIRED" spec text contradicts empirical
   validator behaviour.**
   Structural validator treats `tokens: {}` as "present" — the spec
   says tokens are required *and* should map every anatomy part's
   visual properties. Both statements are false for headless
   components; no rule fires. Cheapest fix: one sentence in §13
   blessing `tokens: {}` as the "owns no paint" shape. Option (b)
   — a `profile.categories.{cat}.visual_contract: false` toggle —
   only becomes necessary if a later primitive hits a rule that
   `tokens: {}` cannot satisfy.

3. **F-Radix-1 — profile parser rejects fields the spec marks
   optional.**
   `interaction_patterns`, `accessibility_defaults`, `categories`,
   `token_layers` are REQUIRED by the parser
   (`profile-parser.ts:21-30`) but OPTIONAL by the spec (Profile §3).
   A pure-minimal Profile should be ~20 lines; today it forces ~60
   lines of "empty but present" ceremony. Pure validator drift —
   easy fix, high ergonomic payoff for future foreign-DS ports.

## Also logged (F-Radix 4–8, lower impact)

- **F-Radix-4** — conditional ARIA is prose-only (draft.7 candidate)
- **F-Radix-5** — `mirrors_state` forces `[false, true]`; Radix's
  `on|off` DOM vocabulary can't live in the axis (accepted tension,
  Target's job)
- **F-Radix-6** — `token_expandable` required even when grammar is
  empty (cdf-core TODO)
- **F-Radix-7** — controlled/uncontrolled prop pairs don't fit
  `mutual_exclusion:` (accepted tension, React-specific)
- **F-Radix-8** — empty `token_grammar: {}` works by accident, not
  by explicit blessing (doc-only fix)

## Recommendation

**Go to shadcn next.**

Rationale: budget clean, validator accepts headless shapes, two
primitives covered without structural format change. The three
most-impactful frictions are either validator-lag (F-Radix-1, 6),
docs (F-Radix-2, 8), or narrow (F-Radix-5, 7). Only **F-Radix-3
(`asChild`)** is a structural gap, and it will surface again with
more severity in Dialog — so deferring to draft.6 with real evidence
from two primitives is the right order.

shadcn/ui adds the interesting next-order question: *what happens
when a Radix-shaped component DOES bind to tokens?* The token-bridge
will stress the layer-boundary the current format defines around
`profile.extends` and Target overrides. That is a separate test with
its own budget.

**Do NOT port Dialog** before draft.6 resolves F-Radix-3. Dialog is
seven subcomponents and every one of them carries `asChild`; writing
seven specs that all silently drop that prop would be dishonest
about the format's fit.

## Commits

Recommended sequence for reviewer replay:

1. `docs(radix): scaffold radixTests/ profile + config`
2. `docs(radix): port Separator`
3. `docs(radix): port Toggle`
4. `docs(radix): summarise findings`

Each commit is independently revertable; findings accumulate in
`radixTests/findings.md` on each step.
