# Transformer — Storybook CSF3

When your DS ships with [CSF3](https://storybook.js.org/docs/writing-stories)
stories for every component, the `argTypes` declarations already
encode what the scaffold needs for `components[].properties[]`.
Pair it with a tokens source (DTCG, Tailwind config, generated JSON)
for a complete ScaffoldInput.

## What we extract

| CSF3 source | ScaffoldInput field |
|-------------|---------------------|
| `default export.title` | `components[].name` (last path segment by convention) |
| `argTypes[name].control.type === 'select'` + `.options[]` | `properties[].type: "variant"` + `values[]` |
| `argTypes[name].control.type === 'boolean'` | `properties[].type: "boolean"` |
| `argTypes[name].control.type === 'text'` | `properties[].type: "text"` |

CSF3 has no native convention for `token_refs`. If you want the
stronger LLM-authoring-ready annotation, pair the Storybook extractor
with a source-code walk that scans each component's CSS for
`var(--…)` references.

## Example — extracting from one story file

```ts
// Button.stories.ts (CSF3)
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Inputs/Button",
  argTypes: {
    variant: { control: { type: "select" }, options: ["primary", "secondary"] },
    size:    { control: { type: "select" }, options: ["sm", "md", "lg"] },
    disabled: { control: { type: "boolean" } },
  },
};
export default meta;
export const Default: StoryObj = {};
```

Becomes:

```json
{
  "name": "Button",
  "properties": [
    { "name": "variant", "type": "variant", "values": ["primary", "secondary"] },
    { "name": "size",    "type": "variant", "values": ["sm", "md", "lg"] },
    { "name": "disabled", "type": "boolean" }
  ]
}
```

See [`storybook-csf.ts`](./storybook-csf.ts) for a runnable glob-and-parse
implementation.

## Gotchas

- **Static parsing vs runtime evaluation.** A CSF3 `argTypes` field is
  sometimes a function or inherits from `parameters.controls.exclude`.
  The script below uses a regex-based static parse for speed; for
  real projects a `@babel/parser`-based walk gives better coverage.
- **Story title → component name.** The script takes the last segment
  of `title` ("Inputs/Button" → "Button"); if your convention differs,
  override.
- **No tokens.** CSF3 stories don't ship tokens. Combine this
  transformer with [`dtcg-only.ts`](./dtcg-only.ts) or a Tailwind /
  style-dictionary extractor.
