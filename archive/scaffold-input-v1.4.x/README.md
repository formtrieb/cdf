# ScaffoldInput — Transformer Catalogue

> **⚠️ DEPRECATED — historical reference only.**
>
> The `cdf_profile_scaffold` MCP tool referenced below was **removed in
> cdf-mcp v1.4.0** (April 2026). Profile authoring is now skill-based
> via `cdf-profile-scaffold` (a Claude Code Skill that orchestrates a
> 7-phase Profile-scaffolding workflow against the cdf-mcp v1.5.0+
> tool surface — `cdf_validate_profile`, `cdf_get_spec_fragment`,
> `cdf_diff_profile`, `cdf_coverage_profile`, etc.).
>
> The five transformer patterns below (figma-official, figma-console,
> dtcg-only, storybook-csf, handwritten) remain useful as **conceptual
> references** for shaping DS sources into a normalised input. The
> Skill consumes a richer phase-1 walker output (see
> `cdf/specs/CDF-PROFILE-SPEC.md` §1 + the `cdf-profile-scaffold`
> Skill's Phase 1 docs), not the ScaffoldInput JSON described here.
>
> **Action items:**
> - For a current Profile-authoring workflow, install the Claude
>   Code plugin (post-Akt 3) or read the Skill source under
>   `.claude/skills/cdf-profile-scaffold/SKILL.md`.
> - The TypeScript transformers (`figma-official.ts` etc.) still
>   compile against the v1.4.x ScaffoldInput shape. They are NOT
>   maintained against current cdf-mcp tool surfaces.
>
> This directory may be removed or relocated in the run-up to npm
> publish of `formtrieb-cdf-mcp` v1.7.0.

---

## Historical content (v1.3.x — v1.4.x ScaffoldInput contract)

The `cdf_profile_scaffold` tool reads a **ScaffoldInput JSON** file
that you produce from your existing design-system source. The tool is
intentionally MCP-agnostic: it parses the JSON you bring, not Figma /
DTCG / Storybook directly. Shaping those sources into ScaffoldInput
is your responsibility — but this catalogue ships five
copy-paste-ready starting points.

## Contract

See [`scaffold-input.schema.json`](./scaffold-input.schema.json) for
the JSON-Schema (auto-generated from the TypeScript interface in
`packages/cdf-core/src/analyzer/profile-scaffold/input-parser.ts`).

Minimum viable input:

```json
{
  "tokens": []
}
```

`modes` and `components` are both optional (default `[]`). `source`
metadata is optional but helpful for the scaffold's provenance
comment at the top of the emitted Profile.

## Included transformers

| Source | Produces | Script |
|--------|----------|--------|
| [figma-official](./figma-official.md) | Figma Variable Collections + Components via the official Figma MCP | [figma-official.ts](./figma-official.ts) |
| [figma-console](./figma-console.md) | Same idea, via the `figma-console` MCP | [figma-console.ts](./figma-console.ts) |
| [dtcg-only](./dtcg-only.md) | A DTCG `tokens.json` with no component data | [dtcg-only.ts](./dtcg-only.ts) |
| [storybook-csf](./storybook-csf.md) | Storybook CSF3 stories (`argTypes` → component properties) | [storybook-csf.ts](./storybook-csf.ts) |
| [handwritten](./handwritten.md) | Minimal hand-authored example | [handwritten.json](./handwritten.json) |

**Scripts are reference implementations.** They demonstrate the shape
of the output; they do NOT have to be runtime dependencies of your
project. Copy, adapt, discard — whatever suits your pipeline.

## The two-axis test for a good transformer

1. **Completeness.** `tokens` should enumerate every token the
   generated Profile should catalogue. Omissions surface as gaps in
   `token_grammar` / `standalone_tokens`.
2. **Token refs.** When your source knows which components use which
   tokens (Figma Dev Mode, Code Connect, source-code parsing), set
   `components[].token_refs: [...]`. Without it the scaffold still
   works but emits weaker `used_by:` annotations — the Profile is
   valid but less LLM-authoring-ready (see design §3.6 / D2b).

## Running the scaffold against your input

```bash
# Via the MCP server (interactive — prompts for the three milestones):
# In your MCP client: call `cdf_profile_scaffold` with
#   input_path: ./my-input.json
#   ds_name:    "Acme"
#   ds_identifier: "acme"
#   mode:       "interactive"

# Via Node / tsx directly (agent-mode):
tsx -e "
import { scaffoldProfile, parseScaffoldInput, loadPriorArtIndex } from 'formtrieb-cdf-core';
import { readFileSync, writeFileSync } from 'node:fs';
const input = parseScaffoldInput(readFileSync('./my-input.json', 'utf-8'));
const r = scaffoldProfile(input, {
  ds_name: 'Acme', ds_identifier: 'acme', priorArt: loadPriorArtIndex(),
});
writeFileSync('./acme.profile.yaml', r.profileYaml, 'utf-8');
"
```
