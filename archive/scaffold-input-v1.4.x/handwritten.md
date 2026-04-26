# Transformer — Handwritten

The minimum-friction path: write the JSON directly. Useful for tiny
DS-es, or when you're scaffolding a Profile as an experiment and
haven't invested in transformer tooling.

This also doubles as the canonical shape reference — if you're
writing a transformer for a source not in the catalogue, start by
hand-authoring the output for one component and work backwards.

## Example — minimal valid input

[`handwritten.json`](./handwritten.json):

```json
{
  "tokens": [
    { "path": "color.primary.bg.rest",   "value": "#3b82f6", "type": "color" },
    { "path": "color.primary.bg.hover",  "value": "#2563eb", "type": "color" },
    { "path": "color.primary.text.rest", "value": "#ffffff", "type": "color" },
    { "path": "spacing.sm", "value": "8px",  "type": "dimension" },
    { "path": "spacing.md", "value": "16px", "type": "dimension" }
  ],
  "modes": [
    { "collection": "Theme", "values": ["Light", "Dark"] }
  ],
  "components": [
    {
      "name": "Button",
      "properties": [
        { "name": "variant", "type": "variant", "values": ["primary", "secondary"] },
        { "name": "size",    "type": "variant", "values": ["sm", "md", "lg"] }
      ],
      "token_refs": [
        "color.primary.bg.rest",
        "color.primary.bg.hover",
        "color.primary.text.rest"
      ]
    }
  ],
  "source": { "kind": "handwritten", "ref": "scratch-pad" }
}
```

## Running the scaffold against it

```bash
tsx -e "
import { scaffoldProfile, parseScaffoldInput, loadPriorArtIndex } from 'formtrieb-cdf-core';
import { readFileSync, writeFileSync } from 'node:fs';
const input = parseScaffoldInput(readFileSync('./handwritten.json', 'utf-8'));
const r = scaffoldProfile(input, {
  ds_name: 'Acme', ds_identifier: 'acme', priorArt: loadPriorArtIndex(),
});
writeFileSync('./acme.profile.yaml', r.profileYaml, 'utf-8');
console.log(r.warnings);
"
```

With the handwritten input above, the scaffold will emit:

- `token_grammar.color` (inferred from the 3-deep `color.*` tree)
  with `used_by: [Button]` (from `token_refs`).
- `standalone_tokens` for `spacing.sm` / `spacing.md` (too few to
  form a grammar).
- `vocabularies.variant` and `vocabularies.size` (inferred from
  `Button.properties`).
- `theming.modifiers.semantic` (re-named from "Theme" per alias
  lookup).

## When to use

- Proof-of-concept Profile generation before you invest in a
  transformer.
- Editing one component's part of a ScaffoldInput by hand after a
  Figma-sourced capture had gaps.
- Teaching / documentation.
