/**
 * Reference transformer — Storybook CSF3 stories → ScaffoldInput.components[].
 *
 * Regex-based static parse. For production use prefer @babel/parser
 * to handle inheritance, spread-args, and dynamic control types.
 */
import { readFileSync } from "node:fs";
import type {
  ScaffoldInput,
  ScaffoldInputComponent,
  ScaffoldInputProperty,
  ScaffoldInputToken,
} from "formtrieb-cdf-core";

export function extractComponentFromCSF(filePath: string): ScaffoldInputComponent | undefined {
  const src = readFileSync(filePath, "utf-8");

  const titleMatch = src.match(/title:\s*["']([^"']+)["']/);
  if (!titleMatch) return undefined;
  const title = titleMatch[1];
  const name = title.split("/").pop() as string;

  const argTypesMatch = src.match(/argTypes:\s*\{([\s\S]*?)\n\s*\}/);
  if (!argTypesMatch) return { name, properties: [] };

  const properties: ScaffoldInputProperty[] = [];
  const propRe = /(\w+)\s*:\s*\{\s*control:\s*\{\s*type:\s*["'](\w+)["'][^}]*\}(?:\s*,\s*options:\s*(\[[^\]]*\]))?/g;
  let match: RegExpExecArray | null;
  while ((match = propRe.exec(argTypesMatch[1])) !== null) {
    const propName = match[1];
    const controlType = match[2];
    const optionsLit = match[3];
    if (controlType === "select" && optionsLit) {
      const values = JSON.parse(optionsLit.replace(/'/g, '"')) as string[];
      properties.push({ name: propName, type: "variant", values });
    } else if (controlType === "boolean") {
      properties.push({ name: propName, type: "boolean" });
    } else if (controlType === "text") {
      properties.push({ name: propName, type: "text" });
    }
  }

  return { name, properties };
}

export function buildScaffoldInput(params: {
  tokens: ScaffoldInputToken[];
  storyFiles: string[];
}): ScaffoldInput {
  const components: ScaffoldInputComponent[] = [];
  for (const file of params.storyFiles) {
    const c = extractComponentFromCSF(file);
    if (c) components.push(c);
  }
  return {
    tokens: params.tokens,
    modes: [],
    components,
    source: { kind: "handwritten", ref: "storybook-csf extractor" },
  };
}
