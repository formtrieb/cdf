# ADR-004: Component token-binding syntax

**Status:** Accepted
**Date:** 2026-04-26
**Constitution refs:** Article I (Token-Driven Binding),
Article III (LLM-First + Correctness-Without-Bureaucracy)

## Context

A CDF Component spec must express, for each part of the component,
which token paths drive each visual property. The shape of that
expression is contested in the wider ecosystem. Three relevant
data points:

1. **DTCG itself does not specify a component-binding pattern.**
   The DTCG format module covers tokens (`$value`, `$type`,
   `$extensions`, references via `{group.path}`) but is silent on
   how a *component* binds tokens to its own properties. CDF
   inherits no normative pattern from DTCG here.

2. **DirectedEdges uses two orthogonal mechanisms.** Their
   [ADR-006](https://github.com/DirectedEdges/specs/blob/main/adr/006-token-references.md)
   adopts `$token` (DTCG-aligned token *references* in value
   positions); their [ADR-008](https://github.com/DirectedEdges/specs/blob/main/adr/008-prop-bindings.md)
   adopts `$binding` (prop-to-prop *bindings* — visibility derived
   from another prop's value, etc.). The two solve different
   problems and coexist.

3. **CDF currently uses flat YAML.** [`CDF-COMPONENT-SPEC.md`](../CDF-COMPONENT-SPEC.md)
   §13.1 plus [`specs/examples/minimal.component.yaml`](../examples/minimal.component.yaml)
   show the shape:

   ```yaml
   tokens:
     container:
       background: color.controls.{intent}.background.{interaction}
     label:
       color: color.controls.{intent}.text.{interaction}
   ```

   The key (`background`, `color`) is the visual property; the
   value is the token path. No `$`-prefixed discriminator
   appears. Sixteen internal Formtrieb Component specs, five
   foreign-DS validation ports, and the reference Angular
   generator all rely on this shape today.

The question this ADR settles is whether CDF Components should
migrate to a `$token`-wrapped shape (DTCG-aligned at the
binding call-site), retain flat YAML, or accept both as aliases.

## Decision

**CDF Component specs continue to express token bindings as flat
YAML. The key is the visual property name; the value is the token
path. No `$token` wrapper. No `$binding` wrapper. Token paths
themselves use the existing curly-brace placeholder syntax
(`{intent}`, `{interaction}`) defined in
[`CDF-COMPONENT-SPEC.md`](../CDF-COMPONENT-SPEC.md) §13.1.**

## Consequences

**Positive.**

- Article III is honoured strongly: flat YAML is the most
  readable form for an LLM or human encountering a CDF Component
  for the first time. The minimum cognitive overhead — three
  lines of YAML express three bindings.
- Article I is satisfied without ceremony: one key, one value,
  one token path. Wrapping in `$token` would not add information;
  the binding *is* the token reference because that is the only
  thing the format permits in this position.
- Zero migration cost: 16 internal Formtrieb specs, 5 foreign-DS
  validation ports (Radix, shadcn, Primer, Material 3, USWDS),
  and the reference Angular generator all continue to work
  unmodified. The hypothesis the v1.0.0 release tested ("the
  format describes the practical range of DS architectures
  without bending") is preserved.

**Negative.**

- Tooling outside CDF that walks DTCG-shaped trees looking for
  `$token` discriminators cannot identify CDF Component bindings
  generically. Such tools must learn CDF's structural shape
  (key-as-visual-property, value-as-path) explicitly.
- If DTCG ever lands a normative `$component-binding` shape
  (currently community-discussion only — see ADR-002 for the
  related observation), CDF will need a future ADR to either
  adopt or document the divergence.

**Neutral / Trade-offs.**

- DirectedEdges' `$binding` mechanism (prop-to-prop conditional
  references — e.g., "this slot is visible iff that prop is
  non-null") solves a problem CDF currently does not have. CDF
  Components today express conditional behaviour through `states:`
  + `interaction_patterns:` from Profile, not through inline
  prop-to-prop bindings. If a future CDF requirement surfaces
  prop-to-prop dependencies (and thus a `$binding` analogue), it
  is its own ADR; this ADR scopes only to *token* bindings.

## Alternatives considered

**ADOPT `$token` wrapper at the binding site.** Migrate every
CDF Component to `background: { $token: "color.path" }` shape,
matching DirectedEdges ADR-006. Rejected on two grounds. First,
it contradicts Article III directly: a CDF author opening a
Component spec to add a button variant would face two extra keys
(`$token`, optionally `$type`) per binding for no semantic gain
— the format already restricts this position to token references.
Second, the migration cost is concrete and large: 16 internal
specs + 5 foreign-DS ports + the reference Angular generator's
emitter would all need changes. The benefit (DTCG-tool
discoverability at the binding site) is speculative; the cost is
measured.

**ALIAS — accept both flat YAML and `$token`-wrapped, canonical
emit is flat.** Parser tolerates both shapes; canonical emit is
flat YAML. Rejected: the parser surface grows for unclear payoff.
External adopters reading the spec would face a "which shape do
I use?" question that the format would not answer cleanly. The
format gains a maintenance burden (test matrix doubles, schema
permits two shapes per binding, future ADRs must consider both)
without the format gaining a single capability. Article III
rules out this kind of optionality where structural unanimity
already serves.

**Adopt `$binding` for token references, keep `$token` for
declarations.** Mirror DirectedEdges' two-mechanism split, but
with CDF-specific semantics. Rejected: this would invent CDF's
own naming convention while citing Anova as the inspiration —
the worst of both worlds. CDF should either adopt DTCG/Anova
shapes wholesale (rejected above) or keep its existing shape
(this ADR's choice). A custom-named third path is precisely the
kind of bureaucratic divergence Article III names.
