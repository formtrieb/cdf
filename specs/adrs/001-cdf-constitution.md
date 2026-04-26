# ADR-001: CDF Constitution

**Status:** Accepted
**Date:** 2026-04-26
**Constitution refs:** (this ADR establishes the Constitution; no
prior article exists to cite)

## Context

CDF v1.0.0 froze on 2026-04-18 after five foreign-DS validation
passes. The reference implementation shipped to npm as
`@formtrieb/cdf-core@1.0.2` on 2026-04-26. With the format now
public and externally consumable, future format-affecting
decisions need a stable anchor: a small set of articles that
spec authors and ADR writers can cite when they take a position
on a contested question.

Without an explicit Constitution, two failure modes are likely:

1. **Re-litigation.** Each new ADR re-derives the same first
   principles ("does the format permit runtime math?", "should
   tokens be as strict as properties?") from scratch. ADRs grow
   long because they re-argue settled ground.
2. **Drift.** Decisions that contradict the format's existing
   posture land because no one wrote down the posture. Five years
   in, the format no longer has a coherent shape.

The pattern source is Nathan Curtis' DirectedEdges/specs project
([adr/](https://github.com/DirectedEdges/specs/tree/main/adr)),
whose ADRs cite "Constitution I, §5.2.3"-style references inline.
DirectedEdges does not surface a separate Constitution document;
its constitution is implicit. CDF makes it explicit because
external adopters benefit from a one-page read of the format's
posture before they fork or depend on it.

## Decision

**CDF adopts a three-article Constitution, captured in
[`CDF-EVOLUTION.md`](../CDF-EVOLUTION.md) §1, governing future
ADRs and spec changes.** The articles are:

- **Article I — Token-Driven Binding.** Build-time-resolved
  one-token-per-binding; no runtime transformation primitives.
- **Article II — API Hard, Tokens Pragmatic.** Strict validation
  on Properties + States; pragmatic validation on token paths.
- **Article III — LLM-First Authoring + Correctness-Without-
  Bureaucracy.** Field shapes optimise for first-read authoring;
  drift-detection over drift-prevention; no ceremonial
  discriminators where structural typing suffices.

## Consequences

**Positive.**

- ADRs are shorter: each cites the article that ruled out
  rejected alternatives instead of re-deriving first principles.
- External adopters can read three articles and predict whether
  a format change they want is on-pattern.
- Future maintainers inherit a non-trivial posture even when
  original authors have moved on; the articles act as a
  guardrail against drift.

**Negative.**

- Three articles are a public commitment. Retracting one (or
  amending it materially) is costly — every prior ADR's
  reasoning needs to be re-checked. The articles must be
  genuinely load-bearing, not aspirational.
- An article that turns out to be wrong (e.g., Article I if a
  future runtime-token-math primitive becomes industry-standard)
  forces a major version bump or a Constitutional amendment ADR
  with cross-cutting impact.

**Neutral / Trade-offs.**

- The Constitution is small (three articles). This is a deliberate
  trade-off: more articles capture more nuance but dilute which
  articles are actually load-bearing. Anova-class catalogues with
  forty ADRs lean on small constitutions for a reason.
- The Constitution is non-normative meta-text, not part of any
  validator contract. A spec or ADR that contradicts an article
  is "off-pattern" but not "invalid"; the social cost of
  contradicting the Constitution sits in PR review, not in CI.

## Alternatives considered

**Five-article Constitution (A + B + C + D + E from the
brainstorm).** Add Article B (Extraction-as-seed: Figma → CDF is
one-way, one-time) and Article E (Three-format separation:
Component / Profile / Target are independently versioned). Rejected
because B drives no in-scope ADR (extraction tooling lives outside
the format) and E duplicates [`CDF-ARCHITECTURE.md`](../CDF-ARCHITECTURE.md)
§1, which is already the canonical statement. An article that no
ADR cites is decoration; an article that restates an existing
canonical document is duplication. Cuttable on those grounds.

**No Constitution at all (DirectedEdges pattern).** Let ADRs cite
each other and treat first principles as folk knowledge. Rejected
because CDF is more recently public than DirectedEdges and
external adopters do not yet have folk-knowledge of the format's
posture. The explicit Constitution buys legibility for the cost
of one extra page; that page pays for itself the first time an
external adopter reads it before opening an issue.

**Lift Anova/DirectedEdges Constitution verbatim.** No such
document exists upstream. The pattern (small constitution,
load-bearing articles, ADRs that cite article numbers) is
borrowed; the article *content* is CDF's own.
