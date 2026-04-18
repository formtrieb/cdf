# Big-DS Primer Port — Findings Summary

**One-page summary** of the third Big-DS foreign-DS validation pass
— @primer/primitives (real DTCG 2025.10 as the happy-path
token-bridge stress test). See
[`BIG-DS-PRIMER-BRIEF.md`](./BIG-DS-PRIMER-BRIEF.md) for the
mission, [`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md)
and [`BIG-DS-RADIX-FINDINGS.md`](./BIG-DS-RADIX-FINDINGS.md) for the
prior two passes this one builds on, and
[`../primerTests/findings.md`](../primerTests/findings.md) for the
full friction log with per-finding reasoning.

## What shipped

| File | Status |
|------|--------|
| `primerTests/primer.profile.yaml` | Parses clean; (γ)-via-grammar bridge, 2 `token_grammar` entries + 2 `standalone_tokens` |
| `primerTests/.cdf.config.yaml` | Prefix `pr`, Light / Dark theme axis |
| `primerTests/specs/button.component.yaml` | **0 errors / 0 warnings / 0 info** |
| `primerTests/specs/label.component.yaml` | **0 errors / 0 warnings / 0 info** |
| `primerTests/findings.md` | 8 findings logged (F-primer-0 through 6, with F-primer-4 split into 4a + 4b) |
| `primerTests/.primer-primitives/` | Cloned at `c19e78df9f3b98a9be4ee5da8bd7f8cb5b74298f`, gitignored |

## Format-change budget used

| Budget line item | Limit | Used | Note |
|---|---|---|---|
| New optional CDF fields | ≤2 | **0** | (γ)-principle preserved via mechanism shift; zero structural growth |
| New Category/Property toggles | ≤1 | **0** | Same as prior passes; `property.target_only` now has two-DS evidence (F-primer-5) but draft.8 decision, not draft.7 |

**Budget stance:** 0/2 and 0/1 — **three foreign-DS passes in a row,
total structural format change zero**. The signal the brief explicitly
called out: *"Three foreign-DS passes with 0/2 and 0/1 format-change
budgets would be decisive evidence that the CDF format, at draft.7,
is stable across the practical range of DS architectures from
headless through DTCG."* That signal is now in.

## Top 3 frictions by impact

1. **F-primer-1 — (γ) is a principle, not a mechanism.**
   The brief pre-committed (γ) *"declare concepts as
   `standalone_tokens`, prose-annotate ownership"* with a budget of
   ≤25 `standalone_tokens`. Primer's source is grammar-shaped
   (`button.{variant}.{element}.{state}`), not flat like shadcn.
   Enumerating every leaf as a standalone_token would have taken
   ~38 entries. The honest mechanism for a grammar-shaped source
   is `token_grammar` with prose ownership in the grammar `description:`
   — which preserves (γ)'s principle (prose-ownership, no new format
   field) while adapting the mechanism to the source shape.
   **Two `token_grammar` entries + 2 `standalone_tokens` total = 4
   declarations for the entire Primer surface modelled.** The
   budget's spirit (no new fields) is kept; the budget's letter (≤25
   standalone_tokens) was rendered moot by the mechanism shift.
   *Recommendation:* one-line footnote in `BIG-DS-SHADCN-FINDINGS.md`
   F-shadcn-0 clarifying "(γ) is a principle; mechanism adapts to
   source shape" — low-effort doc polish.

2. **F-primer-5 — `property.target_only` now has two-DS evidence.**
   F-shadcn-2 first logged the pattern: a property axis whose effects
   live entirely outside the Component's modelled token family (shadcn's
   Tailwind utility size bundles). That finding explicitly deferred
   the fix until two-DS evidence existed. Primer's Button `size`
   property repeats the pattern — not via utility classes, but via
   DS-owned tokens in a grammar family this pass doesn't model
   (`control.{size}.*`). Same symptom, different cause: the
   signalling gap *"this property's absence of bindings is
   intentional"* is worth a machine-readable flag. Recommend a
   single optional `property.target_only: true` boolean for draft.8
   — smallest possible surface that covers both DSes.

3. **F-primer-4a + F-primer-4b — focus ring (confirmed) and
   pending state (open).**
   F-shadcn-5's single-ring focus observation is confirmed on a
   second DS; §13.5's *"use plain `outline-color:` for single-ring;
   §13.5 block is for structured double-ring"* prose note is
   well-motivated and ready for draft.8. Primer's pending/loading
   state (Button's native spinner) was deferred this pass to keep
   the token-driven-principle stress test clean; the modelling
   question *"Formtrieb's `states.pending: {token_expandable: false}` or
   a richer idiom?"* opens again with Material 3's loading patterns.

## Also logged (F-primer 0, 2, 3, 6 — lower impact)

- **F-primer-0** — Primer layout + DTCG `$extensions.overrides`
  mode encoding differs from the brief's assumed per-theme-folder
  layout. Both representations are CDF-compatible; toolchain
  concern, not a CDF gap.
- **F-primer-2** — Theme axis decision: Light + Dark only (per
  brief pre-commit); 8+ vision-accommodation modes deferred to a
  dedicated pass (likely Material 3 accessibility surface).
- **F-primer-3** — DTCG `$type` at leaf level vs CDF `dtcg_type` at
  grammar level: 100% overlap, harmless redundancy. Not a gap.
- **F-primer-6** — Semantic API naming vs colour-keyed token naming
  on Label (React `variant=accent` → token `blue`). Profile models
  the token surface; semantic wrapper belongs at the component-
  library layer. Doc-level recommendation for draft.8.

## Recommendation

**γ-bridge absorbed real DTCG; go to Material 3 next.**

Rationale: The brief's headline question — *"does draft.6+draft.7
describe real DTCG without bending?"* — gets a **qualified yes**.
*Qualified* because of F-primer-1's mechanism shift (the literal
(γ)-as-standalone_tokens interpretation needed adaptation for
grammar-shaped sources), but the QUALIFICATION IS DOCUMENTATION,
NOT FORMAT. Zero fields added, zero toggles. The Token-Driven
Principle prose (draft.7 §1.1 #2, §13 intro, §6 intro) described
Primer correctly without bending — CDF-CON-008 (the
`no-raw-unitless-tokens` rule; shipped ID differs from the draft.7
plan's CDF-CON-006 because 006/007 were already taken) was silent on
both components, exactly the token-driven DS's expected result.

The (γ)/(β) question **stays closed**: Primer did not require a
`token_provider` field. Prose ownership via `description:` (whether
on `standalone_tokens` or `token_grammar` entries) continues to
carry external-source signalling with zero format cost.

**Do NOT reopen F-Radix-3 (asChild / Primer `as` polymorphism).**
Primer's `as` has the same shape as Radix's Slot and shadcn's asChild
— three DSes now share the same deferral, and all three logged it
without new format evidence. The Dialog-evidence trigger stays the
right next step for that decision.

**Do NOT reopen F-shadcn-2 as a separate question — it MERGES with
F-primer-5** as "two-DS evidence for `property.target_only`." Draft.8
should pick (a) the minimal one-boolean change from the F-shadcn-2
proposal.

## Commits

Recommended sequence for reviewer replay:

1. `docs(primer): Step 0 — provision @primer/primitives + findings.md skel`
2. `docs(primer): Step 1 — Profile + .cdf.config.yaml for Button+Label`
3. `docs(primer): Step 2 — port Primer Button spec`
4. `docs(primer): Step 3 — port Primer Label spec`
5. `docs(primer): Step 4 — findings + summary` (this commit, pending)

Each commit independently revertable; findings accumulate in
`primerTests/findings.md` on each step.

## What this unlocks for Material 3

Material 3's CDF port will stress:

- **Rich tokens** (motion, elevation, typography scale, state layers,
  dynamic colour seeds) — tests `token_grammar` + `token_layers` at
  scale. State layers will **confirm** (or deny) draft.7's verdict
  that 12%-overlay-on-hover is a token-build-time transformation, not
  a runtime rule. Primer's Token-Driven Principle validation (this
  pass) is the prior that makes Material 3's state-layer test meaningful.
- **Theme mechanics at scale** — dynamic-colour seed → palette
  generation. CDF's `theming.set_mapping:` was exercised by Formtrieb
  (three axes) but not by shadcn or Primer in any meaningful way.
  Material 3 closes that gap.
- **The `property.target_only` decision** — Material 3's density
  scale and elevation tiers will produce the final data point for
  F-primer-5 / F-shadcn-2. Three-DS evidence is enough to land or
  reject the flag.
- **Vision-accommodation re-opens** — F-primer-2 deferred Primer's
  8+ accommodation modes. Material 3's accessibility contract
  (dynamic contrast curves, high-contrast seed) reactivates the
  `theming.modifiers` multi-axis question on a DS that designs for
  it explicitly.

The three prior passes prepared the ground cleanly; draft.6 + draft.7
survived **headless (Radix), token-bridge-external (shadcn), and
token-bridge-DTCG (Primer)** with zero structural format change.
Material 3 is the test that decides whether draft.7 → draft.8 opens
as a refinement pass or as a growth pass. **Current evidence points
to refinement** — F-primer-5's property flag and F-primer-4a's
single-ring focus note are both small, additive, well-motivated by
multi-DS evidence, and can be made without revisiting any format
mechanic.
