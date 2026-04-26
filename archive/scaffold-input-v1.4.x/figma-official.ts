/**
 * Reference transformer — official Figma MCP → ScaffoldInput.
 *
 * This file is runnable as an illustration, not a production artefact.
 * The Figma MCP-SDK surface is only shaped here; adapt to your client.
 *
 * Usage sketch (inside an MCP client):
 *   const vars       = await mcp.figma.get_variable_defs({ fileKey });
 *   const components = await mcp.figma.get_design_context({ fileKey, nodeId });
 *   const metadata   = await mcp.figma.get_metadata({ fileKey });
 *   const scaffoldInput = buildScaffoldInput({ fileKey, vars, components, metadata });
 *   await fs.writeFile("./scaffold-input.json", JSON.stringify(scaffoldInput, null, 2));
 */
import type {
  ScaffoldInput,
  ScaffoldInputToken,
  ScaffoldInputMode,
  ScaffoldInputComponent,
  PropertyType,
  TokenType,
} from "formtrieb-cdf-core";

/** Shape of what `get_variable_defs` returns (simplified for the example). */
interface FigmaVariableDefs {
  collections: Array<{
    name: string;
    modes: Array<{ modeId: string; name: string }>;
    defaultModeId: string;
    variables: Array<{
      name: string; // `color/button/primary/bg/rest`
      resolvedType: "COLOR" | "FLOAT" | "STRING" | "BOOLEAN";
      valuesByMode: Record<string, string | number>;
    }>;
  }>;
}

/** Shape of what `get_design_context` returns for a component-set (simplified). */
interface FigmaComponentContext {
  name: string;
  properties: Array<{
    name: string;
    type: "VARIANT" | "BOOLEAN" | "INSTANCE_SWAP" | "TEXT";
    values?: string[];
  }>;
  /** From Code Connect: every CSS custom-property referenced by the component. */
  referencedVariables?: string[];
}

interface FigmaFileMetadata {
  fileKey: string;
  name: string;
}

export function buildScaffoldInput(params: {
  fileKey: string;
  vars: FigmaVariableDefs;
  components: FigmaComponentContext[];
  metadata?: FigmaFileMetadata;
}): ScaffoldInput {
  const tokens = flattenVariables(params.vars);
  const modes = flattenModes(params.vars);
  const components = params.components.map(toScaffoldComponent);

  return {
    tokens,
    modes,
    components,
    source: {
      kind: "figma",
      ref: params.fileKey,
      date: new Date().toISOString().slice(0, 10),
    },
  };
}

function flattenVariables(vars: FigmaVariableDefs): ScaffoldInputToken[] {
  const out: ScaffoldInputToken[] = [];
  for (const collection of vars.collections) {
    for (const variable of collection.variables) {
      const value = variable.valuesByMode[collection.defaultModeId];
      if (value === undefined) continue;
      out.push({
        path: variable.name.replace(/\//g, "."),
        value,
        type: mapVariableType(variable.resolvedType),
      });
    }
  }
  return out;
}

function flattenModes(vars: FigmaVariableDefs): ScaffoldInputMode[] {
  return vars.collections
    .filter((c) => c.modes.length > 1) // single-mode collections aren't theming axes
    .map((c) => ({
      collection: c.name,
      values: c.modes.map((m) => m.name),
    }));
}

function toScaffoldComponent(c: FigmaComponentContext): ScaffoldInputComponent {
  return {
    name: c.name,
    properties: c.properties.map((p) => ({
      name: p.name,
      type: mapPropertyType(p.type),
      values: p.values,
    })),
    // When Code Connect isn't configured, omit `token_refs` — the
    // scaffold emits a non-fatal warning + falls back to prior-art
    // descriptions without structural `used_by:` annotations.
    token_refs: c.referencedVariables?.map((v) => v.replace(/\//g, ".")),
  };
}

function mapVariableType(t: FigmaVariableDefs["collections"][number]["variables"][number]["resolvedType"]): TokenType {
  switch (t) {
    case "COLOR":   return "color";
    case "FLOAT":   return "dimension";
    case "BOOLEAN": return "number"; // no dedicated boolean token type
    case "STRING":  return "string";
  }
}

function mapPropertyType(t: FigmaComponentContext["properties"][number]["type"]): PropertyType {
  switch (t) {
    case "VARIANT":        return "variant";
    case "BOOLEAN":        return "boolean";
    case "INSTANCE_SWAP":  return "instance-swap";
    case "TEXT":           return "text";
  }
}
