# Changelog

All notable changes to the CDF format are logged here. The format
follows [Semantic Versioning](https://semver.org/): breaking changes
bump the major; additive field/rule changes bump the minor; doc
polish and clarifications bump the patch.

---

## [1.0.0] — 2026-04-18

**Initial public release.** Three-format family (Component, Profile,
Target) frozen after five foreign-DS validation passes without
structural format change.

### What's in this release

- **CDF Component** (`.component.yaml`) — properties, states, events,
  anatomy, tokens, behavior, accessibility, CSS. Token-Driven
  Principle formalised: every visual property binds to exactly one
  token path that resolves to one DTCG value at build time. Runtime
  math (opacity modifiers, `color-mix()`, `calc()` on token
  references) is out of scope; state variations are distinct tokens.
- **CDF Profile** (`.profile.yaml`) — the DS's constitution:
  vocabularies, token grammar, theming modifiers (multi-axis),
  interaction patterns, accessibility defaults. Supports
  `standalone_tokens` (flat sources), `token_grammar` (hierarchical
  sources), and mixed adoption in a single Profile.
- **CDF Target** (`.target-{framework}.yaml`) — per-(DS × framework)
  output conventions. Identifier templates, file layout, idiom
  choices (signal vs observable, Angular vs SwiftUI vs Kirby).

### Validation evidence

Five foreign-DS validation passes (full findings in `evidence/`):

| Pass | DS | Architecture stressed | Result |
|------|----|-----------------------|--------|
| 1 | Radix Primitives | Headless — no tokens | 0/2 + 0/1 |
| 2 | shadcn/ui | Consumer-owned CSS vars | 0/2 + 0/1 |
| 3 | @primer/primitives | Real DTCG 2025.10 (DS-owned) | 0/2 + 0/1 |
| 4 | Material 3 | Rich toolchain-generated, state-layered | 0/2 + 0/1 |
| 5 | USWDS | Accessibility-first, OS-signal preferences | 0/2 + 0/1 |

Structural format change across all five: **zero**. CDF-CON-008
(no-raw-unitless-tokens — the Token-Driven-Principle enforcer) silent
on all ten foreign-DS fixture specs plus 8 internal Formtrieb specs. Two deferred questions converted from deferred to resolved:

- **Vision-accommodation multi-axis theming** (F-primer-2) — resolved
  via ownership split: DS-owned switches land in
  `theming.modifiers`, OS-signal switches (`@media (forced-colors)`,
  `@media (prefers-reduced-motion)`) land in §14.4 `css:` escape
  hatch. Both mechanisms already existed; USWDS validated their
  orthogonality.
- **Intent-driven conditional ARIA** (F-Radix-4) — resolved via
  §15.3 narrative format. USWDS Alert's 5-intent × 2-role ×
  3-politeness matrix absorbs into eight narrative entries without
  new format surface.

### Deferred (not blocking v1.0.0)

- `asChild` / `as` polymorphism — five DSes share the deferral; waiting
  on Dialog-evidence to force the structural question.
- Composite-type grammar for ARIA beyond §15.3 narrative —
  machine-checkability add-on, correctness isn't gated on it.
- Cross-layer relocation: `css:` escape hatch (§14.4) + `css:` block
  (§16) currently live in Component under explicit cross-layer flags;
  move to Target reserved for a later minor version.
- Reference-implementation validator rule (profile-vocabulary-type
  shorthand in `property-type-valid`) — spec-correct, validator lags.
  Tracked in `cdf-core`.

### Normative spec files (this repo)

- [`specs/CDF-ARCHITECTURE.md`](./specs/CDF-ARCHITECTURE.md) —
  descriptive overview (non-normative)
- [`specs/CDF-COMPONENT-SPEC.md`](./specs/CDF-COMPONENT-SPEC.md) —
  normative
- [`specs/CDF-PROFILE-SPEC.md`](./specs/CDF-PROFILE-SPEC.md) —
  normative
- [`specs/CDF-TARGET-SPEC.md`](./specs/CDF-TARGET-SPEC.md) —
  normative
