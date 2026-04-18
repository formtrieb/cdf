# CDF Target Format

**Version:** 1.0.0
**Status:** Working Draft
**File extension:** `.target-{framework}.yaml`
**Depends on:** a [CDF Profile](CDF-PROFILE-SPEC.md), a target framework
**Consumed by:** generators

---

## 1. Purpose

A Target describes **how a design system expresses itself in one framework**.
It is parametric over all components in the DS — not attached to any single
CDF Component.

A Target tells a generator:

- What framework version it targets and what file layout to produce
- What API conventions to follow (signals vs. `@Input`, hooks vs. classes)
- What styling conventions (scoped styles, `:host`, Shadow DOM, …)
- What composition conventions (standalone components, imports, dep-inj)
- What normalizations to apply (reserved names, identifier casing)
- Which Component states become DOM attributes vs. signal inputs
- What dependencies the generated code may assume

A Target does **not** describe:

- The DS vocabulary — that's the [Profile](CDF-PROFILE-SPEC.md).
- Specific components — those are [CDF](CDF-COMPONENT-SPEC.md) files.

> ### 1.1 Design principles
>
> 1. **Parametric, not per-component** — One Target serves all components.
> 2. **Framework-idiomatic** — The Target encodes the framework's conventions;
>    generators do not hardcode Angular-isms.
> 3. **Profile-bound** — A Target is paired with exactly one Profile.
> 4. **Pluggable** — Adding a framework is adding a Target, not rewriting the
>    generator.

---

## 2. Target categories

Targets fall into two categories with different shapes:

| Category          | Produces                                     | Examples                  |
| ----------------- | -------------------------------------------- | ------------------------- |
| **Implementation**| Code that IS the component at runtime        | Angular, SwiftUI, Kirby   |
| **Presentation**  | A representation of the component elsewhere  | Figma, Storybook, docs    |

An Implementation Target produces the built house.
A Presentation Target produces a blueprint or a catalogue.

Both share the identity + conformance sections of this spec. They differ in
which optional sections apply — an Implementation Target fills §§ 6–11; a
Presentation Target may fill only §§ 6, 12.

---

## 3. Conformance

A file conforms to this specification if:

1. It is valid YAML 1.2.
2. It contains all **REQUIRED** fields in [§4](#4-top-level-schema).
3. It references a Profile that exists at the declared path.
4. The declared `framework_version:` is a valid semver range for the chosen
   framework.
5. Category-specific required fields are present (Implementation-only fields
   MUST NOT appear in a Presentation Target and vice versa, unless declared
   shared).

---

## 4. Top-level schema

```yaml
# ── Identity ──────────────────────────────────────────────────
name: string                          # REQUIRED — e.g. "Formtrieb × Angular"
version: string                       # REQUIRED — semver
profile: path                         # REQUIRED — path to .profile.yaml
profile_version: string               # REQUIRED — compatible semver range
category: implementation | presentation  # REQUIRED
framework: string                     # REQUIRED — angular | kirby | figma | ...
framework_version: string             # REQUIRED — semver range
description: string                   # REQUIRED

# ── Output layout ────────────────────────────────────────────
output: Output                        # REQUIRED — where files go, how named

# ── Generation mode ──────────────────────────────────────────
generation: Generation                # REQUIRED — regen semantics per file type

# ── API conventions (Implementation) ─────────────────────────
api: ApiConventions                   # Implementation REQUIRED

# ── Styling conventions (Implementation) ─────────────────────
styling: StylingConventions           # Implementation REQUIRED if framework
                                      #                   has styling

# ── Composition conventions (Implementation) ─────────────────
composition: CompositionConventions   # Implementation REQUIRED

# ── Normalization ────────────────────────────────────────────
normalization: Normalization          # optional — reserved names, casing

# ── State → input promotion ──────────────────────────────────
state_to_input: StateToInput          # optional — which state axes become
                                      #            DOM attributes or inputs

# ── Dependencies ─────────────────────────────────────────────
dependencies: Dependencies            # optional — runtime libs generated
                                      #            code may import

# ── Presentation-specific ────────────────────────────────────
presentation: PresentationOptions     # Presentation-only — e.g. Figma
                                      #   variant-property dumps, Storybook
                                      #   controls layout
```

---

## 5. Identity

The Target's identity establishes which DS it serves, which framework it
realises, and what versions of each it is compatible with.

### 5.1 Fields

| Field               | Required | Description |
| ------------------- | -------- | ----------- |
| `name`              | Yes      | Stable identifier — conventionally `"{DS} × {Framework}"` (e.g. `"Formtrieb × Angular"`) or a hyphen-joined slug (`formtrieb-angular`). |
| `version`           | Yes      | Semver of this Target. Bumps on Target schema or output-convention changes. |
| `profile`           | Yes      | Filesystem-relative path to the Profile (`.profile.yaml`) this Target is paired with. |
| `profile_version`   | Yes      | Semver range declaring Profile compatibility. See Appendix C. |
| `category`          | Yes      | `implementation` or `presentation`. Determines which §§ apply. |
| `framework`         | Yes      | Framework identifier — `angular`, `swiftui`, `react`, `kirby`, `figma`, `storybook`, … |
| `framework_version` | Yes      | Semver range for the framework. `>=19` for Angular 19+, `^15` for SwiftUI 15.x, etc. |
| `description`       | Yes      | One-line description: which Profile, which framework, and any non-obvious scope. |

### 5.2 Stability rules

- **`name` MUST NOT change** after first publication. Downstream consumers
  identify a Target by name.
- **`profile` SHOULD be a relative path** (`./formtrieb.profile.yaml`) so the
  pair can be moved as a unit.
- **`profile_version` follows semver caret rules.** A `^1.0.0` range
  permits any 1.x Profile; switching to `^2.0.0` is a breaking change for
  the Target.
- **`framework_version` follows the framework's semver convention.** Some
  frameworks (Angular) version aggressively; others (Kirby) move slowly.
  Pick a range that reflects realistic compatibility.

### 5.3 Example — Implementation Target

```yaml
name: formtrieb-angular
version: "1.0.0"
profile: ./formtrieb.profile.yaml
profile_version: "^1.0.0"
category: implementation
framework: angular
framework_version: ">=19"
description: >
  Angular 19+ implementation Target for the Formtrieb design system.
  Standalone components, signal-based inputs, SCSS scoped styles.
```

### 5.4 Example — Presentation Target

```yaml
name: formtrieb-figma
version: "0.1.0-draft"
profile: ./formtrieb.profile.yaml
profile_version: "^1.0.0"
category: presentation
framework: figma
framework_version: "any"           # Figma is a hosted product — no semver
description: >
  Figma presentation Target — produces variant-property dumps and
  nested-instance catalogues for the Formtrieb DS, used by the Figma MCP
  bridge to maintain spec ↔ design parity.
```

### 5.6 Identifier Template DSL

A Target derives concrete framework expressions (CSS prefixes, Swift type
prefixes, file names, etc.) from the Profile's abstract `identifier:`
(Profile §9.2) using a small template language. Target fields that accept
templates are documented as "template-allowed" in their field tables.

**Placeholders referencing the Profile identifier:**

| Placeholder       | Transform                                         | Example (`identifier: "ft"`) |
| ----------------- | ------------------------------------------------- | ---------------------------- |
| `{identifier}`    | As-written (lowercase, kebab-safe from Profile)   | `ft`                         |
| `{IDENTIFIER}`    | UPPER                                             | `FT`                         |
| `{Identifier}`    | PascalCase (each hyphen segment capitalised)      | `Ft`                         |
| `{identifier-kebab}` | Explicit kebab-case (same as default)          | `ft`                         |

**Placeholders referencing a component name** (resolved per emission):

| Placeholder          | Transform                                         | Example (component `TextInput`) |
| -------------------- | ------------------------------------------------- | ------------------------------- |
| `{name}`             | Raw component name (as declared in the Component) | `TextInput`                     |
| `{name-kebab}`       | kebab-case                                        | `text-input`                    |
| `{name-camel}`       | camelCase                                         | `textInput`                     |
| `{NamePascal}`       | PascalCase                                        | `TextInput`                     |
| `{name-snake}`       | snake_case                                        | `text_input`                    |

**Composition placeholders** used inside Target-declared patterns:

| Placeholder   | Bound to                                                |
| ------------- | ------------------------------------------------------- |
| `{prefix}`    | The Target-resolved prefix value (e.g. derived `ft-`)  |
| `{component}` | Component name, cast to the Target's relevant casing   |
| `{modifier}`  | A modifier value (property value or state axis value)  |
| `{child}`     | An anatomy child part name                              |

**Example — Web Target derives from identifier:**

```yaml
# Profile §9
naming:
  identifier: "ft"

# Web Target §9
styling:
  css_prefix:   "{identifier}-"        # → "ft-"
  token_prefix: "--{identifier}-"      # → "--ft-"
  pattern:      "{prefix}{component}--{modifier}__{child}"
  # emits: .ft-button--brand__label
```

**Example — Swift Target derives from identifier:**

```yaml
# Swift Target §8
api:
  type_prefix:  "{IDENTIFIER}"         # → "FT"
  type_pattern: "{prefix}{NamePascal}" # → "FTTextInput"
```

**Explicit overrides** — any template-allowed field MAY take a literal
string instead, for DSes that need a platform-specific brand:

```yaml
# e.g. Swift uses the full brand name, Web uses the short form
styling:
  css_prefix: "ft-"                    # template OR explicit literal
api:
  type_prefix: "Formtrieb"             # explicit override (not derived)
```

**Rules:**

1. A template MUST resolve at Target-load time (before component emission).
   Unresolved placeholders (e.g. `{identifier}` when no identifier is
   declared) are Target-validation errors.
2. Unknown placeholders in a template are errors. The DSL is closed —
   Targets MAY NOT invent new placeholders ad hoc.
3. Transforms compose left-to-right in their casing semantics: Pascal-of-
   lowercase is unambiguous; Pascal-of-UPPER is identity.

---

## 6. Output

The `output:` block declares **where generated files go and how they are
named**. Generators use it to compute final file paths from component
identity + artefact type.

### 6.1 Fields

| Field           | Required | Description |
| --------------- | -------- | ----------- |
| `base_dir`      | Yes      | Root directory for generated files, relative to a generator-supplied workspace root. |
| `structure`     | Yes      | Layout strategy — `flat` (one folder per component under `base_dir`) or `nested` (folders by category). |
| `shared_dir`    | No       | Subdirectory under `base_dir` for cross-component artefacts (shared types, styles, helpers). Defaults to `_shared`. |
| `files`         | Yes      | Map of artefact type → filename pattern. See §6.3. |
| `class_suffix`  | No       | Suffix appended to component class names (Angular `Component`, React `View`, Vue nothing). Empty string permitted. |

### 6.2 `structure` strategies

- **`flat`** — every component gets a folder directly under `base_dir`:
  `generated/angular/button/button.component.ts`. Easiest to find files by
  name. Used by Formtrieb.
- **`nested`** — components are grouped by category:
  `generated/angular/actions/button/button.component.ts`. Useful for
  large DSes with many components per category. Validator MAY warn if
  `category` values from the Profile are not slug-safe.

### 6.3 `files:` — filename patterns

Each entry maps an artefact type to a filename pattern. Patterns may use
placeholders:

| Placeholder           | Resolves to |
| --------------------- | ----------- |
| `{name}`              | Component name in the framework's preferred casing — kebab for filenames, PascalCase for class names. Generator decides per position. |
| `{name-kebab}`        | Force kebab-case. |
| `{NamePascal}`        | Force PascalCase. |
| `{name-camel}`        | Force camelCase. |
| `{category}`          | Category slug from Profile. |
| `{ext}`               | Framework-implied extension when omitted from the pattern. |

Common artefact keys (consumers may add their own):

| Key         | Typical use |
| ----------- | ----------- |
| `component` | The main component file. |
| `template`  | Separate template file (Angular `.html`, SwiftUI does not). |
| `styles`    | Separate stylesheet (Angular `.scss`, SwiftUI does not). |
| `stories`   | Storybook stories. |
| `test`      | Unit tests. |
| `index`     | Re-export barrel. |

### 6.4 Disabling artefact types

Set the value to `null` to skip an artefact entirely:

```yaml
files:
  component: "{name}.component.ts"
  template: "{name}.component.html"
  styles: "{name}.component.scss"
  stories: "{name}.stories.ts"
  test: null                          # skip generating test files
```

### 6.5 Example — Formtrieb × Angular

```yaml
output:
  base_dir: ./generated/angular
  structure: flat
  shared_dir: _shared
  files:
    component: "{name}.component.ts"
    template: "{name}.component.html"
    styles: "{name}.component.scss"
    stories: "{name}.stories.ts"
    test: null
  class_suffix: Component
```

Resolved for the Button component: `generated/angular/button/button.component.ts`,
class name `ButtonComponent`.

---

## 7. Generation mode

The `generation:` block declares **regen semantics** — what happens when the
generator runs against a workspace that already contains generated files.
This decision is per-Target, sometimes per-artefact, and load-bearing for
how teams collaborate around generated code.

### 7.1 Modes

| Mode             | Behaviour |
| ---------------- | --------- |
| `aggressive`     | Regenerate fully every run. Spec is the only truth; humans MUST NOT edit the file. Diffs from the previous run are overwritten. |
| `scaffold-once`  | Create the file from the spec on first run; subsequent runs MUST NOT touch it. The human owns the file after creation. |
| `merge`          | Structured merge — generator owns specific regions (declared by stable markers); the human owns the rest. |
| `complete`       | Single mode applied to all artefacts. Convenience shorthand; details depend on per-artefact defaults declared by the framework. |

### 7.2 Block forms

**Single-mode form** — all generated artefacts use the same policy:

```yaml
generation:
  mode: aggressive
```

**Per-artefact form** — different policies per file type:

```yaml
generation:
  artefacts:
    component: aggressive            # .ts is spec-truth
    template: scaffold-once          # .html is human-owned after first scaffold
    styles: scaffold-once            # .scss is human-owned after first scaffold
    stories: aggressive
```

The `complete` shorthand expands to framework-recommended per-artefact
policies. For Angular, the canonical expansion is:

```yaml
artefacts:
  component: aggressive
  template: scaffold-once
  styles: scaffold-once
  stories: aggressive
  test: aggressive
```

### 7.3 Markers — required for `merge` mode

A `merge` mode artefact MUST declare region markers the generator recognises:

```yaml
generation:
  artefacts:
    template:
      mode: merge
      markers:
        begin: "<!-- @cdf-begin {region} -->"
        end:   "<!-- @cdf-end {region} -->"
```

Outside markers, the human owns the content. Inside markers, the generator
owns it. Validators MUST refuse `merge` mode without markers.

### 7.4 What `aggressive` implies for the consumer

- The file SHOULD carry an "auto-generated" header banner.
- Editors MAY suggest the file as read-only.
- CI MAY run the generator and fail if the working tree differs.
- Issue trackers SHOULD point bug reports at the spec, not the file.

### 7.5 What `scaffold-once` implies for the consumer

- The file is **absent from regen runs once it exists**.
- The generator MUST NOT diff it for drift.
- The file is part of the human-owned source tree — typically reviewed,
  refactored, hand-tuned per component.
- Schema-level changes that affect the file (e.g. a new prop the template
  should reference) require the human to update the file. The generator
  MAY emit a warning naming the spec change, but MUST NOT modify the file.

### 7.6 Example — Formtrieb × Angular

```yaml
generation:
  mode: complete                     # canonical Angular split:
                                     #   .ts aggressive, .html/.scss scaffold-once
```

Equivalent expanded form:

```yaml
generation:
  artefacts:
    component: aggressive
    template: scaffold-once
    styles: scaffold-once
    stories: aggressive
```

> **Decision rationale (Phase 6).** `.ts` is spec-truth because the API surface,
> imports, and signal wiring are mechanically derivable from the Component. `.html`
> and `.scss` are scaffold-once because real-world templates accumulate
> design-tweaks that no static spec can express; treating them as spec-truth
> would force every visual nuance into the spec, defeating the point of
> decoupling design intent from output.

---

## 8. API conventions

The `api:` block declares **how each CDF Component concept is realised in the framework's
API**. It maps Component inputs/outputs/types to framework primitives — Angular
signals, React hooks, SwiftUI bindings, Vue refs.

> **Implementation-only.** Presentation Targets (§14) realise no runtime
> API; this section MUST be omitted there.

### 8.1 Fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `inputs`      | Yes      | Map of Component property type → framework input primitive. Covers `enum`, `boolean`, `string`, `number`, `IconName`, `required`, `two_way`. See §8.2. |
| `outputs`     | Yes      | Framework primitive for events. Single value (e.g. `output` for Angular `output()`). |
| `types`       | No       | Map of Component named type → import path / package. See §8.4. |
| `reserved_names` | No    | Names that collide with framework imports. Generator suffixes collisions. See §8.5. |
| `environment_states` | No | Map of state-axis name → resolution strategy when the same state can come from environment (DOM ancestor, parent context). See §8.6. |
| `type_prefix` | No       | Prefix for typed class / view / struct names. Template-allowed. See §8.7. Relevant for Implementation Targets that emit typed identifiers (Swift, Kotlin, C#, Java, TypeScript when the Target wants a prefixed API). |
| `type_pattern` | No      | Full identifier pattern. Template-allowed. Default `"{prefix}{NamePascal}"`. See §8.7. |

### 8.2 `inputs:` mapping

Maps each Component property type to the framework primitive that realises it.
The map keys cover all property types (Component §7) plus the meta-keys
`required` and `two_way`.

```yaml
api:
  inputs:
    enum: input              # Angular: input<EnumType>(default)
    boolean: input           # Angular: input<boolean>(false)
    string: input            # Angular: input<string>('')
    number: input
    IconName: input
    required: input.required # Angular: input.required<T>() for properties marked required
    two_way: model           # Angular: model<T>(default) — for bindable: two-way (Component §7.8)
```

Validators check that every type referenced by any Component property has an
entry. Missing entries are rejected.

> **Why a per-type mapping rather than a single primitive?** Frameworks
> often use *different* primitives for different types — Angular uses
> `input.required<T>()` for required and `model<T>()` for two-way bindings.
> A flat single-primitive setting cannot express this without losing
> information.

### 8.3 `outputs:` mapping

Single value naming the framework primitive for events:

```yaml
api:
  outputs: output            # Angular output() emitter
```

If a framework uses different primitives per event payload type (rare),
the value MAY be a map keyed by payload type.

### 8.4 `types:` — external type imports

Maps Component named types (typically declared in the Profile's vocabulary) to
import paths. Generators emit the import when the type is referenced.

```yaml
api:
  types:
    IconName: "@formtrieb/ui-library/icon"     # import { IconName } from '@formtrieb/ui-library/icon'
```

A type without an entry is assumed to be either a primitive (`string`,
`boolean`, `number`) or locally declared. Validators MAY warn on
undocumented named types.

### 8.5 `reserved_names:` — framework collision handling

Some Component property and event names collide with framework imports or
language keywords. The generator MUST rename collisions per the declared
strategy:

```yaml
api:
  reserved_names:
    names: [input, output, model, effect, computed, signal, focus, blur]
    suffix: Event
```

Resolution rule: if a Component event named `input` collides with the framework's
`input` primitive, the generator emits `inputEvent`. The generator MUST
preserve the original CDF Component name in user-facing API documentation; the
suffixed name is an implementation detail.

> **Why suffix and not prefix?** Generated identifier sort order matters
> for IDE autocompletion. `inputEvent` keeps the conceptual name as the
> sort prefix; `eventInput` fragments the namespace.

### 8.6 `environment_states:` — ambient state resolution

Some state axes can be set by the consumer **on the component** OR by an
ancestor in the environment (a `disabled` `<fieldset>`, a SwiftUI
`.disabled()` modifier on a parent view). The Target declares per-axis
how the framework reconciles them:

| Strategy | Behaviour |
| -------- | --------- |
| `auto`   | Generator defers to the framework's native ancestor resolution. Angular: read `[disabled]` attribute via host binding; SwiftUI: inherit from environment. |
| `manual` | Generator emits an explicit input for the state; ancestor coordination is the consumer's job. |
| `merge`  | Generator emits both an input and an ancestor-aware computation, OR'd at runtime. |

```yaml
api:
  environment_states:
    disabled: auto
    readOnly: manual
```

Defaults: any axis listed in the Profile's `interaction_patterns.promoted`
that is also a recognised ancestor-aware state in the framework MAY default
to `auto`. Otherwise default is `manual`.

### 8.7 `type_prefix` and `type_pattern` — typed-identifier naming

For Targets whose frameworks emit named types (Swift classes, Kotlin classes,
C# classes, Java classes, TypeScript interfaces prefixed by convention),
`type_prefix` and `type_pattern` derive the concrete identifier from the
Profile's `identifier:` (Profile §9.2) plus the component name.

**Template-allowed fields. Typical derivations:**

```yaml
# Swift Target — Apple-style UPPER prefix
api:
  type_prefix:  "{IDENTIFIER}"          # → "FT"
  type_pattern: "{prefix}{NamePascal}"  # → "FTButton", "FTTextInput"

# Kotlin Target — Pascal-single-word prefix
api:
  type_prefix:  "{Identifier}"          # → "Ft"
  type_pattern: "{prefix}{NamePascal}"  # → "FtButton"

# Java Target — explicit override to match legacy package convention
api:
  type_prefix:  "Formtrieb"             # literal override
  type_pattern: "{prefix}{NamePascal}"  # → "FormtriebButton"
```

| DS identifier | Target    | Derived `type_prefix` | Emitted identifier (Button) |
| ------------- | --------- | --------------------- | --------------------------- |
| `ft`          | Swift     | `FT`                  | `FTButton`                  |
| `ft`          | Kotlin    | `Ft`                  | `FtButton`                  |
| `mp`          | Swift     | `MP`                  | `MPButton`                  |

**Relationship with Target §6 `output.class_suffix`:**

`class_suffix` is for frameworks that require a suffix on the base name
(Angular's `ButtonComponent`, React optional `ButtonView`). Suffix is
applied *after* `type_pattern` — the full emitted identifier is
`{type_pattern_expanded}{class_suffix}`.

For Angular: `type_prefix: ""` (empty — Angular convention has no prefix),
`type_pattern: "{NamePascal}"`, `class_suffix: "Component"` →
`ButtonComponent`.

For Swift: `type_prefix: "{IDENTIFIER}"`, `type_pattern: "{prefix}{NamePascal}"`,
`class_suffix: ""` → `FTButton`.

**Omission.** A Target that does not emit typed identifiers at all (a
pure-template Target, or a Web Target where CSS classes are the only
identifier surface) MAY omit both fields. Default `type_prefix: ""`,
`type_pattern: "{NamePascal}"` yields the component name unchanged.

### 8.8 Example — Formtrieb × Angular

```yaml
api:
  inputs:
    enum: input
    boolean: input
    string: input
    required: input.required
    two_way: model
  outputs: output
  types:
    IconName: "@formtrieb/ui-library/icon"
  reserved_names:
    names: [input, output, model, effect, computed, signal, focus, blur]
    suffix: Event
  environment_states:
    disabled: auto
  # Angular has no type prefix by convention — ButtonComponent, not MPButton
  type_prefix:  ""
  type_pattern: "{NamePascal}"
  # Combined with output.class_suffix: "Component" → ButtonComponent
```

---

## 9. Styling conventions

The `styling:` block declares **how visual concerns are realised in the
framework's stylesheet language**. It covers typography, sizing, focus
rendering, hierarchy buckets, and motion defaults.

> **Implementation-only.** Presentation Targets without a styling layer
> MUST omit this section. Frameworks that have no separate stylesheet
> (SwiftUI inline modifiers, React Native StyleSheet) MAY still use this
> block to declare their idioms.

This section ties closely to Profile §9 (Naming). Where Profile declares
the DS-level vocabulary, Target declares the framework-level idiom.

### 9.1 Fields

| Field               | Required | Description |
| ------------------- | -------- | ----------- |
| `css_prefix`        | No       | CSS class prefix for this DS × framework. Template-allowed. Default `"{identifier}-"`. See §9.2.1. |
| `token_prefix`      | No       | CSS custom-property prefix. Template-allowed. Default `"--{identifier}-"`. See §9.2.1. |
| `methodology`       | No       | Class-naming methodology — `BEM` \| `plain`. Default `BEM`. See §9.2.2. |
| `pattern`           | No       | Class-naming pattern template. Default (BEM) `"{prefix}{component}--{modifier}__{child}"`. See §9.2.2. |
| `casing`            | No       | Target-specific casing (currently: `css_selectors`). See §9.2.3. |
| `typography`        | No       | Strategy for emitting typography token bindings. See §9.3. |
| `sizing`            | No       | Strategy for emitting size tokens (height, padding, gap). Default `token` (direct CSS variable). |
| `focus`             | No       | Strategy for the focus ring — outline, ring (Tailwind), platform-default. See §9.5. |
| `hierarchy_buckets` | No       | Coarse groupings of hierarchy values for shared styling. See §9.6. |
| `transitions`       | No       | Default transition duration and easing for state changes. See §9.7. |
| `style_encapsulation` | No     | Component-style scope: `scoped` (Angular default), `shadow`, `global`, `module-css`, `none`. |
| `state_guards`      | No       | Web-Target-wide CSS selector fragments per state value. See §9.8. |

### 9.2 Naming — prefixes, methodology, pattern, casing

The Web Target's naming block derives concrete CSS identifiers from the
Profile's abstract `identifier:` (Profile §9.2) plus a few framework-level
choices (BEM vs. plain, selector casing).

#### 9.2.1 `css_prefix` and `token_prefix`

The CSS class prefix and custom-property prefix applied to every selector
and custom property the Target emits. Conventionally a trailing hyphen so
concatenation with a component name produces a valid identifier.

**Derived default** (from Profile `identifier:`):

```yaml
styling:
  css_prefix:   "{identifier}-"        # → ft-
  token_prefix: "--{identifier}-"      # → --ft-
```

**Explicit override** (for DSes where the Web prefix deviates from the
abstract identifier):

```yaml
styling:
  css_prefix: "formtrieb-"             # literal; ignores Profile identifier
  token_prefix: "--formtrieb-"
```

| DS        | Profile `identifier` | Derived `css_prefix` | Emitted class    |
| --------- | -------------------- | -------------------- | ---------------- |
| Formtrieb | `ft`                 | `ft-`                | `.ft-button`     |
| Acme      | `acme`               | `acme-`              | `.acme-button`   |

#### 9.2.2 `methodology` and `pattern`

`methodology` names the class-naming convention:

- `BEM` — Block / Element / Modifier. `pattern` MUST use `{prefix}`,
  `{component}`, `{modifier}`, `{child}`.
- `plain` — single-class identifiers only. No modifier or child structure.

The canonical BEM pattern:

```yaml
methodology: BEM
pattern: "{prefix}{component}--{modifier}__{child}"
```

Emits for Button's `container` anatomy, hierarchy `brand`:

```
.ft-button--brand
.ft-button__container
.ft-button--brand:hover     # with state guard from §9.8
```

#### 9.2.3 `casing`

Target-specific casing for identifiers the Target emits that are NOT
already fixed by the Profile. Currently:

| Key              | Applies to                         | Typical value  |
| ---------------- | ---------------------------------- | -------------- |
| `css_selectors`  | Class names inside the BEM pattern | `kebab-case`   |

File-name casing is declared per-artefact in Target §6 `output.files`.
DS-level casings (`component_names`, `properties`, `token_paths`) live in
Profile §9.3 and apply uniformly to every Target.

### 9.3 `typography:` — emission strategy

Typography rarely fits a single token-per-property model. The Target
declares one of three strategies:

| Strategy | Output |
| -------- | ------ |
| `token`  | Each typography sub-property (`font-family`, `font-size`, …) emitted as a separate CSS variable assignment. Most direct, most verbose. |
| `mixin`  | Generator emits a single mixin call; the mixin (provided by the framework's stylesheet helpers) expands to the full set. |
| `class`  | Generator emits a typography utility class on the element; class definitions live elsewhere (Tailwind, Bootstrap-style). |

**Mixin strategy** declares how the mixin is imported and called:

```yaml
styling:
  typography:
    strategy: mixin
    import: "@use '../../../../css/typography' as *"
    call: "@include typography('{token-name}')"
```

Placeholder `{token-name}` substitutes the typography token reference from
the Component (e.g. `label.large`).

### 9.4 `sizing:` — emission strategy

| Strategy | Output |
| -------- | ------ |
| `token`  | Direct CSS variable: `height: var(--ft-controls-height-base)`. Default. |
| `class`  | Utility class: `class="ft-h-base"`. |
| `inline` | Inline style binding: `style="height: {{computedHeight}}"`. Avoid for performance-sensitive paths. |

### 9.5 `focus:` — focus ring rendering

The Profile declares whether a category supports focus (Profile §11);
the Target declares **how** the framework renders it.

| Strategy | Output |
| -------- | ------ |
| `outline`        | CSS `outline` + `outline-offset`, two ring stack via box-shadow when needed. |
| `box-shadow`     | Pure box-shadow stack — useful for components inside `overflow: hidden` parents. |
| `platform`       | Defer to the platform's native focus indicator (SwiftUI, AppKit, native HTML defaults). No CSS emitted. |

When tokens drive the ring colors:

```yaml
styling:
  focus:
    strategy: outline
    tokens:
      outer: "--ft-focus-ring-outer"
      inner: "--ft-focus-ring-inner"
```

### 9.6 `hierarchy_buckets:` — coarse groupings

A DS may have many hierarchy values that share styling at a coarse level
(all "filled" hierarchies share padding; all "ghost" hierarchies share
text-only treatment). Buckets let the Target declare these groupings without
the Component restating them per component:

```yaml
styling:
  hierarchy_buckets:
    filled: [brand, primary, secondary]
    ghost:  [tertiary, tertiaryWithoutPadding]
```

Generators MAY use buckets to share modifier rules — the Angular generator
emits `&.ft-button--brand, &.ft-button--primary, &.ft-button--secondary`
rather than three separate blocks.

### 9.7 `transitions:` — motion defaults

Default duration and easing applied when no token-bound transition is
declared on the component:

```yaml
styling:
  transitions:
    default_duration: "150ms"
    default_easing: ease
```

Components remain free to override per-property in their `behavior:`
declarations (Component §14).

### 9.8 `state_guards:` — Web-wide state selector fragments

A state guard is a **CSS selector fragment** appended to a component's root
class to scope state-dependent styling. A `hover:` guard of
`:hover:not([disabled])` means every component's hover rule applies to
`.{prefix}{component}:hover:not([disabled])` — disabled elements never
hover-highlight.

State-guard keys match state axis values from Profile §10 Interaction
Patterns. A Component MAY override individual guards in its `css.states:`
block (Component §16) when the component needs an additional inhibitor
(e.g. Button excludes `.pending`, InputCore excludes `.readonly`).

The canonical four guards:

| State      | Template selector                      | Rationale                        |
| ---------- | -------------------------------------- | -------------------------------- |
| `hover`    | `:hover:not([disabled])`               | No hover feedback when disabled  |
| `pressed`  | `:active:not([disabled])`              | No press feedback when disabled  |
| `focused`  | `:focus-visible`                       | Keyboard focus only, not mouse   |
| `disabled` | `[disabled], [aria-disabled='true']`   | HTML + ARIA disabled variants    |

**Merge semantics with a Component's `css.states:`** (per-key, not per-block):

- **Replace** — when a key is present in both, the Component value wins.
- **Add** — when a key is present only in the Component, it's a
  component-specific state with no DS-wide default.
- **Inherit** — when a key is present only in the Target, the Component
  inherits verbatim.

A Component that overrides `hover` still inherits the Target's `focused`
and `disabled` guards.

```yaml
styling:
  state_guards:
    hover:    ":hover:not([disabled])"
    pressed:  ":active:not([disabled])"
    focused:  ":focus-visible"
    disabled: "[disabled], [aria-disabled='true']"
```

And in a Component that extends the defaults:

```yaml
# Button — additionally excludes pending from hover and pressed
css:
  states:
    hover:   ":hover:not([disabled]):not(.ft-button--pending)"
    pressed: ":active:not([disabled]):not(.ft-button--pending)"
    # focused and disabled inherit from the Target
```

> **Migration note.** `state_guards:` lived in the Profile (`css_defaults.state_guards`)
> through v1.0.0-draft. Moved here in the layer-boundary review pass because the
> field is purely Web-specific and has no meaningful interpretation in non-Web
> Targets.

### 9.9 Example — Formtrieb × Angular

```yaml
styling:
  # Naming — derived from Profile identifier "ft"
  css_prefix:   "{identifier}-"             # → ft-
  token_prefix: "--{identifier}-"           # → --ft-
  methodology:  BEM
  pattern:      "{prefix}{component}--{modifier}__{child}"
  casing:
    css_selectors: kebab-case
  # Visual idioms
  typography:
    strategy: mixin
    import: "@use '../../../../css/typography' as *"
    call: "@include typography('{token-name}')"
  sizing:
    strategy: token
  hierarchy_buckets:
    filled: [brand, primary, secondary]
    ghost:  [tertiary, tertiaryWithoutPadding]
  focus:
    strategy: outline
    tokens:
      outer: "--ft-focus-ring-outer"
      inner: "--ft-focus-ring-inner"
  transitions:
    default_duration: "150ms"
    default_easing: ease
  style_encapsulation: scoped
  state_guards:
    hover:    ":hover:not([disabled])"
    pressed:  ":active:not([disabled])"
    focused:  ":focus-visible"
    disabled: "[disabled], [aria-disabled='true']"
```

---

## 10. Composition conventions

The `composition:` block declares **how component composition is realised**
— what a slot is in this framework, how `extends` materialises, how labels
attach to inputs, how overlays mount.

> **Implementation-only.**

### 10.1 Fields

| Field               | Required | Description |
| ------------------- | -------- | ----------- |
| `strategy`          | Yes      | How the framework structures each component file. See §10.2. |
| `slot_element`      | Yes      | The framework primitive for content projection — `ng-content`, `slot`, `children`, `@ViewBuilder`. |
| `label_association` | No       | Default mechanism for label ↔ input association (§10.4). |
| `overlay`           | No       | Strategy for overlays / popovers / dialogs (§10.5). |
| `extends_strategy`  | No       | How a Component's `extends` (Component §5.3) materialises in the framework (§10.6). |
| `imports`           | No       | Default import mechanism for nested components (§10.7). |

### 10.2 `strategy` — file composition shape

| Strategy   | Layout |
| ---------- | ------ |
| `split`    | Component split into logic file + template file + style file (Angular default). |
| `single-file` | All concerns in one file (Vue SFC, Svelte, React + JSX). |
| `class`    | One class file with template inline as a string or template literal. |

This drives the §6 `output.files` shape — `split` requires `template` and
`styles` entries; `single-file` requires only `component`.

### 10.3 `slot_element`

Names the framework primitive that receives projected content:

```yaml
composition:
  slot_element: ng-content        # Angular
  # slot_element: slot            # Web Components
  # slot_element: children        # React (children prop)
  # slot_element: ViewBuilder     # SwiftUI
```

Multi-slot mapping (when the framework has named slots):

```yaml
composition:
  slot_element:
    default: ng-content
    header: "ng-content[select='[slot=header]']"
    footer: "ng-content[select='[slot=footer]']"
```

### 10.4 `label_association`

How a Form-Control component associates with its label. Drives the
generated template for InputGroup-style components (Component §15
`label_association`).

| Strategy            | Behaviour |
| ------------------- | --------- |
| `for-id`            | `<label for="x">` ↔ `<input id="x">`. Default for HTML. |
| `aria-labelledby`   | `aria-labelledby="x"` on the input, `id="x"` on the label. Useful when `for/id` is impractical (ShadowDOM, dynamic id). |
| `nested`            | Input is wrapped inside the label. No id needed. Less flexible for layout. |
| `framework-binding` | Framework provides its own binding (SwiftUI `Label`, React's `useId`). |

### 10.5 `overlay:` — overlay mount strategy

Components like Popover, Dialog, Tooltip need to escape the document flow.
The Target declares the mechanism:

```yaml
composition:
  overlay:
    strategy: cdk             # Angular CDK Overlay
    # strategy: portal        # React-style portal
    # strategy: teleport      # Vue Teleport
    # strategy: native        # native <dialog>, <popover>
    # strategy: window        # SwiftUI .popover / NSPanel
```

Each strategy implies generator behaviour for components that declare an
overlay anatomy part. A future revision of this spec will formalise the
field shape (mount node, transition timing, focus-trap binding).

### 10.6 `extends_strategy`

How a Component's `extends` (Component §5.3 — structural HAS-A composition) materialises:

| Strategy   | Output |
| ---------- | ------ |
| `wrapper`  | Generator emits a wrapper component that imports and templates the extended component. Default. |
| `inline`   | Generator merges promoted properties directly into the parent template at generation time. No runtime wrapper. |
| `mixin`    | Generator uses framework mixin/inheritance (rarely available; SwiftUI ViewModifier). |

```yaml
composition:
  extends_strategy: wrapper
```

The choice trades off file size (inline is smaller) against runtime
flexibility (wrapper allows the inner component to evolve independently).

### 10.7 `imports:` — nested component import mechanism

Default mechanism the generator uses when one component references another
(via `anatomy.{part}.component:`):

| Strategy        | Output |
| --------------- | ------ |
| `relative`      | Relative path imports (`../icon/icon.component`). Default for monorepo packages. |
| `package`       | Package-name imports (`@formtrieb/ui-library/icon`). For published libraries. |
| `barrel`        | Single barrel re-export (`@formtrieb/ui-library`). Trades tree-shaking for ergonomics. |

Per-component overrides MAY be declared in §11 `dependencies.external`.

### 10.8 Example — Formtrieb × Angular

```yaml
composition:
  strategy: split
  slot_element: ng-content
  label_association: for-id
  overlay:
    strategy: cdk
  extends_strategy: wrapper
  imports: relative
```

---

## 11. Dependencies

The `dependencies:` block declares **what runtime libraries the generated
code may import**. It serves both as a generator constraint (refuse to emit
imports outside this list) and as a documentation surface for downstream
consumers (build tools, security audits).

> **Implementation-only.**

### 11.1 Fields

| Field         | Required | Description |
| ------------- | -------- | ----------- |
| `resolution`  | No       | How the generator resolves dependency references. `auto` (default) — generator infers from imports map. `manual` — every external dependency MUST be explicitly listed in `external`. |
| `framework_core` | No    | Allow-list of imports from the framework's own core packages. Defaults to the framework's canonical core (`@angular/core`, `react`, `vue`). |
| `external`    | No       | Map of name → import declaration for non-core dependencies referenced from CDF Components (Icons, LoadingSpinner, …). See §11.3. |
| `loading_indicator` | No | Name of the `external` entry to use as the loading/spinner component. Generators reference this for `pending` state rendering. |

### 11.2 `framework_core`

Defaults to a framework-canonical list. Override only when a Target
restricts itself further (e.g. a server-only Angular Target excluding
`@angular/animations`).

```yaml
dependencies:
  framework_core:
    - "@angular/core"
    - "@angular/common"
    - "@angular/cdk"
```

### 11.3 `external` — non-core imports

Each entry names a dependency that CDF Components may reference by name. The
generator emits the import statement when the name appears.

```yaml
dependencies:
  external:
    LoadingSpinner:
      import: "@formtrieb/ui-library/loading-spinner"
      selector: ft-loading-spinner
    Icon:
      import: "@formtrieb/ui-library/icon"
      selector: ft-icon
```

Fields per entry:

| Field      | Required | Description |
| ---------- | -------- | ----------- |
| `import`   | Yes      | Module specifier (`@scope/package/subpath` or relative path). |
| `selector` | No       | DOM selector / template element name. Required for components used in templates. |
| `members`  | No       | Specific named imports. Defaults to the entry name. |

### 11.4 Ties to Profile `assets`

The Profile's `assets:` block (Profile §13) declares **how assets are
consumed** at the DS level (`origin: package` × `consumption: ts-registry`).
The Target's `dependencies.external` realises this for the framework — the
import path is the framework-resolvable expression of what the Profile
described abstractly.

A future revision may auto-derive `external` entries from `assets` to
remove the duplication.

### 11.5 `loading_indicator`

Names which `external` entry is the loading/spinner component. Generators
use it when emitting code for the `pending` state of pressable components.

```yaml
dependencies:
  loading_indicator: LoadingSpinner
```

If unset, components with a `pending` state MUST declare their loading
indicator inline via anatomy.

### 11.6 Example — Formtrieb × Angular

```yaml
dependencies:
  resolution: auto
  framework_core:
    - "@angular/core"
    - "@angular/common"
    - "@angular/cdk"
  external:
    LoadingSpinner:
      import: "@formtrieb/ui-library/loading-spinner"
      selector: ft-loading-spinner
  loading_indicator: LoadingSpinner
```

---

## 12. Normalization

The `normalization:` block declares **per-name and per-axis adjustments**
the generator applies *after* reading the Component but *before* emitting code.
Normalization is the place for framework-specific cosmetics — name
collisions, casing overrides, host-element behaviour — that should not
leak back into the Component or Profile.

> **Implementation-only.**
> **Applies after spec read, before code emit.** Normalization MUST NOT
> change the Component's semantics — only its surface representation in the
> generated code.

### 12.1 Fields

| Field             | Required | Description |
| ----------------- | -------- | ----------- |
| `properties`      | No       | Map of property name → strategy. See §12.2. |
| `states`          | No       | Map of state-axis name → adjustments. See §12.3. |
| `constraints`     | No       | How `mutual_exclusion` and `conditional` (Component §7.9, §7.10) are enforced. See §12.4. |
| `host`            | No       | Host-element behaviour defaults (focus on click, overflow handling). See §12.5. |
| `css_class_names` | No       | Override default kebab-case for specific property/state values. See §12.6. |
| `casing`          | No       | Identifier casing rules per position (class / prop / CSS variable). See §12.7. |

### 12.2 `properties:` — per-property strategy

Adjustments applied to a specific property at code-emit time:

```yaml
normalization:
  properties:
    tertiaryWithoutPadding:
      strategy: keep              # emit as-is, no normalization
    formType:
      strategy: rename
      from: type                  # Component says "type", emit as "formType" to avoid HTML clash
```

| Strategy | Behaviour |
| -------- | --------- |
| `keep`   | Emit as written in the Component. |
| `rename` | Rename per the `from` field. Used when the Component name collides with framework reserved names AND `api.reserved_names` cannot resolve it positionally. |
| `omit`   | Suppress the property entirely in generated code. Rare — typically for properties that are framework-implicit. |

### 12.3 `states:` — per-state adjustments

```yaml
normalization:
  states:
    disabled:
      preserve_focus: true        # disabled element stays focusable (aria-disabled, not [disabled])
    pending:
      css: class                  # use class strategy even if the global default is attribute
```

Per-state options:

| Option           | Description |
| ---------------- | ----------- |
| `preserve_focus` | Boolean. When true, the disabled state uses `aria-disabled` instead of the native `[disabled]` attribute, preserving focusability. |
| `css`            | Override the CSS-emission strategy from Component §16 (`class` / `attribute` / `custom-property`) for this state. |

### 12.4 `constraints:` — mutual-exclusion enforcement

How the generator enforces Component-declared mutual exclusions (§7.9) and
conditionals (§7.10):

```yaml
normalization:
  constraints:
    strategy: runtime
```

| Strategy | Behaviour |
| -------- | --------- |
| `runtime`     | Emit runtime checks (assertion / `console.warn` in dev, no-op in prod). Default. |
| `compile`     | Encode in TypeScript types where possible (discriminated unions, `never` branches). |
| `none`        | Generator emits no enforcement; consumer is trusted. |

### 12.5 `host:` — host element behaviour

Defaults for the component's root element when it is the framework's
`:host`:

```yaml
normalization:
  host:
    click_to_focus: true          # clicking the host moves focus to the host
    text_overflow: ellipsis       # default text-overflow on host children
```

These are emitted as host-binding rules (Angular `@HostBinding`) or the
framework's equivalent.

### 12.6 `css_class_names:` — kebab-case overrides

By default, property and state values become kebab-case CSS class modifiers
(`ft-button--primary`, `ft-input-core--has-value`). Some values need
explicit overrides — e.g. matching HTML conventions:

```yaml
normalization:
  css_class_names:
    readOnly: readonly            # match the HTML "readonly" attribute
    hasValue: has-value           # explicit hyphenation (default would be "hasvalue")
```

The validator MAY warn on values that produce ambiguous kebab forms
(double-cap → unclear hyphen position).

### 12.7 `casing:` — identifier-casing rules

Rules for how identifiers are rendered per position. Most frameworks have
fixed conventions; this block is for Targets that deviate or need to
declare them explicitly.

```yaml
normalization:
  casing:
    class:    PascalCase           # ButtonComponent
    prop:     camelCase            # iconStart
    css_var:  kebab-case           # --ft-button-bg
    enum_value: camelCase          # tertiaryWithoutPadding
```

Defaults follow the framework's idiom: Angular uses PascalCase classes,
camelCase props, kebab CSS vars; SwiftUI uses PascalCase for everything
public. Validators apply defaults from a per-framework table.

### 12.8 Example — Formtrieb × Angular

```yaml
normalization:
  properties:
    tertiaryWithoutPadding:
      strategy: keep
  states:
    disabled:
      preserve_focus: true
    pending:
      css: class
  constraints:
    strategy: runtime
  host:
    click_to_focus: true
    text_overflow: ellipsis
  css_class_names:
    readOnly: readonly
    hasValue: has-value
```

---

## 13. State → input promotion

The `state_to_input:` block declares **which Component state axes become consumer
inputs** (DOM attributes, parent-controllable props) versus which stay
internal to the component.

> **Concept ↔ Profile.** `state_to_input:` is the concrete, framework-level
> half of the same concept whose abstract, DS-level half is
> `interaction_patterns.promoted` in the Profile (Profile §10.6). Profile
> declares *that* a state crosses the component boundary; this block
> declares *how* — which DOM attribute, ARIA pairing, or framework
> primitive realises the boundary crossing.

> **Implementation-only.**
> **Composes with Profile.** The Profile's `interaction_patterns.promoted`
> (Profile §10.6) declares the DS-level baseline; the Target adds
> framework-specific promotions. The merge is additive — the Target can
> add but not remove.

### 13.1 Why this exists

Component state axes (Component §8) are declared as runtime-managed; the component
reacts to events and switches its own visual state. But some axes are
*also* meaningfully set by the consumer:

- `disabled` — the consumer disables a button.
- `pending` — the consumer marks a form-submit as in-flight.
- `readOnly` — the parent form puts an input into read-only mode.

When an axis is consumer-set, it needs a framework input — a prop, a
signal, a DOM attribute. When it isn't, the component owns it entirely.

The Profile declares which axes are conceptually consumer-set across the
DS. The Target maps that to framework primitives.

### 13.2 Forms

**List form** — names the axes that become consumer inputs:

```yaml
state_to_input:
  - disabled
  - pending
  - loading
  - readOnly
```

**Map form** — declares per-axis the input mechanism:

```yaml
state_to_input:
  disabled:
    mechanism: dom-attribute       # <button [disabled]="...">
    aria_only: false               # use native [disabled], not aria-disabled
  pending:
    mechanism: input-signal        # input<boolean>(false)
  readOnly:
    mechanism: dom-attribute
```

| Mechanism        | Output |
| ---------------- | ------ |
| `dom-attribute`  | Native HTML attribute on the host element. Best for native ARIA semantics. |
| `aria-attribute` | `aria-*` attribute only. Used when the element doesn't support a native attribute (e.g. role=button on a div). |
| `input-signal`   | Framework input primitive (Angular `input()`, React prop, etc.). |
| `both`           | Emit both the input and the attribute, kept in sync. |

### 13.3 Composition with Profile

Effective set = `Profile.interaction_patterns.promoted` ∪ `Target.state_to_input`.

The Target MUST NOT remove an axis declared by the Profile. If a framework
fundamentally cannot honour a promotion (e.g. a non-DOM Target promoting
`disabled`), the Target SHOULD use the `mechanism` field to declare the
nearest equivalent rather than silently dropping the promotion.

**Name resolution.** Entries in `Profile.promoted` and `Target.state_to_input`
identify axes by name. A CDF Component SHOULD use the canonical axis name
from its Profile (`disabled`, not `blocked`) — the Profile's
`interaction_patterns` section is the DS vocabulary for axis names. If a
Component deliberately renames an axis, a consumer MUST treat that
Component as non-promoting for the renamed axis under this Target; the
Target never rewrites Component axis names on its own. Bridging renamed
axes to the Profile's canonical names is planned for a future revision and
is out of scope for v1.0.0-draft.

#### 13.3.1 Web realisation of Profile's canonical markers

The Profile declares observable state markers abstractly (Profile §10.6 —
"externally observable"). A Web Target realises them with the following
canonical mapping:

| Profile marker        | Web realisation                 | Rationale                                   |
| --------------------- | ------------------------------- | ------------------------------------------- |
| `disabled`            | `[disabled]` attribute on native controls; `[aria-disabled="true"]` on non-native | Native form semantics + `:disabled` pseudo-class |
| `focused`             | `:focus-visible` pseudo-class   | Browser-managed, not author-set             |
| `validation: error`   | `[aria-invalid="true"]`         | ARIA contract for input validation          |
| `open` (expandable)   | `[aria-expanded="true\|false"]` | ARIA contract for disclosure widgets        |
| `selected`            | `[aria-selected="true"]` or `[aria-pressed]` depending on role | ARIA contract for selection state |

A non-Web Target (SwiftUI, Kirby, Figma) declares its own mapping in its
own spec. The shape of each mapping is framework-specific; what matters is
that the Profile's abstract marker is honoured by *some* boundary-crossing
mechanism.

### 13.4 Interaction with `api.environment_states`

§8.6 `environment_states` and §13 `state_to_input` overlap for ancestor-
aware states like `disabled`. The split:

- **`state_to_input`** decides *whether* the axis is exposed to the consumer.
- **`environment_states`** decides *how* the exposed axis is reconciled with
  ancestor environment.

A typical Angular `disabled` axis appears in both:

```yaml
api:
  environment_states:
    disabled: auto                 # reconcile with ancestor [disabled]

state_to_input:
  - disabled                       # exposed as <button [disabled]>
```

### 13.5 Example — Formtrieb × Angular (list form)

```yaml
state_to_input:
  - disabled
  - pending
  - loading
  - readOnly
```

### 13.6 Example — Map form with explicit mechanisms

```yaml
state_to_input:
  disabled:
    mechanism: dom-attribute
  pending:
    mechanism: input-signal
  readOnly:
    mechanism: dom-attribute
  validation:
    mechanism: aria-attribute      # aria-invalid only — no native [validation]
```

---

## 14. Presentation options

The `presentation:` block declares **per-framework options for Presentation
Targets** (Figma, Storybook, docs sites). These Targets do not emit runtime
code — their output is consumed by a design tool, a documentation site, or
a component catalogue.

> **Presentation-only.** Implementation Targets MUST omit this block.

The block is a free-form map keyed by framework. The shape of each entry
is framework-specific; this section documents the conventions for the
three currently-anticipated frameworks (Figma, Storybook, docs).

### 14.1 Figma options

Reshapes the data that lived in the legacy in-CDF `figma:` block (CDF v0.x)
into a Target artefact, where it belongs.

```yaml
presentation:
  figma:
    component_set:
      arrange: auto                 # auto-arrange variants in a grid
      grid:
        columns_axis: hierarchy     # which Component axis becomes columns
        rows_axis: interaction      # which Component axis becomes rows
        gap: 24
    variant_properties:
      include: all                  # all | listed | exclude
      # listed: [hierarchy, size]
      # exclude: [validation]       # rarely needed
    nested_instances:
      sync: true                    # generator updates nested instances
                                    # when parent components change
      mapping_source: cdf-anatomy   # use anatomy.{part}.component links
    naming:
      component: "{ComponentPascal}"
      variant: "{property}={value}"
    publish:
      mode: draft                   # draft | published
      library: formtrieb-ui
```

| Field             | Description |
| ----------------- | ----------- |
| `component_set`   | Component-set arrangement on the Figma canvas. |
| `variant_properties` | Which Component properties become Figma variant properties. Default: all. |
| `nested_instances` | Strategy for nested-instance synchronisation. |
| `naming`          | Pattern templates for component and variant names in Figma. |
| `publish`         | Library publication settings. |

### 14.2 Storybook options

```yaml
presentation:
  storybook:
    args_layout: controls           # controls | tables | hidden
    controls:
      enum: select                  # select | radio | inline-radio
      boolean: boolean
      string: text
    play_functions: false           # generate Testing-Library interaction tests
    docs:
      autodocs: true                # generate docs page from spec
      source_format: typescript
    decorators:
      theme_picker: true            # inject a theme/semantic picker
      rtl_toggle: false
```

| Field          | Description |
| -------------- | ----------- |
| `args_layout`  | How property controls render in the addons panel. |
| `controls`     | Per-property-type control widget mapping. |
| `play_functions`| Whether to generate `play` functions for interaction tests. |
| `docs`         | Autodocs / MDX integration. |
| `decorators`   | Story-level decorators injected globally. |

### 14.3 Docs options

For Markdown / MDX / static-site docs generators:

```yaml
presentation:
  docs:
    format: mdx                     # md | mdx | jsx
    code_examples:
      framework: angular            # which Implementation Target's syntax
                                    # is shown in the example block
      live_preview: true
    sections:
      - api                         # generate from Component properties/events
      - tokens                      # generate from Component tokens
      - accessibility               # generate from Component accessibility
      - examples                    # human-authored
    output:
      base_dir: ./docs/components
      file: "{name-kebab}.mdx"
```

### 14.4 Custom presentation frameworks

A Target for a framework not listed above MAY use any key under
`presentation:` so long as the Target's documentation describes the schema.
A future revision of this spec MAY canonicalise additional frameworks.

### 14.5 Example — Formtrieb × Figma (presentation Target)

```yaml
presentation:
  figma:
    component_set:
      arrange: auto
      grid:
        columns_axis: hierarchy
        rows_axis: interaction
    variant_properties:
      include: all
    nested_instances:
      sync: true
      mapping_source: cdf-anatomy
    naming:
      component: "{ComponentPascal}"
      variant: "{property}={value}"
    publish:
      mode: draft
      library: formtrieb-ui
```

---

## Appendix A. Minimal example (Angular)

The smallest complete Angular Target file — sufficient to generate one
component against the Formtrieb Profile.

```yaml
# formtrieb.target-angular.yaml
name: formtrieb-angular
version: "1.0.0"
profile: ./formtrieb.profile.yaml
profile_version: "^1.0.0"
category: implementation
framework: angular
framework_version: ">=19"
description: >
  Angular 19+ implementation Target for the Formtrieb DS.

output:
  base_dir: ./generated/angular
  structure: flat
  files:
    component: "{name}.component.ts"
    template: "{name}.component.html"
    styles: "{name}.component.scss"
  class_suffix: Component

generation:
  mode: complete                    # .ts aggressive, .html/.scss scaffold-once

api:
  inputs:
    enum: input
    boolean: input
    string: input
    required: input.required
    two_way: model
  outputs: output
  reserved_names:
    names: [input, output, model, signal]
    suffix: Event
  type_prefix: ""                      # Angular convention: no prefix
  type_pattern: "{NamePascal}"         # class_suffix "Component" appends → ButtonComponent

styling:
  css_prefix: "{identifier}-"          # → "ft-"
  token_prefix: "--{identifier}-"      # → "--ft-"
  methodology: BEM
  pattern: "{prefix}{component}--{modifier}__{child}"
  casing:
    css_selectors: kebab-case
  typography:
    strategy: mixin
    import: "@use 'css/typography' as *"
    call: "@include typography('{token-name}')"
  focus:
    strategy: outline
  style_encapsulation: scoped

composition:
  strategy: split
  slot_element: ng-content
  label_association: for-id

state_to_input:
  - disabled
  - pending
  - readOnly
```

---

## Appendix B. Minimal example (Figma)

The smallest complete Figma Target — primarily presentation, with the
variant-property handling reshaped from the legacy in-CDF `figma:` block.

```yaml
# formtrieb.target-figma.yaml
name: formtrieb-figma
version: "0.1.0-draft"
profile: ./formtrieb.profile.yaml
profile_version: "^1.0.0"
category: presentation
framework: figma
framework_version: any
description: >
  Figma presentation Target for Formtrieb DS — emits variant-property dumps
  and nested-instance catalogues consumed by the Figma MCP bridge.

output:
  base_dir: ./presentation/figma
  structure: flat
  files:
    catalogue: "{name-kebab}.figma.json"

generation:
  mode: aggressive                  # presentation outputs are always spec-truth

presentation:
  figma:
    component_set:
      arrange: auto
      grid:
        columns_axis: hierarchy
        rows_axis: interaction
    variant_properties:
      include: all
    nested_instances:
      sync: true
      mapping_source: cdf-anatomy
    naming:
      component: "{ComponentPascal}"
      variant: "{property}={value}"
    publish:
      mode: draft
      library: formtrieb-ui
```

---

## Appendix C. Target ↔ Profile compatibility

Rules for the `profile_version:` range a Target declares. These are
**semantic guidance**, not a mechanical algorithm — the validator can
detect mismatches but cannot judge whether a given Profile change is
breaking *for this Target*.

### C.1 What counts as a breaking Profile change for a Target

A Profile change is breaking for a Target if any of the following hold:

| Profile change                                                         | Breaks Target if … |
| ---------------------------------------------------------------------- | ------------------ |
| Vocabulary value renamed or removed (`hierarchies`, `intents`, `sizes`) | Target's `normalization.css_class_names` or `styling.hierarchy_buckets` references it. |
| Token grammar rule changed                                             | Always — Target's emitted CSS depends on grammar shape. |
| Theme axis added / renamed                                             | Always — Target's emitted theme switching depends on axis names. |
| Naming `css_prefix` or `token_prefix` changed                          | Always — Target emits prefixed identifiers throughout. |
| Interaction pattern renamed                                            | If Target's `state_to_input` references it. |
| `assets` `consumption` strategy changed                                | If Target's `dependencies.external` was derived from it. |
| `accessibility_defaults` changed                                       | Usually no — defaults flow through; but `min-target-size` token rename will break. |
| New category added                                                     | Not breaking — Target expands automatically. |
| Existing category's `interaction_default` changed                      | Breaking — Target's state-promotion logic shifts. |

### C.2 Recommended `profile_version:` ranges

| Target stability                | Range                  |
| ------------------------------- | ---------------------- |
| Ships with one Profile version  | `=1.0.0` (exact)       |
| Tested across one minor series  | `~1.0.0` (1.0.x)       |
| Forward-compatible within major | `^1.0.0` (1.x)         |
| Pre-release tracking            | `^1.0.0-draft`         |

`^1.0.0` is the typical default — declares that the Target is built against
the 1.x Profile contract and will NOT survive a 2.x bump without review.

### C.3 What forces a Target version bump

A Target's own version bumps when:

| Change                                                       | Bump |
| ------------------------------------------------------------ | ---- |
| Output filename or directory layout changes                  | Major (consumers' tooling breaks) |
| `api.inputs` mapping changes (e.g. `model` → `signal`)       | Major |
| New optional field added to any block                        | Minor |
| Default value changed (e.g. `style_encapsulation` default)   | Minor or Major depending on observability |
| Documentation, examples, internal cleanup                    | Patch |
| Profile range widened (`^1.0.0` → `^1.0.0 || ^2.0.0`)        | Minor |
| Profile range narrowed (`^1.0.0` → `~1.0.0`)                 | Major |

### C.4 Drift detection at generator runtime

Generators SHOULD perform a compatibility check on every run:

1. Read the Target's `profile_version:` range.
2. Read the resolved Profile's actual `version:` field.
3. If the Profile's version is outside the Target's declared range,
   refuse to generate and emit a clear error naming both versions.

This is the same guardrail mechanism a CDF Component uses for `cdf_version:`
against the Profile (Component §2 Conformance; Profile §4.3 `cdf_version`
and §15.4 `Compatibility with parent's cdf_version`). Its purpose is to catch silent
drift — a Profile update that ships fine for some Targets but produces
broken output for others.

### C.5 Coordinated releases

When a Profile change is breaking, the recommended workflow:

1. **Profile** ships a new major version (`2.0.0`).
2. **Targets** that depend on it bump their `profile_version:` range and
   typically their own version (Major if any output shape changes, Minor
   otherwise).
3. **CDF Components** that depend on the Profile may need migration; the Profile
   SHOULD ship a migration appendix following the
   [CDF-SPEC Appendix B](CDF-COMPONENT-SPEC.md#appendix-b-migration-from-v03) pattern
   (block-rename / field-removed / field-renamed / now-required tables +
   migration checklist).

The three formats version independently but coordinate at major boundaries.
There is no global "DS version" — the three independent versions are
sufficient.
