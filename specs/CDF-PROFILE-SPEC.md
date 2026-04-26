<!-- GENERATED FILE — do not edit directly.
     Source fragments: cdf/specs/profile/
     Regenerate with:  scripts/build-profile-spec.sh -->

# CDF Profile Format

**Version:** 1.0.0
**Status:** Working Draft
**File extension:** `.profile.yaml`
**Depends on:** DTCG ≥ 2025.10
**Consumed by:** [CDF](CDF-COMPONENT-SPEC.md), [CDF Target](CDF-TARGET-SPEC.md)

---

## 1. Purpose

A Profile describes the **semantic vocabulary of a design system**, independent
of any single component and independent of any output framework. It is the
shared context every CDF Component in the DS implicitly imports.

A Profile tells consumers:

- What named value sets the DS uses (hierarchies, intents, sizes, …)
- What token paths are legal, and what each segment means
- What theming modifiers exist (semantic/device/shape/…) and how they apply
- What naming conventions the DS follows (CSS prefix, BEM pattern, file casing)
- What interaction patterns are canonical (state semantics, event conventions)
- What accessibility defaults apply to all components
- What component categories exist
- Where assets (icons, fonts) come from and how they are consumed
- What CSS conventions (state-guard selectors, private-property naming) apply

A Profile **does not** describe individual components. That is the job of
[CDF](CDF-COMPONENT-SPEC.md).

A Profile **does not** describe output conventions for a specific framework.
That is the job of [CDF Target](CDF-TARGET-SPEC.md).

> ### 1.1 Design principles
>
> 1. **Vocabulary, not configuration** — A Profile names things. It does not
>    parametrise generators.
> 2. **Single source of truth per concept** — A hierarchy is defined once,
>    referenced everywhere.
> 3. **LLM-legible** — Every field has a `description:` explaining *why*, not
>    just *what*.
> 4. **Extensible by composition** — A Profile MAY extend another Profile,
>    overriding only the fields that differ.
> 5. **DTCG-compatible** — Token grammar maps to DTCG `$type` values.

---

## 2. Conformance

A file conforms to this specification if:

1. It is valid YAML 1.2.
2. It contains all fields marked **REQUIRED** in [§3](#3-top-level-schema).
3. All field values match the types declared in this spec.
4. All vocabulary references resolve within the same file (or within an
   extended Profile, see [§15](#15-profile-extension)).
5. All `token_grammar` patterns reference either declared vocabularies or
   inline value sets.

A conforming validator MUST reject any file violating (1)–(5). A conforming
validator MAY warn about missing non-required fields.

---

## 3. Top-level schema

```yaml
# ── Identity ──────────────────────────────────────────────────
name: string                      # REQUIRED
version: string                   # REQUIRED — semver
cdf_version: string               # REQUIRED — semver range
dtcg_version: string              # optional — date-based DTCG version
extends: path                     # optional — another .profile.yaml
description: string               # REQUIRED

# ── Core vocabularies ─────────────────────────────────────────
vocabularies: Vocabularies        # REQUIRED — named value sets

# ── Token layer ───────────────────────────────────────────────
token_grammar: TokenGrammar       # REQUIRED — path patterns + types
token_layers: TokenLayers         # optional — reference cascade between grammars
standalone_tokens: StandaloneTokens # optional — tokens outside any grammar
token_sources: TokenSources       # optional — where tokens live on disk

# ── Theming ──────────────────────────────────────────────────
theming: Theming                  # REQUIRED — modifier axes + values

# ── Naming ────────────────────────────────────────────────────
naming: Naming                    # REQUIRED — DS identifier + DS-level casing

# ── Interaction ──────────────────────────────────────────────
interaction_patterns: InteractionPatterns  # optional — canonical state semantics

# ── Accessibility defaults ───────────────────────────────────
accessibility_defaults: A11yDefaults       # optional — DS-wide a11y conventions

# ── Component organisation ───────────────────────────────────
categories: Categories            # optional — component groupings

# ── External assets ──────────────────────────────────────────
assets: Assets                    # optional — icons, fonts, etc.

# Note: `css_defaults:` was removed in the v1.0.0-draft layer-boundary
# review pass. State guards and other CSS conventions now live in the
# Web Target (CDF-TARGET-SPEC §9.7). See §14 below.
```

---

## 4. Identity

The Identity block declares **what this Profile is** and **what it is
compatible with**. It is the first thing a consumer reads.

```yaml
name: string                      # REQUIRED
version: string                   # REQUIRED — semver
cdf_version: string               # REQUIRED — semver range
dtcg_version: string              # optional — date-based DTCG version
extends: path                     # optional — another .profile.yaml
description: string               # REQUIRED — multi-line
```

### 4.1 `name`

- **Type:** string
- **REQUIRED.**
- **Rule:** PascalCase. Used as a human-facing identifier and (conventionally)
  as the prefix derivation source (e.g. `name: Formtrieb` → `css_prefix: ft`,
  declared explicitly in [§9](#9-naming)).
- **Stability:** MUST NOT change across minor/patch versions. A rename is a
  major version bump, because downstream CDF Components may refer to the Profile
  by name.

### 4.2 `version`

- **Type:** semver string (e.g. `"1.0.0"`, `"1.1.0-draft"`).
- **REQUIRED.**
- **Rule:** Follows [semver 2.0](https://semver.org). Breaking changes to
  `vocabularies`, `token_grammar`, or `naming` require a major version bump.
  Additions that do not invalidate existing CDF Components require a minor bump.
  Documentation-only changes are a patch.
- **Pre-release:** A `-draft` suffix signals the Profile is experimental and
  consumers MUST NOT assume stability.

### 4.3 `cdf_version`

- **Type:** semver range (e.g. `">=1.0.0 <2.0.0"`, `">=1.0.0-draft"`).
- **REQUIRED.**
- **Purpose:** Declares which CDF Component versions this Profile is compatible with.
  A validator MUST refuse to resolve a CDF Component against a Profile whose
  `cdf_version` range does not include the CDF Component Component's own version.
- **Rule:** Ranges SHOULD be expressed as closed-open intervals per semver
  convention.

### 4.4 `dtcg_version`

- **Type:** date string matching the DTCG release versioning (e.g.
  `"2025.10"`).
- **Optional.**
- **Purpose:** Declares which DTCG version the Profile's `token_grammar`
  types against. A Profile that does not import DTCG tokens MAY omit this.
- **Default:** If omitted, consumers assume the latest DTCG release.

### 4.5 `extends`

- **Type:** path string, relative to the Profile file's location.
- **Optional.**
- **Purpose:** Declares Profile inheritance (see [§15](#15-profile-extension)).
  An extended Profile's fields are inherited; the extending Profile overrides
  selectively.
- **Rule:** Circular extension MUST be rejected by a validator.

### 4.6 `description`

- **Type:** string (multi-line allowed).
- **REQUIRED.**
- **Purpose:** Explains the intent of the Profile in prose. Read by humans
  and LLMs; SHOULD answer "what system is this, and what does it cover?" in
  under 120 words.

### 4.7 Example

```yaml
name: Formtrieb
version: "1.0.0"
cdf_version: ">=1.0.0 <2.0.0"
dtcg_version: "2025.10"
description: >
  Formtrieb design system profile. Defines the semantic vocabulary for
  interactive controls and status indicators across all targets.
```

---

## 5. Vocabularies

A **vocabulary** is a named, ordered set of canonical values. Vocabularies
are the *alphabet* from which legal token paths and legal Component property
values are formed.

Vocabularies are referenced:

- From [`token_grammar`](#6-token-grammar) — an axis declares
  `vocabulary: hierarchy` to pull the set `[brand, primary, secondary,
  tertiary]`.
- From [Component properties](CDF-COMPONENT-SPEC.md#7-properties) — a property declares
  `type: enum`, `values: [brand, primary, secondary, tertiary]`; a
  profile-aware validator MAY recognise these as a vocabulary instance.
- From [Component state axes](CDF-COMPONENT-SPEC.md#8-states) — axis values SHOULD come
  from a vocabulary or from the Profile's
  [interaction patterns](#10-interaction-patterns).

### 5.1 Schema

```yaml
vocabularies:
  {name}:                         # REQUIRED — snake_case key
    description: string           # REQUIRED — why this vocabulary exists
    values: [string, ...]         # REQUIRED — ordered list of canonical values
    casing: string                # optional — lowercase | PascalCase | kebab
    aliases:                      # optional — synonyms recognised by
      {alt_name}: {canonical}     #            validators but emitted as
                                  #            canonical in generated output
    per_category:                 # optional — see §5.4
      {category}: [string, ...]
    notes:                        # optional — key → note pairs
      {value}: string
```

### 5.2 `description`

A one-paragraph explanation of **what the vocabulary means**, not what its
values are. The purpose is to let an LLM understand *why this set exists*
without cross-referencing a component.

> Good: "Visual emphasis levels for interactive controls. Higher hierarchy
> = more visual weight."
> Bad: "brand, primary, secondary, tertiary."

### 5.3 `values`

An ordered list of canonical strings. **Order is normative**: consumers MAY
rely on it (e.g. rendering hierarchy choices from strongest to weakest in
documentation tools).

Values are case-sensitive. If a vocabulary documents a specific casing via
`casing:`, every value MUST match.

### 5.4 `per_category` — variant shapes

Some vocabularies are **variant-shaped**: the set of legal values depends on
a containing category. Example: typography `name` depends on the `category`:

```yaml
typography:
  pattern: "Typography.{category}.{name}"
  axes:
    category:
      values: [Display, Title, Body, Label, Caption]
    name:
      per_category:
        Display: ["Display 1", "Display 2", "Display 3"]
        Title: ["Title 1", "Title 2", "Title 3"]
        Body: [Base, Large]
        Label: [Large, Base, Small]
```

A consumer validating `Typography.Display.Base` MUST reject it — `Base` is
not a legal `name` when `category: Display`.

### 5.5 Rules

1. **Uniqueness:** Within one vocabulary, values MUST be unique.
2. **Cross-vocabulary overlap:** Values MAY appear in multiple vocabularies
   with different meanings (e.g. `primary` in both `hierarchy` and
   `intensity`). Consumers disambiguate by context (axis binding).
   *Canonical example from foreign-DS validation:* Material 3's FAB has
   variants `[primary, secondary, tertiary, surface]` whose names are
   **identical** to values in the `color_role` vocabulary — because in
   Material a FAB's "variant" IS its colour role. Similarly,
   `[small, medium, large]` appears in both the `size` vocabulary
   (Button/FAB) and the `typography_scale` vocabulary. Rule 5 (reserved-
   namespace isolation) applies only when a value is in **exactly one**
   vocabulary — so both Material overlaps are legal. `binds_to:` on the
   Component property is what makes the disambiguation machine-
   readable. This cross-vocabulary pattern is unusual in flat /
   single-vocabulary DSes (shadcn, Primer) and becomes first-class in
   rich DSes like Material 3 where vocabularies carry semantic families.
3. **Extension:** An extending Profile MAY add values to an inherited
   vocabulary but MUST NOT remove them without a major version bump.
4. **Vocabulary as type:** A Component property may declare `type: hierarchy`
   instead of `type: enum` + `values: [...]`. Profile-aware validators
   resolve the type to the vocabulary values.
5. **Reserved-namespace isolation (API level).** A value that belongs to
   exactly one vocabulary MUST NOT appear in a Component `properties.*.values`
   or `states.*.values` list **unless that axis is bound to the owning
   vocabulary** (same name, or explicit `binds_to:` declaration — see
   CDF Component §7/§8). Mixing a vocabulary's values into an axis that
   does not speak its name is a Tier-1 validator error
   (`CDF-STR-011` in CDF Component §18.3). The rule applies only to
   **properties and states** — Token paths are not subject to it, because
   tokens are the implementation layer and a Profile's `token_grammar`
   closure is sufficient there.

> **Why isolation is hard.** Without this rule, two Components in the same
> DS can spell validation in incompatible ways — one as a separate axis,
> one folded into interaction — and a consumer cannot predict which. The
> Profile is the DS's constitution (Architecture §3.4); its vocabularies
> only constrain behaviour if they are enforced. This rule is the
> enforcement mechanism for property- and state-level API surface.

### 5.6 Token-key naming vs. semantic-API naming

A DS's component library MAY expose a property API whose values differ
from the underlying token keys. Concrete example: Primer-React's `Label`
component exposes `variant=accent | success | attention | severe |
danger | done | sponsors`, while the underlying token tree
(`@primer/primitives/src/tokens/component/label.json5`) keys by colour:
`label.blue`, `label.green`, `label.yellow`, `label.orange`,
`label.red`, `label.purple`, `label.pink`. The semantic-to-colour
mapping (`accent → blue`, `success → green`, …) lives inside the
component library (`Label.tsx`), not the token tree.

A CDF Profile models the **token surface**, not the component library's
API. The vocabulary that covers this property SHOULD use the
**token-key values**, not the semantic API values:

```yaml
# CORRECT — vocabulary mirrors the DTCG token keys
vocabularies:
  label_scheme:
    values: [blue, green, yellow, orange, red, purple, pink, gray]
    description: |
      Label background/foreground colour family. Names match the
      Primer token tree (label.{scheme}.bgColor, label.{scheme}.fgColor).
      A consuming component library MAY expose a semantic wrapper
      (e.g. variant=accent ↦ scheme=blue); that mapping is a
      library-level concern, not a Profile concern.
```

```yaml
# AVOID — vocabulary embeds semantic API names that don't appear in tokens
vocabularies:
  label_scheme:
    values: [accent, success, attention, severe, danger, done, sponsors]
    # ⚠ These names do NOT appear in the token tree. The Profile would
    #   need a private mapping table to bridge them — Profile becomes
    #   a layer of business logic, not a description of the DS surface.
```

**Why the separation:**

- The Profile's vocabularies must align with what the token tree
  actually exposes. A vocabulary value MUST be addressable in the
  token grammar (otherwise placeholder substitution `label.{scheme}`
  breaks).
- The semantic wrapper — if a CDF-consuming code generator emits one
  for ergonomic API surface — belongs at the **component-library
  generation step**, parametrised by a separate semantic-mapping
  declaration outside the Profile.
- This separation keeps the Profile honest (it describes only the
  token surface) and keeps the library wrapper composable (it can
  vary independently of the underlying tokens).

> **Multi-DS observation.** Most DSes do not have this split: shadcn's
> variant values match its token names (`primary` → `--primary`),
> Formtrieb's hierarchy names appear in both tokens and Components.
> Primer is the first DS in the foreign-DS validation series where
> consumer-facing API and token-key surface diverge — but the pattern
> generalises: any time a designer-or-developer sees a property name
> that doesn't match the token they expect, the answer is "the
> semantic wrapper lives at the library layer; the token-key
> vocabulary lives in the Profile."

---

## 6. Token grammar

The token grammar declares **which token paths are legal in this DS** and
**what each path segment means**. It is the contract between the DS's DTCG
token files and every CDF Component that references them.

> **The Profile ↔ Component token interplay.** The Profile is the *grammar*;
> CDF Components are *sentences* that follow the grammar. A CDF Component
> writes token paths
> with placeholders — `color.controls.{hierarchy}.background.{interaction}` —
> where some placeholders (`{hierarchy}`) bind to a component *property*,
> and others (`{interaction}`) bind to a component *state axis*. Generators
> and validators expand these to concrete paths and verify they exist in the
> DTCG token files.

**Build-time enumerability.** A Profile's `token_grammar` declares which
token paths exist in this DS. A conforming DTCG token tree provides a static
value for each resolved path at **token-build time**. CDF does not describe
dynamic token resolution — paths are enumerable at build time, and each
enumerated path corresponds to one DTCG value. This invariant is what makes
the token-driven principle ([CDF Component §1.1 #2](./CDF-COMPONENT-SPEC.md#11-design-principles))
enforceable: a Component that references a grammar-covered path can trust
that the path resolves to a value, without needing to know how the DS's
toolchain produced that value.

### 6.1 Schema

```yaml
token_grammar:
  {grammar_name}:                 # REQUIRED — dotted canonical prefix
                                  #            (e.g. "color.controls")
    pattern: string               # REQUIRED — path template with {axis}s
    dtcg_type: string             # REQUIRED — DTCG $type for all tokens
                                  #            matching this grammar
    description: string           # REQUIRED
    axes:                         # REQUIRED — one entry per {axis} in pattern
      {axis_name}:
        vocabulary: string        # OR — references a named vocabulary
        values: [string, ...]     # OR — inline values
        description: string       # optional — required if `values:` inline
        notes: {value: string}    # optional
    contrast_guarantee: string    # optional — see §6.5
```

**Headless DS shape.** A Profile with no visual contract MAY declare
`token_grammar: {}`. Every downstream reference to a grammar — in
[`token_layers`](#610-token_layers--reference-cascade-between-grammar-groups),
`interaction_patterns.token_layer` ([§10.3](#103-token_layer)),
`categories.token_grammar` ([§12.3](#123-token_grammar)), and a CDF
Component's `tokens:` block ([CDF-COMPONENT-SPEC §13](./CDF-COMPONENT-SPEC.md#13-tokens))
— becomes correspondingly optional. This is the canonical shape for
Headless DSes (Radix Primitives, Reach UI, Material Web Headless) that
delegate all styling to consumers. Validators MUST accept the empty
map; `token_expandable` on state axes defaults to `false` and the
required-field check is waived (see CDF-STR-004 carve-out).

### 6.2 `pattern`

A dotted path template. Placeholders in curly braces reference entries in
`axes:`. The placeholder order defines the canonical path order.

```yaml
pattern: "color.controls.{hierarchy}.{element}.{state}"
```

Rules:

1. Placeholder names MUST match `[a-z][a-z0-9_]*`.
2. Every placeholder MUST have an entry in `axes:`.
3. Non-placeholder segments are **literal** — they appear in every resolved
   path (e.g. `color.controls` is literal; only the three `{…}` vary).
4. Two grammars MUST NOT share a pattern; they MAY share a canonical prefix
   if placeholder sets differ.

### 6.3 `dtcg_type`

The DTCG `$type` that every token matching this grammar declares. Consumers
MAY use this to type-check token usage in Components (e.g. a `color:` CSS property
must receive a token with `dtcg_type: color`).

Currently used: `color`, `typography`, `dimension`, `shadow`, `border`,
`duration`, `cubicBezier`, `number`, `fontFamily`, `fontWeight`.

### 6.4 `axes`

Each axis declares either `vocabulary:` (reference) or `values:` (inline).

- **Vocabulary reference** — preferred when the set is reused across
  grammars or in CDF Component properties.
- **Inline values** — appropriate when the set is grammar-specific (e.g.
  `level: [base, level1, level2, level3]` in `color.surface`).

An axis with inline values SHOULD include `description:` so its meaning is
self-contained.

### 6.5 `contrast_guarantee` (optional)

A prose declaration of WCAG contrast properties guaranteed by tokens matching
this grammar. Consumed by accessibility validators and surfaced in
documentation.

```yaml
color.text:
  contrast_guarantee: >
    color.text.primary and color.text.secondary are guaranteed accessible
    (4.5:1) on all color.surface.* backgrounds.
```

### 6.6 How a CDF Component references tokens

A CDF Component writes `tokens.{anatomy_part}.{css_property}: {token-path}`. The path
MAY contain placeholders in curly braces:

```yaml
# in a CDF Component Component
tokens:
  container:
    background: color.controls.{hierarchy}.background.{interaction}
    border-color: color.controls.{hierarchy}.stroke.{interaction}
```

Placeholder resolution rules:

1. A placeholder name that matches a property name (e.g. `{hierarchy}`) is
   bound to that property's value. `hierarchy: brand` →
   `color.controls.brand.background.{interaction}`.
2. A placeholder name that matches a state axis (e.g. `{interaction}`) is
   resolved per state value. The grammar declares `state_expandable` via the
   axis's `token_expandable` flag in the Component
   (see [Component §8 States](CDF-COMPONENT-SPEC.md#8-states)).
3. Unbound placeholders are a validation error.

### 6.7 Pattern-aware validation

From the grammar alone, a validator can:

1. **Enumerate legal paths.** `color.controls` admits
   |hierarchy| × |element| × |state| = 4 × 6 × 10 = 240 tokens.
2. **Reject unknown paths.** `color.controls.marketing.background.hover`
   fails — `marketing` is not in `hierarchy`.
3. **Verify completeness.** Every path the grammar predicts SHOULD exist in
   the DTCG token files; gaps MAY be surfaced as warnings.
4. **Type-check Component token usage.** A CDF Component that assigns a `typography` token
   to a `color` CSS property is rejected.

### 6.8 Axis-order significance

Different grammars MAY place shared placeholders in different positions.
Compare:

```yaml
color.controls:      pattern: "color.controls.{hierarchy}.{element}.{state}"
color.system-status: pattern: "color.system-status.{intent}.{element}.{hierarchy}"
```

In `color.controls`, `hierarchy` is the primary differentiator. In
`color.system-status`, `intent` leads, with `hierarchy` as a minor axis.
This reflects how the DS reasons about each token family — controls are
picked by hierarchy first, status indicators by intent first.

Axis order is normative: a CDF Component MUST write path segments in the order the
grammar declares.

### 6.9 Token-path state names vs. component state names

The state axis of a token grammar MAY use a different vocabulary than the
corresponding CDF Component state axis. Example: `color.controls`'s `state` includes
`active` (used for focused components), while a CDF Component focusable component
declares its state axis as `interaction: [enabled, hover, pressed, focused,
disabled]`.

Profiles SHOULD declare this translation once via
[interaction patterns](#10-interaction-patterns). CDFs SHOULD NOT invent
per-spec translations.

### 6.10 `token_layers` — reference cascade between grammar groups

A mature token system is not flat: foundation palettes feed into semantic
palettes feed into component-ready tokens. `token_layers:` declares this
**reference cascade** explicitly so validators (and LLMs) can check that a
token in one layer only references tokens in a layer it is allowed to
reach.

#### 6.10.1 Schema

```yaml
token_layers:
  - name: string                # REQUIRED — layer identifier
    description: string         # REQUIRED — what this layer contains
    grammars: [string]          # optional — grammar pattern names
                                # (keys from §6) that belong to this layer
    references: [string]        # optional — layer names this layer may
                                # reference in its token values
```

Layers are an ordered list. Conventionally the first entry is the
"foundation" (no `references:`) and the last is the outermost
consumer-facing layer (may reference any layer above it).

#### 6.10.2 Rules

1. **Every name is unique within the list.** Duplicate layer names are a
   Profile-validation error.
2. **`grammars:` entries MUST exist in `token_grammar:`.** A layer
   referencing a grammar pattern that doesn't exist is rejected.
3. **`references:` entries MUST exist in `token_layers:`.** Forward
   references (referring to a layer defined later) are permitted because
   the list is a DAG, not a sequence.
4. **No cycles.** The transitive closure of `references:` MUST be a DAG.
   Validators reject cycles.
5. **A grammar pattern belongs to at most one layer.** If `color.controls`
   is listed under layer `Controls`, it cannot also be listed under
   `Interaction`.
6. **Empty `grammars: []` is legal.** A layer MAY contain only standalone
   tokens (§6.11) or serve as a reference target without owning any
   grammar pattern.

#### 6.10.3 Semantics — what the cascade enforces

When a token's `$value` references another token, the referenced token
MUST live in:

- the same layer (self-references within a layer are permitted), OR
- a layer listed in the current layer's `references:` (transitively).

A token in `Controls` that references a `Foundation` token is only legal
if `Foundation` is reachable from `Controls` via `references:`
(directly or transitively).

> **Enforcement responsibility.** CDF validators check this when loading
> the referenced DTCG token files. The Profile's `token_layers:` is the
> **contract**; the DTCG resolver (outside the Profile spec) is the
> **enforcer**.

#### 6.10.4 Example (Formtrieb)

```yaml
token_layers:
  - name: Foundation
    description: >
      Raw color scales, dimensions, typography primitives. Never used
      directly by components — always referenced through higher layers.
    grammars: []

  - name: Interaction
    description: >
      Semantic palette. Selects from Foundation and assigns meaning
      (colorway + intensity).
    grammars: [color.interaction]
    references: [Foundation]

  - name: Controls
    description: >
      Component-ready tokens. Each hierarchy × element × state combination
      resolves to a specific Interaction token.
    grammars: [color.controls, color.system-status]
    references: [Interaction]

  - name: Components
    description: >
      Component-specific overrides and tokens that don't fit the Controls
      grid (focus ring, overlay colors, inputGroup spacing).
    grammars: []
    references: [Controls, Interaction]
```

A `color.controls.primary.background.hover` token is in `Controls`. It
MAY resolve to a `color.interaction.brand.700` token (reachable via
`Controls → Interaction`) but MAY NOT directly resolve to a raw
Foundation token — it must go through Interaction first. This is the
rule that makes a DS recolor-able: change Interaction, all Controls
follow.

#### 6.10.5 Omission and defaults

`token_layers:` is **optional**. A Profile that omits it is declaring
"my tokens form a single flat reference graph, no cascade enforcement".
Validators do not attempt to infer layers from token paths.

A Profile that ships token_layers MUST cover every grammar pattern it
owns. Grammar patterns not named in any layer are a validation warning
(not an error) — the Profile may intentionally treat them as unlayered.

#### 6.10.6 Extension semantics

A Profile extending another (§15) MAY add new layers or add to existing
layers' `grammars:`/`references:` — but MAY NOT remove layers the parent
declared, nor remove entries from `grammars:`/`references:` lists.
Rationale: removal would invalidate downstream tokens without warning.

### 6.11 `standalone_tokens` — tokens outside any grammar

Not every token fits a grammar pattern. A DS typically has a handful of
tokens that are **singletons** (`color.page`, `color.backdrop`) or
small flat enumerations (`color.brand.{primary|secondary}`). These
tokens are registered in `standalone_tokens:` so that:

- LLMs and humans know they exist without having to grep the DTCG files.
- Validators can type-check their usage in CDFs (via `dtcg_type`).
- The Profile's token space (grammar-covered + standalone) is closed:
  any other path in the DTCG files that is neither is a mistake.

#### 6.11.1 Schema

```yaml
standalone_tokens:
  {token-path}:                 # full dotted path, e.g. color.page
    dtcg_type: string           # REQUIRED — DTCG $type
    description: string         # REQUIRED — what the token represents
    values: [string]            # optional — legal leaf names when the
                                # path expands to an enumeration
    layer: string               # optional — the token_layers layer
                                # this token belongs to (§6.10)
```

#### 6.11.2 Rules

1. **`{token-path}` MUST NOT match any declared grammar pattern.** A
   token path is either grammar-covered (§6) OR standalone — never both.
2. **`dtcg_type` MUST be one of the declared DTCG types.** See `dtcg_version:`
   in Profile §4 for the supported set.
3. **`values:` is a flat enumeration of leaf names.** When present, the
   effective token paths are `{token-path}.{value}` for each entry.
   Paths not in the enumeration are not part of the DS.
4. **`layer:` is optional.** When present, MUST match a name in
   `token_layers:` (§6.10) and behaves the same as a grammar listed
   under that layer — the standalone token participates in the cascade.

#### 6.11.3 Example (Formtrieb)

```yaml
standalone_tokens:
  color.page:
    dtcg_type: color
    description: "Page background. Light = white, Dark = near-black."
    layer: Components

  color.backdrop:
    dtcg_type: color
    description: "Overlay backdrop. Typically black with scrim opacity."
    layer: Components

  color.brand:
    dtcg_type: color
    description: "Brand accent colors for non-control usage."
    values: [primary, secondary]
    layer: Components

  color.light:
    dtcg_type: color
    description: "Constant light color (white) — for inverted text/icons."
    layer: Foundation

  color.dark:
    dtcg_type: color
    description: "Constant dark color (black)."
    layer: Foundation
```

Effective token paths: `color.page`, `color.backdrop`, `color.brand.primary`,
`color.brand.secondary`, `color.light`, `color.dark`.

#### 6.11.4 Relationship to grammar-covered tokens

The two are complementary. A Profile's token space is:

> **Total token space** = all paths matched by any `token_grammar:` pattern
>                       ∪ all paths named in `standalone_tokens:`

A DTCG token file containing a path in neither set is a validation warning
("unexpected token path not declared in Profile").

**Choosing between grammar and standalone.** Both mechanisms can declare
the same kind of tokens — the choice is authorial:

- **Use `token_grammar`** when a family varies along one or more named
  axes whose values are enumerable: `radius.{size}`, `dimension.{scale}`,
  `borderWidth.{name}`, `fontSizes.{variant}.{size}`. The grammar makes
  the axes first-class: validators can enumerate legal paths, derive
  `{placeholder}` resolution rules, and surface missing values. Foundation
  families (dimension scales, radius scales, typography primitives) are
  almost always grammars.
- **Use `standalone_tokens`** for singletons (`color.page`, `color.backdrop`),
  small flat enumerations with no shared axis (`color.brand: [primary,
  secondary]`), or tokens that are intrinsically one-off. If you find
  yourself declaring many `standalone_tokens` entries that share a dotted
  prefix, the cue is to promote them to a grammar.

A practical rule of thumb: if a path has `{placeholder}`-style variation
a CDF Component might want to address through a property or state, it
belongs in `token_grammar`. If a path is used verbatim as a fixed value,
`standalone_tokens` is enough.

#### 6.11.5 Extension semantics

A Profile extending another (§15) MAY add new standalone tokens or
add `values:` to existing enumerations. It MAY NOT remove standalone
tokens, remove enumeration values, or change a token's `dtcg_type`.
Changes to `description:` are free (documentation-only).

---

### 6.12 `resolution` — when axes collapse into a token slot

A Component may declare multiple orthogonal state axes (e.g. `interaction`,
`validation`, `selected`) that each resolve tokens against the **same
token-grammar placeholder**. A flat `{state}` slot in
`color.controls.{hierarchy}.{element}.{state}` is shared by pressable
states (`hover`, `pressed`), focusable states (`active`), validation
values (`error`, `success`), and selection markers — because the DTCG
token file keeps all those values in one dimension.

When multiple Component axes contend for the same slot, a generator needs
a deterministic tie-breaker. The grammar declares one:

```yaml
token_grammar:
  color.controls:
    pattern: "color.controls.{hierarchy}.{element}.{state}"
    dtcg_type: color
    axes:
      hierarchy: { vocabulary: hierarchy }
      element:   { vocabulary: element }
      state:
        values: [enabled, hover, pressed, active, disabled, error, success, inactive]
    resolution:
      precedence: [validation, interaction, selectable]
      description: >
        When a Component resolves a token path and multiple state axes
        have non-default values, the axis earliest in this list wins
        the `{state}` slot. Example: a focused + error input resolves
        to `state = error` because validation outranks interaction.
```

#### 6.12.1 Rules

1. **`precedence:` is a list of Component axis names** (matching Profile
   `interaction_patterns` names). The first axis whose current value is
   non-default wins the slot.
2. **The rule is local to one grammar.** Different grammars MAY declare
   different precedences (rare, but legal).
3. **Axis default.** An axis contributes its value only when it is at a
   non-default state. `validation: none` does not participate; `selected:
   false` does not participate.
4. **Fall-through.** If no axis in the precedence list is active, the
   slot takes the first axis's declared `default` — conventionally
   `interaction: enabled`.
5. **Required when collapsed axes exist.** A grammar whose `{state}` slot
   is declared to accept values from more than one Profile pattern MUST
   declare `resolution:`. Validators reject grammars that allow
   collapse without a precedence rule (`CDF-STR-013` in Component §18.3).

#### 6.12.2 Why this lives in the grammar, not in the Component

The collapse is a **rendering** concern, not a Component-authoring
decision. Every Component that uses `color.controls` inherits the same
precedence — a checkbox and an input both follow `validation >
interaction`. Putting the rule in the Component would let each Component
pick its own tie-breaker, which is exactly the inconsistency this format
is built to prevent.

---

---

## 7. Token sources

A Profile that owns tokens declares **where its DTCG JSON files live** and
**how those files compose into token sets**. Consumers (Tokens MCP, resolver,
generator) read this to locate the JSON and to understand which sets are
always active vs. switched by theme modifiers (see [§8](#8-theming)).

A Profile MAY omit `token_sources:` if it does not ship its own tokens —
e.g. an abstract Profile that defines vocabulary only, extended by concrete
Profiles that supply the tokens.

### 7.1 Schema

```yaml
token_sources:
  directory: path                 # REQUIRED — root directory, relative
                                  #            to the profile file
  format: string                  # optional — "tokens-studio" (default) |
                                  #            "dtcg-native"
  sets:                           # REQUIRED — grouped set references
    {group}:                      # e.g. foundation, semantic, device, …
      - path                      # — path under `directory`, without .json
      - path
```

### 7.2 `directory`

Path relative to the `.profile.yaml` file. Points at the root under which
all referenced set files live. Consumers resolve set references as
`{directory}/{set_path}.json`.

### 7.3 `format`

Declares the JSON dialect. Currently recognised:

- `tokens-studio` (default) — Tokens Studio export format:
  `$value`/`$type`/`$description`, optional `$themes.json` and
  `$metadata.json` at the root.
- `dtcg-native` — [DTCG specification](https://design-tokens.github.io/)
  straight JSON.

Profiles SHOULD NOT mix formats within one `directory`.

### 7.4 `sets`

A dictionary of named groups, each listing the set files (paths without
`.json`) that belong to that group. Group names are informational —
consumers MAY surface them (MCP token browsing, docs) but MUST NOT infer
theming semantics from them. Theming semantics live in
[§8.3 `set_mapping`](#83-set_mapping).

### 7.5 Example

```yaml
token_sources:
  directory: ./tokens
  sets:
    foundation:
      - Foundation/Foundation
      - Foundation/HelpersFoundation
    semantic:
      - Semantic/Light
      - Semantic/Dark
    device:
      - Device/Desktop
      - Device/Tablet
      - Device/Mobile
    components:
      - Components/Icon
      - Components/InputGroup
```

### 7.6 Extension semantics

If this Profile extends another via [§15](#15-profile-extension) and both
declare `token_sources:`, the extending Profile's declaration **replaces**
the parent's in full. Partial merging of token-source trees is not
supported — composition of tokens across Profiles happens in DTCG, not at
the Profile level.

---

## 8. Theming

A Profile declares the **theming modifiers** a DS responds to. A modifier
is an axis — `semantic`, `device`, `shape` — whose active context
switches token values across the whole DS.

Modifiers differ from CDF Component state axes:

- **Modifier** — DS-wide, applied to a context boundary (document root or a
  subtree). Affects many components at once. Switched by a host attribute,
  class, or framework-level mode.
- **State axis** — per-component, describes runtime interaction state.
  Applied to one component at a time.

### 8.1 Schema

```yaml
theming:
  modifiers:                      # REQUIRED — one entry per axis
    {modifier_name}:
      description: string         # REQUIRED
      contexts: [string, ...]     # REQUIRED — legal values, ordered
      default: string             # optional — MUST be in `contexts`
      required: boolean           # optional — default false
      data_attribute: string      # optional — "data-{modifier}" convention
      css_class_pattern: string   # optional — alternative to data_attribute
      figma_collection: string    # optional — Figma variable collection name
      affects: [string, ...]      # optional — token-grammar prefixes this
                                  #            modifier may override

  set_mapping:                    # REQUIRED if `token_sources.sets` present
    {set_path}:                   # — path without .json, matching a §7.4 entry
      modifier: string            # OR — names a §8.1 modifier
      context: string             #     — one of that modifier's contexts
      always_enabled: boolean     # OR — set is always active
```

### 8.2 `modifiers`

Each modifier is an axis that consumers toggle at runtime (or build time).
Rules per field:

- **`description`** — explains what the modifier controls. SHOULD answer
  "which token families does this modifier swap?" in one sentence.
- **`contexts`** — ordered list of legal values. Order is normative
  (documentation tools MAY rely on it).
- **`default`** — if declared, MUST be one of `contexts`. Consumers apply
  this when no explicit context is set.
- **`required`** — `true` means every context boundary MUST pick a value;
  `false` means the modifier MAY be absent (falls back to DS defaults in
  the DTCG resolver).
- **`data_attribute`** — the HTML attribute name (e.g. `data-semantic`)
  that carries the active context. CSS selectors of the form
  `[data-semantic="Dark"]` switch token values. A modifier MAY use
  `css_class_pattern` instead (e.g. `theme-{context}`).
- **`figma_collection`** — the Figma Variables collection name that
  represents this modifier's modes. Consumed by Figma target / Figma MCP
  tooling.
- **`affects`** — optional list of token-grammar prefixes (from §6) whose
  values this modifier is allowed to override. A consumer MAY warn if a
  token-set under `set_mapping` touches a grammar not listed in `affects`.

### 8.3 `set_mapping`

Connects each token set file (from [§7.4 `sets`](#74-sets)) to a modifier
context. Three shapes:

```yaml
# 1. Set is always active (no modifier switches it off)
"Foundation/Foundation": { always_enabled: true }

# 2. Set is activated by a specific modifier context
"Semantic/Light": { modifier: semantic, context: Light }
"Semantic/Dark":  { modifier: semantic, context: Dark }

# 3. Wildcard — all sets under a prefix follow the same rule
"Components/*": { always_enabled: true }
```

Rules:

1. Every set listed in `token_sources.sets` MUST appear in `set_mapping`
   (directly or via wildcard), or be covered by a catch-all.
2. A set with `modifier` + `context` is only resolved when that modifier is
   set to that context. When the modifier is set to a different context,
   the set is **not included** in the resolved token tree.
3. A modifier's context MUST match one of the declared `contexts` values
   for that modifier.

### 8.4 How modifiers compose with token paths

A CDF Component token reference does **not** include modifier placeholders. The CDF
writes `color.controls.brand.background.hover` — not
`color.controls.{semantic}.brand.background.hover`. The active modifier
context is resolved by the DTCG layer: the `Semantic/Light` and
`Semantic/Dark` sets both contain a `color.controls.brand.background.hover`
entry with different `$value`s; the resolver picks one based on which set
is active.

This separation keeps CDF Components **modifier-agnostic**. A Button spec works
in any semantic theme — the theme-switching mechanism is orthogonal.

> **Consequence for generators.** Generators emit styling that switches on
> the `data_attribute` (or class) pattern. The CSS generator does not
> expand per-modifier at build time; the browser picks the right value at
> runtime via the DTCG resolver's output (typically CSS custom properties
> scoped under `[data-semantic="Light"]` and `[data-semantic="Dark"]`).

### 8.5 Example (abbreviated from Formtrieb)

```yaml
theming:
  modifiers:
    semantic:
      description: "Color mood — light or dark appearance"
      contexts: [Light, Dark]
      default: Light
      required: true
      data_attribute: data-semantic
      affects: [color.controls, color.interaction, color.surface, color.text]

    device:
      description: >
        Viewport class. Controls dimensions (heights, spacing) and
        typography sizes. Does NOT change color.
      contexts: [Desktop, Tablet, Mobile]
      default: Desktop
      required: false
      data_attribute: data-device
      affects: [controls.height, spacing.component, typography]

    shape:
      description: "Border radius strategy"
      contexts: [Round, Sharp]
      default: Round
      required: false
      data_attribute: data-shape
      affects: [radius]

  set_mapping:
    "Foundation/Foundation": { always_enabled: true }
    "Semantic/Light":        { modifier: semantic, context: Light }
    "Semantic/Dark":         { modifier: semantic, context: Dark }
    "Device/Desktop":        { modifier: device,   context: Desktop }
    "Shape/Round":           { modifier: shape,    context: Round }
    "Components/*":          { always_enabled: true }
```

---

## 9. Naming

A Profile declares the DS's **abstract identity** and the **casing conventions**
that every Target MUST respect. Concrete expressions — CSS class prefixes, BEM
patterns, Swift type prefixes — live in the relevant Target; Targets derive
them from the Profile's identifier via a small template DSL (see
[CDF Target §5.6](CDF-TARGET-SPEC.md#56-identifier-template-dsl)).

**What lives here (DS identity, invariant across frameworks):**
- the abstract identifier (`identifier:`)
- casing of DS-level identifiers (component names, property keys, token paths)
- reserved DS-level names

**What lives in the Target (framework expression):**
- CSS class and custom-property prefixes, BEM methodology, BEM pattern,
  CSS-selector casing (Target §9 Styling)
- Type prefixes for typed languages (Target §8 API)
- File-name casing (Target §6 Output)

### 9.1 Schema

```yaml
naming:
  identifier: string              # REQUIRED — abstract DS identifier, lowercase-kebab
                                  # e.g. "ft" (Formtrieb), "acme" (a consuming DS)
                                  # Targets derive concrete prefixes via the identifier
                                  # template DSL (Target §5.6).
  casing:                         # REQUIRED
    component_names: string       # Identifier casing for components
    properties: string            # Identifier casing for Component property keys
    token_paths: string           # Casing of segments in token paths
  reserved_names:                 # optional — key → rationale
    {name}: string
```

### 9.2 `identifier`

A short, lowercase, hyphen-safe string identifying the DS. This is the
**atom** from which every Target derives its framework-specific prefixes.

| Profile   | `identifier` | Typical Web CSS class | Typical Swift type |
| --------- | ------------ | --------------------- | ------------------ |
| Formtrieb | `ft`         | `.ft-button`          | `FTButton`         |
| Acme      | `acme`       | `.acme-button`        | `AcmeButton`       |

Rules:

1. **Lowercase, a–z and hyphens only.** Underscore, digits, and Unicode are
   reserved for future use; validators MUST reject identifiers that do not
   match `^[a-z][a-z-]*$`.
2. **Short.** Conventionally 2–4 characters. Longer identifiers produce
   awkward CSS class names.
3. **Immutable after first publication.** An identifier rename is a major
   version bump — it breaks every generated artefact downstream.

The identifier is case-*preserving* in this spec. Targets apply casing
transforms via the Identifier Template DSL; the Profile does not normalise
casing on the identifier itself.

### 9.3 `casing`

Casing declarations are **normative**: Targets MUST cast identifiers to
the declared casing when emitting DS-level names.

| Key                | Applies to                                      | Typical value  |
| ------------------ | ----------------------------------------------- | -------------- |
| `component_names`  | `CDFComponent.name`, emitted class identifiers  | `PascalCase`   |
| `properties`       | Component property keys, emitted framework props | `camelCase`    |
| `token_paths`      | Segments in a DTCG token path                   | `camelCase`    |

Recognised casing names: `kebab-case`, `camelCase`, `PascalCase`,
`snake_case`, `lowercase`, `UPPERCASE`.

> **Target-specific casing lives in the Target.** `css_selectors` casing
> (kebab for Web) and `file_names` casing (kebab for Web, PascalCase for
> Swift-source files) are framework idioms; they belong in the relevant
> Target's Styling or Output section, not here.

### 9.4 `reserved_names`

A dictionary of names the DS **reserves** — disallowed as Component property
names, state axis names, or anatomy part names without explicit opt-in.
Each entry declares the rationale so LLMs and humans understand why.

```yaml
reserved_names:
  interaction: "Axis name for interaction states (not 'state')"
  hierarchy:   "Axis name for visual emphasis (not 'type')"
  type:        "Reserved for semantically distinct presentation modes"
```

A validator MUST reject a CDF Component that uses a reserved name for a
different purpose than its rationale implies. Whether this is an error or
a warning is up to the validator configuration.

> **Note on framework-level reserved names.** This list is DS-level.
> Framework-specific reserved names (Angular `input`/`output`/`signal`;
> Swift keywords; HTML attribute collisions like `readonly`) live in the
> [Target](CDF-TARGET-SPEC.md#12-normalization), not here — a Profile is
> framework-agnostic.

### 9.5 Example

```yaml
naming:
  identifier: "ft"
  casing:
    component_names: PascalCase
    properties: camelCase
    token_paths: camelCase
  reserved_names:
    interaction: "Axis name for interaction states (not 'state')"
    hierarchy:   "Axis name for visual emphasis (not 'type')"
```

A Web Target consuming this Profile derives `css_prefix = "ft-"`,
`token_prefix = "--ft-"`, and emits `.ft-button--brand` for a Button.
A Swift Target derives `type_prefix = "FT"` and emits `FTButton`. Both
trace back to the single `identifier: "ft"` declaration.

### 9.6 Migration from v0.x

The Profile `naming:` block in v0.x carried `css_prefix`, `token_prefix`,
`methodology`, `pattern`, `casing.css_selectors`, and `casing.file_names`.
These are relocated in v1.0.0-draft:

| v0.x `naming.` field        | v1.0.0 location                          |
| --------------------------- | ---------------------------------------- |
| `css_prefix`                | Target §9 `styling.css_prefix`           |
| `token_prefix`              | Target §9 `styling.token_prefix`         |
| `methodology`               | Target §9 `styling.methodology`          |
| `pattern`                   | Target §9 `styling.pattern`              |
| `casing.css_selectors`      | Target §9 `styling.casing.css_selectors` |
| `casing.file_names`         | Target §6 `output.files` (per-artefact)  |

A v0.x Profile that ships an explicit `css_prefix: "ft-"` migrates to v1.0.0
by setting `identifier: "ft"` in the Profile and letting the Target derive
`css_prefix: "{identifier}-"` (the default). Profiles that used non-derivable
custom prefixes (e.g. `css_prefix: "formtrieb-"` while identifier would be
`ft`) can override explicitly in the Target.

---

## 10. Interaction patterns

An **interaction pattern** is a named, canonical shape for a component's
runtime state. Patterns are defined in the Profile so that every focusable
input has the same state axis, every pressable button has the same state
axis — components do not re-invent the vocabulary.

A CDF Component does not have to adopt a pattern verbatim (a Component MAY define its
own states); but components that use a recognised pattern SHOULD reference
it by name so validators can enforce consistency.

### 10.1 Schema

```yaml
interaction_patterns:
  {pattern_name}:                 # REQUIRED — snake_case
    description: string           # REQUIRED
    states: [string, ...]         # REQUIRED — component-facing state names
    token_layer: string           # optional — name of an entry in
                                  #            §6.10 `token_layers:` (NOT
                                  #            a grammar key from §6).
                                  #            Validators reject grammar
                                  #            keys here.
    token_mapping:                # optional — component-facing → token-path
      {component_state}: {path_state}
    orthogonal_to: [string, ...]  # optional — other patterns this composes
                                  #            with
    promoted: [string, ...]       # optional — states promoted to DOM
                                  #            attributes by default
    notes:                        # optional — per-state rationale
      {state}: string
```

### 10.2 `states`

The ordered list of state names **as consumers see them**. These are the
values a CDF Component state axis declares:

```yaml
# in a CDF Component Component
states:
  interaction:
    description: "Input focus cycle"
    values: [enabled, hover, focused, disabled]   # ← matches `focusable`
    default: enabled
```

State order is normative — it determines default rendering order in
documentation tools (Storybook grids, Figma variant rows).

### 10.3 `token_layer`

Optional reference to a **token layer** — i.e. an entry in the
Profile's [`token_layers:`](#610-token_layers--reference-cascade-between-grammar-groups) list (`name:` of one of the
declared layers, e.g. `Controls`, `Interaction`, `Foundation` in
Formtrieb's setup). It is **not** a token-grammar key (e.g.
`color.controls`); a validator running L4 (cross-field structural)
rejects a `token_layer:` value that does not match a declared layer
name.

The reason is one of indirection: a layer groups one or more grammars
plus standalone tokens, and patterns bind to that grouping rather
than to a single grammar. A pressable Button reading from `Controls`
can pull from any of `color.controls`, `radius.controls`, etc., via
the same layer reference; pinning the pattern to one grammar would
break that.

A validator MAY use this to check that a CDF Component using the
`pressable` pattern reads from a grammar inside the `Controls` layer
rather than reaching into `Interaction` or `Foundation` directly.

### 10.4 `token_mapping`

The **translation layer** between component-facing state names and the
state segment in token paths (see [§6.9](#69-token-path-state-names-vs-component-state-names)).
Each key is a state name from `states:`; each value is the corresponding
`{state}` placeholder value in the token grammar.

```yaml
focusable:
  states: [enabled, hover, focused, disabled]
  token_mapping:
    enabled:  enabled
    hover:    hover
    focused:  active        # ← component says "focused", token path says "active"
    disabled: disabled
```

Identity mappings MAY be omitted; a consumer assumes `x → x` when the key
is absent. Only non-identity mappings MUST be declared.

**Why this exists.** The token system was designed around a single
`{state}` axis that covers both pressable and focusable components
(`active` is the "actively-in-use" state for both). Consumer-facing state
names were chosen per pattern for clarity — buttons are `pressed`,
inputs are `focused`. The mapping bridges the two without forcing either
to match the other.

**Precedence.** A single CDF Component may override this Profile-level
mapping at the state axis (Component §8.5) or at a property (Component §7.6).
Resolution order for any given name: state-level → property-level → this
pattern-level entry. See CDF Component §8.5 *Precedence across levels* for
the full rule and edge cases.

### 10.5 `orthogonal_to`

Lists other patterns with which this one composes. An orthogonal pattern
is a separate axis that multiplies with the base: a Checkbox is both
`pressable` (can be clicked, hovered, pressed, disabled) and `selectable`
(has a selected/unselected state). Both axes apply simultaneously.

A CDF Component that declares both patterns' state axes generates the Cartesian
product of states:

```
pressable:    [enabled, hover, pressed, disabled]
selectable:   [selected, unselected]
→ 4 × 2 = 8 state combinations (orthogonal grid, not a flat enum)
```

### 10.6 `promoted`

> **Concept ↔ Target.** `promoted:` is the abstract, DS-level half of the
> same concept whose concrete, framework-level half is CDF Target
> `state_to_input:` (Target §13). Profile declares *that* a state crosses
> the boundary; Target declares *how*. A consumer reads both together.

Lists state values or entire axes that are **externally observable** — that
is, exposed at the component boundary rather than kept internal to the
component's implementation.

An observable state is one that:

- A parent component or runtime environment can set (or influence).
- Assistive technology needs to read.
- Other components in the tree can react to via relationship queries
  (selector, environment, ancestor bindings).

`promoted:` names the states this pattern expects to expose. It does **not**
name *how* they are exposed — that is a per-Target decision (DOM attribute
for Web, `@Binding` for SwiftUI, template variable for Kirby, etc.).

Canonical observable markers:

| State / axis          | Meaning at the boundary                          |
| --------------------- | ------------------------------------------------ |
| `disabled`            | Component is non-interactive; consumers + a11y must know |
| `focused`             | Component has input focus; observable via platform focus APIs |
| `validation: error`   | Component reports an invalid state; consumers + a11y must know |
| `open` (expandable)   | Component is in its expanded state; consumers may react |

Each Target maps these markers to its own concrete mechanism. See
[CDF Target §13](CDF-TARGET-SPEC.md#13-state--input-promotion) for the Web
mapping (DOM attributes + ARIA) and for how a Target declares its mapping
table.

> **Why abstract here and concrete in Target.** The Profile describes
> the DS's interaction contract independently of any framework. "This
> state crosses the boundary" is a DS-level claim — it holds for every
> Target. *How* the boundary-crossing is realised (DOM, SwiftUI binding,
> Figma property) is framework-specific.

#### Auto-promotion of mirrored states

A CDF Component state axis paired with a `mirrors_state:` property
(CDF Component §7.11) is **automatically observable at the component
boundary** — the consumer-facing property IS the boundary crossing.
Profile `promoted:` does not need to list the mirrored state separately;
listing it is allowed but redundant. Validators MAY surface duplicate
listings as info-level reminders (`CDF-INF-00X`).

This rule keeps the boundary contract honest without forcing
double-bookkeeping: a Checkbox declaring `properties.checked.mirrors_state:
selected` carries the `selected` axis across the boundary by the property
alone — no need for `selectable.promoted: [selected]` to repeat it.

### 10.7 Example (abbreviated from Formtrieb)

```yaml
interaction_patterns:

  pressable:
    description: >
      Direct click/tap targets — buttons, tags, toggles. Full cycle:
      rest → hover → press → release.
    states: [enabled, hover, pressed, disabled, pending]
    token_layer: Controls
    token_mapping:
      # identity mappings elided (enabled, hover, pressed, disabled)
      pending: enabled           # pending has no dedicated token state
    promoted: [disabled]
    notes:
      pending: >
        No dedicated token state. Visual treatment is enabled + spinner +
        opacity.disabled overlay.

  focusable:
    description: >
      Keyboard-focusable controls — inputs, selects, textareas.
    states: [enabled, hover, focused, disabled]
    token_layer: Controls
    token_mapping:
      focused: active            # token system calls focused "active"
    promoted: [disabled, focused]

  selectable:
    description: >
      Binary or tri-state selection — checkboxes, radios, selection tags.
    states: [selected, unselected]
    orthogonal_to: [pressable, focusable]
    promoted: [selected]
    notes:
      token_mapping_pattern: >
        `selectable` does NOT declare a Profile-level `token_mapping:` because
        how the selected axis projects onto token paths depends on the
        component's visual structure:

        **Flat selectables** (SelectionTag, Chip, ToggleButton) keep one
        element-surface and switch its state segment. These components MAY
        map `selected: active` — treating "selected" as a variant of
        "active" on the same background/text/icon elements.

        **Surface-swap selectables** (Checkbox, Radio) paint different
        anatomy elements depending on `selected`: stroke-only when
        unselected, filled background when selected. These components do
        NOT apply a token_mapping; they emit separate token bindings per
        anatomy part with boolean-qualified modifier overrides
        (Component §13.2).

        The Component spec's `states.selected.token_mapping:` (Component
        §8.5) is the normative override — components declare their own
        mapping when it applies, and omit it when surface-swap is used.

  expandable:
    description: >
      Open/closed state controlling content visibility — accordions,
      dropdowns, combo boxes.
    states: [open, closed]
    orthogonal_to: [pressable, focusable]
    promoted: [open]             # conventionally [aria-expanded]

  validation:
    description: >
      Form-validation state. Not an interaction in the user-event sense;
      rather, the DS concept "is this field's content acceptable?". Always
      orthogonal to pressable / focusable / selectable (never folded into
      an interaction axis — see §10.8).
    states: [none, error, success]
    default: none
    orthogonal_to: [pressable, focusable, selectable]
    promoted: [error]            # conventionally [aria-invalid="true"]
    notes:
      none: "No validation signal. The field is in its baseline presentation."
      semantic_note: >
        Validation is a reserved vocabulary. Values `error` and `success`
        MUST NOT appear in interaction / selectable / expandable axes on
        any Component — the Profile isolates them to this pattern.
        See §10.8.
```

---

### 10.8 The `validation` pattern is reserved

`validation` is the first pattern in this Profile spec declared as
**reserved vocabulary** (§5.5 rule 5). Its values (`error`, `success`,
plus any Profile extensions like `warning`, `pending`) are exclusive to
validation axes — a Component that lists `error` in its `interaction`,
`selectable`, or `expandable` state axis is structurally invalid.

**Why this specifically.** Validation reads differently from interaction
states:

- Interaction describes **user event sources** (pointer, keyboard focus).
- Validation describes **form-content status** (is the input acceptable).

Mixing them into one axis collapses two independent concerns into one
slot — a representational shortcut that Figma variant matrices encourage
but the format rejects. A Component in the same DS that models Input
with orthogonal validation and Checkbox with folded validation is
internally inconsistent; CDF's job is to prevent that.

**Rendering.** The token grammar may still have a flat `{state}` slot
(Formtrieb's `color.controls.*.{state}` with `error` and `success` as peer
values). When multiple axes resolve into the same token slot, the
grammar's `resolution:` precedence (§6.12) picks which axis wins. This
keeps tokens pragmatic while keeping the API surface strict.

**Extension.** A Profile extending another MAY add new validation values
(e.g. `warning`, `pending`). Removing inherited validation values is a
major-version change (Profile §15).

**Cross-refs:** CDF Component §18.3 `CDF-STR-011`,
[Token grammar §6.12](#612-resolution-when-axes-collapse-into-a-token-slot).

---

## 11. Accessibility defaults

A Profile declares **DS-wide accessibility conventions** so that every CDF Component
starts from a safe baseline. A CDF Component inherits these defaults implicitly; its
[§15 accessibility block](CDF-COMPONENT-SPEC.md#15-accessibility) overrides only what
deviates from the DS default.

The Profile-level defaults are organised into five blocks: focus indication,
interactive target sizing, contrast guarantees, keyboard behaviour per
interaction pattern, and per-category defaults.

### 11.1 Schema

```yaml
accessibility_defaults:

  focus_ring:                     # optional
    description: string
    pattern: string               # "ring" | "double-ring" | "outline" | custom
    token_group: string           # token grammar prefix for focus tokens

  min_target_size:                # optional
    token: string                 # token path for the minimum size value
    wcag_level: string            # "A" | "AA" | "AAA"
    description: string

  contrast_requirements:          # optional
    description: string
    {pairing_name}:               # named pairing blocks (see §11.4)
      description: string
      pairs:
        - foreground: string      # token path or pattern
          background: string      # token path or pattern
          ratio: string           # "4.5:1", "3:1", etc.
          wcag: string            # "A" | "AA" | "AAA"
          description: string

  keyboard_defaults:              # optional
    {pattern_name}:               # matches an §10 interaction_patterns key
      {key}: string               # key name → action name

  category_defaults:              # optional
    {category_name}:              # matches a §12 categories key
      focus_visible: boolean
      element: string             # default semantic HTML element
      roles: [string, ...]        # default ARIA roles
      aria: [string, ...]         # default ARIA attribute declarations
      aria_extensions: [string, ...]  # additional ARIA attrs the category
                                      #   commonly needs
      keyboard: string            # which interaction_pattern's keyboard
                                  # defaults apply
```

### 11.2 `focus_ring`

Describes how focus is indicated for focusable controls at a DS level.
Supported patterns:

- `ring` — single-ring outline
- `double-ring` — outer focus-colour + inner page-background ring
  (ensures visibility on any surface)
- `outline` — single CSS outline property
- any custom string — implementation-defined; consumers MUST have a
  matching renderer

`token_group` names the token grammar prefix where focus-related tokens
live (e.g. `focus` → tokens under `focus.*`). A Target generator uses this
to locate the outline colour, offset, width.

### 11.3 `min_target_size`

The minimum size of interactive targets, declared as a **token reference**
(not a fixed pixel value). Declaring a token rather than a number means
theming modifiers (esp. `device`) can scale it — Mobile gets larger
targets than Desktop through the device-modified token, without rewiring
the spec.

`wcag_level` records the WCAG level this default targets. SHOULD be `AA`
or stricter for production DSes.

### 11.4 `contrast_requirements`

Contrast guarantees hold **within designed pairings only**. Not every
foreground-background combination is accessible; only the ones the DS
explicitly pairs. This section enumerates those pairings.

Each named block lists `pairs:` — foreground token + background token +
ratio + WCAG level. A consumer MAY:

- validate generated output by resolving token paths and computing ratios
- surface the pairings in documentation (which text goes on which surface)
- reject Component token bindings that violate a pairing implicitly

Pairings MAY use `{placeholder}` patterns (from §6 token grammar). A
validator expands them into concrete pairs when resolving.

```yaml
contrast_requirements:
  controls_internal:
    description: "Text and icons inside filled controls."
    pairs:
      - foreground: "color.controls.{hierarchy}.text-on-color.{state}"
        background: "color.controls.{hierarchy}.background.{state}"
        ratio: "4.5:1"
        wcag: AA
```

### 11.5 `keyboard_defaults`

Per-interaction-pattern keyboard bindings. A component that adopts a
pattern (see [§10](#10-interaction-patterns)) inherits that pattern's
keyboard behaviour unless its Component overrides it.

Key names follow [W3C UI Events `KeyboardEvent.key`](https://w3c.github.io/uievents-key/)
(`Enter`, `Space`, `Tab`, `Escape`, `ArrowUp`, etc.). Action names are
DS-specific verbs — the Target translates them to platform idioms.

### 11.6 `category_defaults`

Per-category defaults, keyed by the categories declared in
[§12](#12-categories). Fields:

- `focus_visible` — whether the category's components participate in the
  focus ring
- `element` — the default semantic HTML element (Primitive → `span`,
  Action → `button`, Input → `input`)
- `roles` — default ARIA roles applied to the root
- `aria` — default ARIA attribute declarations (`aria-hidden: true` for
  purely decorative primitives)
- `aria_extensions` — ARIA attributes the category commonly needs but
  that individual components bind per-instance (`aria-invalid` for
  Inputs)
- `keyboard` — references a pattern from
  [`keyboard_defaults`](#115-keyboard_defaults)

### 11.7 How a CDF Component uses these defaults

A CDF Component MAY omit its `accessibility:` block entirely if the defaults for its
category suffice. When the block is present, its fields override the
category defaults at field granularity — not block granularity. Example:

```yaml
# Profile:     category_defaults.Actions = {element: button, focus_visible: true,
#                                           keyboard: pressable}
# Component:   accessibility.keyboard overrides; other fields inherit.
accessibility:
  keyboard:
    Enter: activate
    Space: activate
    ArrowDown: open_menu         # ← Component-specific, adds to inherited
```

> **Rule.** A Target generator MUST apply Profile defaults when the CDF Component is
> silent, and MUST apply CDF values when the CDF Component speaks. Defaults and
> overrides MUST NOT be silently merged across list values unless the
> field is explicitly declared additive (`aria_extensions` is additive;
> `roles` is not).

---

## 12. Categories

A Profile declares the **component categories** the DS organises around.
Every Component's `category:` field MUST name one of these categories. Categories
carry three kinds of information:

1. **Organisational** — how the DS groups components for documentation and
   browsing.
2. **Behavioural** — what kind of interaction the category implies
   (`interaction: none | pressable | focusable`).
3. **Token-grammar binding** — which `token_grammar` grouping a component
   of this category typically draws from.

A CDF Component's category is the primary signal for consumers — a validator can
check, from category alone, that a `Primitives` component does not declare
interactive states, or that a `Status` component binds to
`color.system-status` rather than `color.controls`.

### 12.1 Schema

```yaml
categories:
  {CategoryName}:                 # REQUIRED — PascalCase
    description: string           # REQUIRED
    interaction: string           # REQUIRED — "none" | an
                                  #   interaction_patterns key
    token_grammar: string         # optional — token grammar prefix that
                                  #   this category typically uses
    examples: [string, ...]       # optional — known component names
```

### 12.2 `interaction`

The **primary** interaction pattern of the category — a default that the
Component uses when it declares no own interaction pattern. Values:

- `none` — non-interactive (no hover, press, focus). Primitives and Status
  typically use `none`.
- `pressable` — direct click/tap targets; see [§10 `pressable`](#10-interaction-patterns).
- `focusable` — keyboard-focusable; see §10 `focusable`.

**This is a default, not a constraint.** A Component in a category MAY
declare additional interaction patterns beyond the category default,
particularly when the Profile's `orthogonal_to:` mechanism applies:

- An `Inputs` category (default `focusable`) may contain a **Checkbox** that
  is `selectable` + `pressable` — per §10 `selectable.orthogonal_to:
  [pressable, focusable]`, `selectable` composes with either of the
  axial patterns. Here Checkbox overrides the default, choosing `pressable`
  as its base (click-feedback like a button) plus `selectable` as an
  orthogonal axis.
- An `Actions` category (default `pressable`) may contain a **ToggleButton**
  that is `pressable` + `selectable` — same composition rule.
- An `Overlays` category (default `focusable`) may contain a **Dialog** that
  is `focusable` + `expandable`.

**Conflict rule.** A Component MUST NOT declare an interaction pattern that
contradicts its category default — e.g. an `Actions` component declaring
only `focusable` (without `pressable`) is inconsistent. Additive composition
via `orthogonal_to:` is permitted and expected; wholesale replacement is
not.

Validators MAY warn when a Component's declared interaction patterns neither
match the category default nor compose with it via `orthogonal_to:`.

### 12.3 `token_grammar`

Optional: the canonical token-grammar prefix (from [§6](#6-token-grammar))
that components in this category draw from. Declaring this lets validators
flag cases like a `Primitives` component accidentally bound to
`color.controls.*` (controls tokens are reserved for interactive
categories).

If a category has no canonical grammar binding (`Layout` components vary),
omit the field.

### 12.4 `examples`

Informational. Lists known component names in this category. Not normative
— a component's category is declared by the CDF Component Component's `category:` field, not
by appearing in a Profile's `examples`. Consumers MAY surface this list
in documentation.

### 12.5 Extension semantics

An extending Profile ([§15](#15-profile-extension)) MAY:

- Add new categories.
- Override a category's `description` or `examples`.
- MUST NOT change a category's `interaction` value — doing so would
  invalidate existing CDFs downstream.

### 12.6 Example (abbreviated from Formtrieb)

```yaml
categories:

  Primitives:
    description: "Atomic visual elements without interactive behaviour."
    interaction: none
    examples: [Icon, LoadingSpinner]

  Actions:
    description: "Clickable controls that trigger operations."
    interaction: pressable
    token_grammar: color.controls
    examples: [Button, IconButton]

  Inputs:
    description: "Controls for data entry and selection."
    interaction: focusable
    token_grammar: color.controls
    examples: [TextField, ComboBox, ToggleSwitch]

  Status:
    description: "Read-only indicators showing system state."
    interaction: none
    token_grammar: color.system-status
    examples: [StatusChip, Badge]

  Layout:
    description: "Structural components for page organisation."
    interaction: none
    # No canonical token_grammar — Layout components vary widely.
    examples: [Divider, Accordion, Pagination]

  Overlays:
    description: "Popover containers for transient content."
    interaction: none
    examples: [PopoverMenu, Tooltip, Modal]
```

---

---

## 13. Assets

A Profile declares the **external assets** the DS relies on: where they
originate, how generated code consumes them, and what vocabulary they
expose. Currently `assets.icons` is normative; `assets.fonts` and
`assets.illustrations` are reserved for future versions.

The central design decision: **origin and consumption are independent
dimensions.** Icons may originate in Figma and be consumed as a TypeScript
registry (the Formtrieb pattern), or originate as an npm package and be
consumed via direct imports (the Lucide-Angular pattern). A bridge tool
(declared via `export_tool`) connects the two when they differ.

### 13.1 Schema

```yaml
assets:

  icons:
    naming_case: string           # REQUIRED — "snake" | "kebab" | "camel"
    sizes: [string, ...]          # REQUIRED — ordered list, matches a size
                                  #            vocabulary or inline values

    origin:                       # REQUIRED
      type: string                # "figma" | "package" | "filesystem"
      # — shape-specific fields (see §13.3) —

    consumption:                  # REQUIRED
      type: string                # "typescript-registry" | "package-import"
                                  # | "sprite-href"
      # — shape-specific fields (see §13.4) —
```

### 13.2 `icons.naming_case` and `icons.sizes`

- **`naming_case`** — how icon identifiers are cased across the DS. A
  Target generator MUST use this when emitting type-safe icon names.
  Accepts `snake`, `kebab`, `camel`.
- **`sizes`** — ordered list of size identifiers. A CDF Component Icon spec SHOULD
  expose `size: enum` values that match or form a contiguous subset of
  this list. Order is normative (smallest first by convention).

### 13.3 `origin` — where truth lives

Three shapes:

**Figma origin** — icons are authored as vector shapes inside a Figma
component set. An export tool (Claude skill, plugin, pipeline) pulls them
out.

```yaml
origin:
  type: figma
  url: "https://www.figma.com/design/<fileKey>/<name>?node-id=<n>-<n>"
  export_tool: build-icons        # name of the skill/tool that exports
```

**Package origin** — icons come from an npm package or equivalent; the DS
does not own them, only selects which to expose.

```yaml
origin:
  type: package
  package: lucide
  version: ">=0.577"
```

**Filesystem origin** — icons live as SVG files on disk, authored outside
a design tool.

```yaml
origin:
  type: filesystem
  path: "./icons/svg/"
```

### 13.4 `consumption` — how generated code accesses icons

Three shapes:

**TypeScript registry** — the Target generates (or relies on a pre-generated)
TypeScript file that exports a typed name union and a `Record<name, SVG>`
map.

```yaml
consumption:
  type: typescript-registry
  registry_path: "./icon-registry"   # module path, no extension
  registry_export: icons             # named export (the name → SVG map)
  name_type_export: IconName         # named export (the string literal union)
  viewbox: "0 0 20 20"               # SVG viewBox uniform across the DS
```

**Package import** — the consumer imports a pre-built component per icon.

```yaml
consumption:
  type: package-import
  import_package: lucide-angular
  import_symbol: LucideAngularModule
  render_template: '<lucide-icon [name]="name()" [size]="size()" />'
```

**Sprite href** — icons rendered via `<use>` referencing a sprite file.

```yaml
consumption:
  type: sprite-href
  sprite_path: "./icons/sprite.svg"
  href_prefix: "icon-"              # e.g. <use href="./icons/sprite.svg#icon-close" />
```

### 13.5 Origin × consumption combinations

The two dimensions are orthogonal. Common combinations:

| Origin        | Consumption            | Typical use                             |
| ------------- | ---------------------- | --------------------------------------- |
| `figma`       | `typescript-registry`  | Custom DS, icons exported from Figma    |
| `package`     | `package-import`       | Off-the-shelf icon lib (Lucide, Heroicons) |
| `package`     | `typescript-registry`  | Pre-bundle a package's icons into own registry |
| `filesystem`  | `sprite-href`          | Classic SVG sprite pipeline             |

Combinations where origin and consumption are not the same tool typically
declare `origin.export_tool` — the skill/build-step responsible for
bridging them.

### 13.6 Cross-reference

- Icon Component specs bind `size:` enum values to `assets.icons.sizes`
  (see [Component §7](CDF-COMPONENT-SPEC.md#7-properties)).
- Target generators use `consumption` to decide what imports and rendering
  patterns to emit (see
  [CDF Target §11](CDF-TARGET-SPEC.md#11-dependencies)).

### 13.7 Example (Formtrieb)

```yaml
assets:
  icons:
    naming_case: snake
    sizes: [xsmall, small, base, large]
    origin:
      type: figma
      url: "https://www.figma.com/design/EXAMPLE-FILE-ID/DesignSystem?node-id=138-342"
      export_tool: build-icons
    consumption:
      type: typescript-registry
      registry_path: "./icon-registry"
      registry_export: icons
      name_type_export: IconName
      viewbox: "0 0 20 20"
```

---

## 14. (Removed in v1.0.0-draft) — CSS defaults moved to Target

The former **CSS defaults** section has been relocated to
[CDF Target §9.7 `state_guards:`](CDF-TARGET-SPEC.md#97-state_guards--ds-wide-state-selector-fragments)
as part of the Phase-7b layer-boundary review pass.

**Rationale.** The block was purely Web-specific (`state_guards:` contains
raw CSS selector fragments). A SwiftUI or Kirby Target has no meaningful
interpretation of CSS pseudo-class fragments like `:hover:not([disabled])`.
Keeping the block in the Profile forced non-Web Targets to either ignore
it or awkwardly translate it. Moving it to the Target is a cleaner fit for
the layer model: *the Profile declares DS identity that applies to every
Target; the Target declares framework-specific idioms.*

**Where things live now.**

| Former location                     | New location                  |
| ----------------------------------- | ----------------------------- |
| `profile.css_defaults.state_guards` | `target.styling.state_guards` (Web Targets only) |

A Web Target that omits `state_guards:` falls back to the four canonical
guards documented in Target §9.7. Non-Web Targets omit the field entirely.

> **Section-number stability.** The section-number slot is preserved as
> a redirect rather than compacted, so cross-references from v0.x and
> draft-internal links remain valid. Future drafts may renumber.

---

## 15. Profile extension

A Profile MAY extend another Profile via the `extends:` field ([§4.5](#45-extends)).
Extension is the mechanism by which multiple DSes share one vocabulary:
a consuming Profile extends a parent (e.g. Formtrieb), inheriting the full
token grammar, vocabularies, interaction patterns, and accessibility
defaults while overriding only the parts that differ (naming prefix,
theming contexts, categories, assets).

### 15.1 Rules at a glance

| Field group                 | Merge semantics                                        |
| --------------------------- | ------------------------------------------------------ |
| `name`, `version`           | Always the extending Profile's own values              |
| `cdf_version`               | Extending Profile declares its own; MUST be within parent's range |
| `extends`                   | Single-level only — chains are not supported in v1.0.0-draft |
| `description`               | Replaces parent                                        |
| `vocabularies`              | Per-key: new keys added, existing keys REPLACE parent (entire vocabulary entry, not value list) |
| `token_grammar`             | Per-key: new keys added, existing keys REPLACE         |
| `token_layers`              | Additive only — new layers added, existing layers MAY extend `grammars:`/`references:` but MUST NOT remove entries. Layer ordering is preserved from the parent; new layers append. (see §6.10.6) |
| `standalone_tokens`         | Additive only — new tokens added, existing tokens MAY extend `values:` but MUST NOT remove tokens, values, or change `dtcg_type`. (see §6.11.5) |
| `token_sources`             | REPLACE entire block (see §7.6)                        |
| `theming.modifiers`         | Per-modifier: new added, existing REPLACE              |
| `theming.set_mapping`       | REPLACE entire block                                   |
| `naming`                    | Per-key replace (e.g. extending Profile MAY override `css_prefix` while inheriting the rest) |
| `interaction_patterns`      | Per-pattern: new added, existing REPLACE               |
| `accessibility_defaults`    | Per-block: new added, existing blocks REPLACE          |
| `categories`                | Per-category: new added, existing REPLACE (see [§12.5](#125-extension-semantics)) |
| `assets`                    | Per-asset-type REPLACE (e.g. `assets.icons` replaces entirely) |

**Default principle:** replace at the smallest documented unit, never at
value-list granularity. An extending Profile CANNOT remove individual
values from an inherited vocabulary — doing so silently would invalidate
CDFs across the DS family.

### 15.2 Value additions to inherited vocabularies

An extending Profile MAY add values to an inherited vocabulary by naming
the vocabulary explicitly and providing the **full** replacement list
including the inherited values. There is no partial-add syntax — the
replacement is always whole-list, to keep the file self-contained and
readable.

```yaml
# parent (Formtrieb): vocabularies.hierarchy.values = [brand, primary, secondary, tertiary]
# extending (Big Co):
vocabularies:
  hierarchy:
    description: "..."                          # MUST carry forward or restate
    values: [brand, primary, secondary, tertiary, muted]   # +muted
```

A validator MAY warn if an extending Profile's replacement list drops
parent values (potential mistake) or reorders them (breaks order-sensitive
consumers).

### 15.3 Circular extension

`extends:` chains MUST NOT form cycles. A validator MUST reject a Profile
whose `extends:` eventually references itself (direct or transitive).

### 15.4 Compatibility with parent's `cdf_version`

The extending Profile's `cdf_version:` range MUST be within the parent's
`cdf_version:` range. Extending a Profile that supports CDF Component 1.x
while declaring support for CDF Component 2.x is rejected: the parent's
rules may not hold
for the wider range.

### 15.5 Example — Acme extends Formtrieb

```yaml
# Extending only what differs.
name: Acme
version: "1.0.0"
extends: ../formtrieb.profile.yaml
cdf_version: ">=1.0.0 <2.0.0"
description: >
  Acme extends Formtrieb with Acme-specific naming, theming,
  and component categories.

# Naming override — same casing, different identifier.
naming:
  identifier: "acme"
  # casing inherited unchanged from Formtrieb

# Theming contexts differ from Formtrieb's.
theming:
  modifiers:
    semantic:
      description: "Light/Dark color scheme — Acme-specific themes."
      contexts: [Light, Dark]     # No brand-specific themes
      default: Light
      required: true
      data_attribute: data-semantic
  set_mapping:                    # REPLACE whole — §8.3 requires coverage
    "Foundation/Foundation":  { always_enabled: true }
    "Semantic/Light":         { modifier: semantic, context: Light }
    "Semantic/Dark":          { modifier: semantic, context: Dark }
    # … rest of Acme's set mapping …

# Concrete assets — parent has only the template.
assets:
  icons:
    naming_case: snake
    sizes: [xsmall, small, base, large]
    origin:      { type: figma, url: "...", export_tool: build-icons }
    consumption: { type: typescript-registry, registry_path: "./icon-registry",
                   registry_export: icons, name_type_export: IconName,
                   viewbox: "0 0 20 20" }

# vocabularies, token_grammar, interaction_patterns, accessibility_defaults,
# categories — all inherited from Formtrieb without change.
```

### 15.6 Known limitation — single-level extension

v1.0.0-draft supports **one level** of extension (profile B extends
profile A). Multi-level chains (C extends B extends A) are rejected. This
constraint simplifies merge semantics and makes validator implementations
straightforward; it will be revisited when a real use case demands chains.

> **Implementation workaround.** The current `formtrieb-cdf-core` parser
> relies on a workaround (always loading `formtrieb.profile.yaml` and
> mutating the prefix) because true extension resolution is not yet
> implemented. A future minor version formalises this.

---

## Appendix A. Minimal example

The smallest Profile sufficient to author one non-trivial component
against. Demonstrates Identity, one Vocabulary, one Token Grammar, one
Theming modifier, Naming, and one Interaction Pattern.

```yaml
name: TinyDS
version: "1.0.0-draft"
cdf_version: ">=1.0.0-draft"
dtcg_version: "2025.10"
description: >
  Minimal DS for demonstrating CDF Profile format. One hierarchy,
  one interaction pattern, light/dark theming.

vocabularies:
  hierarchy:
    description: "Visual emphasis levels for interactive controls."
    values: [primary, secondary]
  element:
    description: "Visual parts of a control receiving individual token values."
    values: [background, text, stroke]

token_grammar:
  color.controls:
    pattern: "color.controls.{hierarchy}.{element}.{state}"
    dtcg_type: color
    description: "Interactive UI controls. Hierarchy x element x state grid."
    axes:
      hierarchy: { vocabulary: hierarchy }
      element:   { vocabulary: element }
      state:
        description: "Token-path state names."
        values: [enabled, hover, pressed, disabled]

token_sources:
  directory: ./tokens
  sets:
    foundation: [Foundation]
    semantic:   [Semantic/Light, Semantic/Dark]

theming:
  modifiers:
    semantic:
      description: "Light/Dark color scheme."
      contexts: [Light, Dark]
      default: Light
      required: true
      data_attribute: data-semantic
      affects: [color.controls]
  set_mapping:
    "Foundation":       { always_enabled: true }
    "Semantic/Light":   { modifier: semantic, context: Light }
    "Semantic/Dark":    { modifier: semantic, context: Dark }

naming:
  identifier: "t"
  casing:
    component_names: PascalCase
    properties: camelCase
    token_paths: camelCase

interaction_patterns:
  pressable:
    description: "Direct click/tap targets."
    states: [enabled, hover, pressed, disabled]
    token_layer: Controls

categories:
  Actions:
    description: "Clickable controls."
    interaction: pressable
    token_grammar: color.controls
    examples: [Button]
```

That's 47 lines. A Button Component authored against this Profile is under
40 lines more — a complete DS pair in under 90 lines of YAML.

---

## Appendix B. Relationship to DTCG

A CDF Component Profile sits alongside DTCG, not on top of it. Each has a distinct
scope:

| DTCG describes                           | A Profile describes                    |
| ---------------------------------------- | -------------------------------------- |
| What a token is (name, `$value`, `$type`) | What token paths are legal             |
| Per-token type (`color`, `dimension`)     | What path segments mean (vocabularies) |
| File organisation (optional themes)       | Which sets activate per modifier       |
| Value resolution (references)             | Reference cascade rules (token layers) |

A DTCG-aware tool that does **not** understand CDF Profile format can
still consume the DS's token files directly — they are plain DTCG. It
just cannot validate that a token path follows the DS's grammar, or that
two tokens participate in a pairing that guarantees contrast.

A CDF Component-aware tool builds on top: it reads the Profile to *know the rules*,
then reads DTCG tokens to *resolve the values*. The Profile is the
schema; DTCG is the data.

### B.1 Version alignment

A Profile's `dtcg_version:` declares the DTCG release it is written
against. Token types (`color`, `dimension`, `shadow`, `typography`, etc.)
and `$value` formats are defined by DTCG; changes in DTCG minor/patch
versions SHOULD be non-breaking for Profiles. A Profile MAY omit
`dtcg_version:` — consumers then assume the latest published DTCG.

### B.2 What DTCG doesn't cover

DTCG scope stops at the token level. Everything above — which *paths*
exist, how modifiers *switch* them, how components *consume* them —
lives in the Profile. That's why CDF Profile exists: DTCG deliberately
left component-level semantics out of scope.

---

## Appendix C. Known gaps (Phase 7b review)

This appendix tracks format-design questions that surfaced during Phase 7b.
Items are marked resolved as they are addressed; remaining items are
deferred to later v1.x revisions with a named blocker.

- **Formalisations — resolved in draft:**
  - **[§6.10 `token_layers`](#610-token_layers--reference-cascade-between-grammar-groups)** — reference cascade rules between token
    grammar groups now have a schema (name + description + grammars +
    references), explicit DAG and coverage rules, and merge semantics for
    Profile extension.
  - **[§6.11 `standalone_tokens`](#611-standalone_tokens--tokens-outside-any-grammar)** — tokens outside any grammar pattern now
    have a schema (dtcg_type + description + optional values + optional
    layer), plus a "total token space" relationship with `token_grammar`.
- **Layer-boundary review — resolved in draft:**
  - [§9 Naming](#9-naming) split. DS-identity (`identifier:`, `casing:`,
    `reserved_names:`) stays in Profile. Web-specific fields (`css_prefix`,
    `token_prefix`, `methodology`, `pattern`, `css_selectors` casing)
    moved to [CDF Target §9.2](CDF-TARGET-SPEC.md#92-naming--prefixes-methodology-pattern-casing).
    Typed-identifier prefix (Swift/Kotlin/Java) added as
    [CDF Target §8.7](CDF-TARGET-SPEC.md#87-type_prefix-and-type_pattern--typed-identifier-naming).
    Unified via a small Identifier Template DSL
    ([CDF Target §5.6](CDF-TARGET-SPEC.md#56-identifier-template-dsl)) so
    the Profile's abstract `identifier:` drives every Target's expression.
  - [§10.6 `promoted:`](#106-promoted) reframed as abstract "externally
    observable" markers; concrete Web mapping moved to
    [CDF Target §13.3.1](CDF-TARGET-SPEC.md#1331-web-realisation-of-profiles-canonical-markers).
  - [§14 CSS defaults](#14-removed-in-v100-draft--css-defaults-moved-to-target)
    relocated to [CDF Target §9.8](CDF-TARGET-SPEC.md#98-state_guards--web-wide-state-selector-fragments).
- **Layer-boundary review — remaining (deferred):** Component §14
  `behavior.css` and §16 CSS block still live in the Component spec and
  are flagged Web-specific. Moving them cleanly requires a
  **"Target-Overlays"** concept (per-Component × per-Target partials) that
  has not been designed yet. Planned for a later v1.x revision.
