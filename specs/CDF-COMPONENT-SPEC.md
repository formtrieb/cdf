# CDF Component Spec

**Format:** CDF Component (one of the three CDF formats — see [Architecture](CDF-ARCHITECTURE.md))
**Version:** 1.0.0
**Status:** Working Draft
**File extension:** `.component.yaml`
**Depends on:** a [CDF Profile](CDF-PROFILE-SPEC.md)
**Consumed by:** generators, LLMs, validators

---

## 1. Purpose

A CDF Component describes **one UI component instance** — its API surface,
structural anatomy, token bindings, interactive behaviour, accessibility
requirements, and composition relationships — independently of any output
framework.

A CDF Component answers:

- What are this component's inputs and outputs?
- What are its visual parts?
- What tokens drive its appearance?
- What runtime states does it have?
- What accessibility guarantees does it offer?
- What other components does it compose?
- Which design-source document describes it?

A CDF Component does **not** answer:

- What the DS vocabulary is — that's the [Profile](CDF-PROFILE-SPEC.md).
- How to render it in a given framework — that's the [Target](CDF-TARGET-SPEC.md).

> ### 1.1 Design principles
>
> 1. **Declarative, not imperative** — Describe intent, not rendering logic.
> 2. **Token-driven** — Every visual property in a `tokens:` block binds to
>    exactly one token path, which resolves to exactly one DTCG value at
>    **token-build time** (before any Component renders). The format
>    deliberately forbids runtime transformations on token values —
>    arithmetic, alpha modifiers, `color-mix()`, `calc()` on token
>    references. State variations are distinct tokens with their values
>    (including any alpha) baked in at build time. A DS that expresses
>    states via runtime opacity modifiers (Tailwind-style
>    `hover:bg-primary/90`) diverges from this principle and MUST either
>    declare distinct state tokens or document the divergence explicitly
>    in token `description:` annotations. Scope: the `tokens:` block,
>    typography mixins, and token references inside `css:` blocks. Out of
>    scope: `behavior:` runtime-logic, `conditional:` expressions,
>    framework-level state machines.
> 3. **Structure over template** — Anatomy is a typed tree; generators produce
>    idiomatic templates.
> 4. **Orthogonal state modelling** — States are independent axes, not a flat
>    enum. Prevents combinatorial explosion.
> 5. **Constraint-aware** — Mutual exclusions, conditional validity, prop
>    dependencies are first-class.
> 6. **Accessibility-native** — ARIA, keyboard, and contrast requirements are
>    part of the spec.
> 7. **Composition over inheritance** — Child components referenced by name;
>    the generator resolves imports per framework.
> 8. **LLM-legible** — Every section self-documenting; descriptions explain
>    *why*, not just *what*.

---

## 2. Conformance

A file conforms to this specification if:

1. It is valid YAML 1.2.
2. It contains all **REQUIRED** fields in [§3](#3-top-level-schema).
3. It references a Profile (directly or through an inheritance chain).
4. All token paths match patterns declared in the referenced Profile's
   `token_grammar`.
5. All vocabulary references (hierarchy, intent, size, …) resolve to values
   declared in the referenced Profile.
6. All state axes referenced in `tokens`/`css` resolve to axes declared in
   `states`.

A conforming validator MUST reject any file violating (1)–(6). Additional
consistency rules (anatomy/tokens parity, accessibility completeness, etc.)
are defined in [§18](#18-validation-rules).

---

## 3. Top-level schema

```yaml
# ── Identity ──────────────────────────────────────────────────
name: string                      # REQUIRED — PascalCase
category: string                  # REQUIRED — one of profile.categories
description: string               # REQUIRED — multi-line purpose + usage
profile: path                     # REQUIRED — path to .profile.yaml

# ── Composition ──────────────────────────────────────────────
extends: filename                 # optional — embeds another Component as wrapper
inherits: filename                # optional — inherits all fields from parent

# ── Cascade context ──────────────────────────────────────────
theme_axes: ThemeAxes             # optional — axes this component responds to

# ── API surface ──────────────────────────────────────────────
properties: Properties            # optional — consumer-configurable inputs
properties_sealed: SealedProps    # optional — locked inherited inputs
states: States                    # optional — runtime state axes
events: Events                    # optional — outputs
derived: DerivedValues            # optional — computed from props/states

# ── Structure ────────────────────────────────────────────────
anatomy: Anatomy                  # REQUIRED — structural parts
slots: Slots                      # optional — content projection points

# ── Visual contract ──────────────────────────────────────────
tokens: Tokens                    # REQUIRED — token mapping per anatomy part
compound_states: Compound[]       # optional — multi-axis state intersections
token_gaps: string[]              # optional — known unresolved references

# ── Behavioural contract ─────────────────────────────────────
behavior: Behavior                # optional — transitions, transforms
accessibility: Accessibility      # REQUIRED — ARIA, keyboard, focus, contrast

# ── Implementation hints ─────────────────────────────────────
css: CSS                          # optional — selector, modifiers, private props
references: Reference[]           # optional — spec / implementation links

# ── Design source ────────────────────────────────────────────
design_source: DesignSource       # optional — where this component lives in
                                  #            the design tool of record
```

---

## 4. Identity

> **Contract:** authoring. The Identity block names the component and
> anchors it in the referenced Profile's vocabulary.

### 4.1 Schema

```yaml
name: string                      # REQUIRED
category: string                  # REQUIRED — one of profile.categories
description: string               # REQUIRED — multi-line
profile: path                     # REQUIRED — path to .profile.yaml
```

### 4.2 `name`

- **Type:** string, cast to `profile.naming.casing.component_names`
  (typically PascalCase).
- **REQUIRED.**
- **Rule:** MUST be unique within the DS. A validator MAY warn if two CDFs
  in the same `directory` (or same Profile) declare the same `name`.
- **Stability:** renaming a component is a breaking change for any
  consumer that imports it by name. Authors MUST bump the CDF Component's version
  when renaming.

### 4.3 `category`

- **Type:** string, one of the keys declared in
  [`profile.categories`](CDF-PROFILE-SPEC.md#12-categories).
- **REQUIRED.**
- **Rule:** A validator MUST reject a category not declared in the
  referenced Profile. The category determines default accessibility
  treatment (see [§15](#15-accessibility)) and allowed `token_grammar`
  bindings (see [§13](#13-tokens)).

### 4.4 `description`

- **Type:** string (multi-line allowed).
- **REQUIRED.**
- **Guidance:** SHOULD answer three questions in 80–150 words:
  1. What is this component?
  2. When should consumers use it?
  3. When should they NOT use it? (cross-reference sibling components)
- Descriptions are the primary surface LLMs read to decide whether a
  component fits a user need. Terse component names like `Chip` need
  long descriptions; self-explanatory names like `TextInput` need less.

### 4.5 `profile`

- **Type:** path string, relative to the CDF Component's location.
- **REQUIRED in v1.0.0.**
- **Purpose:** declares which Profile supplies the vocabulary, token
  grammar, categories, and interaction patterns this CDF Component speaks.
- **Rule:** a validator MUST reject a CDF Component whose `profile:` path does
  not resolve to a readable `.profile.yaml`, or whose resolved Profile's
  `cdf_version:` range does not include this CDF Component's own version.
- **Inherited Components:** when a CDF Component uses `inherits:` or `extends:`
  ([§5](#5-composition)), the `profile:` of child and parent MUST match.

> **Note — implicit profile discovery.** A future version MAY allow
> `profile:` to be omitted and resolved by directory convention (the
> nearest `.profile.yaml` up the file tree). In v1.0.0-draft this is
> rejected; explicit is mandatory. Rationale: makes single-file LLM
> reading unambiguous.

### 4.6 Example

```yaml
name: Button
category: Actions
description: >
  Labeled action trigger with five visual hierarchy levels. Always has
  visible text — for icon-only actions, use IconButton. Supports
  optional leading or trailing icon, two sizes, and a pending state
  that replaces content with a spinner icon.
profile: ../formtrieb.profile.yaml
```

---

## 5. Composition

> **Contract:** both. Composition affects the authoring contract
> (what a child component carries over from its parent) AND the
> generation contract (what the generator emits for inherits vs. extends).

A CDF Component supports two composition mechanisms with different semantics:

| Mechanism    | Relation              | Component shape                    | Typical use                                     |
| ------------ | --------------------- | ---------------------------------- | ----------------------------------------------- |
| `inherits:`  | IS-A                  | Flat field-level merge             | IconButton inherits Button                      |
| `extends:`   | HAS-A (as wrapper)    | Structural embed + property promotion | TextInput extends InputGroup (wraps it)         |

A Component MUST NOT use both mechanisms simultaneously on the same parent.

### 5.1 `inherits:` — spec inheritance

**Schema:**

```yaml
inherits: filename                # REQUIRED target, relative path
# All sections below may be present; declared sections override the parent.
# Undeclared sections are inherited verbatim.
```

**Semantics:**

- The child carries over every field of the parent (properties, states,
  events, anatomy, tokens, accessibility, css).
- Any field the child declares replaces the parent's. Merging is
  field-level, never value-level within a field.
- `properties_sealed:` ([§7.5](#75-sealed-properties)) locks inherited
  properties to fixed values, removing them from the child's consumer
  API.

**Use when:** the child IS a specialised parent — IconButton is a Button
that happens to be icon-only.

```yaml
# icon-button.spec.yaml
name: IconButton
category: Actions
inherits: button.spec.yaml
profile: ../formtrieb.profile.yaml

# Everything from Button carries over. The child declares only deltas.
properties_sealed:
  # Label becomes optional visible via slot-overlay; icon-only buttons hide it.
  iconStart: false
  iconEnd: false

properties:
  icon:                            # new property, specific to IconButton
    type: IconName
    required: true
```

### 5.2 `extends:` — structural embed

**Schema:**

```yaml
extends: filename                 # REQUIRED target, relative path
```

**Semantics:**

- The child wraps the parent as **one anatomy part** of itself (not as
  its root).
- The parent's properties are either **promoted** (exposed as properties
  of the child) or **sealed** (locked to a fixed value).
- The parent's anatomy, tokens, states, events are owned by the parent —
  the child does not re-declare them; it accesses them through the
  anatomy part the parent occupies.
- The child MAY add new properties, states, events, and additional
  anatomy parts alongside the embedded parent.

**Use when:** the child composes the parent as a building block —
TextInput is an InputGroup *containing* an InputCore, not a specialisation
of InputGroup.

```yaml
# text-input.spec.yaml
name: TextInput
category: Inputs
extends: input-group.spec.yaml     # TextInput wraps an InputGroup
profile: ../formtrieb.profile.yaml

# InputGroup's properties are promoted by default (see §5.3).
# Override to seal specific parent properties:
properties_sealed:
  variant: default                 # InputGroup.variant locked for TextInput

# TextInput adds its own properties (owned by its InputCore child):
properties:
  value:
    type: string
    bindable: two-way
  placeholder:
    type: string
    optional: true
```

### 5.3 Property promotion and sealing (`extends:`)

When a CDF Component uses `extends:`, the parent's properties have three possible
states:

| Parent property status | Component declaration             | Behaviour                                   |
| ---------------------- | --------------------------------- | ------------------------------------------- |
| Promoted (default)     | No entry in `properties_sealed:`  | Appears in child's consumer API             |
| Sealed to a value      | `properties_sealed: { name: val }` | Locked; not in child's API                  |
| Overridden             | Entry in `properties:` with same name | Child-declared definition wins           |

The child MUST NOT promote a parent property to a different type; it may
only seal or override (same type) or pass through.

### 5.4 Sealed inherited properties

For `inherits:`, `properties_sealed:` has the same role: locking
inherited properties to fixed values so they disappear from the child's
API. Example: IconButton inherits Button; sealing `iconStart: false` and
`iconEnd: false` removes those properties from IconButton's consumer
surface, because an icon-only button has its own `icon:` property.

### 5.5 Circular composition

`inherits:` and `extends:` chains MUST NOT form cycles. A validator MUST
reject any composition graph that revisits a CDF Component.

### 5.6 Chain depth

- `inherits:` chains: up to **3 levels deep** in v1.0.0-draft. Practical
  examples rarely exceed 2 (Button → IconButton).
- `extends:` chains: up to **2 levels** in v1.0.0-draft. Deeper embedding
  should be expressed as multiple named anatomy parts rather than nested
  `extends:`.

### 5.7 Cross-reference to generation

Generators realise the two mechanisms differently. See
[CDF Target §10 Composition Conventions](CDF-TARGET-SPEC.md#10-composition-conventions)
for framework-specific patterns — e.g. Angular emits `inherits:` as a
subclass + override and `extends:` as a wrapper standalone component
with imports of the embedded parent.

---

## 6. Theme axes

> **Contract:** authoring. Declares which of the referenced Profile's
> theming modifiers this component consumes. Has no effect on the
> generated component API — theme switching happens at the document or
> subtree boundary, not per component.

A Component's `theme_axes:` is a **subset** of the Profile's
[`theming.modifiers`](CDF-PROFILE-SPEC.md#8-theming). Declaring an axis
means: "tokens this component reads may vary with this modifier's
context". It does NOT mean the component exposes the axis as a
property — modifiers are DOM-level context, not consumer inputs.

### 6.1 Schema

```yaml
theme_axes:                       # optional — absent = no axes
  {modifier_name}:                # MUST match a profile.theming.modifiers key
    values: [string, ...]         # MUST be a subset of profile's contexts
    data_attribute: string        # optional — MUST match profile declaration
    affects: string               # optional — token-grammar patterns affected
```

### 6.2 Value subset rules

- If a component declares a modifier, its `values:` list MUST be a subset
  of the Profile's `contexts:` for that modifier.
- Declaring a subset is acceptable (e.g. a component that has only Light
  variants in Figma even though the DS supports Light+Dark).
- Declaring a superset or unknown values MUST be rejected.

### 6.3 Why declare at all?

Declaration serves three purposes:

1. **Documentation.** A reader sees at a glance which themes the
   component has been designed for.
2. **Validation hint.** A token-coverage tool can verify that the
   token-sets for each declared context have values for every token this
   component reads.
3. **Variant enumeration.** Documentation tools (Storybook, Figma target)
   can generate a variant grid scoped to declared axes only — not the
   full Cartesian product of all DS modifiers.

### 6.4 Primitives

Components with `interaction: none` and no token references that vary
with a modifier MAY omit `theme_axes:` entirely. An Icon's size tokens
don't respond to the semantic (Light/Dark) modifier — so the Icon spec
declares only `device` (which affects size) or nothing at all.

### 6.5 Example

```yaml
theme_axes:
  semantic:
    values: [Light, Dark]
    data_attribute: data-semantic
    affects: "color.controls.*, color.interaction.*"
  device:
    values: [Desktop, Tablet, Mobile]
    data_attribute: data-device
    affects: "controls.height.*, spacing.*, typography.*"
  shape:
    values: [Round, Sharp]
    data_attribute: data-shape
    affects: "radius.*"
```

---

## 7. Properties

> **Contract:** both. Properties define the component's **consumer-facing
> API** (authoring contract: what can be set) AND signal to the generator
> what framework inputs, signals, model bindings, or attribute proxies to
> emit (generation contract).

Properties are declarative, typed inputs a consumer sets. They are
distinct from:

- **States** ([§8](#8-states)) — runtime, internal, not consumer-set.
- **Events** ([§9](#9-events)) — outputs, not inputs.
- **Theme axes** ([§6](#6-theme-axes)) — DOM-level context, not
  per-component inputs.

### 7.1 Schema

```yaml
properties:
  {name}:                         # REQUIRED — cast to profile casing
    type: string                  # REQUIRED — see §7.2 for supported types
    values: [any, ...]            # REQUIRED if type is "enum"
    default: any                  # optional — MUST match `type`
    required: boolean             # optional — default false
    optional: boolean             # optional — alias for `required: false`;
                                  #            exactly one of required/optional
                                  #            MAY be specified (not both)
    description: string           # REQUIRED — LLM-readable purpose
    bindable: string              # optional — "two-way" | "one-way" (default)
    input_type: string            # optional — HTML input type vocab, see §7.7
    token_mapping:                # optional — see §7.6
      {value}: {token_segment}
    mutual_exclusion: string      # optional — name of another property that
                                  #            must not be set alongside this
    conditional: string           # optional — expression declaring
                                  #            conditional validity
    mirrors_state: string         # optional — name of a §8 state axis whose
                                  #            value mirrors this property at
                                  #            runtime (see §7.11)
    target_only: boolean          # optional — default false. When true, the
                                  #            property's visual effects are
                                  #            owned by the Target layer, not
                                  #            by this Component's tokens block
                                  #            (see §7.12)
```

### 7.2 Supported `type` values

Core types:

| `type`              | Value domain                                     |
| ------------------- | ------------------------------------------------ |
| `enum`              | One of the strings in `values:`                  |
| `boolean`           | `true` / `false`                                 |
| `string`            | Any string                                       |
| `number`            | Any number (integer or float)                    |
| `IconName`          | Any icon identifier recognised by the Profile's `assets.icons` registry |

Profile-vocabulary types:

- A `type:` value that matches a Profile vocabulary key (e.g.
  `type: hierarchy`) is shorthand for `type: enum` +
  `values: [<vocabulary values>]`.
- Profile-aware validators MUST resolve these at validation time.
- If the Profile does not declare the vocabulary, the type is rejected.

User-defined types:

- Additional types MAY be declared by the Profile or by an extending
  document. Currently reserved for future use; v1.0.0-draft recognises
  only the core + vocabulary types listed above.

### 7.3 `required` / `optional` / `default`

Exactly one of three mutually exclusive patterns:

| Pattern                       | Meaning                                               |
| ----------------------------- | ----------------------------------------------------- |
| `required: true`              | Consumer MUST set a value; no default applies          |
| `default: <value>`            | Value is consumer-settable; if omitted, default wins   |
| `optional: true` (or omitted) | Value is consumer-settable; if omitted, remains unset  |

**Rule:** `required: true` + `default:` is a contradiction and MUST be
rejected. Either a consumer is forced to provide a value, or a default
fills in — not both.

### 7.4 `description`

Every property MUST have a description. Descriptions are the primary
surface LLMs use to decide whether a property matches a user intent.
SHOULD include:

- What the property controls visually or behaviourally.
- When consumers typically set it vs. leave it at default.
- Cross-references to sibling properties if interaction matters
  (mutual exclusion, conditional validity).

### 7.5 Sealed properties (`properties_sealed:`)

Used by CDFs that `inherits:` or `extends:` another spec (see
[§5.3](#53-property-promotion-and-sealing-extends)). Locks an inherited
or embedded property to a fixed value:

```yaml
# IconButton inherits Button
properties_sealed:
  iconStart: false               # icon-only button has no leading icon slot
  iconEnd: false
```

The sealed property:

- MUST NOT appear in `properties:` (would double-declare).
- Disappears from the child's consumer API — consumers cannot set it.
- Is still present at generation: the generator substitutes the locked
  value wherever the parent references it.

### 7.6 `token_mapping`

Maps a property's consumer-facing value to a different segment used in
token paths. Parallel to the Profile's
[`interaction_patterns.token_mapping`](CDF-PROFILE-SPEC.md#104-token_mapping)
but for property values instead of state values.

**Use case.** A Button's `hierarchy` property has the consumer-facing
value `tertiaryWithoutPadding`, but no matching token — the token system
knows only `tertiary`. The mapping declares the identity:

```yaml
properties:
  hierarchy:
    type: enum
    values: [brand, primary, secondary, tertiary, tertiaryWithoutPadding]
    token_mapping:
      # identity mappings for brand/primary/secondary/tertiary omitted
      tertiaryWithoutPadding: tertiary
```

A consumer sets `hierarchy: tertiaryWithoutPadding`; the token resolver
reads `color.controls.tertiary.*`. The presentation-layer difference
(no padding) is handled by CSS modifiers, not by token selection.

Rules:

- Identity mappings MAY be omitted.
- The mapped-to segment MUST match an axis value in the relevant Profile
  `token_grammar`.

### 7.7 `input_type` (for `type: string`)

When a property carries user input text, `input_type:` declares the
HTML-input-type vocabulary:

```yaml
input_type: text | password | email | url | tel | search | number
```

Purpose: lets Web generators emit `<input type="email">` and native
generators pick the appropriate keyboard (`.keyboardType = .emailAddress`
in SwiftUI). If omitted, the generator defaults to `text`.

> **Note.** This field exists because `type:` is overloaded: the CDF Component
> `type:` is a *value domain* (string, number, enum); `input_type:` is a
> *UI hint*. The separation keeps value-domain checks independent of
> keyboard/validation hints.

### 7.8 `bindable`

Declares whether the property supports two-way binding. Default is
`one-way` (consumer → component).

| Value      | Behaviour                                                             |
| ---------- | --------------------------------------------------------------------- |
| `one-way`  | Consumer sets; component reads. Default.                              |
| `two-way`  | Consumer sets AND component reports changes. Paired with an event.    |

**Generator mapping** (examples — see Target):

- Angular `bindable: two-way` → `model()` signal + automatic
  `nameChange` output.
- SwiftUI → `@Binding`.
- React → controlled prop + `onChange` (separate event).

A `bindable: two-way` property SHOULD have a paired event with
`native_name: nameChange` (conventionally).

### 7.9 `mutual_exclusion`

Names another property that MUST NOT be set simultaneously:

```yaml
iconStart:
  type: IconName
  optional: true
  mutual_exclusion: iconEnd

iconEnd:
  type: IconName
  optional: true
  mutual_exclusion: iconStart
```

A validator MAY warn if the exclusion is declared asymmetrically (only
one side references the other); both sides SHOULD name each other.

### 7.10 `conditional`

Declares conditional validity in a small expression language. Reserved
for v1.0.0-draft — examples only, formal grammar in v1.0.0 final:

```yaml
properties:
  clearable:
    type: boolean
    default: false
    conditional: "value !== null"      # only relevant when the input has content
```

Until the grammar is frozen, validators SHOULD warn (not reject) on
`conditional:` fields, and MUST treat them as documentation.

### 7.11 `mirrors_state` — bridging consumer-set inputs into runtime axes

Most properties (hierarchy, size, iconStart) are pure consumer configuration:
they shape the component's API but do not participate in token resolution by
their own name. Most state axes (interaction, validation) are pure runtime
concerns: the component drives them from events, the consumer never names
them. Some inputs are **both** — `checked` on a Checkbox, `open` on an
Accordion, `pending` on a Button: the consumer sets them, AND they appear
as a state axis in the token-modifier syntax (`background--checked.true`,
`border-color--open.true`).

Modelling these as a separate property and a separate state axis is honest
about the dual role. `mirrors_state:` makes the bridge explicit:

```yaml
properties:
  checked:
    type: boolean
    default: false
    bindable: two-way
    mirrors_state: selected      # this property's value IS the `selected` axis
    description: Selection state.

states:
  selected:
    values: [false, true]
    default: "false"
    token_expandable: true
    description: Token-resolution axis mirrored from the `checked` property.
```

Rules:

1. **Target exists.** The named state axis MUST exist in §8 `states:`.
2. **Type compatibility.**
   - A `boolean` property mirrors a state axis with `values: [false, true]`.
   - An `enum` property mirrors a state axis whose `values:` are a superset
     of (or equal to) the property's `values:`.
   - Other `type` values are not mirrorable in v1.0.0-draft.
   Validator: `CDF-SEM-013`.
3. **Default consistency.** The property's `default:` and the state axis's
   `default:` MUST resolve to the same value (after type coercion).
4. **Bindability inheritance.** If the property is `bindable: two-way`, the
   mirrored state is also implicitly two-way for any consumer that addresses
   the state axis directly (e.g. via `state_to_input:` in a Target).
5. **Auto-promotion.** A mirrored state is **automatically observable at the
   component boundary** — Profile §10.6 `promoted:` need not list it
   separately. Listing it explicitly is allowed (no error) but redundant.
   See Profile §10.6 *Auto-promotion of mirrored states*.
6. **Single mirror.** A state axis MAY be the mirror target of at most one
   property. Validator: `CDF-SEM-014`.

> **Why two names, not one.** Property `checked` is the consumer-facing
> contract — it has the framework idiom (`@Input`, `@Binding`, `value`).
> State `selected` is the token-resolution axis — it appears in
> `background--selected.true` modifiers and in compound-state `when:`
> predicates. The names match the audience: consumers think `checked`,
> the token system thinks `selected` (or whatever the Profile's
> selectable-pattern vocabulary calls it). `mirrors_state:` is the
> two-way translator the spec previously left implicit.

> **When NOT to mirror.** If a property only configures non-token aspects
> of the component (icon name, label text, mutual exclusion partner), it
> does not mirror a state. Most properties don't.

### 7.12 `target_only` — Property without modelled bindings

A property MAY declare `target_only: true` to signal that its visual
effects are owned by the Target layer, not by this Component's
modelled `tokens:` block. This is appropriate when:

- The DS ships the axis as utility classes / atomic CSS bundles
  without DS tokens — e.g. shadcn-style `size` shipped as Tailwind
  utility bundles (`h-10 px-4 py-2`, `h-9 px-3`, …).
- The DS owns tokens for the axis but in a token family the Component
  spec deliberately does NOT model — e.g. Primer-style `size` driven
  by `control.{size}.*` while the Component models only `color.button.*`.

Schema:

```yaml
properties:
  size:
    type: enum
    values: [default, sm, lg, icon]
    target_only: true
    description: |
      Size affects height/padding/font-size via Tailwind utility
      bundles (shadcn) or via the control.{size}.* token family
      (Primer). This Component spec does not model that token surface;
      the Target generator owns the size→class mapping.
```

**Semantics:**

- When `target_only: true`, validators MUST NOT warn about absent
  token bindings for this property.
- When absent or `false`, the property is expected to have token
  bindings; absence is a potential authoring oversight that an
  audit-time check MAY surface.
- The flag is a **signalling primitive**, not a binding mechanism.
  It does not declare WHERE the bindings live — only that this
  Component spec is not the place to look.

**When NOT to use `target_only`:**

- The property has token bindings in this Component's `tokens:` block —
  even partial bindings make `target_only: true` misleading.
- The property's effects can be expressed in the modelled token
  surface but the author hasn't gotten around to it — that's a TODO,
  not a `target_only`. Use `target_only` to mark *intentional*
  out-of-scope, not *deferred* in-scope work.

> **Origin.** Multi-DS evidence from foreign-DS validation passes:
> shadcn `Button.size` (utility-class bundles, no DS tokens) +
> Primer `Button.size` (DS tokens in a different family) +
> Material 3 `Button.density` (DS tokens in a sizing-system family).
> Three structurally distinct reasons for "bindings absent by
> design", all collapsed under one signalling primitive.

> **Trigger condition — narrow by design.** `target_only: true`
> signals that the property's resolution lives in the **Target
> generator's non-DS code** — utility classes (shadcn's Tailwind
> bundles), component-library props (Primer's `size` prop), or
> sizing-system token families the Component spec deliberately
> does not model (Material 3's `density`). It does NOT apply when
> the axis's resolution lives in the DS itself as non-token
> arithmetic — e.g. USWDS Button's `size` axis, where
> `default`/`big` correspond to Sass `padding` + `font-size` math
> rather than tokens. In that case, the axis is a legitimate
> consumer-facing property whose CSS-emission lives in the
> Component's `css:` block or in derived values, and the absence
> of bindings in `tokens:` is not "intentional out-of-scope" but
> "arithmetic, not tokens". A future draft MAY introduce a
> second flag (e.g. `derived_by_source: true`) if this shape
> becomes common; at v1.0.0 the one-DS observation is
> insufficient evidence.

### 7.13 Example (abbreviated from Formtrieb Button)

```yaml
properties:
  hierarchy:
    type: enum
    values: [brand, primary, secondary, tertiary, tertiaryWithoutPadding]
    default: primary
    token_mapping:
      tertiaryWithoutPadding: tertiary
    description: >
      Visual emphasis level. Brand = CTA (brand-color fill), Primary =
      high-emphasis, Secondary = subtle, Tertiary = text-only (no fill).
      tertiaryWithoutPadding behaves visually like tertiary but has no
      horizontal padding.

  size:
    type: enum
    values: [base, small]
    default: base
    description: "Control height via device-aware controls.height tokens."

  iconStart:
    type: IconName
    optional: true
    mutual_exclusion: iconEnd
    description: "Icon displayed before the label text."

  iconEnd:
    type: IconName
    optional: true
    mutual_exclusion: iconStart
    description: "Icon displayed after the label text."
```

---

## 8. States

States describe runtime visual axes that drive token resolution and
modifier overrides. They come in two flavours:

- **Component-managed states** — driven by events the component handles
  itself, never set by the consumer. `interaction` (pointer/keyboard
  events), `validation` (form-status), `pending` (async progress) are
  typical. A consumer does not pass `interaction: "hover"`; the component
  reacts to pointer events and applies the correct token set internally.

- **Property-mirrored states** — paired one-to-one with a §7 property via
  `mirrors_state:` (§7.11). The consumer sets the value through the
  property; the state axis is the same value, addressable by the token
  system. `selected` mirrored from `checked`, `open` mirrored from
  `expanded`, `loading` mirrored from `pending` are typical.

Either flavour participates identically in token-modifier syntax,
compound-state predicates, and grammar-slot resolution. The flavour
matters only for the API surface: component-managed states never appear
in the consumer's input list; property-mirrored ones always do.

The `states:` block is a map of named axes. Each axis is an independent
dimension. Multiple axes multiply into a grid — `interaction × validation`
produces twelve combinations, not a flat union of seven names. When a
specific combination needs token values that cannot be derived from the
per-axis defaults (a surface swap, a semantic override), declare a
**compound state** (§8.8).

> **Separate semantic concerns into separate axes.** Interaction
> (pointer/keyboard events) and validation (form-content status) are
> different concepts; they MUST live in different axes. Folding
> `error` into an `interaction` axis's values is a Tier-1 validator
> error under `CDF-STR-011` (§18.3) — the Profile's `validation`
> pattern (Profile §10 + §10.8) is a reserved vocabulary that claims
> those names. This rule extends to any reserved vocabulary the
> Profile declares: `hierarchy`, `size`, `intent`, or custom
> additions. Axis naming should follow the vocabulary name, or the
> axis should declare `binds_to: {vocabulary}` explicitly.

### 8.1 Axis fields

| Field              | Required | Description |
| ------------------ | -------- | ----------- |
| `values`           | Yes      | Ordered list of valid values for this axis. |
| `default`          | No       | Value when no runtime signal is active. Omit only when the default is the first entry and unambiguous. |
| `token_expandable` | Yes      | `true` = this axis maps to a token-path segment; the DTCG resolver switches token sets per value. `false` = axis affects layout/class only, no dedicated token state. |
| `token_mapping`    | No       | Map of axis-value → token-segment when the spec value differs from the token name (see §8.5). |
| `description`      | No       | Human-readable note on what drives this axis and how it behaves. |

> **Note on `runtime:`** — existing v0.x specs carry a `runtime: true` field
> on every axis. In v1.0.0 all state axes are runtime by definition; the field
> is redundant and MUST be omitted. Validators SHOULD warn on its presence.

> **Static-pattern Components omit `states:` entirely.** When a Component
> inherits a single-value interaction pattern (`static` — Profile §10),
> the Component SHOULD NOT declare a one-value axis
> (`interaction: { values: [enabled] }`). Validators reject state axes
> with fewer than 2 values (`values` array MUST contain ≥2 entries);
> the idiomatic expression is to omit the `states:` block altogether
> and rely on the Profile's `static` pattern as an implicit default.
> Prior art: shadcn Badge, Primer Label, USWDS Alert — all non-
> interactive components — omit `states:` and validate cleanly.

### 8.2 `token_expandable`

When `token_expandable: true`, the axis value is substituted into token paths
at the segment position declared in the Profile's `token_grammar`. The DTCG
resolver selects the matching token set for each combination.

When `token_expandable: false`, the axis drives CSS class assignment or other
layout logic, but the token resolver does not branch on it. The component uses
the same token values regardless of this axis's value.

```yaml
states:
  interaction:
    values: [enabled, hover, pressed, disabled]
    token_expandable: true          # tokens branch per value

  pending:
    values: [false, true]
    default: "false"
    token_expandable: false         # no dedicated token state — reuses enabled tokens
    description: >
      Async operation in progress. Shows a spinner, suppresses pointer
      interaction. Driven by a CSS class, not a CSS pseudo-class.
```

### 8.3 Orthogonal axes

State axes are orthogonal. The set of valid combinations is the Cartesian
product of all axes. A component with:

```yaml
states:
  interaction:
    values: [enabled, hover, focused, disabled]
    token_expandable: true
  validation:
    values: [none, error, success]
    default: none
    token_expandable: true
```

…declares twelve token combinations (`4 × 3`). The Profile's `token_grammar`
and the `orthogonal_to` declaration in `interaction_patterns` govern which
combinations are valid; the validator checks that tokens exist for each
reachable combination.

Some combinations are unreachable at runtime (e.g. `disabled × focused`). The
Profile's `interaction_patterns` documents these suppressions; the CDF Component
does not repeat them.

### 8.4 Canonical axes and Profile cross-reference

The Profile's `interaction_patterns` declares the canonical axes for each
pattern (`pressable`, `focusable`, `selectable`, `expandable`). A component
referencing one of these patterns SHOULD use the canonical axis name and values
unless there is a documented reason to deviate.

Cross-ref: Profile §10 (Interaction Patterns).

### 8.5 State-level `token_mapping`

When the component's state value differs from the token-path segment the
Profile expects, declare a `token_mapping` map on the axis:

```yaml
states:
  interaction:
    values: [enabled, hover, focused, disabled]
    token_expandable: true
    token_mapping:
      focused: active           # token path uses "active", spec uses "focused"
    description: >
      Focusable pattern. The "focused" state resolves to the "active" token
      segment — a Figma naming convention carried into the token files.
```

The Profile's `interaction_patterns.token_mapping` (§10) is the canonical
source; this field overrides it for the specific component when needed.

#### Precedence across levels

The name `token_mapping` appears in three places across CDF. When more than
one applies to the same name, resolve in this order (most specific wins):

1. **State-level** (Component §8.5) — overrides everything for state-name
   substitutions on the owning axis.
2. **Property-level** (Component §7.6) — overrides Profile mappings for
   property-value substitutions.
3. **Pattern-level** (Profile §10.4) — the canonical DS-wide mapping. Used
   whenever no Component-level entry covers the name.

Component-level entries never need to re-declare Profile identity mappings;
a consumer MUST fall through to the Profile when a Component-level map is
silent on a name. Conflicts (same name mapped to different segments at two
levels) are not an error — the Component is deliberately overriding — but
`cdf_suggest` SHOULD surface the override so reviewers can confirm intent.

### 8.6 Example — Button (pressable)

```yaml
states:
  interaction:
    values: [enabled, hover, pressed, disabled]
    token_expandable: true
    description: >
      Standard pressable interaction axis. Maps directly to token segments.

  pending:
    values: [false, true]
    default: "false"
    token_expandable: false
    description: >
      Async operation in progress. Spinner replaces content, pointer events
      suppressed. Reuses enabled-state tokens.

  focusable:
    values: [false, true]
    default: "false"
    token_expandable: false
    description: >
      Focus ring visibility. Driven by :focus-visible. Uses Components/Focus
      tokens — not part of the controls color grammar.
```

### 8.7 Example — InputCore (focusable + validation)

```yaml
states:
  interaction:
    values: [enabled, hover, focused, disabled]
    token_expandable: true
    token_mapping:
      focused: active
    description: >
      Focusable pattern. "focused" maps to "active" in the token path.

  validation:
    values: [none, error, success]
    default: none
    token_expandable: true
    description: >
      Form validation state. Drives stroke color. "none" = neutral stroke.
      Error and success override the interaction stroke.

  readOnly:
    values: [false, true]
    default: "false"
    token_expandable: false
    description: >
      Read-only mode. Removes stroke, sets background to inactive, suppresses
      all interaction state changes.

  hasValue:
    values: [false, true]
    default: "false"
    token_expandable: false
    description: >
      Whether the input contains a value. Derived from input events — not
      set by the consumer. Controls placeholder vs. value text rendering.
```

### 8.8 Compound states

Most state axes are independent: each axis declares its token contribution
once, and the generator combines them per-cell through the §13.2 modifier
syntax. Some combinations, however, carry a visual identity that cannot be
produced by cross-multiplying per-axis defaults. For these, declare a
**compound state**.

Typical cases:

- **Surface swap.** Checkbox `selected: true` replaces a stroke-only
  indicator box with a filled background and an icon. The `interaction` axis
  still applies — but on a different surface than in the unselected case.
- **Semantic override.** An `error` state that overrides hierarchy color on
  one part while preserving selection tokens on another.
- **Intersections with no composable cross-product.** Any combination whose
  per-axis token paths would not resolve to the designed value.

Everything else — a single property that varies per axis value — belongs in
the §13.2 modifier syntax, which is more local and easier to read.

> **Single-axis equivalence.** When a `compound_states:` entry's `when:`
> clause names **only one axis**, the entry is semantically equivalent to
> a §13.2 modifier override. Both forms produce identical generator
> output; the §13.2 form is lighter and preferred for single-axis cases.
> Use `compound_states:` only when the cell identity actually depends on
> two or more axes (surface swap, semantic override, intersections with
> no composable cross-product). Observed in practice: Material 3 FAB's
> `elevation × interaction` pattern uses `compound_states:` for
> readability symmetry with Button's (genuinely two-axis) elevation
> × variant × interaction case; the single-axis §13.2 form would be
> equally correct and slightly shorter.

#### Schema

Compound states live in a top-level `compound_states:` list, sibling to
`tokens:`:

```yaml
compound_states:
  - when: { axis_a: value_a, axis_b: value_b, ... }
    tokens:
      {anatomy-part}:
        {css-property}: {token-path | literal}
```

| Field    | Required | Description |
| -------- | -------- | ----------- |
| `when`   | Yes      | Map of axis → value. A compound matches a render cell when every `when` entry equals that cell's resolved axis value. Omitted axes are wildcards (subset semantics). |
| `tokens` | Yes      | Token-path overrides for the matched cells. Same shape as the top-level `tokens:` block. Anatomy parts and CSS keys MUST satisfy the §13 addressing rules. |

#### Merge semantics

For each render cell, resolution proceeds in declared order:

1. The top-level `tokens:` block produces a base token assignment, with
   per-axis modifier syntax (§13.2) applied.
2. Every `compound_states[]` entry whose `when` matches the cell overrides
   the matching token keys. Multiple matching compounds merge in
   declaration order; later entries win for shared keys.

#### Closure rule

Every render cell (every Cartesian-product combination of declared axis
values) MUST resolve every referenced token path. Cells where a path
remains unresolved after defaults and compounds are a validator error
(`structural.compound_states.coverage`). This guarantees that a generator
can produce deterministic output for every reachable runtime state — and
that two independent generators reading the same spec produce matching
results.

#### Example — Checkbox (real Formtrieb tokens, orthogonal validation)

```yaml
states:
  interaction:
    values: [enabled, hover, pressed, disabled]
    token_expandable: true
    description: >
      Pointer-driven interaction states. Error is NOT folded in —
      validation is its own axis per the Profile's reserved vocabulary
      (Profile §10.8). The token slot `{state}` in
      `color.controls.*.{state}` is shared with `validation`; the
      grammar's resolution precedence (Profile §6.12) picks the winner
      per render cell.

  validation:
    values: [none, error]
    default: none
    token_expandable: true
    description: >
      Form-validation state. Orthogonal to interaction — an errored
      checkbox can also be hovered, pressed, or disabled.

  selected:
    values: [false, true]
    default: "false"
    token_expandable: true
    description: >
      Token-resolution axis mirrored from the `checked` property
      (see §7.11 mirrors_state). Consumer addresses it via `checked`;
      tokens address it via `--selected.true` modifier syntax.

  indeterminate:
    values: [false, true]
    default: "false"
    token_expandable: true
    description: >
      Token-resolution axis mirrored from the `indeterminate` property.
      When true, overrides the selected glyph (the Checkbox renders a
      minus instead of a checkmark) and announces aria-checked="mixed".

# Consumer-facing property side of both mirrors.
properties:
  checked:
    type: boolean
    default: false
    bindable: two-way
    mirrors_state: selected     # bridges consumer API ↔ token-resolution axis
    description: >
      Consumer-set selection state. Two-way bindable. Auto-promoted at the
      component boundary because of the mirror — no extra `promoted:`
      declaration needed (Profile §10.6).

  indeterminate:
    type: boolean
    default: false
    mirrors_state: indeterminate
    description: >
      Tri-state visual indicator. Consumer-set; not bindable two-way
      (the component never flips it autonomously). Used by `iconName`
      derivation below.

derived:
  # Icon glyph is logic, not a token — declared in derived (§10) and
  # routed to the nested Icon's `name` prop via anatomy bindings
  # (§11.4.5). Keeps the tokens block honest about its purpose (§13.6).
  # Multi-source rule list (§10.2): indeterminate trumps selected for
  # the glyph — design semantic, also matches aria-checked="mixed".
  iconName:
    from: [selected, indeterminate]
    mapping:
      - when: { indeterminate: true }
        value: minus
      - when: { selected: true, indeterminate: false }
        value: check
      - default: none
    description: Indicator glyph driven by selected × indeterminate.

anatomy:
  indicator-icon:
    component: Icon
    conditional: "selected || indeterminate"
    locked:
      size: base
      color: controlled
    bindings:
      name: iconName        # nested-component prop ← derived value

tokens:
  indicator-box:
    # Base layer — the bordered "unselected" box. The {state} placeholder
    # is a grammar-slot reference (§13.1 rule 3); Profile §6.12 picks
    # the winning Component axis (validation > interaction).
    border-color: color.controls.primary.stroke.{state}
    border-width: borderWidth.thin
    border-radius: radius.xs
    background: none

  indicator-icon:
    color: color.controls.primary.icon-on-color.{state}
    # NOTE: `name` is NOT listed here — it is a nested-component prop
    # routed via anatomy bindings above. The tokens block holds only
    # token-path values per §13.6.

compound_states:
  # Selected swaps surface: stroke disappears, background paints. Icon
  # name is owned by the derived/bindings pair — no need to redeclare.
  - when: { selected: true }
    tokens:
      indicator-box:
        border-color: none
        background: color.controls.primary.background.{state}

  # selected: true × interaction: hover — Formtrieb's hover token for the
  # filled surface is a distinct value, not the default hover stroke.
  # Named explicitly because the coverage rule needs this intended value.
  - when: { selected: true, interaction: hover, validation: none }
    tokens:
      indicator-box:
        background: color.controls.primary.background.hover
      indicator-icon:
        color: color.controls.primary.icon-on-color.hover

  # selected: true × validation: error — errored checked checkbox.
  - when: { selected: true, validation: error }
    tokens:
      indicator-box:
        background: color.controls.primary.background.error
      indicator-icon:
        color: color.controls.primary.icon-on-color.error
```

Read the resolution as a layered cake. The base `tokens:` block uses the
`{state}` placeholder, which the Profile's §6.12 precedence resolves
per-cell — validation wins when active, interaction fills in otherwise.
The first compound rewrites the box for every `selected: true` cell;
the icon's glyph (`check` vs. `none`) is decided by the `iconName`
derived value plus the binding to the nested Icon — separate concern,
no token confusion. The remaining compounds name specific intersections
whose tokens Formtrieb designed explicitly.

The `validation: none` qualifier on the hover compound is deliberate:
without it, the compound would also fire for `selected: true × hover ×
error` — overwriting the error colour. Compound `when` blocks should be
precise on every axis that matters, not permissive.

#### When NOT to use compound states

- A single property varying per axis value → use §13.2 modifier syntax.
- A whole axis having its own token path per value → declare it in `tokens:`
  with the `{axis}` placeholder.
- A purely structural axis that doesn't affect tokens →
  `token_expandable: false`, no compound needed.

Compound states are for cells where the designed value depends on the
intersection, not on either axis alone.

---

## 9. Events

Events describe the component's output contract — signals the component emits
to its consumer. Events are listed in an `events:` map keyed by camelCase name.

### 9.1 Event fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `payload`     | Yes      | Type of the emitted value. Use `void` for signal-only events. Primitive types (`string`, `boolean`, `number`) or a named type from §7.1 vocabulary. |
| `description` | Yes      | What triggers the event. Include: when it fires, when it does NOT fire (e.g. disabled), and what the payload contains. |
| `native`      | No       | `true` = this is a native DOM event passed through without re-emission. |
| `native_name` | No       | The underlying DOM event name when it differs from the CDF Component's event name. Required when `native: true` and names differ. |

### 9.2 Custom vs. native events

**Custom events** are component-level signals with explicit semantics:

```yaml
events:
  clicked:
    payload: void
    description: >
      Emitted when the button is activated — via click, Enter, or Space.
      Not emitted when disabled or pending.
```

**Native passthrough events** document that a native DOM event is forwarded
without re-emission. Listing them communicates the component's passthrough
surface to consumers and generators.

```yaml
events:
  focus:
    payload: void
    native: true
    native_name: focus
    description: Native focus event forwarded from the inner input element.

  blur:
    payload: void
    native: true
    native_name: blur
    description: Native blur event forwarded from the inner input element.
```

> **Distinction:** a custom event named `focus` without `native: true` means
> the component synthesises a focus signal from its own logic. `native: true`
> means the DOM event is forwarded as-is. Generators handle them differently.

### 9.3 Paired events for `bindable: two-way`

A property declared `bindable: two-way` (§7.8) SHOULD have a paired event that
carries the new value. By convention the event name is `{propertyName}Change`:

```yaml
properties:
  value:
    type: string
    bindable: two-way

events:
  valueChange:
    payload: string
    description: >
      Emitted when the input value changes. Payload is the current string.
      Not emitted when disabled or readOnly.
      Paired with property "value" (bindable: two-way).
```

Generators use this pairing to emit the correct two-way binding idiom:
Angular `model()`, SwiftUI `@Binding`, React controlled prop + onChange.

### 9.4 Example — Button

```yaml
events:
  clicked:
    payload: void
    description: >
      Emitted when the button is activated (click, Enter, or Space).
      Not emitted when disabled or pending.
```

### 9.5 Example — InputCore

```yaml
events:
  valueChange:
    payload: string
    description: >
      Emitted when the input value changes. Payload is the current value.
      Not emitted when disabled or readOnly.
      Paired with property "value" (bindable: two-way).

  cleared:
    payload: void
    description: >
      Emitted when the clear button is activated. The consumer should reset
      the value. After clearing, focus returns to the input element.
      Only emitted when clearable=true and hasValue=true.

  focus:
    payload: void
    native: true
    native_name: focus
    description: Native focus event forwarded from the inner input element.

  blur:
    payload: void
    native: true
    native_name: blur
    description: Native blur event forwarded from the inner input element.
```

---

## 10. Derived values

Derived values are read-only mappings from a source (a property, a state
axis, or a combination of them) to a value consumed by tokens or by an
anatomy part's nested-component prop. They exist to keep token maps clean
when the same property drives multiple unrelated scales — and to give
declarative shape to "the icon shows `check` when checked, `minus` when
indeterminate" without smuggling logic into the tokens block.

The `derived:` block is a map keyed by derived-name. Each entry declares:

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `from`        | Yes      | Source — a property/state name, OR a list of property/state names for multi-source derivations. |
| `mapping`     | Yes      | Single-source: a map of source value → derived value covering every value of the source. Multi-source: an ordered list of rule entries (see §10.2). |
| `description` | Yes      | Why this derivation exists and what consumes it. |

Derived values are referenced from two places:
- The `tokens:` block, typically inside a nested scale entry (§13.3).
- An anatomy part's `bindings:` map, which routes a derived value to a
  nested component's property (§11.4.5).

> **Scope.** Derived values describe *declarative value mappings*, not
> arbitrary expressions. There is no arithmetic, no string concatenation;
> rule entries match by exact axis-value equality. A derivation that cannot
> be expressed as a value table or a list of equality predicates is out of
> scope for v1.0.0.

### 10.1 Single-source derivations

The simplest form: source is one property or state axis, mapping is a map
from each source value to a derived value.

```yaml
derived:
  iconSize:
    from: size
    mapping:
      base: base
      small: small
    description: >
      Derives icon size for leading-icon from the component size property.

  contentTypography:
    from: size
    mapping:
      base: label.large
      small: label.base
    description: >
      Derives typography scale from size.
```

The `mapping:` MUST cover every value of the source axis (validator
`CDF-SEM-009`).

### 10.2 Multi-source derivations

When the derived value depends on two or more sources, declare them as a
list under `from:` and replace the value-map with an ordered list of
rule entries:

```yaml
derived:
  iconName:
    from: [checked, indeterminate]
    mapping:
      - when: { indeterminate: true }
        value: minus
      - when: { checked: true, indeterminate: false }
        value: check
      - default: none
    description: >
      Indicator glyph for the Checkbox indicator-icon. Indeterminate wins
      over checked; both off renders no icon.
```

Rules:

- Each entry has either a `when:` predicate map or a `default:` marker.
- `when:` is a **conjunction** — every key/value pair in the map MUST
  match the corresponding source axis's current value for the entry to
  apply.
- Entries are evaluated **in declaration order**; the first matching
  entry wins. `default:` MUST be the last entry; it always matches.
- Coverage: the rule list MUST be exhaustive over the Cartesian product
  of source axis values. The validator (`CDF-SEM-009`) computes the
  product, applies each rule in order, and fails if any cell remains
  unresolved.
- Multi-source derivations may not nest further derivations as inputs.

### 10.3 When NOT to use derived values

- If the mapping is **identity** (`base → base`, `small → small`), don't
  declare it — the token map can reference the property directly.
- If the derivation is specific to one token assignment, inline the value
  in the `tokens:` block instead (§13.3 value maps).
- If the value depends on **runtime computation beyond axis equality**
  (arithmetic, string interpolation, function calls), it belongs in the
  generator's framework code, not in the spec.

---

## 11. Anatomy

Anatomy describes the component's structural parts — the named pieces that
tokens, states, and slots address. Every token path in §13 MUST resolve to
a named anatomy part; every ARIA override in §15 MUST target one.

The `anatomy:` block is a map keyed by part name (kebab-case). Parts are
declared top-level — nesting is permitted via `children:` but in practice
most anatomy trees are flat, because composition is handled by nested
components (§11.3) rather than deep part hierarchies.

### 11.1 Part fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `element`     | One of `element` or `component` is required | Semantic HTML element (`button`, `input`, `label`, `div`) or an abstract box (`box`, `text`) when the element is framework-decided. |
| `component`   | One of `element` or `component` is required | Name of a nested CDF Component. Mutually exclusive with `element`. See §11.3. |
| `description` | Yes      | What this part is and how it behaves. Visible to generators and LLMs. |
| `conditional` | No       | Visibility expression. The part is rendered only when the expression evaluates true at runtime. Expression grammar is reserved (see §7.10) — v1.0.0-draft accepts these as documentation. When `conditional` is false the part is fully absent from the tree; `locked:` still governs the part's nested-component props if/when it is rendered. |
| `locked`      | No       | For `component:` parts only. Pins specific properties of the nested component to a static value or a property-driven map (see §11.4). |
| `bindings`    | No       | For `component:` parts only. Routes a `derived:` value (§10) to a nested component's property. Use when the nested prop varies with the parent's properties or states (e.g. icon `name` derived from checked/indeterminate). See §11.4.5. |
| `visually_hidden` | No   | `true` = the part is present in the accessibility tree (focusable, form-submitting, screen-reader-readable) but not visually rendered. Typical use: a native `<input>` that carries focus + form value while a sibling part paints the visual indicator. See §11.9. |
| `role`        | No       | ARIA role override. Defaults come from Profile §11 (Accessibility Defaults). |
| `aria`        | No       | Map of ARIA attribute → value or expression. Overrides Profile defaults. |
| `children`    | No       | Nested anatomy parts. Rare — most trees are flat. |

### 11.2 `element` vs. abstract boxes

`element:` accepts either a concrete HTML tag or an abstract box:

- **Concrete HTML tags** (`button`, `input`, `label`, `a`, `fieldset`, `nav`,
  …) — the generator MUST produce that tag (or its framework equivalent).
  These carry semantic meaning and often drive accessibility defaults.
- **`box`** — a generic layout container. The generator chooses the concrete
  tag (`div`, `span`, `View`, etc.) based on Target conventions.
- **`text`** — a text-bearing element with no inherent semantics. The
  generator chooses a concrete tag (`span`, `p`, `Text`, …).

Prefer concrete tags when the semantics matter (`button`, `input`, `label`).
Use abstract boxes when the element is a layout detail the framework decides.

### 11.3 Nested components

When a part is another CDF Component, use `component:` instead of `element:`:

```yaml
anatomy:
  icon-start:
    component: Icon
    description: >
      Optional icon before the label. Visible when iconStart is set.
    conditional: iconStart || pending
    locked:
      size:
        base: base
        small: small
      color: controlled
```

The `component:` value MUST name a component that exists in the same profile.
Generators resolve the import per framework.

> **Nested components vs. slots.** A `component:` part is a *fixed* child —
> the component always uses that specific child type. A **slot** (§12) is a
> *content projection point* — the consumer provides the child. Choose based
> on who controls the child's identity.

### 11.4 `locked` — pinning nested component properties

`locked:` declares which properties of a nested component the parent pins.
Pinned properties are not exposed in the parent's API.

Two forms:

**Value lock** — the property is fixed to a concrete value:

```yaml
locked:
  color: controlled       # special sentinel: color is driven by the parent's tokens
```

**Derived lock** — the property tracks the parent's property via a mapping:

```yaml
locked:
  size:
    base: base            # when parent size=base, child size=base
    small: small          # when parent size=small, child size=small
```

The sentinel value `controlled` indicates the parent drives this property via
its `tokens:` block rather than by passing a property value. Generators
translate this per framework (e.g. Angular CSS custom properties, SwiftUI
environment values).

### 11.4.5 `bindings` — wiring derived values into nested-component props

`locked:` handles **static** values and **single-property** derived maps.
For nested-component props that depend on multi-source derivations or on
state axes, use `bindings:` to route a `derived:` value (§10) into a
named prop of the nested component:

```yaml
derived:
  iconName:
    from: [checked, indeterminate]
    mapping:
      - when: { indeterminate: true }
        value: minus
      - when: { checked: true, indeterminate: false }
        value: check
      - default: none
    description: Indicator glyph for the Checkbox.

anatomy:
  indicator-icon:
    component: Icon
    conditional: "checked || indeterminate"
    locked:
      size: base               # static lock — Icon's size is always "base"
      color: controlled        # parent drives via tokens block
    bindings:
      name: iconName           # Icon's `name` prop ← derived value
```

Schema:

| Field    | Required | Description |
| -------- | -------- | ----------- |
| `{prop}` | Yes      | Key MUST name a property of the nested component. Value MUST name a `derived:` entry on the parent. |

Resolution rules:

1. The key MUST be a valid property of the referenced nested component.
   Validators load the nested Component spec and reject unknown property
   names (`CDF-SEM-011`).
2. The value MUST name an entry in the parent's `derived:` block.
   Forward references resolve at validation time; missing names error
   (`CDF-SEM-012`).
3. A property MAY appear in `locked:` OR `bindings:`, never both —
   binding a derived value already determines the prop's runtime value.
4. `bindings:` is for `component:` parts only. On `element:` parts the
   block is meaningless and rejected.

> **Why bindings, not tokens.** A nested component's prop (e.g. Icon's
> `name`) is part of *that* component's API contract, not a styling
> token. Putting `name: check` in the parent's `tokens:` block conflates
> two concepts (token-path and prop-literal) and trips the §13.6
> allowed-value check. `bindings:` makes the wiring explicit and keeps
> the `tokens:` block honest about its purpose.

### 11.5 `conditional` visibility

A part with `conditional:` is rendered only when the expression evaluates
true. Expressions reference properties and states:

```yaml
anatomy:
  clear-button:
    component: IconButton
    description: Clear button — visible only when there is content to clear.
    conditional: clearable && hasValue

  error-icon:
    component: Icon
    description: Error indicator — visible only in the error validation state.
    conditional: validation === 'error'
```

The grammar is reserved for v1.0.0 final (see §7.10). Until then, validators
MUST treat conditionals as documentation — they do not reject specs on
conditional-grammar issues, but generators MAY implement a supported subset.

**Interaction with other part fields:**

- **`conditional` + `locked`.** When `conditional` evaluates false, the part
  is absent from the runtime tree entirely — `locked:` has no effect because
  nothing is rendered. When `conditional` evaluates true, `locked:` applies
  to the rendered instance exactly as §11.4 describes. Locked values are
  static — they do not vary with the conditional's truth.
- **`conditional` + `visually_hidden`.** These are independent. A part may
  be both hidden AND conditional — it's present in the a11y tree when the
  condition is true, absent when false.
- **`conditional` + tokens.** When a part is conditionally absent, its
  `tokens.{part}:` entries are not emitted. Generators MUST NOT emit CSS
  for parts that are compile-time provably absent; runtime-conditional
  parts emit their CSS unconditionally and rely on DOM absence.

### 11.6 Anatomy addressing rules

1. **Token paths (§13) MUST name a part.** `tokens.container.background: …`
   requires `anatomy.container` to exist.
2. **Part names are kebab-case.** `icon-start`, `clear-button`,
   `trailing-action`.
3. **One host per component.** The first declared part (conventionally
   `container`, `wrapper`, or the component's root) is the host element.
   The Target spec may constrain which element types are valid hosts.
4. **Parts are flat by default.** Use `children:` only when the parent-child
   structure is semantically load-bearing (e.g. `fieldset → legend + inputs`).

### 11.7 Example — Button

```yaml
anatomy:
  container:
    element: button
    description: >
      The host element. Horizontal auto-layout, center-aligned. Handles
      background, radius, height, and padding. :host IS the interactive
      element — no wrapper div.

  icon-start:
    component: Icon
    description: >
      Optional icon before the label. Visible when iconStart is set.
      In pending state, becomes the spinner icon (replaces content).
    conditional: iconStart || pending
    locked:
      size:
        base: base
        small: small
      color: controlled

  label:
    element: text
    description: >
      Button label text. Present in enabled/hover/pressed/disabled states.
      Hidden during pending (replaced by spinner icon).

  icon-end:
    component: Icon
    description: >
      Optional icon after the label. Hidden during pending.
    conditional: iconEnd && !pending
    locked:
      size:
        base: base
        small: small
      color: controlled
```

### 11.8 Example — InputGroup (slot-based composition)

```yaml
anatomy:
  wrapper:
    element: box
    description: >
      Outer vertical layout. Stacks label → input-slot → message.

  label:
    element: label
    description: >
      Form label. Associated with the projected child via for/id.

  input-slot:
    element: box
    description: >
      Content projection point for the input child (InputCore, ComboBox).
      The consumer provides the child; InputGroup does not own it.

  message:
    element: text
    description: >
      Contextual text below the input. Content and color switch based on
      validation. Hidden when no text is provided for the active state.
    conditional: helper || error || success
```

### 11.9 `visually_hidden` — native elements behind visual surrogates

Some components separate **semantics** from **visuals**: a native
`<input type="checkbox">` owns focus, form value, and keyboard handling,
while a sibling part paints the visible indicator. The native element is
needed by the accessibility tree but MUST NOT appear on screen.

Declare the semantic part with `visually_hidden: true`:

```yaml
anatomy:
  native-input:
    element: input
    visually_hidden: true
    description: >
      The real checkbox input. Hidden via CSS clip-path/sr-only technique
      but remains in the a11y tree — screen readers announce it, Tab focuses
      it, forms submit it.

  indicator-box:
    element: box
    description: >
      The painted indicator that visually represents the checkbox state.
      Pointer events are captured by the parent <label>, not this part.
```

**Rules for `visually_hidden: true` parts:**

1. **MUST remain in the a11y tree.** Generators MUST use the standard
   visually-hidden CSS pattern (zero-sized clip, absolute positioning,
   `overflow: hidden`) — NOT `display: none` or `visibility: hidden`.
2. **MUST remain in the form-submission path when applicable.** For
   native form elements (`input`, `select`, `textarea`), the hidden
   element MUST continue to submit its value when the enclosing form
   is submitted. The standard sr-only CSS pattern preserves this;
   `display: none` and `hidden` attribute do not. Generators MUST
   choose a hiding technique that preserves both a11y-tree membership
   AND form-submission membership.
3. **Tokens MAY be omitted.** A hidden part typically has no visual
   styling. If `tokens.{part}:` is absent, validators MUST NOT warn.
4. **The part MUST be addressable by other parts' ARIA.** Sibling parts
   often reference the hidden part via `for=` / `aria-labelledby=` /
   `aria-describedby=`. The hidden part SHOULD have a stable part name
   (e.g. `native-input`) to anchor these references.
5. **`conditional` still applies.** A hidden part with `conditional: X`
   is absent when X is false, same as any other part.
6. **Non-Web Targets interpret this differently.** SwiftUI has no
   "visually hidden" concept — the Target's job is to translate the
   semantic intent into its platform equivalent (e.g. a real SwiftUI
   control with `.hidden()` not applied, styled flat).

---

## 12. Slots

Slots are content projection points — parts of the component that the consumer
fills with arbitrary content. Where a nested component (§11.3) is a *fixed*
child the component always uses, a slot is *parametric* over its content.

The `slots:` block is a map keyed by slot name. A component without slots
omits the block entirely (or declares it empty: `slots: {}`).

### 12.1 Slot fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `description` | Yes      | What goes in this slot and how it behaves. |
| `required`    | No       | `true` = the consumer MUST project content. Default: `false`. |
| `fallback`    | No       | Default content rendered when the slot is empty. Free-form markup/text — the generator decides how to realise it per framework. |
| `accepts`     | No       | Allow-list of CDF Component names. When present, consumers SHOULD project only these. Validator warns otherwise. |

Slot names follow these conventions:

- `default` — the primary unnamed content projection point. Most components
  with a slot have exactly one, named `default`.
- Named slots (`header`, `footer`, `leading`, `trailing`, …) for components
  that accept content in multiple positions.

### 12.2 Slots vs. nested components — choosing between them

Use a **nested component** (§11.3) when:
- The child's identity is fixed. A Button always has a label, never an
  arbitrary React fragment.
- The parent pins properties on the child (`locked:`).
- The parent's tokens address the child directly.

Use a **slot** (§12) when:
- The consumer chooses the child type. InputGroup accepts InputCore today,
  ComboBox tomorrow.
- The content is open-ended text or markup (a card body, a menu list).
- The component doesn't style its children — it only lays them out.

### 12.3 Example — InputGroup

```yaml
slots:
  default:
    description: >
      The input child component. Exactly one input primitive should be
      projected. InputGroup passes validation state to the child — in
      Angular, the child reads the parent's validation signal or accepts
      a validation input.
    required: true
    accepts: [InputCore, ComboBox]
```

### 12.4 Example — PopoverMenu

```yaml
slots:
  default:
    description: >
      The list content — typically PopoverMenuItem items, optionally grouped
      with group headlines. The parent provides items via content projection
      or dynamic rendering.
    required: true
```

### 12.5 Example — Card (hypothetical, with named slots and a fallback)

```yaml
slots:
  header:
    description: Optional card header. Typically a heading + actions.
    required: false

  default:
    description: Card body content.
    required: true

  footer:
    description: Optional footer — typically buttons or metadata.
    required: false
    fallback: <span class="ft-card__footer-spacer" />
```

---

## 13. Tokens

The `tokens:` block maps every visual property of every anatomy part to a
token path. It is the component's styling contract — the generator reads it
and produces framework-appropriate CSS, SwiftUI modifiers, or Figma variable
bindings.

```yaml
tokens:
  {anatomy-part}:
    {css-property}: {token-path | value-map | mixin reference}
    {css-property}--{modifier}: {override token-path}
```

The outer key MUST match a part declared in §11 Anatomy. The inner keys are
CSS-property-like names; they are interpreted by the generator per Target
conventions — they are not required to be literal CSS property names (see
§13.6).

**Headless components.** A Component that declares no visual contract —
typically a Headless primitive (Radix Separator, Radix Toggle) where the
consumer owns all styling — MAY declare `tokens: {}`. The block remains
REQUIRED to make authoring intent explicit: an **absent** `tokens:` block
reads as "forgot to write tokens", whereas an **empty** block reads as
"owns no paint". Anatomy parts in such a Component need no token bindings,
and the addressing rules in §13.7 are vacuously satisfied. The §13 sibling
rules (placeholders, compound-state closure, etc.) apply only to entries
that exist. See `radixTests/specs/separator.component.yaml` for a lived
example.

**Build-time resolution.** Every token path referenced in this block MUST
resolve to a single DTCG value at token-build time. CDF does not carry
runtime transformations — arithmetic, alpha modifiers, `color-mix()`, or
other dynamic operations. Such operations, if the DS needs them, are the
token toolchain's responsibility and their output is a static value stored
in the token tree. A Component specification is thus a complete description
of which tokens render where, independent of any runtime context other than
Component state and Profile theme modifiers.

### 13.1 Token paths and placeholders

Token paths follow the Profile's `token_grammar`. Placeholders in braces —
`{hierarchy}`, `{interaction}`, `{validation}`, … — are resolved at render
time by substituting the current property or state value. The Profile declares
which placeholders are valid per grammar.

```yaml
tokens:
  container:
    background: color.controls.{hierarchy}.background.{interaction}
    #                          ^ property           ^ state axis
```

Resolution rules:

1. **Property placeholders** bind to a §7 property. `{hierarchy}` substitutes
   the runtime value of the `hierarchy` property.
2. **State placeholders** bind to a §8 state axis. `{interaction}` substitutes
   the current value of the `interaction` axis.
3. **Grammar-slot placeholders** bind to a token-grammar axis (Profile §6),
   not to a Component property or state directly. They are used when a
   single grammar slot is **shared** by multiple Component axes — for
   example Formtrieb's `color.controls.{hierarchy}.{element}.{state}` whose
   `{state}` slot accepts values from `interaction`, `validation`, and
   `selectable` Component axes alike. Resolution follows the grammar's
   `resolution.precedence:` declaration (Profile §6.12): the first
   non-default Component axis named in the precedence list provides the
   slot's value. A grammar-slot placeholder is recognised by name match
   against the Profile's `token_grammar.*.axes` keys, not against the
   Component's local properties or states.
4. **Unbound placeholders are errors.** A path with `{foo}` requires either
   a property, a state axis, or a grammar slot named `foo`; otherwise the
   validator rejects the spec.
5. **State `token_mapping` applies.** If the spec declares `focused → active`
   (§8.5), the resolver substitutes `active` for `focused`.
6. **Property `token_mapping` applies.** Same rule at the property level
   (§7.6) — e.g. `tertiaryWithoutPadding → tertiary`.

> **Why grammar slots are first-class.** Many DS Profiles flatten
> conceptually-orthogonal Component axes into one token-grammar slot for
> data-model compactness. A focused errored input picks one stroke colour,
> not two; the slot is single-valued at render time even though two
> axes contributed. Grammar-slot placeholders let a Component express
> *"resolve this against the grammar's collapse rule"* without having to
> name every contributing axis explicitly.

Cross-ref: Profile §6 (Token Grammar), §6.12 (resolution precedence),
§8.4 (modifier-agnostic paths).

### 13.2 Modifier overrides

A modifier is an override that applies only for a specific property or state
value. Syntax: `{css-property}--{modifier-value}`.

```yaml
tokens:
  container:
    background: color.controls.{hierarchy}.background.{interaction}
    background--tertiary: none                      # property override
    background--tertiaryWithoutPadding: none        # property override
    border-radius: radius.full
    border-radius--tertiaryWithoutPadding: none     # property override

  label:
    color: color.controls.{hierarchy}.text-on-color.{interaction}
    color--tertiary: color.controls.tertiary.text.{interaction}    # different path per hierarchy
```

The modifier segment names a property value OR a state value. When multiple
modifiers apply to a single CSS property, the generator resolves them in
source order (last write wins) — stable because YAML maps preserve insertion
order in practice and the spec pipeline normalises key order.

**Modifier source disambiguation:** a modifier value MUST be unique across
properties and states to avoid ambiguity. If two axes share a value name
(unusual), qualify the modifier with the axis: `background--validation.error`.

**Boolean state axes** use the axis-qualified syntax because `true`/`false`
are not globally unique values — every boolean state axis has the same two
values. The qualifier carries the axis name so the generator can resolve
which axis the override binds to:

```yaml
tokens:
  indicator-box:
    # Base rule — the bordered "unselected" box.
    border-color: color.controls.primary.stroke.{interaction}
    background: none
    # Boolean-state overrides — required qualifier.
    border-color--selected.true: none                             # filled box: no border
    background--selected.true: color.controls.primary.background.{interaction}
    background--indeterminate.true: color.controls.primary.background.{interaction}
```

The axis-qualified form `{css-property}--{axis-name}.{value}` is REQUIRED for
boolean state axes. The short form `{css-property}--{value}` is only legal
for axes whose values are globally unique (enum properties, named states).
Validators MUST reject unqualified boolean-state overrides.

**When the combination spans two or more axes** — e.g. a Checkbox token that
depends on both `selected: true` and `interaction: hover` — use the
§8.8 `compound_states:` block instead of stacking modifiers in this syntax.
The modifier form stays single-axis by design.

> **Hybrid form with §13.3 value-maps — legal and idiomatic for flat-
> token DSes.** When a CSS property varies per state AND its per-state
> value depends on a property axis (variant, hierarchy, intent), the
> `{css-property}--{state-value}` key MAY take a §13.3 value-map as its
> value — one map per state, keyed by the property axis:
>
> ```yaml
> tokens:
>   container:
>     background: { default: color.primary, secondary: color.secondary, … }
>     background--hover:   { default: color.primary-dark, secondary: color.secondary-dark, … }
>     background--active:  { default: color.primary-darker, secondary: color.secondary-darker, … }
>     background--disabled: { default: color.disabled, secondary: color.disabled, … }
> ```
>
> This is the natural expression for DSes whose state variation is
> encoded in **token names** (USWDS: `primary`, `primary-dark`,
> `primary-darker`) rather than via a grammar axis. Validated in
> production against USWDS Button's 8 variants × 4 states × 3 CSS
> properties = 96 cells, 0 errors / 0 warnings. Prefer this hybrid
> over a §8.8 `compound_states:` expansion (which would need 24
> entries per CSS property) when the matrix is genuinely a
> variant × state product without deeper semantic overrides.

### 13.3 Value maps (property-driven scales)

When a CSS property varies discretely with a property (not a state), the
value itself may be a map from property values to token paths:

```yaml
tokens:
  container:
    height:
      base: controls.height.base
      small: controls.height.small
    padding-inline:
      base: spacing.component.6x
      small: spacing.component.5x

  icon-start:
    size:
      base: icon.size.base
      small: icon.size.small
```

This form is equivalent to declaring `height--base: …` and `height--small: …`
but reads cleanly when every value of a property has a distinct token.

Generators MUST accept both forms and produce the same output.

### 13.4 Typography

Typography is a nested block — `font-family`, `font-size`, `font-weight`,
`line-height` are addressed as a group:

```yaml
tokens:
  label:
    typography:
      base:
        font-family: fontFamilies.baseFamily
        font-size: fontSizes.label.large
        font-weight: fontWeights.regular
        line-height: lineHeights.label.large
      small:
        font-family: fontFamilies.baseFamily
        font-size: fontSizes.label.base
        font-weight: fontWeights.regular
        line-height: lineHeights.label.base
```

When every scale entry shares the same family + weight and only sizes differ,
a shorter form is permitted:

```yaml
tokens:
  label:
    typography-family: fontFamilies.baseFamily
    typography-weight: fontWeights.regular
    typography-size:
      base: fontSizes.label.large
      small: fontSizes.label.base
    typography-line-height:
      base: lineHeights.label.large
      small: lineHeights.label.base
```

> **Typography mixin (extension).** Profiles MAY declare named typography
> mixins in their `token_sources` or asset bundles. A Component may reference a
> mixin by name: `typography: typography.mixin.label-large`. The Profile
> defines how mixins expand. v1.0.0 does not formalise mixin grammar —
> consumers SHOULD document the mechanism they use.

> **Composite DTCG typography tokens — single-key binding form.** When a
> DS ships typography as a composite DTCG type (one token per
> role × scale cell whose `$value` is an object carrying `fontFamily`,
> `fontSize`, `fontWeight`, `letterSpacing`, `lineHeight`), a Component
> MAY bind it with the single-key form: `typography: typography.label.large`.
> This is parallel to the mixin-reference form above — the token's
> composite `$value` expands into the same sub-properties the nested
> block declares explicitly. Material 3's typography system is the
> canonical composite case; Material Button and FAB both bind via
> `typography: typography.label.large`, which resolves to the composite
> DTCG token without requiring the split `font-family` / `font-size` /
> etc. form.

### 13.5 Focus block

Focus rings have pattern-specific token sets (e.g. double-ring, single-ring).
The `focus:` block is addressed at the component level, not per part, because
the focus ring conceptually wraps a specific part:

```yaml
tokens:
  focus:
    pattern: double-ring
    applies_to: container
    outer: focus.outer       # token group → focus.outer.{color,width,offset}
    inner: focus.inner       # token group → focus.inner.{color,width,offset}
```

Each `outer:` / `inner:` value names a **token group** in the Profile's
focus grammar (Profile §6 — typically `focus.{ring}.{property}` with
`ring ∈ [outer, inner]` and `property ∈ [color, width, offset]`). The
generator expands the group to its concrete leafs; the Component does not
list each property individually.

Valid patterns are declared by the Profile (category defaults or explicit
interaction pattern). The `applies_to` value MUST name an anatomy part.

> **Profile-shape note.** The focus token paths above match Formtrieb's
> `focus.{ring}.{property}` grammar. A Profile that organises focus
> tokens differently (e.g. `focus-ring.outer`, `focus.outline-color`)
> sets the corresponding paths in its grammar, and CDF Components in
> that Profile reference whatever the Profile declares. The `outer:` /
> `inner:` keys in this block are the abstraction; the values are the
> concrete grammar paths.

#### 13.5.1 Single-ring vs. double-ring

§13.5's structured fields (`outer:`, `inner:`, optional offset) describe
the **double-ring** pattern often seen in material-style design systems
that ship two semantically distinct focus tokens (an outer halo + an
inner contrast ring).

**Single-ring focus** — a single `outline-color:` (and optionally
`outline-width:` / `outline-offset:`) binding on the container element,
no separate outer/inner — is equally valid. It SHOULD be expressed as a
direct `tokens:` entry on the relevant anatomy part, NOT as a partial
fill of the §13.5 structured fields:

```yaml
# Single-ring (shadcn, Primer, many CSS-var DSes)
tokens:
  container:
    outline-color: color.focus.outline
    outline-width: focus.outline.width   # optional
    outline-offset: focus.outline.offset # optional

# Double-ring (material-style DSes with semantic outer + inner tokens)
tokens:
  focus:
    pattern: double-ring
    applies_to: container
    outer: focus.outer
    inner: focus.inner
```

**When to use which:**

- Use the §13.5 `focus:` block when the DS owns separate outer + inner
  focus tokens with semantic distinction.
- Use a plain `outline-*:` binding on the container part when the DS
  ships a single focus token.

Both validate. The structural form should follow the DS's design
intent — a single-token DS does not gain anything from the structured
block, and the structured block does not lose anything by being
absent when there is only one ring.

> **Multi-DS evidence.** Both shadcn (F-shadcn-5) and Primer
> (F-primer-4a) ship single-ring focus and naturally land in the
> plain `outline-color:` form. The structured §13.5 block is
> appropriate for material-shaped DSes; not appropriate to retrofit
> onto single-ring sources.

### 13.6 Allowed value types

Every token-map value MUST be one of:

1. **Token path** — dotted path following Profile grammar
   (`color.controls.primary.background.hover`).
2. **Value map** — map of property-value → token path or literal (§13.3).
3. **Documented literal** — a small set of strings the spec permits verbatim:
   - `none` — explicitly no value for this property
   - `inherit` — inherit from parent
   - `currentColor` — use the current text color

   > `inherit` and `currentColor` resolve at render time via CSS cascade, but
   > they MUST ultimately trace to a token-bound value on the current or an
   > ancestor element. They are NOT escape hatches for raw CSS values.
4. **Raw dimensional-with-unit** — permitted only for structural dimensions
   that have no token counterpart, and only as quoted strings with an
   explicit unit suffix (`px`, `em`, `rem`, `%`, `vh`, `vw`, `ch`, …):
   `"1px"`, `"80px"`, `"216px"`. Validators MUST warn on every raw value
   and link to the placeholder audit. **Unitless raw numbers are NOT
   permitted** for non-dimensional properties (opacity, line-height,
   z-index, …) — these MUST be tokens. See §13.6.1.
5. **Derived reference** — the name of a §10 derived value, used inside a
   value map.

Anything else is rejected — no `rgb(…)`, no `#hex`, no arithmetic expressions.

#### 13.6.1 Why dimensional-only

Raw values exist as a pragmatic escape for structural dimensions a DS has
not yet tokenised. Unitless numbers (opacity, line-height, multipliers) are
a different category: a DS that needs opacity values has the design
decision *"which opacity levels do we standardise?"* — which is what a
Profile's `opacity` token family answers. Permitting raw unitless values in
Components bypasses that decision and invites runtime-math patterns (alpha
modifiers, derived shades) that this format explicitly rejects (see §1.1
principle #2).

### 13.7 Addressing rules

1. **Every token key MUST address a declared anatomy part.**
   `tokens.container.background` requires `anatomy.container`.
2. **Every placeholder MUST bind to a property or state.** Unbound
   placeholders reject at validation.
3. **No raw CSS colors.** §1.1 principle #2 — token paths or documented literals.
4. **Modifier values MUST exist.** `background--tertiary` requires
   `hierarchy` to include `tertiary` in its values (or a state to include it).
5. **Profile grammar MUST match.** The resolved token path MUST satisfy the
   Profile's `token_grammar` pattern.

### 13.8 Example — Button (partial)

```yaml
tokens:
  container:
    background: color.controls.{hierarchy}.background.{interaction}
    background--tertiary: none
    background--tertiaryWithoutPadding: none
    border-radius: radius.full
    border-radius--tertiaryWithoutPadding: none
    height:
      base: controls.height.base
      small: controls.height.small
    height--tertiaryWithoutPadding: dimension.6x
    padding-inline:
      base: spacing.component.6x
      small: spacing.component.5x
    padding-inline--tertiaryWithoutPadding: spacing.component.none
    min-width: "80px"

  label:
    color: color.controls.{hierarchy}.text-on-color.{interaction}
    color--tertiary: color.controls.tertiary.text.{interaction}
    color--tertiaryWithoutPadding: color.controls.tertiary.text.{interaction}
    color--secondary: color.controls.secondary.text-on-color.{interaction}

  icon-start:
    color: color.controls.{hierarchy}.icon-on-color.{interaction}
    color--tertiary: color.controls.tertiary.icon.{interaction}
    size:
      base: icon.size.base
      small: icon.size.small
    gap: spacing.component.3x

  focus:
    pattern: double-ring
    applies_to: container
    outer: focus.ring.outer
    inner: focus.ring.inner
```

---

## 14. Behavior

The `behavior:` block documents runtime side-effects that are not visible in
tokens, states, or anatomy alone — what happens when a state axis enters a
specific value, how consumer actions translate to internal state changes, and
(as a narrow escape hatch) imperative CSS that has no token counterpart.

Behavior is declarative-narrative, not imperative: it describes *what happens*,
not *how to make it happen*. The imperative side lives in the generator.

The `behavior:` block is a map keyed by behavior name. Each entry describes
one runtime concern — usually a state value, a property effect, or a
composed-child interaction.

### 14.1 Behavior fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `description` | Yes      | What happens at runtime. Written for human readers — what the user sees, what the component does, what events fire. |
| `css`         | No       | Raw CSS declarations that have no token counterpart (`pointer-events`, `cursor`, `user-select`). See §14.4. |

### 14.2 Naming

Behavior entries SHOULD be named after their trigger:

- **State values** — `pending`, `readOnly`, `disabled`. The entry describes
  what this state value does at runtime beyond the token set-switch.
- **Property effects** — `validation` (the whole axis), `clearable` (boolean
  effect), `autoFocus`.
- **Part interactions** — `clearButton`, `trailingAction`. The entry describes
  how that anatomy part participates in runtime behavior.

### 14.3 What belongs in `behavior:`

- **State side-effects beyond tokens.** If `pending` hides the label and
  shows a spinner, that is structural behavior — not a token substitution.
- **Cross-part coordination.** "Clicking the clear button clears the input
  and returns focus to the input element" — two parts cooperating.
- **ARIA state mirroring.** `aria-busy` matches `pending`, `aria-invalid`
  matches `validation=error`. Documented here, then listed in §15.
- **Focus management.** Where focus moves after consumer actions (clear →
  input, submit → first-invalid, …).

### 14.4 The `css:` escape hatch

A small set of runtime behaviors is CSS-native but has no token counterpart:
`pointer-events`, `cursor`, `user-select`, `touch-action`, `will-change`.
These MAY be declared via the `css:` field as a single raw CSS string:

```yaml
behavior:
  pending:
    description: >
      The button label and trailing icon are hidden; a spinner replaces
      them in the icon-start position. Pointer interaction is suppressed.
      The button remains focusable and announces aria-busy=true.
    css: "pointer-events: none; cursor: default;"
```

> **Layer note.** `css:` is a known cross-layer concession. These declarations
> are Web-specific and would belong in the Target spec under a stricter
> separation. In v1.0.0 they live in CDF because the only current
> generator is Angular and moving them now would require the Target spec
> to define the behavior-override schema. Consumers for non-Web Targets
> MUST ignore `css:` entries. This is a candidate for relocation to Target
> in a subsequent minor version — see the layer-boundary review pass noted in
> [PROFILE-SPEC Appendix C](CDF-PROFILE-SPEC.md#appendix-c-known-gaps-phase-7b-review).

> **OS-signal media queries are legal `css:` content.** When a DS's
> accessibility preference is driven by a browser/OS signal rather than
> by a DS-owned runtime switch (i.e. not a `theming.modifiers` axis),
> the signal belongs in a `css:` string as a `@media` rule:
>
> ```yaml
> behavior:
>   forced_colors:
>     description: >
>       Windows High Contrast Mode override. USWDS draws a 1px solid
>       border using the system-defined ButtonBorder colour so that
>       buttons remain visible when forced-colors is active.
>     css: "@media (forced-colors: active) { border: 1px solid ButtonBorder; }"
>
>   reduced_motion:
>     description: >
>       Honour the user's OS preference for reduced motion.
>     css: "@media (prefers-reduced-motion: reduce) { transition: none; }"
> ```
>
> Accepted signals: `@media (forced-colors: active)`,
> `@media (prefers-reduced-motion: reduce)`, `@media (prefers-contrast: more)`,
> `@media (prefers-color-scheme: dark)` — any browser-evaluated preference
> query. These are NOT `theming.modifiers` axes; they are paint-time
> directives the browser owns. Prose in `description:` SHOULD state
> which OS/browser signal the block responds to. USWDS is the canonical
> example — its high-contrast + reduced-motion behaviour lives entirely
> in OS-signal `@media` blocks, with an empty `theming.modifiers: {}`
> at the Profile level. See Profile §8 for the distinction between
> DS-owned theme axes and OS-signal preferences.

### 14.5 What does NOT belong in `behavior:`

- **Token set-switching.** If the only thing a state does is change tokens,
  `behavior:` adds nothing — the state declaration (§8) already documents it.
- **Transitions and animations.** Reserved for v1.0.0 final via a dedicated
  `transitions:` block with motion-token references. Raw `transition:` CSS
  in `behavior:` is discouraged but not rejected in v1.0.0-draft.
- **Scripting.** Event handlers, state transitions, conditional logic — the
  generator owns the imperative layer.
- **Layout details.** Flex gap, padding, auto-layout direction — these are
  tokens (§13), not behavior.

### 14.6 Example — Button

```yaml
behavior:
  pending:
    description: >
      The button label and trailing icon are hidden. A spinner icon replaces
      them in the icon-start position. Pointer events are suppressed. The
      button remains focusable and announces aria-busy=true to screen readers.
    css: "pointer-events: none; cursor: default;"
```

### 14.7 Example — InputCore

```yaml
behavior:
  readOnly:
    description: >
      The container loses its stroke and gets a filled background (background
      .inactive). All interaction states (hover, focused) are suppressed. The
      input element gets the readonly HTML attribute.
    css: "pointer-events: auto; cursor: default;"

  clearButton:
    description: >
      Visible when clearable=true AND hasValue=true. Clicking clears the
      input value and emits a clear event. After clearing, focus returns
      to the input element.

  validation:
    description: >
      Drives stroke color (none → neutral, error → negative, success →
      positive) and the visibility of the error-icon (only in error).
      Sets aria-invalid=true when error. Parent components (InputGroup,
      Dropdown) pass this signal through to the message element.
```

---

## 15. Accessibility

The `accessibility:` block declares the component's accessibility contract —
semantic element, role, keyboard interaction, ARIA attributes, focus visibility,
minimum target size, and contrast guarantees.

This block composes with the Profile's `accessibility_defaults` (Profile §11):
the Profile provides category-level baselines, and the component overrides
only where it deviates.

### 15.1 Fields

| Field             | Required | Description |
| ----------------- | -------- | ----------- |
| `element`         | No       | Semantic HTML element of **the interactive part** the component exposes for focus, keyboard, and form semantics. This is NOT required to match the host part (`container.element`) — a `<label>`-wrapped checkbox legitimately has `container.element: label` and `accessibility.element: input`, where the `input` is a different anatomy part. The value MUST match the `element:` of SOME declared anatomy part (validator rule CDF-SEM-007). Omit to let the host part drive. |
| `role`            | No       | ARIA role override. Omit when the native element's implicit role is correct. |
| `focus-visible`   | No       | `true` if the component shows a focus ring via `:focus-visible`. Default: inherited from Profile's category defaults. |
| `keyboard`        | No       | Map of key → action. Key is a canonical key name (`Enter`, `Space`, `Escape`, `Tab`, `ArrowDown`, …). Action is a short human-readable description. |
| `aria`            | No       | List of ARIA attribute declarations — one per line, each a narrative string describing the attribute and its trigger. See §15.3. |
| `min-target-size` | No       | Token path — the minimum hit target dimension. MUST be a token, never a pixel literal. |
| `contrast`        | No       | Narrative statement about contrast guarantees. Typically references which token pairs have been pre-validated. |
| `label_association` | No     | How the component associates with its label — `for/id`, `aria-labelledby`, `aria-label`. Free-form string. |

### 15.2 Composition with Profile defaults

Profile `accessibility_defaults` are **category-level** (per §12 category or
per interaction pattern). The CDF block declares **component-specific**
requirements. The merge rule, adapted from Profile §11:

- **Scalar fields** (`element`, `role`, `focus-visible`, `min-target-size`,
  `label_association`) — CDF value wins; omitted in CDF means "use Profile
  default".
- **Map fields** (`keyboard`) — CDF entries add to the Profile's defaults;
  same key in both → CDF wins.
- **List fields** (`aria`) — CDF entries add to the Profile's defaults;
  duplicate entries are deduplicated by the validator.

A component that fully inherits from its category's defaults MAY omit the
`accessibility:` block entirely.

### 15.3 `aria:` list format

`aria:` is intentionally a **list of narrative strings**, not a structured
map — ARIA attributes have conditional triggers ("when disabled", "when
validation=error") that a flat attribute-to-value map cannot express without
losing legibility.

Each entry SHOULD follow the pattern:

```
"aria-{attribute}: {value-or-rule} — {trigger-condition}"
```

Examples:

```yaml
aria:
  - "aria-disabled: true — when interaction=disabled (preserves focusability)"
  - "aria-busy: true — when interaction=pending"
  - "aria-invalid: true — when validation=error"
```

Validators parse these loosely — the leading `aria-` prefix and the `—`
separator are the only structural requirements. Richer structure (e.g. a
proper expression grammar for triggers) is reserved for v1.0.0 final,
alongside the `conditional:` grammar (§7.10).

### 15.4 `keyboard:` map

Keys use canonical names from the UI Events KeyboardEvent specification:
`Enter`, `Space`, `Escape`, `Tab`, `ArrowUp`, `ArrowDown`, `ArrowLeft`,
`ArrowRight`, `Home`, `End`, `PageUp`, `PageDown`, `F6`, character keys
as single characters.

Combos use `+`: `Cmd+K`, `Shift+Tab`, `Ctrl+Enter`.

Values are short action descriptions — "activate", "open", "close",
"select next option", not full sentences.

### 15.5 `min-target-size:` is a token

Minimum target sizes MUST reference a Profile token, not a pixel literal:

```yaml
min-target-size: controls.height.base          # ✓ token reference
min-target-size: "44px"                        # ✗ rejected — use a token
```

The Profile's dimension tokens encode the DS's target-size policy (WCAG 2.5.5,
Apple HIG, Material — each DS decides). Hard-coding pixels in the CDF Component bypasses
the policy.

Cross-ref: Profile §11 (Accessibility Defaults).

### 15.6 Example — Button

```yaml
accessibility:
  element: button
  focus-visible: true
  keyboard:
    Enter: activate
    Space: activate
  aria:
    - "aria-disabled: true — when interaction=disabled (preserves focusability)"
    - "aria-busy: true — when interaction=pending"
  min-target-size: controls.height.base
  contrast: >
    text-on-color tokens are pre-validated for 4.5:1 contrast against their
    corresponding background tokens in the semantic layer.
```

### 15.7 Example — InputCore

```yaml
accessibility:
  element: input
  role: textbox
  focus-visible: true
  keyboard:
    Tab: "Focus the input"
    Escape: "Clear value (when clearable) or blur"
  aria:
    - "aria-disabled: true — when interaction=disabled"
    - "aria-readonly: true — when readOnly=true"
    - "aria-invalid: true — when validation=error"
    - "aria-placeholder — mirrors placeholder property"
  min-target-size: controls.height.base
  contrast: >
    text/enabled and text/inactive tokens are pre-validated for WCAG AA
    contrast against the page background in both Light and Dark themes.
  label_association: >
    The parent InputGroup associates its <label for="..."> with the input's
    id, or uses aria-labelledby when for/id pairing is not available.
```

### 15.8 Example — Dropdown (composite, combobox role)

```yaml
accessibility:
  role: combobox
  keyboard:
    Enter: "Open menu if closed; select highlighted option if open"
    Space: "Open menu if closed; select highlighted option if open"
    Escape: "Close menu without selection"
    ArrowDown: "Open menu; move highlight down"
    ArrowUp: "Move highlight up"
  aria:
    - "role='combobox' on the trigger element"
    - "aria-expanded='true|false' reflects the open state"
    - "aria-haspopup='listbox' indicates the popup type"
    - "aria-controls references the Popover Menu's id"
    - "aria-activedescendant tracks the currently highlighted option"
    - "aria-labelledby references the InputGroup's label"
    - "aria-invalid='true' when validation=error"
    - "aria-disabled='true' when disabled=true"
```

### 15.9 Example — USWDS Alert (conditional ARIA by intent)

A denser example: a status component whose ARIA role and live-region
politeness both vary across an `intent` property with five values. The
narrative `aria:` list carries the `{attr}: {value} — {trigger}` pattern
without a structural grammar, demonstrating that §15.3's format scales to
multi-axis conditional ARIA matrices.

```yaml
accessibility:
  role: status       # default for info / success; see conditional aria below
  keyboard:
    Escape: "When dismissible: close the alert and return focus to the trigger"
  aria:
    - "role: status — when intent ∈ {info, success} (implicit aria-live=polite; non-urgent notification)"
    - "role: alert — when intent ∈ {error, emergency} (implicit aria-live=assertive; urgent / interrupts AT output)"
    - "role: status — when intent = warning (USWDS convention: soften to polite; role=alert acceptable when urgency warrants it)"
    - "aria-live: assertive — when intent = emergency (emphasises role=alert's implicit assertiveness for highest severity)"
    - "aria-live: polite — when intent = error (USWDS convention softens role=alert's implicit assertive; consumer MAY override to assertive for page-blocking errors)"
    - "aria-live: polite — when intent ∈ {info, success, warning} (matches role=status's implicit polite)"
    - "aria-atomic: true — always (ensures the full body is re-announced on update, not just the changed node)"
    - "aria-hidden: true — on the ::before icon pseudo-element (decorative)"
    - "aria-label='Close' — on the dismiss button when dismissible=true"
```

Eight narrative entries cover a 5-intent × 2-role × 3-politeness matrix.
The `— when intent ∈ {…}` trigger condition is free-form prose; validators
check only for `aria-` prefix + `—` separator structurally. A future
structured-ARIA grammar (reserved for a later minor version) would add
machine-checkability but is NOT a prerequisite — the narrative form scales
to real-world conditional-ARIA complexity.

---

## 16. CSS

The `css:` block declares Web-specific output conventions for the component:
CSS selector, private custom properties, which properties become class
modifiers, and state-guard selector overrides.

> **Layer flag.** The `css:` block is Web-specific by definition. Under a
> stricter layer split it would live in the Target spec — Angular's CSS
> conventions do not apply to SwiftUI or Kirby. It remains in the CDF Component
> spec v1.0.0-draft
> because the Web is the only currently-generating Target and moving it
> would require Target to define the override schema. Non-Web Targets MUST
> ignore the `css:` block. Candidate for relocation to Target in v1.0.0
> final; see [PROFILE-SPEC Appendix C](CDF-PROFILE-SPEC.md#appendix-c-known-gaps-phase-7b-review).

### 16.1 Fields

| Field                      | Required | Description |
| -------------------------- | -------- | ----------- |
| `selector`                 | No       | CSS selector(s) the component styles attach to. Comma-separated for multiple. Defaults to the BEM class derived from the component name (per Profile §9 Naming). |
| `private_custom_properties`| No       | List of CSS custom property names (e.g. `--_bg`, `--_text-hover`) the component defines internally. Convention: underscore prefix denotes "private". |
| `modifiers`                | No       | Map of `{property-or-state-name}: {strategy}` declaring how each axis expresses itself in CSS. See §16.3. |
| `states`                   | No       | Map of `{state-value}: {selector-expression}` overriding Target `styling.state_guards`. See §16.4. |

### 16.2 `selector`

Overrides the Profile's default component selector when the component attaches
to multiple elements (e.g. `button[ft-button], a[ft-button]` for a Button
that may render as either `<button>` or `<a>`).

Omit when the Profile default (typically `.{css_prefix}-{component-name}`) is
correct.

### 16.3 `modifiers:` — expression strategies

Each property or state axis referenced by tokens (§13) resolves at runtime to
either a **class**, a **DOM attribute**, or a **custom property value**. The
`modifiers:` map declares the strategy per axis:

| Strategy    | Example output                                  |
| ----------- | ----------------------------------------------- |
| `class`     | `.ft-button--primary` (BEM modifier)             |
| `attribute` | `[data-validation="error"]` (DOM attribute)      |
| `custom-property` | `--_bg: var(...)` (set via CSS variable)   |

```yaml
css:
  modifiers:
    hierarchy: class       # ft-button--brand, --secondary, …
    size: class            # ft-button--base, --small
    pending: class         # ft-button--pending
    validation: class      # ft-input-core--error, --success
```

Profile `interaction_patterns.promoted` (Profile §10.6) declares which states
become DOM attributes by default; the CDF Component MAY override per-axis. When omitted,
Profile defaults apply.

### 16.4 `states:` — state-guard selector overrides

The Target declares default state-guard selectors in `styling.state_guards` (Target §9.7):

```
hover: ":hover:not([disabled])"
focused: ":focus-visible"
pressed: ":active"
disabled: "[disabled], [aria-disabled='true']"
```

A component overrides these when its interaction model deviates — e.g. a Button
that suppresses hover/pressed while `pending`:

```yaml
css:
  states:
    # Hover/pressed additionally exclude pending state
    hover: ":hover:not([disabled]):not(.ft-button--pending)"
    pressed: ":active:not([disabled]):not(.ft-button--pending)"
    # focused and disabled match profile defaults → not repeated here
    pending: ".ft-button--pending"
```

Only declare overrides; inherited entries carry through from the Target.
Cross-ref: [CDF Target §9.7](CDF-TARGET-SPEC.md#97-state_guards--ds-wide-state-selector-fragments).

### 16.5 Example — Button

```yaml
css:
  selector: "button[ft-button], a[ft-button]"
  private_custom_properties:
    - --_bg
    - --_bg-hover
    - --_bg-pressed
    - --_bg-disabled
    - --_text
    - --_icon
  modifiers:
    hierarchy: class
    size: class
    pending: class
  states:
    hover: ":hover:not([disabled]):not(.ft-button--pending)"
    pressed: ":active:not([disabled]):not(.ft-button--pending)"
    pending: ".ft-button--pending"
```

### 16.6 Example — InputCore

```yaml
css:
  selector: ".ft-input-core"
  private_custom_properties:
    - --_bg
    - --_stroke
    - --_stroke-hover
    - --_stroke-focus
    - --_text
    - --_text-placeholder
    - --_icon
    - --_icon-error
  modifiers:
    size: class
    readOnly: class
    validation: class
    hasValue: class
  states:
    hover: ":hover:not([disabled]):not(.ft-input-core--readonly)"
    focused: ":focus-within:not([disabled])"
    disabled: "[disabled], [aria-disabled='true'], :has(input:disabled)"
```

---

## 17. Design source

The `design_source:` block records **where this component lives in the design
tool of record** — enough to open the source of truth, nothing more.

Rich per-tool data (variant dumps, nested-instance catalogues, Figma node IDs
for every part) **MUST NOT** live in CDF. That data belongs either in the
design tool itself or in a tool-specific target artefact (e.g. a future
Figma Target).

> **Legacy note.** v0.x specs carry a large `figma:` block with ~200 lines of
> Figma-specific data per component (variant_properties, component_properties,
> nested_instances, node IDs). In v1.0.0 this block is pared down to a minimal
> reference. Existing specs MUST migrate; see Appendix B.

### 17.1 Fields

| Field           | Required | Description |
| --------------- | -------- | ----------- |
| `tool`          | Yes      | Design tool identifier — `figma`, `sketch`, `penpot`, `framer`, or a vendor-specific string. |
| `url`           | One of `url` or (`file_key` + `node_id`) | Direct link to the component in the tool. |
| `file_key`      | One of `url` or (`file_key` + `node_id`) | Tool-specific file identifier (for Figma: the fileKey from the URL). |
| `node_id`       | Paired with `file_key` | Tool-specific node identifier. |
| `last_synced`   | No       | ISO date (`YYYY-MM-DD`) the design was last reviewed against the spec. Narrative — no strict staleness check. |

### 17.2 Example — Figma with node reference

```yaml
design_source:
  tool: figma
  file_key: fekh7KslmBf1dl17QMUrZ6
  node_id: "271:7461"
  last_synced: 2026-04-01
```

### 17.3 Example — Figma with direct URL

```yaml
design_source:
  tool: figma
  url: https://www.figma.com/design/EXAMPLE-FILE-ID/DesignSystem?node-id=271-7461
  last_synced: 2026-04-01
```

### 17.4 Rationale — what does NOT live here

The legacy v0.x `figma:` block mixed three concerns:

1. **Design-source reference** — where the component lives. *(kept, §17)*
2. **Validator input** — variant catalogues used to cross-check CDF properties
   against Figma variants. *(moved — validators MAY fetch this via MCP or a
   dedicated cache; it is not part of the spec format)*
3. **Future Figma-target output** — node IDs and instance mappings a Figma
   generator would use. *(moved — belongs in a per-component Figma-target
   artefact, not in CDF)*

Keeping all three in CDF conflated layers. Separating them leaves CDF as a
pure component description, independent of any specific design tool's
implementation details.

---

## 18. Validation rules

The CDF format defines **28 consistency rules** across four tiers. A validator
MUST implement Tier 1 (structural), SHOULD implement Tier 2 (semantic), and
MAY implement Tiers 3 and 4 (convention and cross-layer) depending on its role.

### 18.1 Tiers

| Tier | Name         | Scope                                                         | Severity       |
| ---- | ------------ | ------------------------------------------------------------- | -------------- |
| 1    | Structural   | Schema — required fields, type correctness, YAML validity.    | Error          |
| 2    | Semantic     | Cross-references within the spec — tokens ↔ anatomy, states ↔ token placeholders, property ↔ default. | Error          |
| 3    | Convention   | Profile-driven — naming, category membership, grammar paths.  | Warning        |
| 4    | Cross-layer  | CDF ↔ Profile, CDF ↔ CDF (for `inherits`/`extends`).          | Warning or Error |

### 18.2 Rule format

Each rule is documented with:

- **ID** — stable identifier (e.g. `CDF-TOK-003`).
- **Tier** — 1–4.
- **Severity** — `error` or `warning`.
- **Message template** — human-readable, with placeholders for offending values.
- **Rationale** — why this rule exists.

### 18.3 Tier 1 — Structural rules (examples)

| ID              | Rule                                                              |
| --------------- | ----------------------------------------------------------------- |
| `CDF-STR-001`   | Top-level schema MUST include `cdf_version`, `name`, `category`, `profile`. |
| `CDF-STR-002`   | `cdf_version` MUST be a valid semver range.                       |
| `CDF-STR-003`   | Property types MUST be one of the §7.1 vocabulary.                |
| `CDF-STR-004`   | State axis MUST declare `values` and `token_expandable`.          |
| `CDF-STR-005`   | Event `payload` MUST be present; use `void` for signal-only.      |
| `CDF-STR-006`   | Anatomy parts MUST declare `element` XOR `component`.             |
| `CDF-STR-007`   | `compound_states[].when` MUST name declared state axes and valid values (§8.8). |
| `CDF-STR-011`   | Reserved-vocabulary isolation: values owned by exactly one Profile vocabulary (incl. `validation.values`, `hierarchy.values`, etc.) MUST NOT appear in any `properties.*.values` or `states.*.values` except in an axis bound to the owning vocabulary (matching axis name, or explicit `binds_to:`). Applies to API level; token paths are exempt. See Profile §5.5 rule 5. |
| `CDF-STR-012`   | Axis-name / vocabulary convention: when a state or property axis's values come from a Profile vocabulary, the axis name SHOULD match the vocabulary name. If it does not, the axis MUST declare `binds_to: {vocabulary}` to enable `CDF-STR-011` checks. An axis whose values draw from no Profile vocabulary is a local enum and is not subject to isolation. |
| `CDF-STR-013`   | Token-grammar resolution: a grammar whose `{state}`-like slot admits values from more than one Profile `interaction_pattern` MUST declare `resolution.precedence:` (Profile §6.12). Absence is an error. |

### 18.4 Tier 2 — Semantic rules (examples)

| ID              | Rule                                                              |
| --------------- | ----------------------------------------------------------------- |
| `CDF-SEM-001`   | Every `tokens.{part}…` key MUST address a declared anatomy part (§13.7). |
| `CDF-SEM-002`   | Every `{placeholder}` in a token path MUST bind to a property or state axis (§13.1). |
| `CDF-SEM-003`   | Property `default` MUST be one of the property's `values` (for enum types). |
| `CDF-SEM-004`   | State `default` MUST be one of the axis's `values`.               |
| `CDF-SEM-005`   | `mutual_exclusion` MUST name an existing property; SHOULD be symmetric (§7.9). |
| `CDF-SEM-006`   | Modifier value `{css-prop}--{value}` MUST correspond to an existing property or state value (§13.7). |
| `CDF-SEM-007`   | `accessibility.element`, if present, MUST match the `element:` of SOME anatomy part — the **interactive element** the component exposes for focus, keyboard, and form semantics. It is NOT required to match the host part (first anatomy entry). A component with `container.element: label` and `native-input.element: input` sets `accessibility.element: input` — the label is the host, the input is the interactive element. Validators MUST NOT warn when `accessibility.element` matches a non-host part; they MUST warn when it matches no part at all. |
| `CDF-SEM-008`   | Derived `from:` MUST name an existing property or state axis.     |
| `CDF-SEM-009`   | Derived `mapping` MUST cover every value of the source (single-source) or every cell in the Cartesian product of source axes (multi-source rule list) — §10. |
| `CDF-SEM-010`   | `compound_states` closure: every render cell in the Cartesian product of `states.*.values` MUST resolve every referenced token path to a value, after merging `tokens:` defaults and all matching compounds (§8.8). |
| `CDF-SEM-011`   | `anatomy.{part}.bindings` keys MUST name properties of the referenced nested component. Validators load the nested Component spec to verify (§11.4.5). |
| `CDF-SEM-012`   | `anatomy.{part}.bindings` values MUST name entries in the parent's `derived:` block. Forward references are resolved at validation (§11.4.5). |
| `CDF-SEM-013`   | `properties.{p}.mirrors_state` MUST name an existing state axis whose `values:` are type-compatible with the property's `type` and `values:` (boolean ↔ `[false, true]`; enum ⊆-superset). Defaults MUST coincide. See §7.11. |
| `CDF-SEM-014`   | A state axis MAY be the `mirrors_state` target of at most one property (§7.11). |

### 18.5 Tier 3 — Convention rules (examples)

| ID              | Rule                                                              |
| --------------- | ----------------------------------------------------------------- |
| `CDF-CON-001`   | Component `name` SHOULD match Profile naming (`css_prefix`, casing). |
| `CDF-CON-002`   | Token paths SHOULD satisfy Profile `token_grammar` patterns.      |
| `CDF-CON-003`   | `category` SHOULD be one of Profile `categories`.                 |
| `CDF-CON-004`   | Accessibility `min-target-size` MUST be a token, not a pixel literal (§15.5). |
| `CDF-CON-005`   | No raw color values in `tokens:` (§13.6).                         |
| `CDF-CON-006`   | `runtime: true` on state axes MUST NOT be present (redundant in v1.0.0). |
| `CDF-CON-007`   | Event names SHOULD be camelCase.                                  |
| `CDF-CON-008`   | No raw unitless values. A `tokens.*` entry with an unquoted or quoted numeric value lacking a unit suffix is rejected. Opacity, line-height, z-index values MUST be tokens (see §13.6 rule 4). |

### 18.6 Tier 4 — Cross-layer rules (examples)

| ID              | Rule                                                              |
| --------------- | ----------------------------------------------------------------- |
| `CDF-XLY-001`   | `profile:` MUST reference an existing Profile file.               |
| `CDF-XLY-002`   | Component's `cdf_version` MUST be compatible with Profile's declared `cdf_version` range. |
| `CDF-XLY-003`   | Resolved token paths MUST exist in the token files the Profile declares. |
| `CDF-XLY-004`   | `inherits:` target MUST exist and MUST be the same category (§5.2). |
| `CDF-XLY-005`   | `extends:` target MUST exist; promoted properties MUST NOT conflict with own properties (§5.3). |
| `CDF-XLY-006`   | Accessibility defaults MUST merge cleanly with Profile `accessibility_defaults` (§15.2). |
| `CDF-XLY-007`   | `design_source.tool` SHOULD match a tool supported by the Profile's category definition. |

### 18.7 Aggregation and reporting

A validator SHOULD report:

- **Errors** — block generation. Tier 1 and Tier 2 violations are errors by default.
- **Warnings** — allow generation but surface to the author. Tier 3 and most
  Tier 4 violations are warnings.
- **Info** — informational notes that are neither errors nor warnings (e.g.
  "Profile default used for `accessibility.keyboard.Tab`").

Validators SHOULD emit machine-readable output (`--format json`) in addition
to human-readable output, enabling integration with editor tooling and CI
pipelines.

### 18.8 Severity override

A component MAY declare a `validation_overrides:` block suppressing specific
rules with rationale:

```yaml
validation_overrides:
  CDF-CON-005:                    # rule ID being suppressed
    severity: warning             # downgrade from error to warning
    rationale: >
      opacity values for placeholder text are intentional raw literals;
      no opacity tokens exist in the DS grammar.
```

Overrides apply only to the declaring component. Blanket suppression at the
Profile level is not permitted — if a rule should not fire for an entire DS,
the Profile itself should declare the exception through grammar relaxation.

---

## Appendix A. Minimal example

The smallest complete CDF Component. A Button with one property, one state axis,
one event, flat anatomy, and essential tokens — all required sections, nothing
more.

```yaml
# button.component.yaml
cdf_version: "^1.0.0"
name: Button
category: actions
profile: ../formtrieb.profile.yaml
description: >
  Standard button. Emits a clicked event on activation.

properties:
  hierarchy:
    type: enum
    values: [primary, secondary]
    default: primary
    description: Visual emphasis level.

  label:
    type: string
    required: true
    description: Visible button text.

states:
  interaction:
    values: [enabled, hover, pressed, disabled]
    token_expandable: true

events:
  clicked:
    payload: void
    description: Emitted on activation (click, Enter, Space).

anatomy:
  container:
    element: button
    description: The host element.
  label:
    element: text
    description: Button text.

tokens:
  container:
    background: color.controls.{hierarchy}.background.{interaction}
    border-radius: radius.full
    height: controls.height.base
    padding-inline: spacing.component.6x
  label:
    color: color.controls.{hierarchy}.text-on-color.{interaction}

accessibility:
  element: button
  focus-visible: true
  keyboard:
    Enter: activate
    Space: activate
  min-target-size: controls.height.base

design_source:
  tool: figma
  url: https://www.figma.com/design/ABC123/DesignSystem?node-id=271-7461
```

Optional blocks omitted for brevity: `derived`, `slots`, `behavior`, `css`,
`validation_overrides`.

---

## Appendix B. Migration from v0.3

Breaking changes from CDF v0.3 to v1.0.0. Each row is one replace-and-check
operation.

### B.1 Block-level renames

| v0.3                     | v1.0.0            | Note |
| ------------------------ | ----------------- | ---- |
| `css_architecture:`      | `css:`            | Same fields. Phase 7a.1 rename. |
| `figma:` (full block)    | `design_source:`  | Reduced to `tool` + `url`/`file_key`/`node_id`. Rich data moves out (§17.4). |

### B.2 Fields removed

| v0.3 field                    | Action                                                |
| ----------------------------- | ----------------------------------------------------- |
| `icon_sources:` (top-level)   | Removed — superseded by `profile.assets.icons`.      |
| `states.{axis}.runtime`       | Removed — all state axes are runtime in v1.0.0.      |
| `figma.variant_properties`    | Removed — validator may source via MCP instead.       |
| `figma.component_properties`  | Removed.                                              |
| `figma.nested_instances`      | Removed — anatomy.{part}.component covers this.       |

### B.3 Fields renamed

| v0.3                                  | v1.0.0                              |
| ------------------------------------- | ----------------------------------- |
| `properties.{prop}.token_map`         | `properties.{prop}.token_mapping`   |
| `events.{event}.type`                 | `events.{event}.payload`            |

### B.4 Fields now required

| Field        | Reason                                                             |
| ------------ | ------------------------------------------------------------------ |
| `profile:`   | No more implicit discovery. Declares which Profile the spec uses. |
| `cdf_version:` | Every Component declares its CDF Component spec compatibility range. |
| `description:` on events | Enforce output-contract documentation.                 |

### B.5 Semantic changes (no syntactic difference, but meaning changed)

- **Orthogonal states are now a hard model.** v0.3 allowed `states:` as a
  flat list of values; v1.0.0 requires named axes with values (§8).
- **Modifier overrides on a `disabled` state or `tertiary` hierarchy** are
  resolved against the DS-wide axis, not component-local. Paths that used
  to silently fall back now raise `CDF-SEM-006`.
- **Accessibility merges with Profile defaults.** v0.3 accessibility blocks
  were standalone; v1.0.0 merges per §15.2 — components SHOULD omit the
  fields that match Profile defaults.

### B.6 Migration checklist

- [ ] Rename `css_architecture:` → `css:`.
- [ ] Rename `properties.*.token_map` → `token_mapping`.
- [ ] Rename `events.*.type` → `payload`.
- [ ] Strip `runtime: true` from every state axis.
- [ ] Add `profile:` field pointing to the DS profile.
- [ ] Reduce `figma:` block to `design_source:` (keep fileKey + nodeId only).
- [ ] Remove top-level `icon_sources:` from Icon specs.
- [ ] Validate — any remaining drift surfaces as Tier 2/3 warnings.

---

## Appendix C. Glossary

Terms used throughout this spec with a consistent, narrow meaning.

| Term                         | Meaning |
| ---------------------------- | ------- |
| **Anatomy**                  | The named structural parts of a component (§11). Every token path addresses one. |
| **Axis (state / property)**  | An independent dimension of values. Axes multiply — they do not union. |
| **Bindable**                 | A property that participates in two-way data flow with its consumer (§7.8). |
| **CDF**                      | **Component Description Format** — the umbrella name for the family of three formats: CDF Component, CDF Profile, CDF Target. Not a file format on its own. |
| **CDF Component**            | One of the three CDF formats — describes a single UI component instance. File extension `.component.yaml`. This spec defines CDF Component. |
| **Custom property (private)**| CSS variable scoped to the component, conventionally underscore-prefixed (`--_bg`). Set in §13 tokens, exposed in §16 `private_custom_properties`. |
| **Derived value**            | A read-only declarative mapping from one property/state to a token-consumable value (§10). |
| **Element-of-control**       | Token-grammar segment naming a visual element of an interactive control (background, stroke, text, icon, …). Defined in Profile `token_grammar`. |
| **`extends`**                | Composition relation — the new component structurally wraps another (HAS-A). Contrast with `inherits` (§5.3). |
| **Hierarchy**                | DS vocabulary for visual emphasis (primary / secondary / tertiary / …). Defined in Profile vocabularies, referenced as property enum in a Component. |
| **Host element**             | The outermost anatomy part — conventionally `container` or `wrapper`. The selector in §16 attaches here. |
| **`inherits`**               | Composition relation — the new component IS-A specialisation of another with field merge (§5.3). Contrast with `extends`. |
| **Interaction pattern**      | Canonical interaction model declared by the Profile (`pressable`, `focusable`, `selectable`, `expandable`). Components reference a pattern to inherit axes + a11y defaults. |
| **Modifier**                 | A property or state value that overrides the base token for a specific CSS property (§13.2). Realised as class / DOM attribute / custom-property depending on §16 strategy. |
| **Orthogonal axes**          | Two or more state axes whose valid combinations are the Cartesian product (§8.3). |
| **Part**                     | A single entry in the `anatomy:` block — a named structural element. |
| **Placeholder**              | A `{name}` segment in a token path that resolves to a property or state value at runtime (§13.1). |
| **Profile**                  | CDF Profile — the DS-level spec declaring vocabulary, token grammar, themes, categories. CDF references one. |
| **Promoted state**           | A state axis declared by the Profile as "externally observable" (Profile §10.6). Web Targets realise it as a DOM attribute (Target §13.3.1); other Targets use their own mechanism. |
| **`properties_sealed`**      | Inheritance/extension control that locks specific properties from further override (§5.3). |
| **Sealed property**          | A property marked in `properties_sealed` — immutable in descendants. |
| **Slot**                     | A content projection point — open-ended, consumer-filled (§12). Contrast with nested component (§11.3). |
| **State**                    | A runtime visual axis managed by the component (§8). Not consumer-set. |
| **State guard**              | The CSS selector expression used to scope a state value (`:hover:not([disabled])`). Profile provides defaults; CDF may override (§16.4). |
| **Target**                   | CDF Target — per-(DS × framework) output conventions spec. |
| **Token**                    | A design-token reference, resolved through the DTCG token tree per Profile grammar. |
| **`token_expandable`**       | State-axis flag marking whether the axis contributes a segment to token paths (§8.2). |
| **`token_mapping`**          | A local map from spec value → token-path segment when the two differ (§7.6 / §8.5). |
| **Validator**                | A tool that checks a CDF Component against the rules in §18 and produces errors/warnings/info. |
| **Vocabulary**               | Named set of allowed values declared by the Profile (hierarchies, intents, sizes, …). Referenced in CDF property enums. |
