# Big-DS Material 3 Port — Findings Summary

**One-page summary** of the fourth Big-DS foreign-DS validation pass —
Material 3 (Google) as the *token-bridge-exotic* stress test: non-DTCG,
toolchain-generated, multi-axis-themed, state-layered. See
[`BIG-DS-MATERIAL3-BRIEF.md`](./BIG-DS-MATERIAL3-BRIEF.md) for the
mission,
[`BIG-DS-PRIMER-FINDINGS.md`](./BIG-DS-PRIMER-FINDINGS.md) /
[`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md) /
[`BIG-DS-RADIX-FINDINGS.md`](./BIG-DS-RADIX-FINDINGS.md) for the prior
three passes this one builds on, and
[`../material3Tests/findings.md`](../material3Tests/findings.md) for
the full friction log with per-finding reasoning.

## What shipped

| File | Status |
|------|--------|
| `material3Tests/material3.profile.yaml` | Parses clean; 7 `token_grammar` entries (color × role × slot × state, palette × role × tone, elevation × level, shape.corner × step, motion.duration × bucket, motion.easing × name, typography × role × scale) + 2 `standalone_tokens` (outline, focus.outline). 15 vocabularies covering colour roles, palette tones, five system scales, three component axes, interaction state, density. |
| `material3Tests/.cdf.config.yaml` | Prefix `m3`, two theme axes (semantic × contrast) |
| `material3Tests/specs/button.component.yaml` | **0 errors / 0 warnings / 0 info** — CDF-CON-008 silent |
| `material3Tests/specs/fab.component.yaml` | **0 errors / 0 warnings / 0 info** — CDF-CON-008 silent |
| `material3Tests/findings.md` | 11 findings logged (F-material-provisioning + 0 through 7 + 2× fab-scoped) |
| `material3Tests/.material3-tokens/` | Seed `#6750A4`, `@material/material-color-utilities@0.4.0`, generated 2026-04-16 (gitignored) |

## Format-change budget used

| Budget line item | Limit | Used | Note |
|---|---|---|---|
| New optional CDF fields | ≤2 | **0** | (γ)-principle held via MIXED mechanism — `token_grammar` for systematic families, `standalone_tokens` for singletons. Draft.8's `target_only` field was exercised on BOTH components (third-DS data point) without being a Material-3-introduced field. |
| New Category/Property toggles | ≤1 | **0** | No toggles introduced. |

**Budget stance:** 0/2 and 0/1 — **four foreign-DS passes in a row,
total structural format change zero**. Radix (headless) + shadcn
(token-bridge-external) + Primer (token-bridge-DTCG) + Material 3
(token-bridge-exotic) all absorbed without format-field additions.
This is the decisive evidence signal the four-pass ladder was
designed to produce.

## Top 3 frictions by impact

1. **F-material-0 — State-layer mechanism: state-as-token held under
   Material's richest runtime-math surface.**
   Material 3 specifies interaction states as 8% / 10% / 10% / 16% /
   12% / 38% opacity overlays on paired on-role colours — the exact
   runtime-math pattern F-shadcn-3 first surfaced and that draft.7's
   Token-Driven Principle (Component §1.1 #2) subsequently forbade
   from CDF specs. The brief pre-committed state-as-token (the
   toolchain pre-composes overlays into discrete `.{state}` tokens;
   the Profile and Components see only the result). **This held
   perfectly under Material's richest state surface.** Both specs
   validate with CDF-CON-008 silent. No opacity expression, no
   `color-mix()`, no percentage appears anywhere in either spec.
   The state-layer percentages live only in
   `.material3-tokens/tokens-static.json` as toolchain-only metadata.
   This is the **strongest evidence yet** that draft.7's principle
   prose is both correct and enforceable — a pre-commit that could
   have cracked on the real data, held.

2. **F-material-1 — Two-axis theming (semantic × contrast)
   validated as orthogonal modifiers.**
   Material 3's contrast levels (`standard`, `medium`, `high`) were
   the first-class test for F-primer-2's deferred multi-axis-theming
   question. Two-axes modelling (brief's recommended option)
   absorbed cleanly — Profile §8 supports it as designed, no new
   surface needed. Vision-accommodation (the F-primer-2 deferred
   component) stays deferred for a future pass; Material's contrast
   axis does not claim to cover accommodation, and declaring a
   third `accommodation:` axis if / when evidence arrives is
   additive.

3. **F-material-3 / F-material-4 — draft.8's T1 + T2 both saw
   third-DS confirmation.**
   - `target_only: true` landed in draft.8 T1 on shadcn + Primer
     two-DS evidence. Material's `density` axis on BOTH Button and
     FAB gave the third DS: shadcn's utility-class axes, Primer's
     external-grammar axes, and Material's sizing-system-token
     axes all collapse cleanly under the same flag. Three
     structurally distinct "bindings-absent-by-design" reasons,
     one signalling primitive.
   - Single-ring focus note (§13.5.1) landed in draft.8 T2 on
     shadcn + Primer evidence. Material's focus — which adds a
     state-layer OVERLAY on top of the ring — still uses a plain
     `outline-color:` binding for the RING part; §13.5.1 prose
     describes the idiom correctly. Third-DS data point confirms.

   Both of these validate draft.8's additive-refinement trajectory.

## Also logged (F-material 2, 5, 6, 7 + fab-extended, fab-sizing — lower impact)

- **F-material-2** — Vocabulary cross-overlap (§5.5.2 permits) on
  `color_role` ↔ `fab_variant` and `size` ↔ `typography_scale`.
  First Big-DS pass where a DS naturally has overlapping vocabularies
  WITHOUT contrivance. `binds_to:` disambiguates at the axis binding
  level. Not a gap.
- **F-material-5** — Elevation × variant × interaction requires §8.8
  `compound_states:` (not §13.2 modifier chaining). The two-block
  CDF mechanism (single-axis modifier + multi-axis compound) handled
  Material's richest multi-axis state expression. Pragmatic observation:
  FAB's single-axis elevation × interaction could use §13.2 modifier
  form; it uses compound_states here for symmetry with Button.
  Pure doc-polish opportunity.
- **F-material-6** — Composite DTCG `typography` binding via single
  `typography: <path>` key (§13.4 mixin form). No format surface
  exercised; the existing prose covers the case.
- **F-material-7** — Outlined-disabled border stroke: Material's 12%
  opacity on outline is a one-off visual detail not modelled this
  pass. Fidelity item for a follow-up Profile update, not a format
  gap.
- **F-material-fab-extended** — Extended FAB modelled as `size:
  extended` per Material's docs; alternative (separate variant /
  shape axis) equivalent. Spec-authoring preference, not a format
  question.
- **F-material-fab-sizing** — FAB container dimensions (height /
  padding) unbound per size. NOT a `target_only: true` case because
  `size` has SOME bindings (border-radius, shape.corner), and
  draft.8 §7.12's "when NOT to use" prose covers this. Correctly
  modelled.

## Recommendation

**Format stability confirmed across four foreign-DS passes; draft.8
is a refinement trajectory, not a growth trajectory.**

Rationale: The brief's headline question — *"does CDF, at draft.8,
absorb a non-DTCG, toolchain-generated, multi-axis-themed,
state-layered DS without bending?"* — gets a **clean yes**. Zero
fields added, zero toggles, draft.8's two additive patches (`target_only`
and §13.5.1) both exercised on their third-DS data points without
surfacing any adjacent gap.

The (γ) bridge — now a tested principle across three mechanism
variants (shadcn: flat `standalone_tokens`; Primer: grammar
`token_grammar`; Material 3: MIXED) — absorbed Material's richest-yet
token surface (seven grammar families, two standalone singletons,
six tonal palettes, three system scales, state-baked colour roles).
The Token-Driven Principle (draft.7 §1.1 #2, §13 intro) described
Material's state-layer mechanic correctly — **CDF-CON-008 silent on
both components**, which was the pre-commit's risk: if state layers
had cracked the principle, they would have surfaced here.

**Verdict:** *"Format absorbed Material 3 without bending;
refinement-only trajectory confirmed across four foreign-DS passes."*

Next natural next step: this is the moment to freeze draft.8 → v1.0.0
final as a refinement pass rather than another growth round. The
four-pass evidence ladder is complete and clean.

**Do NOT reopen F-Radix-3 (asChild / `as` polymorphism).** Four DSes
now share the same deferral; the Dialog-evidence trigger stays the
right threshold.

**Do NOT reopen F-primer-2 (vision-accommodation).** Material's
contrast axis is explicitly not the same thing; the deferral stays
intact and a future fifth pass can add `accommodation:` as a third
theme axis additively.

## Commits

Recommended sequence for reviewer replay:

1. `docs(material3): Step 0 — provision Material 3 tokens + findings.md skel`
2. `docs(material3): Step 1 — Profile + .cdf.config.yaml for Button+FAB`
3. `docs(material3): Step 2 — port Material 3 Button`
4. `docs(material3): Step 3 — port Material 3 FAB`
5. `docs(material3): Step 4 — findings + summary` (this commit, pending)

Each commit independently revertable; findings accumulate in
`material3Tests/findings.md` on each step.

## What this unlocks

The four-rung ladder is complete:

- Radix: **headless** (no tokens) — 0/2 + 0/1
- shadcn: **token-bridge-external** (consumer-owned CSS vars) — 0/2 + 0/1
- Primer: **token-bridge-DTCG** (DS-owned real DTCG) — 0/2 + 0/1
- Material 3: **token-bridge-exotic** (DS-owned non-DTCG,
  toolchain-generated, state-layered, multi-axis-themed) — 0/2 + 0/1

The format-stability hypothesis the entire foreign-DS series tested:

> *"CDF v1.0.0-draft.8 describes the practical range of design system
> architectures (headless, external-CSS-vars, real-DTCG,
> rich-non-DTCG) without structural format change."*

**Confirmed.** All four passes clean. The strongest test — Material 3,
with its state layers + rich multi-family token surface + multi-axis
theming — produced the same 0/2 + 0/1 result as the simplest test
(Radix, headless).

Draft.8 can ship as v1.0.0 without a fifth growth round. The
refinement pass for v1.0.0 final would be limited to:

- Doc polish from F-material-5 (§8.8 single-axis compound
  equivalence note), F-material-6 (§13.4 composite-type binding
  cross-reference), F-material-7 (Profile-level outline role
  expansion — if pursued).
- Small fidelity items in `material3Tests/` itself (F-material-7's
  outlined-disabled border), no format change required.

None of these are blocking; v1.0.0 final can ship without them.

## Success signal

Four foreign-DS passes with **0/2 and 0/1** budgets is the
clearest-possible evidence the format is general, not Formtrieb-tailored.
Each pass targeted a structurally distinct DS architecture; each
pass validated the previous pass's findings against a fresh context;
each pass added new data to the `target_only` + single-ring focus
multi-DS evidence trails that draft.8 landed. Material 3 — the
richest and most opinionated DS in the ladder — absorbed with the
same budget as Radix, the simplest.

The hypothesis holds. CDF v1.0.0-draft.8 is stable across the
practical range of DS architectures. Ship.
