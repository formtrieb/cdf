/**
 * Reference transformer — DTCG tokens.json → ScaffoldInput.
 *
 * Runnable as-is:
 *   tsx cdf/examples/scaffold-input/dtcg-only.ts ./tokens.json > scaffold-input.json
 */
import { readFileSync } from "node:fs";
import type {
  ScaffoldInput,
  ScaffoldInputToken,
  TokenType,
} from "formtrieb-cdf-core";

interface DtcgLeaf {
  $value: string | number;
  $type?: string;
}
type DtcgNode = DtcgLeaf | { [key: string]: DtcgNode };

function isLeaf(n: unknown): n is DtcgLeaf {
  return (
    typeof n === "object" &&
    n !== null &&
    "$value" in (n as Record<string, unknown>)
  );
}

export function flattenDtcg(root: DtcgNode, prefix: string[] = []): ScaffoldInputToken[] {
  const out: ScaffoldInputToken[] = [];
  if (isLeaf(root)) {
    out.push({
      path: prefix.join("."),
      value: root.$value,
      type: normaliseType(root.$type),
    });
    return out;
  }
  for (const [key, child] of Object.entries(root)) {
    if (key.startsWith("$")) continue; // metadata ($schema, $description, etc.)
    out.push(...flattenDtcg(child as DtcgNode, [...prefix, key]));
  }
  return out;
}

function normaliseType(t: string | undefined): TokenType {
  switch (t) {
    case "color":       return "color";
    case "dimension":   return "dimension";
    case "typography":  return "typography";
    case "shadow":      return "shadow";
    case "number":      return "number";
    default:            return "string";
  }
}

export function buildScaffoldInput(params: {
  tokenFile: string;
  dtcg: DtcgNode;
}): ScaffoldInput {
  return {
    tokens: flattenDtcg(params.dtcg),
    modes: [],
    components: [],
    source: { kind: "dtcg", ref: params.tokenFile },
  };
}

// ── CLI entry ─────────────────────────────────────────────────────────────
if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: tsx dtcg-only.ts <tokens.json>");
    process.exit(1);
  }
  const dtcg = JSON.parse(readFileSync(file, "utf-8")) as DtcgNode;
  process.stdout.write(
    JSON.stringify(buildScaffoldInput({ tokenFile: file, dtcg }), null, 2) + "\n",
  );
}
