# Component Description Format (CDF)

**A declarative, design-system-agnostic format for describing UI
components — independently of any tool, framework, or platform that
consumes them.**

CDF sits alongside [DTCG](https://www.designtokens.org/) at the
component-contract layer: DTCG describes tokens (atomic design
decisions), CDF describes how those tokens compose into components
(properties, states, events, anatomy, accessibility, target output).

- **Three-format family** — `CDF Component` (per-component instance)
  + `CDF Profile` (DS-level vocabulary & token grammar) + `CDF Target`
  (per-framework output conventions). Each is its own document, its
  own version, its own validator contract.
- **LLM-first authoring** — every field is semantic and documented;
  an LLM can read a Profile + one existing Component and author the
  next Component correctly. Five foreign-DS validation passes
  demonstrate this in practice.
- **Token-driven** — every visual value binds to a token path that
  resolves to a single DTCG value at build time. The format forbids
  runtime transformations (opacity math, `color-mix()`, derived
  shades) inside specs — state variations are distinct tokens with
  values baked in at build time.

## Status

**v1.0.0 — stable.** Frozen 2026-04-18 after five consecutive
foreign-DS validation passes without structural format change.

| Validation pass | Architecture | Format-change budget |
|-----------------|--------------|----------------------|
| [Radix Primitives](./examples/radix/) | headless (no tokens) | 0/2 + 0/1 |
| [shadcn/ui](./examples/shadcn/) | token-bridge-external (consumer-owned CSS vars) | 0/2 + 0/1 |
| [Primer](./examples/primer/) | token-bridge-DTCG (DS-owned real DTCG) | 0/2 + 0/1 |
| [Material 3](./examples/material3/) | token-bridge-exotic (toolchain-generated, state-layered) | 0/2 + 0/1 |
| [USWDS](./examples/uswds/) | accessibility-first (OS-signal preferences, conditional ARIA) | 0/2 + 0/1 |

**Zero structural format change across five passes.** The hypothesis
the series tested — *"CDF describes the practical range of DS
architectures without bending"* — held. See
[`evidence/`](./evidence/) for the full per-pass findings.

## Read the spec

Start here:

1. **[CDF-ARCHITECTURE.md](./specs/CDF-ARCHITECTURE.md)** — why three
   formats, how they relate, who reads what. Non-normative tour.
2. **[CDF-COMPONENT-SPEC.md](./specs/CDF-COMPONENT-SPEC.md)** — the
   per-component format (properties, states, events, anatomy, tokens,
   behavior, accessibility, CSS). Most authoring happens here.
3. **[CDF-PROFILE-SPEC.md](./specs/CDF-PROFILE-SPEC.md)** — the DS
   constitution (vocabularies, token grammar, theming axes,
   interaction patterns, accessibility defaults).
4. **[CDF-TARGET-SPEC.md](./specs/CDF-TARGET-SPEC.md)** — per-(DS ×
   framework) output conventions for code generators.

A minimal end-to-end example lives at
[`specs/examples/`](./specs/examples/) — one `minimal.profile.yaml`
+ `minimal.component.yaml` + `minimal.target.yaml` that parse
clean against the spec's validator.

## Evolution

CDF evolves under a three-article Constitution and Architecture
Decision Records (ADRs). The Constitution names the principles
that govern which kinds of changes are on-pattern; ADRs capture
individual format-affecting decisions, why they were made, and
what was rejected.

- [`specs/CDF-EVOLUTION.md`](./specs/CDF-EVOLUTION.md) — the
  Constitution, ADR template, status lifecycle, supersession rule,
  and semver cadence.
- [`specs/adrs/`](./specs/adrs/) — individual ADRs. Start with
  [ADR-001](./specs/adrs/001-cdf-constitution.md) (the
  Constitution itself) and the index at
  [`specs/adrs/README.md`](./specs/adrs/README.md).

External adopters who plan to fork the format or build durable
tooling on top of it should read the Constitution before opening
issues — it explains what kinds of format change the maintainers
will and will not entertain.

## Reference implementation

The TypeScript parser + validator + MCP server lives in a sibling
repository: **[formtrieb/cdf-core](https://github.com/formtrieb/cdf-core)**
(npm: `@formtrieb/cdf-core`). Install:

```bash
pnpm add @formtrieb/cdf-core
# or
npm install @formtrieb/cdf-core
```

The spec in this repo is the authority; cdf-core tracks it and
implements the rules.

## Quickstart — `.cdf.config.yaml`

A `.cdf.config.yaml` at the root of a design-system repo is how the
CDF tooling (the [`@formtrieb/cdf-mcp`](https://www.npmjs.com/package/@formtrieb/cdf-mcp)
server, the [`cdf` Claude Code plugin](https://github.com/formtrieb/cdf-plugin),
the `cdf-core` analyzer) finds the Profile, the token sources, and
the Profile-scaffold state for a given DS.

The `cdf` plugin installs as a one-entry marketplace (two-step):

```bash
claude plugin marketplace add formtrieb/cdf-plugin
claude plugin install cdf@cdf
```

Minimum shape (Profile already authored):

```yaml
spec_directories: [./specs]
token_sources: [./tokens/]
profile_path: ./my-ds.profile.yaml
```

Full shape used by the `cdf` plugin's
[`/cdf:scaffold-profile`](https://github.com/formtrieb/cdf-plugin)
skill (the `scaffold:` block is **provisional in v1.0**; formal schema
to be added in CDF Profile Spec v1.1.0):

```yaml
# Authored / canonical fields
spec_directories: [./specs]
token_sources: [./tokens/]
profile_path: ./my-ds.profile.yaml

# Maintained by /cdf:scaffold-profile (provisional v1.0 — schema
# formalisation queued for CDF Profile Spec v1.1.0)
scaffold:
  ds_name: my-ds                              # 🔴 required
  figma:
    file_url: https://figma.com/design/<KEY>  # 🔴 required
    file_cache_path: ./.cdf-cache/figma/<KEY>.json   # T1/T2 — REST cache on disk
  tier: T1                                    # T0 | T1 | T2 — auto-detected
  auto_mode: false                            # true → benchmark/eval-only artefacts
  token_source:
    regime: tokens-studio                     # see §regimes below
    path: ./tokens/
    quality_rating: 3                         # 1–3 stars (0 when regime=none)
  resolver:                                   # T1/T2 only
    kind: tokens-mcp                          # tokens-mcp | plugin-cache | enterprise-rest
    mcp_name: my-ds-tokens                    # for tokens-mcp kind
    cache_path: ./.cdf-cache/figma/variables.json   # for plugin-cache kind
  doc_frames:
    convention: _doc-content                  # 🟢 optional
  external_docs: []                           # 🟢 optional URLs
  last_scaffold:                              # written after each run
    timestamp: 2026-04-26T10:15Z
    skill_version: 1.0.0
    tier_used: T1
    auto_mode_used: false
    phases_completed: [1, 2, 3, 4, 5, 6, 7]
    artefacts:
      profile: ./my-ds.profile.yaml
      findings: ./my-ds.findings.md
```

### `token_source.regime` values

| Regime | When to use |
|---|---|
| `tokens-studio` | Tokens are authored in [Tokens Studio](https://tokens.studio); a DS-specific tokens MCP exposes `list_token_sets` / `browse_tokens` |
| `dtcg-folder` | Tokens live as DTCG-spec JSON files under `path:` |
| `figma-variables` | Tokens are Figma Variables (resolved at scaffold-time via Plugin-API or `cdf_resolve_figma_variables`) |
| `figma-styles` | Pre-Variables Figma Styles (paint / text / effect styles) |
| `enterprise-rest` | Figma Enterprise REST `/v1/files/{key}/variables` endpoint |
| `none` | DS has no machine-readable token surface (skill records this as a finding) |

Unknown keys are ignored by the validator + other consumers, so
adding tool-specific extensions under a namespaced sub-block is safe.

## Figma access (Personal Access Token)

The Figma-source tools in `@formtrieb/cdf-mcp`
(`cdf_fetch_figma_file`, `cdf_extract_figma_file` with
`source: "rest"`, `cdf_resolve_figma_variables`) need a Figma
Personal Access Token to hit the REST API. Create one at
<https://www.figma.com/settings> → **Personal access tokens** →
*Generate new token* with the **File content — Read** scope (and
**Variables — Read** if you're on Enterprise and want T2 Variable
resolution).

PAT resolution order in every cdf-mcp tool that takes one:
**`pat:` arg → `FIGMA_PAT` env var → actionable error.** The arg
form overrides the env var so you can default to one PAT in the
shell and override per-call.

Two common delivery patterns:

```bash
# Option A — shell env var (engineer-friendly; one PAT for all DS work)
export FIGMA_PAT="figd_YOUR_TOKEN_HERE"   # add to ~/.zshrc to persist

# Option B — per-call arg (designer-friendly; multi-account / per-file PATs)
# Inside a Claude Code session, ask the skill to call:
#   cdf_fetch_figma_file({ file_key: "abc123", pat: "figd_OTHER_TOKEN" })
```

The full how-to (creation walkthrough with screenshots, scope
table, `.env`-file delivery for project-scoped tokens, common error
diagnoses, security notes, and the no-PAT T0 fallback for
evaluators) lives in the
[`cdf` plugin README](https://github.com/formtrieb/cdf-plugin#figma-personal-access-token-pat).
The mechanics are identical whether you use cdf-mcp through the
plugin or directly via Claude Desktop's MCP config.

## The five-DS evidence suite

Each example under [`examples/`](./examples/) is a complete port of a
real design system's components (Button plus one companion) to CDF.
Every port produced a `findings.md` log of friction encountered;
the summaries live under [`evidence/`](./evidence/) as
`BIG-DS-{DS}-BRIEF.md` (the mission-and-scope handoff for the pass)
and `BIG-DS-{DS}-FINDINGS.md` (the one-page verdict).

These aren't theoretical examples. They are the pre-shipping
stress tests that informed every format decision; every `findings.md`
either triggered a format refinement (draft.7 Token-Driven Principle
formalisation, draft.8 `property.target_only` field, §13.5.1
single-ring focus note, §5.6 Token-key vs Semantic-API naming) or
confirmed that the existing format absorbed the DS without bending.

Each individual pass's `BIG-DS-{DS}-BRIEF.md` + `FINDINGS.md` pair in
[`evidence/`](./evidence/) tells the story of that pass's methodology
and outcome. The `CHANGELOG.md` at the repo root captures which
spec-text changes each draft round introduced.

## Relationship to DTCG

CDF and DTCG are complementary, not competing:

- **DTCG** standardises *tokens*: how to write `{ "$value": "#0066cc", "$type": "color" }` files that many tools can consume.
- **CDF** standardises *components*: how to declare that `Button.variant=primary` binds `container.background-color` to the token path `color.button.primary.bg`.

A CDF Profile declares `dtcg_version:` and maps its `token_grammar`
to DTCG `$type` values. A conforming toolchain reads both side by
side; each has its own typing conventions and its own contribution
to the output.

## License

Apache-2.0 — see [LICENSE](./LICENSE). Both the spec text and the
example profiles/specs fall under Apache-2.0.

Third-party upstream material (foreign-DS token sources cloned
on-demand per each example's Step 0) carries its original upstream
license; see per-example READMEs.

## Contributing

CDF is pre-1.0-of-adoption — format is stable, ecosystem is young.
Issues and PRs are welcome. Format-changing PRs are assessed
against the same standard the format currently holds itself to: is
there **multi-DS evidence** that the change is needed? Single-DS
observations become doc-polish items; multi-DS patterns become
additive format extensions (never breaking removals in minor
versions).

See [`evidence/`](./evidence/) for the shape of evidence the format
was validated against; a similar one-page findings doc accompanies
significant PRs.
