// Ad-hoc validator for the USWDS CDF example.
// Run from repo root: node cdf/examples/uswds/.validate.mjs cdf/examples/uswds/specs/*.yaml
//
// After cdf-core is extracted to the formtrieb/cdf-core repo and published
// to npm (Akt 3), this import flips to `@formtrieb/cdf-core`. For now the
// private-monorepo relative path is used so validation keeps working during
// the extraction transition.
import { parseProfile, parseCDF, validate } from '../../../packages/cdf-core/dist/index.js';
import { readFileSync } from 'node:fs';

const profileYaml = readFileSync('./cdf/examples/uswds/uswds.profile.yaml', 'utf8');
const profile = parseProfile(profileYaml);
console.log('✓ profile parses cleanly');

const specs = process.argv.slice(2);
let totals = { errors: 0, warnings: 0, info: 0 };

for (const spec of specs) {
  const yaml = readFileSync(spec, 'utf8');
  const component = parseCDF(yaml, spec);
  const report = validate(component, undefined, spec, { profile });
  totals.errors += report.summary.errors;
  totals.warnings += report.summary.warnings;
  totals.info += report.summary.info;
  console.log(`\n${spec}:`);
  console.log(`  errors:   ${report.summary.errors}`);
  console.log(`  warnings: ${report.summary.warnings}`);
  console.log(`  info:     ${report.summary.info}`);
  for (const issue of [...report.errors, ...report.warnings, ...report.info]) {
    console.log(`    [${issue.severity}] ${issue.id || '?'}: ${issue.message}`);
  }
}
console.log(`\nTotal: ${totals.errors} error / ${totals.warnings} warning / ${totals.info} info`);
process.exit(totals.errors > 0 ? 1 : 0);
