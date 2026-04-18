# Component Description Format — Architecture

**Version:** 1.0.0
**Status:** Stable — frozen 2026-04-16 after five-pass foreign-DS validation
**Audience:** humans — this is the one to read first.

---

## TL;DR

**CDF** (Component Description Format) is a family of three formats, not one file.

| Format            | File extension         | Describes                                                          |
| ----------------- | ---------------------- | ------------------------------------------------------------------ |
| **CDF Component** | `.component.yaml`      | One component instance (API, anatomy, tokens, a11y, composition)   |
| **CDF Profile**   | `.profile.yaml`        | The design system's vocabulary (tokens, themes, naming, patterns)  |
| **CDF Target**    | `.target-{fw}.yaml`    | Per-(DS × framework) output conventions for a code generator       |

Each format is its own document, with its own version, its own validator
contract. Consumers (LLMs, generators, tooling) can read any single document
alone, or compose the three to produce code.

**CDF** is a **format family in the spirit of DTCG**: it describes *what* a
component is, independently of any tool that consumes it. Generators are one
kind of consumer — LLMs are another.

> **Naming convention used in this document.** "**CDF**" alone refers to the
> umbrella format family. The three concrete formats are always named
> explicitly: "**CDF Component**", "**CDF Profile**", "**CDF Target**". Where
> context makes it unambiguous (inside a section discussing one format),
> the short form ("Component", "Profile", "Target") is used.

---

## 1. Why three formats?

A Component sits between three layers that change at different rates and
belong to different authors:

- **The design system** changes slowly. Its vocabulary (hierarchies, intents,
  sizes, tokens, themes) is shared across dozens of components. → **Profile.**
- **The component itself** changes per-component. Button is not TextField. →
  **Component.**
- **The output** changes per-framework. Angular, Kirby, SwiftUI each have
  different idioms for the same component. → **Target.**

Mixing these into one file was the legacy approach (CDF v0.x). It worked but
hid layer boundaries — DS vocabulary leaked into Components, framework
conventions leaked into Components, and Components became hard to reuse
across DSes or frameworks.

v1.0.0 separates them so each layer owns one document.

---

## 2. How they relate

```
                   ┌─────────────────────┐
                   │   CDF Profile       │  vocabulary, token grammar,
                   │   (DS-level)        │  theming axes, naming, a11y defaults
                   └──────────┬──────────┘
                              │ referenced by
                              ▼
    ┌──────────────────────────────────────────┐
    │   CDF Component                           │  properties, states, events,
    │   (per component)                         │  anatomy, tokens, composition,
    │                                           │  accessibility
    └──────────────────┬───────────────────────┘
                       │ consumed by
                       ▼
    ┌──────────────────────────────────────────┐
    │   CDF Target  +  Component + Profile      │  generator output rules per
    │   (per DS × framework)                    │  framework — or directly read
    │                                           │  by an LLM generating code
    └──────────────────────────────────────────┘
```

- A **Component** always references a **Profile** (via path). The Profile
  defines what token paths, themes, and vocabularies the Component is allowed
  to use.
- A **Target** references a **Profile** (same one), plus implicitly a framework
  ecosystem. A Target does **not** reference specific Components — it's
  parametric over all Components in the Profile.
- A consumer (generator, LLM) reads: `Component × Profile × Target → output`.

The split has a pleasant property: none of the three documents know about the
other two's implementation. A Profile does not know what Target it will feed.
A Component does not know what framework will generate it. A Target does not
know which Components exist. Each is a closed format over its domain.

---

## 3. Two contracts, one setup

The three formats look symmetrical on paper, but in daily use they show a
clear asymmetry: two of them form **contracts**, one is a **one-time
alignment**.

```
          ┌──────────────────────────────────────┐
          │   Profile ⇌ Target  — one-time setup  │   "How does this
          │   alignment per framework             │    framework realise
          │                                       │    this design system?"
          └──────────────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               │                             │
               ▼                             ▼
   ┌─────────────────────────┐   ┌─────────────────────────┐
   │  Component × Profile     │   │  Component × Target     │
   │  — Authoring contract    │   │  — Generation contract  │
   │                          │   │                         │
   │  Designer / DS author:   │   │  Developer / generator: │
   │  "which vocabulary do I  │   │  "how does this        │
   │   speak in?"             │   │   Component become      │
   │                          │   │   framework code?"      │
   │  Primary: Profile        │   │  Primary: Target        │
   │  Output:  Component file │   │  Output:  source files  │
   └─────────────────────────┘   └─────────────────────────┘
                                      ▲
                                      │  consumes
                                Component file
                                      │
                                      └────────── (same file flows from
                                                   authoring to generation)
```

### 3.1 The authoring contract — Component × Profile

When a designer or component author writes a new Component, the live contract
is **Component × Profile**. The author asks:

- What vocabulary may I use? (hierarchies, intents, sizes — from
  `profile.vocabularies`)
- What token paths are legal? (from `profile.token_grammar`)
- What interaction patterns are canonical? (from
  `profile.interaction_patterns`)
- What accessibility defaults apply? (from
  `profile.accessibility_defaults`)
- Which category does this belong to? (from `profile.categories`)

The Target is not part of this conversation. A well-authored Component does
not know or care how it will be rendered — Angular, SwiftUI, Figma, or none
of the above.

### 3.2 The generation contract — Component × Target

When a generator (or an LLM acting as one) turns a Component into framework
code, the live contract is **Component × Target**. The generator asks:

- Where do these files go?
- What API idiom does this framework use for properties? for events?
- How is composition realised — Angular imports, SwiftUI child views,
  Kirby snippets?
- Which states become DOM attributes vs. internal signals?
- What dependencies may the generated code assume?

The Profile is not silent here — it still provides the token grammar, the
category defaults, the `focused → active` state-name mapping — but the
Target has **pre-compiled** the Profile's decisions into framework-specific
patterns. At generation time, the Profile acts as a **validity oracle**
("is this token path legal?") rather than the primary guide.

### 3.3 The one-time alignment — Profile × Target

Before anyone generates anything, a framework integrator defines **how this
framework realises this design system**. This is a single, infrequent act:

- Which `interaction_patterns.promoted` states become DOM attributes?
- How does the Profile's abstract `identifier:` become `ft-button` in Angular
  or `FTButton` in SwiftUI? (Each Target declares its expression of the
  identifier; see Target §5.6 Identifier Template DSL.)
- How does the `assets.icons.consumption` declaration map to this
  framework's import mechanics?

Once aligned, the Target is stable. A team ships dozens of Components and
thousands of builds without re-opening it.

### 3.4 Frequencies

These three events happen at very different cadences, which matters for
tooling and review:

| Format     | Change frequency | Change impact                    | Who edits        |
| ---------- | ---------------- | -------------------------------- | ---------------- |
| Component  | Daily            | One component                    | Designers, component authors, LLMs |
| Target     | Rare             | All generated output             | Framework integrators              |
| Profile    | Very rare        | All Components AND all Targets   | DS architects                      |

A Profile change is a big deal — it ripples through every Component and every
Target the DS touches. The `cdf_version:` and `profile_version:` semver
ranges exist precisely to catch these ripples: when a Profile's major
version changes, downstream artefacts MUST be re-validated.

> A useful mental model: **the Profile is the DS's constitution.** Nobody
> reads the constitution daily — but every daily action must be compatible
> with it, and amending it requires care across the whole system.

### 3.5 Who reads what, restated

Reframed around the two contracts:

| Role                         | Day-to-day reads          | Occasional reads           |
| ---------------------------- | ------------------------- | -------------------------- |
| DS author / architect        | Profile                   | (authors the Profile)      |
| Component author (human)     | Profile + existing Component | Target (to preview output) |
| Component author (LLM)       | Profile + one Component example | —                       |
| Framework integrator         | Target + Profile          | (once per framework)       |
| Generator                    | Component + Target        | Profile (as validity oracle) |
| Reviewer / LLM-as-critic     | Whichever contract the PR changes | —                  |

LLMs doing Component authoring need **Profile + one existing Component**
(nothing more). LLMs doing code generation need **Component + Target** in
the foreground, with Profile as context.

---

## 4. Versioning

Each format versions independently. The three are coordinated at minor-version
cadence but not lockstep — a new Target (Angular 20, say) can ship without a
Profile or CDF Component version bump.

- `CDF Component` — semantic versioning (breaking changes require major bump)
- `CDF Profile` — semantic versioning; `cdf_version:` range declares
  compatibility with CDF Component
- `CDF Target` — semantic versioning; `profile_version:` range declares
  compatibility with a Profile; `framework_version:` declares compatibility
  with the target framework

Draft versions (`1.0.0-draft`) may break freely. A `-draft` suffix is a promise
that the format is not yet stable; consumers MUST NOT build production pipelines
on a draft.

---

## 5. Relationship to DTCG

CDF sits alongside DTCG, not on top of it:

- **DTCG** describes *tokens*. It does not describe *components*.
- **CDF Profile** consumes DTCG tokens — it declares `dtcg_version:` and its
  `token_grammar` maps to DTCG `$type` values.
- **CDF Component** references tokens by path; the Profile guarantees those
  paths resolve in the DTCG files the DS ships.

A consumer that understands DTCG understands half of a CDF Profile. The other
half (vocabularies, interaction patterns, accessibility defaults) is
DS-semantic and out of DTCG scope.

---

## 6. Stability of this document

ARCHITECTURE is descriptive, not normative. It explains how the three formats
fit together. If any of the three normative spec documents says something that
contradicts this document, **the normative specs win** — this document will be
updated to match.

The three normative specs:

- [`CDF-PROFILE-SPEC.md`](CDF-PROFILE-SPEC.md) — v1.0.0
- [`CDF-COMPONENT-SPEC.md`](CDF-COMPONENT-SPEC.md) — v1.0.0
- [`CDF-TARGET-SPEC.md`](CDF-TARGET-SPEC.md) — v1.0.0

> **Filename note.** This document was previously named "CDF" referring to a
> single-format CDF; v1.0.0-draft splits CDF into the umbrella name and three
> concrete formats (Component / Profile / Target). The file
> `CDF-COMPONENT-SPEC.md` is the renamed v0.x `CDF-SPEC.md`.
