# Big-DS Port Sketch — Radix Primitives as CDF

**Status:** Pre-work sketch. No code, no specs, no profile. A directed
hypothesis-dump for the next session that starts the port.

**Purpose:** Before writing `radix.profile.yaml` and the first few
`*.spec.yaml`, identify where CDF's current shape will hit Radix's
shape. The value of the exercise (per
[`project_big_ds_profile_test.md`](../.claude/projects/…/memory/project_big_ds_profile_test.md))
is in the friction — every place CDF doesn't quite fit Radix points
either to a Radix inconsistency or to a CDF blind spot.

---

## 1. What is Radix, structurally

- **Headless.** Radix Primitives ship behavior + accessibility + keyboard
  handling. They ship **no styles**. Consumers bring their own CSS, usually
  via Tailwind, CSS Modules, or vanilla.
- **Composition-first API.** A Dialog is not one component; it's
  `Dialog.Root`, `Dialog.Trigger`, `Dialog.Portal`, `Dialog.Overlay`,
  `Dialog.Content`, `Dialog.Title`, `Dialog.Description`, `Dialog.Close`.
  Seven subcomponents for one conceptual primitive. Consumers assemble
  them manually.
- **`asChild` escape hatch.** Almost every subcomponent accepts
  `asChild`, which renders into a consumer-provided element instead of
  Radix's default. This inverts the typical rendering model —
  Radix doesn't own the DOM, the consumer does.
- **Slot-based, not prop-based.** What Formtrieb expresses as
  `properties.hierarchy.values` Radix would express by letting the
  consumer pass arbitrary children. The API surface is tiny; the
  visual contract is nonexistent.
- **Data-attributes as state.** Radix exposes state via
  `data-state="open"`, `data-disabled`, `data-orientation`. The CSS
  consumer targets these selectors. This is the Radix equivalent of
  Formtrieb's `data-semantic` / `data-device` / `data-shape` theming.

## 2. Start here: the smallest nontrivial primitive

Recommended first port: **`@radix-ui/react-separator`** (truly minimal —
one component, one orientation prop) OR **`@radix-ui/react-toggle`**
(one boolean state, pressable pattern, good SEM-013 `mirrors_state`
test). Skip Dialog/Popover until the format has passed Separator + Toggle.

## 3. Predicted friction points

### 3.1 `tokens:` is REQUIRED, Radix has none
Today `checkStructural` demands a `tokens:` block on every Component
(unless `inherits:` is used). Radix components have no visual contract,
therefore no tokens.

**Options:**
- (a) Relax the rule — make `tokens:` optional for components whose
  category declares `visual_contract: false` (or similar).
- (b) Allow an empty `tokens: {}` block and document the semantics
  ("component owns no paint").
- (c) Introduce a headless Profile flag — `profile.conventions.headless:
  true` skips the requirement globally.

**Recommendation:** (a). Category-level opt-out keeps validation strict
for visual components in the same DS.

### 3.2 Composition > Configuration
Formtrieb's Checkbox has one spec covering the whole control. Radix's
Dialog has seven subcomponents, and every consumer *assembles their
own dialog* from those seven. A single `Dialog` spec in CDF doesn't
capture that.

**Probable shape:**
- One spec per Radix subcomponent (`DialogRoot.spec.yaml`,
  `DialogTrigger.spec.yaml`, …).
- A new top-level block — `composed_by:` or a category like `Compound`
  — documenting the intended assembly without enforcing it.
- Slots carry almost everything (`children: any`) because Radix
  doesn't constrain what consumers pass.

This will stress the `slots:` section and the `component-ref-exists`
consistency check.

### 3.3 States as `data-attributes`, not axes
Radix publishes state through DOM data-attributes. In CDF terms:
the Component has runtime states, those states are DOM-observable.
CDF-PROFILE §10.6 `promoted:` handles this concept — **"boundary-
observable"** is exactly it. Radix is a DS where **every** state is
promoted.

**Expected outcome:** `radix.profile.yaml` sets
`interaction_patterns.*.boundary_observable: true` as the default.
This may reveal whether CDF's promoted-state model is complete enough.

### 3.4 `asChild` — the polymorphic render escape
This is the one that may not fit at all. `asChild` means: "render
my behavior into whatever element you pass me." It's a runtime
polymorphism over anatomy. CDF says `anatomy.container.element: button`
— Radix says `anatomy.container.element: ${whatever-the-user-passes}`.

**Possible interpretations:**
- (a) Treat `asChild` as a property: `as_child: { type: boolean,
  default: false }`. Anatomy declares the *default* element;
  the spec notes that the element is consumer-overridable.
- (b) New anatomy field: `element_polymorphic: true`.
- (c) Model it as a slot with `accepts: "element"`.

**Recommendation:** (a). Boolean property with a doc string is the
least invasive. It will fail the Tier-4 cross-layer check that wants
`accessibility.element` to match `anatomy.container.element` —
that's OK; it's a real semantic ambiguity in Radix's model.

### 3.5 No theming modifiers
Formtrieb has `data-semantic`, `data-device`, `data-shape` — three theme
axes. Radix has nothing at all. CSS styling is the consumer's
problem.

**Expected outcome:** `theming.modifiers: {}`, empty. The required
`set_mapping` also empty. Both are already allowed as empty objects —
no format change needed.

## 4. Friction points that are probably OK

- **Accessibility.** Radix is aggressive about a11y; CDF already
  captures `keyboard:`, `aria:`, `element:`. Good fit.
- **Events.** Radix has `onOpenChange`, `onValueChange` — standard
  event shapes. Fine.
- **Animation state.** Radix exposes `data-state="open"|"closed"`
  with CSS animation hooks. This maps naturally to `states:` +
  `behavior.transition:`.

## 5. What success looks like

The port is a success when:

1. A headless `radix.profile.yaml` validates.
2. `Separator.spec.yaml` + `Toggle.spec.yaml` + `Dialog.Root.spec.yaml`
   all validate.
3. `cdf-core` has gained **at most one** new optional field and **at
   most one** category-level configuration toggle.
4. A brief "CDF vs. Radix" findings doc enumerates what we had to
   change in CDF and what we'd push back on in Radix (e.g., "Dialog's
   Portal doesn't document which container it attaches to by default
   — ambiguity the format surfaces").

If the Radix port needs more than a handful of format changes,
that's a signal the format isn't ready for a Big-DS pass — stop
and iterate on CDF, don't bend it mid-port.

## 6. Things this sketch does NOT commit to

- A date. The port happens whenever CDF is stable enough (probably
  after draft.6 or a v1.0.0 freeze).
- A specific Radix version to track.
- Whether Material 3 or Fluent follows. One Big-DS at a time.
- Whether the sketch should become a plan doc or stay a sketch. It
  stays a sketch until the format change needs (§3.1, §3.4) have a
  decision.
