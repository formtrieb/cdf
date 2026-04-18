#!/usr/bin/env node
// Ad-hoc validator for the Primer CDF example — uses ./.cdf.config.yaml.
// Run from this directory: cd cdf/examples/primer && node .validate.mjs
//
// After cdf-core is extracted to the formtrieb/cdf-core repo and published
// to npm (Akt 3), this import flips to `@formtrieb/cdf-core`. For now the
// private-monorepo relative path is used so validation keeps working during
// the extraction transition.
import { parseConfigFile, validateAll } from "../../../packages/cdf-core/dist/index.js";
import { resolve } from "node:path";

const configPath = resolve(process.cwd(), ".cdf.config.yaml");
const config = parseConfigFile(configPath);

const specDirs = (config.spec_directories || []).map((d) =>
  resolve(process.cwd(), d),
);

const reports = validateAll(specDirs, config);

const summary = reports.map((r) => ({
  file: r.file,
  valid: r.valid,
  errors: r.summary.errors,
  warnings: r.summary.warnings,
  info: r.summary.info,
  errorIssues: r.errors.map((i) => ({ rule: i.rule, path: i.path, message: i.message })),
  warningIssues: r.warnings.map((i) => ({ rule: i.rule, path: i.path, message: i.message })),
}));

console.log(JSON.stringify(summary, null, 2));

const errorCount = summary.reduce((a, b) => a + b.errors, 0);
process.exit(errorCount > 0 ? 1 : 0);
