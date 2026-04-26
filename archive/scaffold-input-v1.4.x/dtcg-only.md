# Transformer — DTCG `tokens.json` only

When your source is a DTCG-compliant `tokens.json` and you have no
component catalogue (Figma, Storybook, etc.) to draw from, this is
the lean path. The resulting Profile has:

- A rich `token_grammar` and/or `standalone_tokens` section (full
  token coverage).
- An **empty** `vocabularies:` section — the scaffold has nothing to
  infer vocabularies from.
- `theming.modifiers` populated from DTCG mode-tokens (W3C DTCG 2.0+
  convention: sibling keys with `$extensions.mode` annotations).

You fill in vocabularies by hand after the scaffold runs, or come
back later with a Figma / Storybook source and re-scaffold (into a
different output path — the tool is fresh-only).

## Example input

```json
{
  "$schema": "https://design-tokens.org/spec/draft-0.1/tokens.schema.json",
  "color": {
    "primary": {
      "bg": { "rest":  { "$value": "#3b82f6", "$type": "color" },
              "hover": { "$value": "#2563eb", "$type": "color" } },
      "text":{ "rest":  { "$value": "#ffffff", "$type": "color" } }
    }
  },
  "spacing": {
    "sm": { "$value": "8px",  "$type": "dimension" },
    "md": { "$value": "16px", "$type": "dimension" }
  }
}
```

## Output shape

```jsonc
{
  "tokens": [
    { "path": "color.primary.bg.rest", "value": "#3b82f6", "type": "color" },
    { "path": "color.primary.bg.hover", "value": "#2563eb", "type": "color" },
    { "path": "color.primary.text.rest", "value": "#ffffff", "type": "color" },
    { "path": "spacing.sm", "value": "8px", "type": "dimension" },
    { "path": "spacing.md", "value": "16px", "type": "dimension" }
  ],
  "modes": [],
  "components": [],
  "source": { "kind": "dtcg", "ref": "./tokens.json" }
}
```

See [`dtcg-only.ts`](./dtcg-only.ts) for a runnable flattener.

## When to use

- Green-field DS that starts with tokens before components.
- Auditing an established DTCG source to see what the CDF Profile
  would look like.
- Migration path: run once for tokens, then edit the Profile to add
  vocabularies, then re-run the tool later in update mode (future
  `cdf_profile_merge`, v1.3+) to sync new tokens.
