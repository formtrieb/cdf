# ADR-003: DTCG `$type` requirement

**Status:** Accepted
**Date:** 2026-04-26
**Constitution refs:** Article I (Token-Driven Binding),
Article III (LLM-First + Correctness-Without-Bureaucracy)

## Context

DTCG ([Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/drafts/format/))
specifies `$type` as the field that declares "what kind of values
are permissible for the token." The normative wording on missing
`$type`:

> *If no explicit type has been set for a token, tools MUST
> consider the token invalid and not attempt to infer any other
> type from the value.*

DTCG provides an inheritance chain so that `$type` need not be
written on every leaf:

1. If the token's `$value` is a reference, inherit the resolved
   referenced token's `$type`.
2. Otherwise, inherit from the closest parent group with a
   `$type`.
3. If no `$type` is found through the chain, the token is
   invalid.

CDF Profiles already declare `dtcg_version:` and reference token
sources that conform to a stated DTCG version. The question this
ADR settles is **how strictly CDF enforces `$type`** on token
files it reads, and whether CDF adds a CDF-specific discriminator
(e.g., `$token: true` to mark token leaves vs. groups) on top of
DTCG's mechanism.

## Decision

**CDF follows the DTCG `$type` MUST and the DTCG inheritance
chain verbatim. CDF adds no additional discriminator. Token
leaves are detected by the structural test "node has a `$value`
key" (DTCG's own definition), and `$type` is resolved through
the DTCG inheritance chain.**

A token whose `$type` cannot be resolved through the chain is
invalid and MUST cause a CDF Profile validator failure (binding
this requirement to CDF's existing validator surface, even
though DTCG itself frames the rule at the tool level).

## Consequences

**Positive.**

- CDF defers entirely to DTCG on token typing. No CDF-specific
  rule for tooling authors to learn. Article III is honoured:
  no ceremonial discriminator where structural typing already
  works.
- CDF's `token_grammar` rules in Profile (e.g., "every token
  matching `color.*` must be `$type: color`") become enforceable
  by the validator because every reachable token has a resolved
  `$type`. Article I — the format binds (part × property) → one
  token resolving to one DTCG `$value` — gains its grammar
  guarantee from this decision.
- Future DTCG `$type` additions (new categories of tokens) flow
  into CDF without ADR work; CDF's validator inherits them
  through DTCG-version declarations in Profile.

**Negative.**

- Third-party token sources that approximate DTCG but omit
  `$type` (some real-world Tokens Studio exports, raw Figma
  variable dumps prior to 2025.10) become rejected. CDF tools
  cannot silently coerce them. Adopters of those sources must
  fix the source or run a normalisation step before validation.
- The strictness is not adjustable per Profile. A Profile cannot
  opt out of `$type` requirements even for token sets it
  deliberately treats as opaque — those sets must be either
  fixed or excluded from CDF's reachable token graph.

**Neutral / Trade-offs.**

- Aligning with DTCG normatively means CDF's validator behaviour
  is bounded by DTCG's behaviour; if DTCG ever relaxes the MUST
  (unlikely, but possible in a future version), CDF inherits the
  relaxation only after a `dtcg_version:` bump in Profile. This
  is the same trade-off CDF accepts everywhere it depends on
  DTCG: tracking, not forking.

## Alternatives considered

**REQUIRE `$type` and add a CDF-specific `$token: true`
discriminator on every leaf.** Belt-and-suspenders: every token
leaf carries both `$type` and `$token: true`. The discriminator
would make leaf-vs-group disambiguation a one-key check instead
of a `$value`-presence test. Rejected: the `$value`-presence
test is DTCG's own definition of a token leaf and is
unambiguous. An additional discriminator would be ceremony with
no information gain — an instance of exactly the bureaucracy
Article III rules out. CDF's walker already implements the
structural test correctly.

**TOLERATE missing `$type` (best-effort inference from value).**
Read `$type` if present; otherwise infer from value (a hex
string is a `color`, a number with a `px` suffix is a
`dimension`, …). Rejected on two grounds. First, it contradicts
DTCG's MUST and silently undermines `dtcg_version:` declarations
in Profile. Second, value-based inference is not unambiguous in
DTCG: a string `"100"` could be a number, a dimension, or a
font-weight depending on token-type. Article I requires the
validator to know the token-grammar mapping with certainty;
inference makes that knowledge probabilistic.

**Defer to DTCG but warn-not-fail on missing `$type`.** A
softer middle ground: walker logs a warning, validator passes
the file, downstream tools may or may not consume it correctly.
Rejected: a warn-only posture creates a class of CDF Profiles
that pass CDF validation but whose generated artefacts are
untyped at consumption time. CDF's `cdf_validate_profile` already
has L0–L8 levels for graduated strictness; adding a fourth
level for "DTCG MUSTs treated as warnings" expands the validator's
state space without unlocking real adopter need.
