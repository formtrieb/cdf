# Transformer — Figma (official MCP)

The official [Figma MCP server](https://www.figma.com/developers/mcp)
exposes a file's Variable Collections and Dev-Mode component data.
This transformer glues those calls into a ScaffoldInput.

## Tools used

| Figma MCP tool | What we extract |
|----------------|-----------------|
| `get_variable_defs` | Variables with resolved values per mode → `tokens[]` + `modes[]` |
| `get_design_context` on a component-set | Component name, variant properties, Code-Connect snippets |
| `get_metadata` | File name, `source.ref` (file key) |

## Shape of the output

```jsonc
{
  "tokens": [
    { "path": "color.primary.bg.rest", "value": "#3b82f6", "type": "color" },
    // … one entry per (variable × default mode)
  ],
  "modes": [
    { "collection": "Theme",   "values": ["Light", "Dark"] },
    { "collection": "Density", "values": ["Comfortable", "Compact"] }
  ],
  "components": [
    {
      "name": "Button",
      "properties": [
        { "name": "variant", "type": "variant", "values": ["primary", "secondary"] },
        { "name": "size",    "type": "variant", "values": ["sm", "md", "lg"] }
      ],
      // Code Connect snippets reveal which variables the component uses.
      // Omit when unavailable; scaffold falls back to prior-art-seeded
      // descriptions without the structural `used_by` list.
      "token_refs": ["color.primary.bg.rest", "color.primary.text.rest"]
    }
  ],
  "source": { "kind": "figma", "ref": "ABC123DEF" }
}
```

## Key mapping choices

- **Variable path**: take the variable's resolved name (e.g.
  `color/button/primary/bg/rest`); normalise `/` → `.` (the parser
  accepts either but `.` is canonical).
- **Default mode** is the mode listed first in the collection.
  Scaffold works on one resolved value per token; mode-variation is
  surfaced through `modes[]`.
- **Component properties**: Figma variant-properties → `type: "variant"`
  with `values[]`; boolean properties → `type: "boolean"`; instance-swap
  → `type: "instance-swap"`; text → `type: "text"`.
- **token_refs** extraction: parse Code Connect templates for
  `var(--…)` references OR walk `fills`/`strokes` on the component
  node. The script below shows the "from Code Connect" path — it's
  the higher-signal source.

See [`figma-official.ts`](./figma-official.ts) for a runnable
implementation.

## Gotchas

- Figma's `get_variable_defs` returns **all** collections; filter to
  the DS's core collections to avoid polluting `tokens[]` with
  file-local or customer-specific overrides.
- `ScaffoldInput.tokens[].value` must be a single resolved value.
  Pick the mode you want to treat as canonical and emit that one;
  the scaffold uses `modes[]` to remember the axis without needing
  per-mode values.
- If the Figma file has no Code Connect, the transformer can still
  work — just omit `components[].token_refs`. The scaffold will emit
  a warning and the resulting Profile will be slightly weaker for
  LLM authoring (see design §3.6).
