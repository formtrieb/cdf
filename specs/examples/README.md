# Minimal Examples — CDF v1.0.0-draft.5

Three files that together form the smallest valid CDF design system. Each is
short enough to read in a minute. They exist to answer one question: *"what
is the minimum surface a Component / Profile / Target must declare?"*

## Files

| File | Role | What it shows |
|------|------|---------------|
| [`minimal.profile.yaml`](./minimal.profile.yaml) | DS-level vocabulary + grammar | One vocabulary, one token grammar, one interaction pattern, one category. Identifier-based naming (post-Batch-2). Empty `theming: {}`. |
| [`minimal.component.yaml`](./minimal.component.yaml) | A single Component (`Tag`) | One property, one anatomy part, one token. No states, no events, no slots. Demonstrates property-driven token binding. |
| [`minimal.target.yaml`](./minimal.target.yaml) | Angular binding | Where files go, how they're named, regen policy. Uses Identifier Template DSL for `selector_pattern`. |

## Running the validator

The simplest path is via the CDF MCP tool, after pointing it at this
directory's `.cdf.config.yaml`:

```text
cdf_validate                  # validates every spec in the configured directory
cdf_validate component=Tag    # narrow to a single component
```

Or directly from the repo root:

```bash
node -e "
import('./packages/cdf-core/dist/index.js').then(async ({ parseConfigFile, validateAll }) => {
  const cfg = parseConfigFile('./specs/v1.0.0-draft/examples/.cdf.config.yaml');
  for (const r of validateAll(['./specs/v1.0.0-draft/examples'], cfg)) {
    console.log(r.valid ? 'OK' : 'FAIL', r.file, r.summary);
  }
});
"
```

Expected: `OK … { errors: 0, warnings: 0, info: 0 }`.

## What these are *not*

- Not a teaching DS. A real DS has multiple hierarchies, interaction states, compound axes, theming. These examples strip all of that.
- Not a reference implementation. For real-world examples of CDF specs, see the foreign-DS validation ports under `../../examples/` (Radix, shadcn, Primer, Material 3, USWDS).
- Not a starter template. Copying these won't give you a usable DS — they show what's *mandatory*, not what's *useful*.

## Why they exist

1. **LLM priming.** A new agent loading CDF for the first time can read these in ~60 seconds and know what fields matter.
2. **Validator regression target.** If the validator ever rejects these, the format has drifted.
3. **Spec cross-check.** When editing the three format specs, run these through the validator — if they stop validating, the spec change is breaking.

## Vocabulary disambiguation

The `intent` vocabulary uses `[emphasis, subtle]` deliberately — values
disjoint from typical real-world DS vocabularies (hierarchy, intent,
validation). This avoids accidentally modeling any specific DS's semantics
and prevents LLMs from cross-pollinating these toy values with any
real DS's semantics.
