# CDF Architecture Decision Records

Each ADR captures a non-trivial format-affecting decision, why it
was made, what was rejected, and which Constitution article(s)
forced the call. ADRs are immutable once Accepted — superseding
decisions get new ADRs that reference predecessors.

For the template, status lifecycle, and supersession rules see
[`../CDF-EVOLUTION.md`](../CDF-EVOLUTION.md) §2.

## Accepted

| # | Title | Status | Date | Constitution refs |
|---|-------|--------|------|-------------------|
| [001](./001-cdf-constitution.md) | CDF Constitution | Accepted | 2026-04-26 | (establishes Constitution) |
| [002](./002-dtcg-extensions-pattern.md) | DTCG `$extensions` adoption pattern | Accepted (Defer) | 2026-04-26 | II, III |
| [003](./003-dtcg-type-requirement.md) | DTCG `$type` requirement | Accepted | 2026-04-26 | I, III |
| [004](./004-component-binding-syntax.md) | Component token-binding syntax | Accepted | 2026-04-26 | I, III |

## Constitution articles cited above

- **Article I** — Token-Driven Binding
- **Article II** — API Hard, Tokens Pragmatic
- **Article III** — LLM-First Authoring + Correctness-Without-Bureaucracy

Articles are defined in [`../CDF-EVOLUTION.md`](../CDF-EVOLUTION.md) §1.

## Numbering

ADRs are numbered sequentially with three-digit zero-padded
prefixes (`001-`, `002-`, …). Numbers are never reused; rejected
or superseded ADRs keep their slot.
