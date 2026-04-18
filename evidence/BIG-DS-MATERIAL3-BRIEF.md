# Big-DS Material 3 Port — Session Brief

**Status:** Operational handoff for the fourth Big-DS pass.
**Assumes:** draft.8 has landed (commit `0ee61d0`, see
[`specs/2026-04-16-draft8-plan.md`](./specs/2026-04-16-draft8-plan.md)).
If it has not, **stop and land draft.8 first** — this brief cites
draft.8's `property.target_only` and §13.5.1/§5.6 prose notes.

**Companion docs:**
- [`BIG-DS-PRIMER-BRIEF.md`](./BIG-DS-PRIMER-BRIEF.md) — prior pass,
  same brief structure, DTCG-happy-path scope.
- [`BIG-DS-PRIMER-FINDINGS.md`](./BIG-DS-PRIMER-FINDINGS.md) — the
  findings this pass builds on. F-primer-1 (γ as principle), F-primer-2
  (vision-accommodation deferred), F-primer-5 (target_only two-DS
  evidence) are load-bearing.
- [`BIG-DS-SHADCN-FINDINGS.md`](./BIG-DS-SHADCN-FINDINGS.md) — second
  pass, F-shadcn-0 footnote (γ-principle clarification, 2026-04-16).
- [`BIG-DS-RADIX-BRIEF.md`](./BIG-DS-RADIX-BRIEF.md) — first pass,
  headless reference.

## Mission (one paragraph)

Material 3 is Google's design system. Unlike Primer (real DTCG with
`$value`/`$type`) it has its **own** token format, generated from a
**dynamic-color seed** by the `@material/material-color-utilities`
toolchain. Three things make it the *exotic* token-bridge case the
γ-principle has not yet been tested against: (1) **state layers** —
12% / 16% / 24% opacity overlays per interaction state, the exact
runtime-math pattern draft.7's CDF-CON-008 was written to forbid;
(2) **rich token families** beyond color/typography — elevation tiers,
motion durations/easings, shape corners, density scales — testing
whether `token_grammar` composes at scale; (3) **first-class
vision-accommodation** with explicit medium/high-contrast tonal
ramps that F-primer-2 deferred. This pass answers *"does CDF
absorb a non-DTCG, toolchain-generated, multi-axis-themed DS
without bending?"* — the fourth foreign-DS pass and the strongest
test of the format's general-vs-Formtrieb-tailored question.

## Setup

```
material3Tests/
  material3.profile.yaml      ← adopts Material color-roles + scales via (γ)
  .cdf.config.yaml            ← prefix `m3`, multi-axis theming
  specs/
    button.component.yaml     ← canonical Material interactive surface
    fab.component.yaml        ← elevation-distinctive component
  findings.md
```

**Source-of-truth for Material 3:**

Material 3 has no single canonical token-tree repo. Use this
prioritised stack:

1. **`@material/material-color-utilities`** (npm package) — the
   official seed-to-palette generator. Run once with a fixed seed to
   produce a deterministic palette; treat the output as the token
   source. Pin the seed in `findings.md` for replay.
2. **`@material/web`** (npm package) — Material's reference web
   components, ships canonical CSS-var names (`--md-sys-color-primary`,
   `--md-sys-elevation-level1`, …). Reference for token naming.
3. **m3.material.io docs** — component behaviour, state-layer
   percentages, density specs, motion tokens.
4. **Material 3 Figma Design Kit** — for visual check only; do NOT
   drive Profile decisions from Figma variables (they drift from the
   code-side token names).

**Provisioning strategy is different from Primer.** Primer ships a
clean DTCG tree to clone. Material 3 does NOT. Step 0 generates the
tokens locally rather than cloning a tree — see Step 0 below.

## γ-Bridge strategy (pre-committed — and re-grounded after Primer)

**Use (γ) as a principle, not as a mechanism.** The principle is
prose-ownership in `description:`, no new format field. The mechanism
adapts to the source shape, per the post-Primer footnote in
shadcnTests/findings.md F-shadcn-0:

| Source shape                          | Mechanism            |
|---------------------------------------|----------------------|
| Flat names (shadcn CSS vars)          | `standalone_tokens`  |
| Grammar-shaped DTCG (Primer)          | `token_grammar`      |
| **Material 3** — color-roles by name + sys-tokens by family | **mixed:** `standalone_tokens` for one-off sys tokens (elevation level1…level5, shape corner-radius scale), `token_grammar` for color-role × tonal-step families (`color.primary.{tone}`, `color.secondary.{tone}`, …) |

Pre-committed: do NOT re-open the (γ)/(β) decision unless one of
these triggers fires:

- Material's seed/palette generation produces metadata that needs
  in-Profile encoding (e.g. tonal-step provenance for accessibility
  audits). Then a `token_provider` field (β) becomes worth proposing.
- State-layer percentages need a structural slot. **They do NOT** —
  draft.7's principle says they are pre-computed token values, not
  CDF runtime math. If you find yourself wanting to add a percentage
  field anywhere in the Profile or Component spec, that is a
  principle violation, not a format gap. Re-read draft.7 plan T2
  before logging.

## Working sources to consult

- `primerTests/primer.profile.yaml` — reference for `token_grammar` +
  `standalone_tokens` mixed adoption with prose ownership. Closest
  precedent for Material's mixed-shape source.
- `shadcnTests/shadcn.profile.yaml` — reference for `standalone_tokens`
  with external-source prose annotation.
- `formtrieb.profile.yaml` — full-grammar reference; Formtrieb is the
  closest analogue to Material's depth (5-level paths, multi-axis
  theming).
- `specs/v1.0.0-draft/CDF-PROFILE-SPEC.md` §5.6 (NEW in draft.8 —
  vocab-key vs semantic-API naming). Material's color-roles
  (`primary`, `secondary`, `tertiary`, `error`, `surface`) ARE
  semantic names, but they ALSO appear in the token tree
  (`md.sys.color.primary`). So §5.6's pattern does not apply
  directly — Material is the case where token-key naming and
  semantic-API naming **coincide**. Document this in F-material-N.
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` §7.12 (NEW in draft.8 —
  `target_only`). Material's density-scale is the third-DS data
  point for this field; expect to use it on Button.
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` §13.5.1 (NEW in draft.8 —
  Single-ring vs Double-ring). Material 3 has a focus-ring overlay
  pattern — single-ring? double-ring? prose-note before deciding.

## Step-by-step

### Step 0 — Provision Material 3 tokens (≈10 min)

Material does not ship a clone-able token tree. Generate one
deterministically from a fixed seed:

```bash
mkdir -p material3Tests/.material3-tokens
cd material3Tests/.material3-tokens

# Init a tiny throwaway project to host the dependency
cat > package.json <<'EOF'
{ "name": "material3-tokens-gen", "private": true, "type": "module" }
EOF
npm install @material/material-color-utilities

# Generate palette from a fixed seed
node --input-type=module -e "
  import { themeFromSourceColor, hexFromArgb } from '@material/material-color-utilities';
  const seed = 0xff6750A4; // Material 3 default purple seed
  const theme = themeFromSourceColor(seed);
  const out = {
    seed: '#6750A4',
    schemes: {
      light: Object.fromEntries(Object.entries(theme.schemes.light.toJSON()).map(([k,v]) => [k, hexFromArgb(v)])),
      dark:  Object.fromEntries(Object.entries(theme.schemes.dark.toJSON()).map(([k,v]) => [k, hexFromArgb(v)])),
    },
    palettes: Object.fromEntries(Object.entries(theme.palettes).map(([name, palette]) => [
      name,
      Object.fromEntries([0,10,20,25,30,35,40,50,60,70,80,90,95,98,99,100].map(tone => [tone, hexFromArgb(palette.tone(tone))])),
    ])),
  };
  console.log(JSON.stringify(out, null, 2));
" > tokens-baseline.json

cd ..
echo "/.material3-tokens/" >> .gitignore
```

**For elevation, motion, shape, typography:** these aren't seed-derived;
they come from m3.material.io docs (or `@material/web` CSS variables).
Manually transcribe the few you need into a `tokens-static.json` next
to `tokens-baseline.json`. Suggested scope for this pass:

- Elevation: levels 0–5 (six values)
- Shape corner: 7-step scale (`none, extra-small, small, medium, large, extra-large, full`)
- Motion duration: 7 values (50/100/150/200/250/300/400 ms)
- Motion easing: 5 values (`standard`, `emphasized`, `linear`, `decelerated`, `accelerated`)

Record in `findings.md`:
- The seed value used
- The `@material/material-color-utilities` version
- Date of generation

This is **not** a real DTCG tree. The Profile's `description:` prose
must be honest: tokens are toolchain-generated, source-of-truth lives
in the seed + utility version + m3.material.io.

### Step 1 — Profile (≈90 min — longer than Primer)

Start by copying `primerTests/primer.profile.yaml`'s structure (mixed
`token_grammar` + `standalone_tokens`).

Tasks:

- **Color-role grammar.** Material's color roles (`primary`,
  `secondary`, `tertiary`, `error`, `surface`, `background`,
  plus `*-container`, `on-*`, `on-*-container` variants per role)
  are systematic. Model as `color.{role}.{slot}` grammar where
  `role ∈ [primary, secondary, …]` and `slot ∈ [base, container,
  on, on-container]`. Decide whether `outline` and `surface-tint`
  are roles or singletons.
- **Tonal palette grammar (separate).** The seed-generated palettes
  live underneath the color roles. Model as `palette.{role}.{tone}`
  with `tone ∈ [0, 10, 20, …, 100]`. Materials docs describe these
  as the raw material from which color roles are constructed; the
  Profile decides whether to expose the palette tones at all
  (consumer DSes might ignore them and only use color roles).
- **State-layer tokens — this is the principle test.** Material
  defines states as opacity overlays: hover 8%, focus 10%, pressed
  10%, dragged 16% (numbers vary by surface). draft.7 says these
  MUST be pre-compiled into discrete tokens, not declared as
  modifiers. Two choices:
  - **(state-as-token) PREFERRED** — declare per-state color tokens
    (`color.primary.hover`, `color.primary.pressed`, …) with the
    overlay baked into the `$value`. Token-toolchain responsibility
    to produce these from the base + opacity. The Profile and
    Components see only the result.
  - **(state-as-overlay) AVOID** — try to declare a `state-layers`
    family with opacity values. **This violates the token-driven
    principle.** If you find yourself sketching this, stop and
    re-read draft.7 plan T2 + CDF-COMPONENT-SPEC.md §1.1 #2.
  Document the choice as F-material-0 (state-layer mechanism).
- **Elevation grammar.** `elevation.level{n}` for n ∈ 0..5. Each
  level resolves to a box-shadow value at build time (or a
  `box-shadow` token in DTCG-shadow-format if the toolchain
  supports it). Six standalone tokens or one grammar entry — your
  call. Document.
- **Shape grammar.** `shape.corner.{step}` with `step ∈ [none, xs,
  sm, md, lg, xl, full]`. Seven values. Likely standalone or
  grammar — same call.
- **Motion grammar.** `motion.duration.{ms-bucket}` and
  `motion.easing.{name}`. Material has named easings beyond
  cubic-bezier — the Profile encodes the *names*, the toolchain
  resolves to concrete cubic-bezier values.
- **Typography grammar.** Material's type scale is
  `typography.{role}.{size}` with `role ∈ [display, headline,
  title, body, label]` and `size ∈ [large, medium, small]`.
  15 entries × 4 sub-properties (font, size, line-height, weight).
  This will exercise CDF Component §13.4 typography blocks at scale.
- **Density vocabulary** — Material's density-scale `[default,
  comfortable, compact]`. Plan-time decision: model as a Profile
  vocabulary `density: [comfortable, default, compact]`, then
  Button declares `target_only: true` for the density property
  because it does not bind to color/shape tokens — it modulates
  padding via the density token family `density.{component}.{step}`
  which is NOT modelled in the Button spec. **This is the third-DS
  data point for `target_only` (F-primer-5 + F-shadcn-2 already
  scored two).**
- **Theming axes — F-primer-2 reactivated.** Material has explicit
  contrast levels: `standard`, `medium-contrast`, `high-contrast`.
  Combined with light/dark, that is 2 × 3 = 6 modes, plus
  vision-accommodation overlays (deferred from F-primer-2). Decide
  whether to declare:
  - **One axis** `semantic: [Light, Dark, LightMC, DarkMC, LightHC, DarkHC]` (six values, flat)
  - **Two axes** `semantic: [Light, Dark]` × `contrast: [standard, medium, high]` (orthogonal)
  - **Three axes** if vision-accommodation enters now (DON'T —
    defer per F-primer-2's scope; Material's contrast is a
    separate axis from accommodation).
  Recommend **two axes** — it matches CDF Component §6's design
  intent and keeps each axis legible. Document as F-material-1.

Watch for:

- **Color role vs tonal palette overlap.** A common Profile mistake
  would be modelling both as `color.*` grammar — they are different
  semantic levels and SHOULD be separate top-level grammars
  (`color.{role}.{slot}` and `palette.{role}.{tone}`).
- **Density's relationship to size.** Material's `Button.size`
  (small/medium/large) and density-scale (comfortable/default/
  compact) interact — both modulate padding. Plan how the Profile
  models this without creating a 9-cell matrix of redundant tokens.
  Likely answer: size is per-component, density is global; both
  end up `target_only: true` if their tokens live outside the
  Component spec's modelled grammar.

### Step 2 — Button (≈90 min — longer than Primer)

Material 3 Button is rich. Five variants (`elevated`, `filled`,
`filled-tonal`, `outlined`, `text`) × three sizes × full state
matrix (rest, hover, focus, pressed, disabled, dragged for some
variants).

`tokens:` block:

- Each variant × state cell binds to discrete tokens. State-layer
  overlays MUST be pre-resolved tokens, never expressed as opacity
  modifiers in the spec.
- Density: `target_only: true` on the density property. **Validates
  draft.8's T1**.
- Variant: declare as Profile vocabulary `button_variant`, mirror
  pattern from Primer.
- Size: same — Profile vocabulary `button_size`. May or may not
  need `target_only: true` depending on whether size tokens are in
  scope.

Watch for:

- **State layers — biggest principle test of draft.7.** Material's
  filled-Button hover is `primary` base + `on-primary` overlay at
  8% opacity. The CORRECT CDF spec entry binds
  `container.background-color.hover: color.primary.hover` where
  `color.primary.hover` is a TOKEN whose value is the pre-mixed
  result. The INCORRECT entry would put an opacity expression in
  the spec. CDF-CON-008 should never fire — if it does, the Profile
  missed a state-token, not a CDF gap.
- **Elevation × state interaction.** Filled-Button has elevation 0
  resting, elevation 1 on hover, elevation 0 on pressed. This is
  TWO axes of state-driven token resolution (elevation AND color).
  Test whether the Component spec can express both cleanly.
- **Disabled state with reduced opacity.** Material says disabled
  surfaces use 12% opacity overlay on container, 38% on label.
  Same principle: pre-resolved tokens
  (`color.surface.disabled`, `color.on-surface.disabled`) baked at
  build time. NOT runtime modifiers.
- **Focus ring.** Material focus uses an outline + state-layer
  overlay. Single-ring or double-ring per §13.5.1? Read the spec
  prose, decide, document.

### Step 3 — FAB (≈45 min)

Smaller surface than Button but exercises Material's elevation
mechanics most distinctly. Three sizes (small/medium/large/extended,
sometimes counted as 4), one canonical variant (filled with optional
tonal/surface), state matrix similar to Button.

Watch for:

- **Elevation tiers.** FAB rest is elevation 3, hover is elevation 4,
  pressed is elevation 3. Tests whether the elevation grammar
  composes through Component bindings naturally. If `elevation.level3`
  and `elevation.level4` are the only paths needed, six standalone
  tokens is fine; if FAB demands `elevation.{level}.{property}`
  (color, blur, offset), consider grammar.
- **FAB.extended vs standard FAB.** Extended-FAB has a label, sizes
  differently. Is this a `variant` or a `size` axis? Material's docs
  call it a separate component sometimes; pragmatic call: model as a
  variant with an additional `label` slot.
- **Density.** Same `target_only: true` test as Button.

### Step 4 — Validate + decide

Same triage as prior passes:
- Real format gap → `findings.md` with proposed patch (draft.9
  candidate)
- Validator behind spec → cdf-core TODO
- My misunderstanding → fix the spec

**Run CDF-CON-008 explicitly.** Expected: zero hits. Material is the
*hardest* test for the token-driven principle — state layers are
exactly the runtime-math pattern draft.7 forbade. If CDF-CON-008
fires anywhere, either (a) a state-token was missed in the Profile,
or (b) the Profile authored a state-layer family that should not
exist. Both are Profile-side fixes, not CDF-format issues.

**Format-change budget for Material 3 pass: ≤2 new optional fields,
≤1 new toggle.** Same as the prior three passes. **Hypothesis under
test:** four foreign-DS passes with 0/2 and 0/1 = decisive evidence
for format generality. If Material 3 needs ≥1 new field, that is
genuinely interesting — it surfaces a structural concern that three
prior passes (across radically different DS architectures) missed.

If the budget is exceeded, **stop, write up, log clearly which
Material 3 feature surfaced the gap.** Do not press past budget.

### Step 5 (optional) — LLM cross-test

Same as prior passes, with an extra Material-specific angle:

- Hand a fresh LLM the Profile + Button + Material's `m3.material.io/components/buttons/specs`
- Ask it to trace the path from "filled-Button hover background" (a
  human-language description) all the way to a concrete DTCG-style
  value through the Profile.
- The chain should be: human description → Component spec
  `tokens:` entry → Profile `token_grammar` → token-toolchain output
  (the seed-derived palette).
- If any step is ambiguous, the Profile prose has a legibility gap.

## findings.md format

Same template. F-material-N numbering. F-material-0 reserved for the
state-layer mechanism choice (expected resolution: state-as-token,
no escalation).

Carry-over findings from Radix, shadcn, Primer stay in their files.
Re-log here only if Material surfaces a NEW dimension of the same
friction. Specifically, F-material findings should explicitly note:

- F-primer-5 / F-shadcn-2 third-DS confirmation for `target_only`.
  This pass either confirms the field's value or surfaces an unexpected
  third-DS pattern that changes the proposal.
- F-primer-2 vision-accommodation re-examined. Material's contrast
  axis is the first-class case; F-material findings should propose
  whether `theming.modifiers` multi-axis is sufficient.
- F-shadcn-3 token-driven principle stress-test. State-layers are the
  Material-defined pattern that draft.7 explicitly addressed; F-material
  findings should report whether the principle survived in practice.

## What you are NOT doing in this session

- **Not porting the rest of Material 3.** Two components (Button +
  FAB). Card / Chip / Switch / Dialog all wait.
- **Not building real Material toolchain.** The seed-derived JSON
  is a snapshot; we don't generate dynamic palettes per request.
- **Not testing all tonal palettes.** The seed produces palettes
  for primary/secondary/tertiary/error/neutral/neutral-variant; for
  this pass, model the structure but only resolve the values your
  two components actually touch.
- **Not implementing vision-accommodation overlays beyond Material's
  built-in contrast levels.** F-primer-2's broader vision-accommodation
  question stays deferred even as Material's contrast axis enters.
- **Not extending the Validator beyond draft.8.** Log; don't fix.
- **Not solving F-Radix-3 (asChild).** Material has a similar pattern
  (`type: button` vs `type: anchor`) — same deferral.

## When you're done

Hand back with:

1. Files in `material3Tests/` (profile, two specs, findings.md,
   `.material3-tokens/` gitignored)
2. Write `docs/BIG-DS-MATERIAL3-FINDINGS.md` — summary doc with
   format-budget tally, top-3 frictions, and a verdict:
   - "Format absorbed Material 3 without bending; refinement-only
     trajectory confirmed across four foreign-DS passes" OR
   - "Material 3 surfaced N new structural concerns; draft.9 plan
     needed before next pass"
3. One commit per major step, mirroring the Primer commit
   sequence.

The headline question this brief answers — *"does CDF, at draft.8,
absorb a non-DTCG, toolchain-generated, multi-axis-themed,
state-layered DS without bending?"* — gets a clear yes / no /
qualified-yes from the findings doc.

## Why Material 3 last (not first)

Five-rung ladder now visible:

- Radix tested **headless** (no tokens at all) — Apr 16
- shadcn tested **token-bridge-external** (consumer-owned CSS vars) — Apr 16
- Primer tested **token-bridge-DTCG** (DS-owned real DTCG) — Apr 16
- **Material 3** tests **token-bridge-exotic** (DS-owned non-DTCG,
  toolchain-generated, state-layered, multi-axis-themed)
- Material 3 also re-opens **vision-accommodation** (F-primer-2)

The previous three passes prepared the ground: Radix proved CDF
describes API-only components; shadcn proved (γ) absorbs external
ownership; Primer proved (γ) absorbs real DTCG with a mechanism
shift. Material 3 is the test that Materials-3-shaped DSes — rich,
opinionated, toolchain-mediated — fit too. It is also the third-DS
data point for `target_only` and the first-class test of vision-
accommodation modelling.

If Material 3 lands clean, the format-stability hypothesis is
overwhelmingly confirmed across the practical range of DS
architectures. If Material 3 surfaces real gaps, those gaps are
specifically the rich-DS gaps the four-pass ladder was designed to
expose — exactly the right time to surface them, before the format
freezes for v1.0.0.

## Success signal

Four foreign-DS passes with **0/2 and 0/1** budgets would be the
clearest evidence the format is general, not Formtrieb-tailored. The
hypothesis the entire foreign-DS series tests:

> *"CDF v1.0.0-draft.8 describes the practical range of design system
> architectures (headless, external-CSS-vars, real-DTCG, rich-non-DTCG)
> without structural format change."*

Material 3 is the test that decides whether v1.0.0 final ships as a
refinement of draft.8 or whether one more growth round is needed.
**Current evidence (3-of-3 clean) points to refinement.** Material 3
either confirms or denies decisively.
