# ADR-002: DTCG `$extensions` adoption pattern

**Status:** Accepted (Defer)
**Date:** 2026-04-26
**Constitution refs:** Article II (API Hard, Tokens Pragmatic),
Article III (LLM-First + Correctness-Without-Bureaucracy)

## Context

DTCG ([Design Tokens Format Module 2025.10](https://www.designtokens.org/TR/drafts/format/))
specifies `$extensions` as a free-form object on token nodes,
intended for tool-specific or vendor-specific metadata. The
normative wording is:

- *"The reverse domain name notation is recommended for this
  purpose."*
- *"Tools that process design token files MUST preserve any
  extension data they do not themselves understand."*
- *"Tools SHOULD restrict their usage of extension data to
  optional meta-data that is not crucial to understanding that
  token's value."*

CDF's reference implementation (`@formtrieb/cdf-core`) already
honours the MUST-preserve rule on token files it reads.
[`packages/cdf-core/src/types/token-tree.ts`](../../../packages/cdf-core/src/types/token-tree.ts)
defines `TokenExtensions` with explicit support for two known
sub-keys (`studio.tokens` for Tokens Studio modify metadata,
`com.figma.scopes` for Figma scope hints) plus pass-through for
arbitrary additional keys.

The question this ADR settles is **not** about preservation
(already handled). It is about whether CDF's own
**format-level metadata** — `vocabularies:`, `token_grammar:`,
`theming:`, and similar Profile/Component top-level fields —
should migrate under a CDF-specific reverse-domain prefix
(e.g., `org.formtrieb.cdf.*`) inside `$extensions` on tokens, or
remain at the top level of CDF documents as it is today.

The question is forced now because external adopters reading the
spec for the first time cannot infer CDF's posture from spec
text alone; an explicit decision is needed before they begin
forking or depending on the format.

## Decision

**CDF defers `$extensions` adoption for its own format-level
metadata. Profile, Component, and Target metadata stays at top
level. CDF continues to round-trip DTCG `$extensions` on token
files it reads, per the DTCG MUST-preserve rule.**

Re-evaluation criteria, stated explicitly so the deferral is
auditable:

1. The DTCG community group lands a canonical CDF-style
   extension (e.g., a normative `$component-binding` shape).
2. An external design-system team adopting CDF demonstrates a
   concrete failure mode whose fix requires CDF metadata to live
   under `$extensions` (e.g., a DTCG-aware tool that refuses to
   round-trip CDF-flavoured top-level keys).

If neither (1) nor (2) lands within twelve months of this ADR's
date, the deferral renews implicitly; a follow-up ADR is not
required to extend it.

## Consequences

**Positive.**

- Zero migration cost for existing artefacts: 16 internal Formtrieb
  Component specs, 5 foreign-DS validation ports, and the
  reference Angular generator continue to work unmodified.
- CDF top-level fields remain visible at first read, satisfying
  Article III. An author opening a Profile sees `vocabularies:`
  immediately, not `$extensions.org.formtrieb.cdf.vocabularies:`.
- The DTCG MUST-preserve rule is honoured *independently* of this
  decision — CDF correctly round-trips third-party `$extensions`
  it does not understand on token files. Tooling-side DTCG
  compatibility is unaffected.

**Negative.**

- Drift risk: if criteria (1) or (2) lands later, retro-adopting
  `$extensions` will be a breaking change requiring a major
  version bump and aliases or migration tooling. Acting now
  would avoid that cost.
- DTCG-aware tooling outside CDF cannot today consume CDF
  metadata via a generic `$extensions`-walking pass; tools that
  want CDF's vocabularies must learn CDF's top-level shape
  explicitly.

**Neutral / Trade-offs.**

- The decision is reversible (within a major version) but not
  free. The re-evaluation criteria above keep the option open
  without forcing periodic re-litigation.

## Alternatives considered

**ADOPT (declare `org.formtrieb.cdf.*` reverse-domain prefix
now).** Migrate CDF top-level metadata under `$extensions` on
tokens, document a CDF-specific reverse-domain key space, and
provide aliasing for backward compatibility. Rejected: contradicts
Article III directly — `$extensions.org.formtrieb.cdf.vocabularies`
is harder to author and review than top-level `vocabularies:`,
and the format gains nothing concrete in exchange. The existing
TokenExtensions round-trip already gives CDF tools a path to
participate in DTCG `$extensions` ecosystem when they need to,
without forcing all CDF metadata into that shape.

**REJECT (declare CDF metadata as a separate top-level
namespace; close the door on `$extensions` interop forever).**
Rejected: closes a future-compatibility door without need.
External adopters with DTCG-aware tooling lose the option to
ever propose CDF-in-`$extensions` patterns. The signal a REJECT
sends ("CDF and DTCG are different things, do not look for
overlap") is also wrong — DTCG and CDF are explicitly
complementary at the token layer.

**ADOPT for tokens only, defer for Profile/Component.** Adopt
`$extensions` for CDF-specific token-level metadata (e.g.,
declaring at the token node level which Component referenced it),
keep Profile/Component metadata top-level. Rejected: the case for
token-level CDF extensions has not surfaced — there is no
real example today where CDF needs to annotate a DTCG token
with CDF-specific data. Adopting on speculation generates
authoring cost (a `org.formtrieb.cdf.*` namespace exists, must
be documented, must be validated) for unclear gain.
