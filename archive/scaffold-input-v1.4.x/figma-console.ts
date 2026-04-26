/**
 * Reference transformer — figma-console MCP → ScaffoldInput.
 *
 * Same shape as figma-official.ts but omits `token_refs` because the
 * figma-console MCP surface has no Code Connect integration.
 */
import type {
  ScaffoldInput,
  ScaffoldInputToken,
  ScaffoldInputMode,
  ScaffoldInputComponent,
} from "formtrieb-cdf-core";

interface ConsoleVariable {
  path: string; // already dot-separated
  value: string | number;
  type: "color" | "dimension" | "string" | "number";
}
interface ConsoleCollection {
  name: string;
  modes: string[];          // e.g. ["Light", "Dark"]
  defaultMode: string;      // e.g. "Light"
  variables: ConsoleVariable[];
}
interface ConsoleComponent {
  name: string;
  variants: Array<{ name: string; type: "variant" | "boolean"; values?: string[] }>;
}

export function buildScaffoldInput(params: {
  fileKey: string;
  collections: ConsoleCollection[];
  components: ConsoleComponent[];
}): ScaffoldInput {
  const tokens: ScaffoldInputToken[] = [];
  const modes: ScaffoldInputMode[] = [];
  for (const c of params.collections) {
    for (const v of c.variables) tokens.push(v);
    if (c.modes.length > 1) modes.push({ collection: c.name, values: c.modes });
  }
  const components: ScaffoldInputComponent[] = params.components.map((c) => ({
    name: c.name,
    properties: c.variants.map((v) => ({
      name: v.name,
      type: v.type === "variant" ? "variant" : "boolean",
      values: v.values,
    })),
  }));
  return {
    tokens,
    modes,
    components,
    source: { kind: "figma-console", ref: params.fileKey },
  };
}
