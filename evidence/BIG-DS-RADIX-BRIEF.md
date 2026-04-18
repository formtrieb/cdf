# Big-DS Radix Port — Session Brief

**Status:** Operational handoff for the next session.
**Companion doc:** [`BIG-DS-RADIX-SKETCH.md`](./BIG-DS-RADIX-SKETCH.md) — the
conceptual analysis that motivated this brief. Read it first if you're
new to the task.

## Mission (one paragraph)

Port two Radix Primitives — **Separator** and **Toggle** — to CDF
v1.0.0-draft.5 as a foreign-DS validation pass. Surface the friction
points where CDF's Formtrieb-grown shape doesn't fit a headless,
composition-first DS. The output is **not** a full Radix profile — it's
a `findings.md` enumerating concrete CDF format gaps and a small set
of specs that prove the format can carry a non-Formtrieb DS at all.

## Setup

```
radixTests/
  radix.profile.yaml          ← hand-author yourself (Profile is judgment)
  .cdf.config.yaml            ← mirror an existing-DS config shape, point at this dir
  specs/
    separator.component.yaml
    toggle.component.yaml
  findings.md                 ← per-friction running log
```

**Source-of-truth for Radix:**
- Docs: https://www.radix-ui.com/primitives/docs/components/separator
- Docs: https://www.radix-ui.com/primitives/docs/components/toggle
- Source if needed: https://github.com/radix-ui/primitives/tree/main/packages/react/separator
- Source if needed: https://github.com/radix-ui/primitives/tree/main/packages/react/toggle

**Token strategy decision (made up front, do not reopen mid-port):**
Pure-Radix means **no tokens**. `tokens: {}` in the Profile, `tokens: {}`
or omitted in components. The shadcn/ui token-bridge concern is a
separate later test — do not conflate.

**CDF spec & validator state:** v1.0.0-draft.5. Validator implements
draft.5 rules. The `cdf-core` package is the validator host; see
`packages/cdf-core/src/validator/rules/` for the rule files if you need
to understand a rejection.

## Working sources to consult

- `specs/v1.0.0-draft/CDF-PROFILE-SPEC.md` — what a Profile must declare
- `specs/v1.0.0-draft/CDF-COMPONENT-SPEC.md` — what a Component must declare
- `specs/v1.0.0-draft/examples/` — minimal valid trio, useful as starting shape
- A real Formtrieb Profile (`formtrieb.profile.yaml`) — structural
  reference for what a full Profile looks like
- A feature-rich internal Component spec (e.g. an InputCore / Checkbox)
  — example of mirrors_state, compound_states, anatomy bindings
- `BIG-DS-RADIX-SKETCH.md` — predicted friction points, do not
  re-derive them

## Step-by-step

### Step 1 — Profile (≈1h, hand-authored)

Author `radix.profile.yaml`. Keep it small. Friction will surface
immediately around Sketch §3.1 (`tokens` required). When the validator
rejects an empty-tokens spec, that's Finding #1. Do **not** patch CDF
mid-port — log it in `findings.md` and continue with `tokens: {}`
declared even if the validator complains.

Required-shape checklist (per Profile §3 + Batch-2 naming):

- [ ] `name`, `version`, `cdf_version`, `dtcg_version`, `description`
- [ ] `vocabularies:` — at minimum `orientation: [horizontal, vertical]`
- [ ] `token_grammar: {}` — empty
- [ ] `token_layers: []` — empty
- [ ] `theming: {}` — empty
- [ ] `interaction_patterns:` — `static`, `pressable`, `toggleable`
  (the last is new; sketch it minimally)
- [ ] `accessibility_defaults.category_defaults` — at minimum a
  Primitive default
- [ ] `naming:` — `identifier: rdx`, casing, empty `reserved_names`
- [ ] `categories:` — `Primitive` (Separator), `Interactive` (Toggle).
  If you decide Sketch §3.1's `visual_contract: false` is the right
  call, declare it on Primitive — that's the one allowed format
  change per the success criterion.

Validate. Iterate until profile is clean OR you've decided a
finding-and-defer is the right call. Either way, log in `findings.md`.

### Step 2 — Separator (≈30 min)

Smallest non-trivial Radix primitive. One component, two props
(`orientation`, `decorative`), no states, no events, no children.

Watch for:
- Does CDF accept zero `states:`? (Likely yes per §8 — verify.)
- `decorative` has a conditional ARIA effect (`role="separator"` only
  when `decorative=false`). Today CDF has no formal mechanism for
  conditional ARIA. Log as Friction.
- If `tokens: {}` was rejected in Step 1, decide: omit the block
  entirely, leave it empty with comment, or accept the validator
  error.

### Step 3 — Toggle (≈45 min)

Stresses `mirrors_state` (draft.5 §7.11) in a headless context. The
pressed property mirrors a state axis used for nothing but
data-attribute emission.

Watch for:
- `defaultPressed` vs `pressed` is a controlled/uncontrolled pair —
  CDF's `mutual_exclusion` is symmetric; this isn't really mutual
  exclusion. Log as Friction.
- Toggle has no token-relevant state axes (everything is
  data-attribute). `token_expandable: false` on every state. Does
  CDF require `token_expandable` even when no tokens exist? Log if so.
- `aria-pressed` reflection — does the spec capture this declaratively
  or only in prose?

### Step 4 — Validate + decide

Run validator after each spec. Categorise each rejection:

- **Real format gap** → log in `findings.md` with proposed spec patch
- **Validator behind spec** → log as cdf-core TODO, do not block port
- **My misunderstanding of CDF** → fix the spec, do not log

The success criterion is **≤1 new optional CDF field + ≤1 new
Category-toggle**. If after Toggle you've accumulated more, **stop
and write up findings** — Dialog is not the next move. The next move
is draft.6 spec evolution.

### Step 5 (optional) — LLM cross-test (≈1h)

If Profile + Separator are clean and the format-change budget isn't
spent, hand a fresh LLM the Profile + Separator spec and the Toggle
docs. Compare the LLM's Toggle to your hand-authored one. Two
questions:
- Did the LLM make different judgment calls? (Where is the spec
  ambiguous?)
- Did the LLM hit the same friction you did? (Validates that the
  friction is real, not just your style.)

## findings.md format

One section per friction. Use this template:

```markdown
## F-Radix-N: short title

**Radix reality:** what Radix actually does, with a doc/source link.
**CDF status:** which spec section forbids/requires/lacks the support.
**Suggested fix:** spec change OR Radix-side compromise OR accept the
tension. One sentence on the "why this option".
**Verdict:** Spec change (draft.6) | Cdf-core TODO | Accepted tension.
**Effort:** small / medium / large.
```

A friction is **not** a finding if it's resolved by reading the spec
more carefully — log only what survives serious attempts to map onto
existing CDF mechanisms.

## What you are NOT doing in this session

- **Not porting Dialog.** Dialog needs the `composed_by:` decision
  (Sketch §3.2). That decision needs Separator + Toggle to inform it.
  Stop after Toggle.
- **Not building shadcn/ui.** Token-bridge work is a separate test.
- **Not extending the validator beyond draft.5.** If a draft.5 rule
  doesn't fire when expected, log as cdf-core TODO. If a rule should
  exist but doesn't, log as draft.6 candidate. Don't write rule code.
- **Not writing a Radix marketing page.** This is a friction-discovery
  exercise, not a "look how flexible CDF is" demo. Honesty over polish.

## When you're done

Hand back to the main session with:

1. The four files in `radixTests/` (profile, two specs, findings.md)
2. A one-page summary in `docs/BIG-DS-RADIX-FINDINGS.md` that:
   - Lists the format-change budget used (X new fields, Y new toggles)
   - Names the top 3 frictions by impact
   - Recommends: "go to shadcn next" OR "stop, draft.6 first"
3. A commit per major step (profile, separator, toggle, findings) so
   the next reviewer can replay your decisions

If the format-change budget is exceeded, the recommendation is
**always** "stop, draft.6 first". Don't push to Dialog with a strained
format.

## Why this format of brief

This brief is itself an experiment: can a structured handoff produce a
focused session? The Formtrieb-Checkbox brief was looser and the LLM still
landed cleanly — but Radix is harder because the friction is the
*point*, not a side-effect. Tight scoping prevents a "let's just port
Dialog too while we're here" drift that would dilute the findings.
