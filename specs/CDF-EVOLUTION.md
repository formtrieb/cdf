# CDF Evolution Policy

**Status:** Adopted 2026-04-26
**Type:** Non-normative meta-document
**Audience:** humans evaluating CDF for adoption; LLMs reading the
format as a candidate authoring target; downstream tool authors
deciding whether to depend on the format.

This document explains what kinds of changes the CDF maintainers
will and will not make to the format itself, and how decisions get
recorded. It is **non-normative**: it does not change what
implementations must emit or accept. The three normative specs —
[`CDF-COMPONENT-SPEC.md`](CDF-COMPONENT-SPEC.md),
[`CDF-PROFILE-SPEC.md`](CDF-PROFILE-SPEC.md),
[`CDF-TARGET-SPEC.md`](CDF-TARGET-SPEC.md) — take precedence whenever
this document drifts.

A note on naming. [`CDF-ARCHITECTURE.md`](CDF-ARCHITECTURE.md) §3.4
says *"the Profile is the DS's constitution"*. That is the
**per-DS** constitution — each design system's Profile is its own
ground truth. This document holds the **format's** constitution —
how CDF itself evolves across releases. The two operate at
different levels and do not conflict.

---

## 1. Constitution

CDF's evolution is governed by three articles. Every Architecture
Decision Record (ADR) cites the article(s) it relies on; an ADR
that takes a position no article supports is off-pattern by
construction. The Constitution is small on purpose: each article
must be load-bearing for real decisions, not philosophy.

### Article I — Token-Driven Binding

Every visual property of a component binds, at build time, to
exactly one token path that resolves to exactly one DTCG `$value`.
State variations are distinct tokens with values baked in. The
format does not contain primitives for runtime transformations —
no `color-mix()`, no opacity multipliers, no `calc()` on token
references — and no future ADR may add them.

This article is the format's load-bearing simplification. It is
why CDF can be statically validated, statically generated, and
trivially diffed across DSes. It is also why CDF deliberately
does not compete with toolchain-side token transforms (Style
Dictionary, Tokens Studio resolvers): those exist; CDF consumes
their output. CDF-CON-008 in CDF-COMPONENT-SPEC enforces this on
the validator side; this article enforces it on the **format** side.

### Article II — API Hard, Tokens Pragmatic

Properties and States — the consumer-facing API of a Component —
are validator-strict: their grammar is enforced, their values
must come from declared vocabularies, and downstream code depends
on their stability. Token paths are pragmatic: they may hold
placeholders, may resolve through Profile token mappings, may
carry DS-side typos that the Profile elects to tolerate, and may
evolve faster than the Component API.

This article exists because the two surfaces are *not symmetric*.
A Property change ripples into every consumer of generated code; a
token-path change ripples only as far as the token resolver. Format
rules that would make tokens as strict as the API would impose
authoring cost without unlocking correctness gains. ADR-002 (DTCG
`$extensions` deferral) and ADR-004 (flat-YAML bindings) both
trace to this article.

### Article III — LLM-First Authoring + Correctness-Without-Bureaucracy

CDF is designed to be authored, reviewed, and validated by LLMs.
Field shapes prefer obvious-defaults over forms that must be filled
in; rules prefer drift-detection over drift-prevention; each field
carries enough context (a `description:` or unambiguous semantic
name) for an LLM with no prior CDF training to fill it correctly
on a first read. The format does not optimise for parsers; it
optimises for the author who has 30 minutes and one example.

This article rules out a class of changes: gratuitous discriminators
(`$token: true` markers that add no information), nested
boilerplate (`{ $value: { $kind: ... } }` shapes that recover from
JSON-Schema awkwardness at the cost of authoring cost), and
ceremonial typing where structural typing is unambiguous. ADR-003
(`$type` follows DTCG without an extra CDF marker) and ADR-004
(flat YAML over `$token`-wrapped) both trace to this article.

---

## 2. Architecture Decision Records

Every non-trivial format-affecting decision is captured as an ADR
under [`specs/adrs/`](./adrs/). ADRs make CDF's evolution **legible**:
a reader sees what was decided, why, what was rejected, and which
Constitution article forced the call. ADRs are immutable once
Accepted — superseding decisions get new ADRs that reference
predecessors.

### 2.1 Template

```markdown
# ADR-NNN: <Title>

**Status:** Proposed | Accepted | Accepted (Defer) | Rejected | Superseded by ADR-NNN
**Date:** YYYY-MM-DD
**Constitution refs:** Article I | Article II | Article III (one or more)

## Context

What problem does this solve? What forces are at play? What is the
current state of the format that the decision modifies?

## Decision

The decision in one or two sentences. Active voice. "We will…" or
"CDF will…".

## Consequences

**Positive:** what gets better.
**Negative:** what gets worse, what costs we accept.
**Neutral / Trade-offs:** anything that is structurally a trade-off
rather than a clear win or loss.

## Alternatives considered

Each alternative gets a short paragraph: what it would have been,
and why it was rejected. The Constitution article(s) that ruled
out an alternative are cited inline.
```

### 2.2 Numbering and naming

ADRs are numbered sequentially with three-digit zero-padded
prefixes: `001-{slug}.md`, `002-{slug}.md`, …, up to `999-`.
Slugs are kebab-case, ≤ 60 characters, descriptive
(`dtcg-extensions-pattern`, not `decision-2`). Numbers are never
reused, even when an ADR is rejected.

### 2.3 Status lifecycle

| Status | Meaning |
|--------|---------|
| **Proposed** | Under discussion in a PR. Not yet binding. |
| **Accepted** | In force. Implementations and the spec text reflect this decision. |
| **Accepted (Defer)** | Decision made, but the chosen position is to *not act now*. Re-evaluation criteria are stated explicitly in the ADR's Decision section. |
| **Rejected** | Considered and not adopted. The ADR remains as a record so future readers don't re-litigate it. |
| **Superseded by ADR-NNN** | Replaced by a newer ADR. The newer ADR cites the predecessor; the older ADR's text is preserved verbatim. |

### 2.4 Supersession

ADRs are not edited after Accepted, except for typo-correction
or status-line updates (e.g., flipping to *Superseded by ADR-NNN*
when a newer ADR lands). Substantive change goes into a new ADR
that explicitly supersedes the predecessor.

This rule is itself an instance of Article III: making decisions
**immutable** is more legible than making them **mutable** at the
cost of authoring discipline. Future readers can audit the chain
without diff archaeology.

### 2.5 What lives in an ADR vs in the spec

| | ADR | Spec text |
|---|---|---|
| What changed | always | always |
| Why it changed | always | sometimes (in §-leading "Rationale" prose) |
| What was rejected | always | rarely |
| When to revisit | always (for Defer status) | never |
| Field shapes, rules, examples | only as illustration | normative |

The spec text answers *what is correct CDF*. The ADR answers
*how did this part of the spec come to look this way*.

---

## 3. Cadence

CDF semver bumps are driven by ADR scope:

- **Patch** — clarifications, typos, examples. No ADR required;
  optional one if the clarification was contentious.
- **Minor** — additive: new optional fields, new validator rules
  that warn (do not block), new accepted token shapes. Always one
  ADR per minor.
- **Major** — breaking: removed fields, breaking validator rules,
  changed semantics. Always one ADR per major; usually with an
  explicit migration path documented in the spec.

The hypothesis the v1.0.0 release tested — *"the format describes
the practical range of DS architectures without bending"* — was
confirmed across five foreign-DS validation passes (see
[`evidence/`](../evidence/)). The bar for breaking changes is
correspondingly high: a breaking ADR must show **multi-DS evidence**
that the change is needed, not a single-DS observation.

---

## 4. What this document is not

- **Not a contributor guide.** See [`README.md`](../README.md)
  §Contributing for how to open issues and PRs.
- **Not a roadmap.** Roadmap-shaped questions live in issues and
  release-note bodies, not here.
- **Not a substitute for the normative specs.** When this document
  drifts from the normative specs, the specs win and this document
  is updated to match.
