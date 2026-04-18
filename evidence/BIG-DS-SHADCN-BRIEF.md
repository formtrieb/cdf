# Big-DS shadcn/ui Port — Session Brief

**Status:** Operational handoff for the second Big-DS pass.
**Companion docs:**
- [`BIG-DS-RADIX-BRIEF.md`](./BIG-DS-RADIX-BRIEF.md) — the prior pass; same
  format, simpler scope (no tokens). Read it as a worked example.
- [`BIG-DS-RADIX-FINDINGS.md`](./BIG-DS-RADIX-FINDINGS.md) — what the
  Radix port surfaced. Some findings carry over.
- [`specs/2026-04-16-draft6-plan.md`](./specs/2026-04-16-draft6-plan.md)
  — five patches that should land BEFORE this session starts. The brief
  assumes draft.6 is in.

## Mission (one paragraph)

shadcn/ui is **Radix Primitives + Tailwind + CSS variables**. The Radix
pass proved CDF can describe headless components. shadcn adds the next
question: *what happens when Radix-shaped components DO bind to tokens,
and the tokens live in the consumer's Tailwind config?* This pass
stresses the **token-bridge** — the seam where a Component's `tokens:`
block points at values declared outside the DS itself. Output is two
component specs and a `findings.md` focused on the bridge.

## Setup

```
shadcnTests/
  shadcn.profile.yaml         ← extends-or-mirrors the Radix profile shape
  .cdf.config.yaml
  specs/
    button.component.yaml     ← canonical shadcn component, has all axes
    badge.component.yaml      ← smallest component with tokens
  findings.md
```

**Source-of-truth for shadcn:**
- Docs: https://ui.shadcn.com/docs/components/button
- Docs: https://ui.shadcn.com/docs/components/badge
- Source: https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4/ui
- Default theme tokens: https://github.com/shadcn-ui/ui/blob/main/apps/v4/registry/new-york-v4/themes.css

## Token-bridge strategy decision (made up front)

shadcn ships tokens as CSS custom properties in `globals.css`,
configured by `tailwind.config.ts`. Consumer adoption typically copies
the `globals.css` into their own project and then *forks* it. The DS
does not own the values — the consumer does.

**Three modelling options. Pick ONE before authoring, do not reopen
mid-port:**

- **(α) Enumerate as standalone_tokens.** shadcn.profile.yaml lists
  `--background`, `--foreground`, `--primary`, `--primary-foreground`,
  etc. as `standalone_tokens`. Component `tokens:` blocks reference
  them. Pro: works with existing CDF mechanisms. Con: dishonest about
  the values being consumer-owned.

- **(β) Declare as external token provider.** New Profile field
  `token_provider: { kind: external, source: tailwind, reference:
  ./globals.css }`. Tokens are NOT enumerated; the Profile says
  "values live there, trust them". Pro: honest. Con: new format field,
  spends draft.6+1 budget.

- **(γ) Hybrid — semantic shape only.** Profile declares the *concepts*
  (`color.semantic.background`, `color.semantic.primary`) as standalone
  tokens with `description: external — see globals.css`. Component
  references them by semantic name. Pro: works without new fields,
  documents the externality. Con: redundant declaration.

**Recommended:** (γ) for this first pass. It tests the bridge without
spending format budget. (β) becomes the call IF (γ) breaks under
Button + Badge. Document the choice in `findings.md` as F-shadcn-0.

## Working sources to consult

- `radixTests/radix.profile.yaml` + `radixTests/specs/` — start by
  copying these. shadcn's Toggle is essentially Radix Toggle + tokens.
- `specs/v1.0.0-draft/CDF-PROFILE-SPEC.md` §6.11 (`standalone_tokens`)
  — the bridge mechanism for option (α) and (γ)
- `specs/v1.0.0-draft/examples/` — minimal token-aware Profile shape
- `formtrieb.profile.yaml` — full token-grammar example (for
  comparison only; shadcn does NOT structure tokens that way)

## Step-by-step

### Step 1 — Profile (≈45 min, hand-authored)

Start from `radix.profile.yaml`. Add:

- A vocabulary for shadcn's `variant` enum: `[default, destructive,
  outline, secondary, ghost, link]` (Button) plus
  `[default, secondary, destructive, outline]` (Badge). Decide
  whether one combined vocab or two scoped vocabs is cleaner.
- A vocabulary for `size`: `[default, sm, lg, icon]`.
- The chosen token-bridge form (α/β/γ — see above). Add an `intent`
  vocabulary if needed for token paths.
- `interaction_patterns.pressable` already in Radix profile; reuse.
- `categories.Interactive` already there; reuse.
- `theming:` — shadcn ships a Light/Dark mechanism via CSS class on
  root (`.dark`). Document it in `theming.modifiers` as `semantic:
  [Light, Dark]` even if `set_mapping: {}` (consumer manages).

Watch for: shadcn's `variant` is conceptually Formtrieb's `hierarchy`.
Naming choice — keep `variant` (shadcn's word, honest) rather than
remapping to `hierarchy`. This tests CDF's vocabulary naming
flexibility.

### Step 2 — Button (≈1h)

shadcn Button is the canonical example: 6 variants × 4 sizes + asChild
+ disabled + standard button semantics. The most-likely-to-friction
component in shadcn's surface.

Watch for:
- **Token references** — Button's variants paint background and
  foreground from semantic tokens (`bg-primary`, `text-primary-foreground`).
  Component `tokens:` block needs to reference whatever the chosen
  bridge form declared. F-shadcn-1 candidate: does the bridge survive
  Button's six variants?
- **`asChild`** — same friction as F-Radix-3. Already documented.
  Decide: model it the same way (boolean property, accept Tier-4
  loosening) or skip it for now.
- **Variant + size cross-product** — 6 × 4 = 24 cells. Are all 24
  designed? (Check the source — some sizes only apply to certain
  variants.) Tests `compound_states:` if not.
- **Loading state** — Button has no built-in loading prop in shadcn,
  but consumers often add it. Decide: out of scope (consumer concern)
  or model as `pending`?

### Step 3 — Badge (≈30 min)

Smaller surface: 4 variants, no sizes, no states beyond static. Mainly
exercises the variant token path, parallel to Button but stripped.
Useful as cross-check: do the variant tokens declare consistently
across two components?

Watch for:
- **Foreground/background pair pattern** — `--primary` + `--primary-foreground`,
  `--secondary` + `--secondary-foreground`, etc. Does the chosen
  bridge form cleanly express the *pairing*, or does it become 12
  loose tokens?
- **`asChild`** — same as Button. Same decision.

### Step 4 — Validate + decide

Same triage as Radix:
- Real format gap → `findings.md` with proposed patch
- Validator behind spec → cdf-core TODO
- My misunderstanding → fix the spec

**Format-change budget for shadcn pass: ≤2 new optional fields, ≤1
new toggle.** Slightly looser than Radix because the token-bridge is
genuinely new territory; if option (β) becomes necessary that alone
spends one of the two field slots.

If the budget is exceeded, **stop, write up, defer Material 3**.

### Step 5 (optional) — LLM cross-test

If time permits and Profile + Button are clean, hand a fresh LLM the
Profile + Button spec + Badge docs. Compare. Same value as before:
ambiguity-detector + friction-confirmer.

## findings.md format

Same template as Radix. F-shadcn-N numbering. F-shadcn-0 reserved for
the token-bridge strategy choice (which option was picked, why, how
it held up).

Carry-over Radix findings stay in their own file — don't re-log unless
shadcn surfaces a new dimension of the same friction.

## What you are NOT doing in this session

- **Not porting the rest of shadcn** (Card, Dialog, Form, etc.). Two
  components is the whole job.
- **Not building a real Tailwind toolchain.** The Profile references
  the `globals.css` shape; we don't generate or consume real Tailwind.
- **Not solving asChild** (F-Radix-3). Same deferral as Radix unless
  shadcn provides a different angle.
- **Not extending the Validator beyond draft.6.** Log; don't fix.

## When you're done

Hand back with:

1. Files in `shadcnTests/` (profile, two specs, findings.md)
2. Update or replace `docs/BIG-DS-SHADCN-FINDINGS.md` — the summary
   doc with format-budget tally, top-3 frictions, and a verdict:
   - "Token-bridge held; go to Material 3 next" OR
   - "Token-bridge stressed; draft.7 first, then Material 3"
3. One commit per major step

The headline question this brief answers — *can CDF describe a
DS that delegates its values to consumer-owned config?* — gets a
clear yes/no/qualified-yes from the findings doc.

## Why two passes before Material 3

Radix → shadcn → Material 3 is a deliberate ramp:
- Radix tests **headless** (no tokens at all)
- shadcn tests **token-bridge** (tokens exist but are external)
- Material 3 tests **full DS** (tokens, theming, motion, accessibility,
  scale)

Skipping shadcn means jumping from "no tokens" to "rich tokens" in one
step — too many friction sources to attribute cleanly. The token-bridge
is its own concept and deserves isolated stress-testing.
