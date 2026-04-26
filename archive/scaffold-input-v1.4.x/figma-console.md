# Transformer — figma-console MCP

The `figma-console` MCP exposes Figma data via a lighter-weight API
than the official Figma MCP. It lacks Code Connect integration but is
often preferred for quick prototyping or when the official server's
auth footprint is inconvenient.

## Tools used

| figma-console tool | What we extract |
|--------------------|-----------------|
| `get_variables` | Variables + collections with mode resolution → `tokens[]` + `modes[]` |
| `get_component_set` | Component definitions and their variant properties |
| `get_file_info` | File name + key for `source.ref` |

## What's different from `figma-official`

- **No Code Connect.** `components[].token_refs` is omitted; the
  scaffold falls back to prior-art-seeded grammar descriptions
  without `used_by:` lists. For LLM-authoring-ready Profiles, prefer
  the official MCP when Code Connect is available.
- **Variable shapes** are flatter: paths come through with `.`
  separators already; no normalisation needed.
- **Mode-value maps** are keyed by mode *name* not mode *id*, which
  simplifies the default-mode pick.

## Example output

```jsonc
{
  "tokens": [
    { "path": "color.primary.bg.rest", "value": "#3b82f6", "type": "color" }
  ],
  "modes": [
    { "collection": "Theme", "values": ["Light", "Dark"] }
  ],
  "components": [
    {
      "name": "Button",
      "properties": [
        { "name": "variant", "type": "variant", "values": ["primary", "secondary"] }
      ]
      // no token_refs — scaffold will warn + fall back
    }
  ],
  "source": { "kind": "figma-console", "ref": "ABC123DEF" }
}
```

See [`figma-console.ts`](./figma-console.ts) for a runnable example.

## Graceful degradation

Running the scaffold against a figma-console-sourced ScaffoldInput
still produces a valid Profile. The Profile is just weaker for
downstream LLM authoring:

- Grammars lose their `used_by: [...]` annotations (the structural
  signal that tells an LLM which grammar serves which components).
- Descriptions are less specific (generic "Scaffold-inferred
  grammar" instead of "Used by Button, TextField — looks like an
  Interactive Controls pattern per Formtrieb").

If you care about this signal, **either** switch to the official
Figma MCP (for Code Connect) **or** maintain the `token_refs`
mapping by hand (see [handwritten](./handwritten.md)).
