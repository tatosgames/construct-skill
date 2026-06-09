---
name: construct3-typescript
description: Write, create, and edit TypeScript code for Construct 3 games, and edit scenes/layouts by hand. Use when adding or editing scripts (main.ts, instance classes, modules), editing a layout/scene JSON, adding object types, wiring scripts into the runtime, or validating a Construct 3 project (.c3proj) after hand-edits. Covers the c3proj/layout/objectType/eventSheet JSON formats and the runtime scripting API conventions.
license: MIT (see LICENSE)
compatibility: Requires Node.js (for scripts/validate.mjs). Construct 3 itself is a browser-based editor; projects are opened via "Open local project folder".
metadata:
  author: Luca Contato (Rising Pixel)
  version: "1.0"
  category: game-development
  tags: construct3, typescript, gamedev, scene-editing, validator
---

# Construct 3 — TypeScript & scene authoring

Construct 3 is a **browser-based, proprietary game editor** (editor.construct.net).
There is no CLI and no headless runtime — you cannot "launch" a `.c3proj` from a
terminal. The project is a folder of JSON files (`project.c3proj`, `layouts/`,
`objectTypes/`, `eventSheets/`) plus TypeScript under `scripts/`. You author by
**editing those files directly**, then the user opens the folder in Construct
(*Open local project folder*) to run it.

Because the editor normally enforces all the cross-references between those
files and nothing does when you hand-edit, the deliverable harness here is a
**validator** that re-checks consistency after every edit.

> **This skill is self-contained.** Everything it needs lives inside the skill
> directory, so it can be packaged and dropped into any repo:
> ```
> construct3-typescript/
>   SKILL.md                       ← this file
>   scripts/validate.mjs           ← the harness
>   references/RECIPES.md          ← scene/code edit procedures
>   references/API-REFERENCE.md    ← runtime scripting API
>   references/PATTERNS.md         ← cited pattern cookbook
>   references/examples/<project>/ ← bundled real projects (code only: .ts/.js/.json/.c3proj)
>   assets/templates/              ← paste-and-edit starting points
> ```
> **All paths in this skill are relative to the skill root** (the directory
> holding this `SKILL.md`); run commands from there. The validator
> (`scripts/validate.mjs`) takes a project folder as its argument — point it at
> the user's actual project (anywhere on disk), or at one of the bundled
> examples. Project-internal paths like `layouts/Foo.json` are relative to
> whatever `project.c3proj` folder you're editing.

**Companion files** (read the one that fits the task):
- **`references/RECIPES.md`** — step-by-step procedures: place/duplicate an
  instance, create an object type, layers & Z-order, instance variables &
  behaviors. Each ends in a validate run. **Start here for "edit the scene".**
- **`references/API-REFERENCE.md`** — distilled runtime scripting API
  (`IRuntime`, `IObjectType`, `IInstance`, families, behaviors, plugin globals,
  lifecycle, TypeScript null/subclassing rules). **Start here for "write code".**
- **`references/PATTERNS.md`** — a cookbook of real, cited snippets pulled from
  the example projects (tweens, timers, families, 3D camera, hierarchy,
  procedural gen, web workers, DOM, …) plus a "which example demonstrates what"
  map. **Start here when you need an idiomatic example of a feature.**
- **`assets/templates/`** — paste-and-edit starting points: `main.ts`,
  `globals.ts`, `instance-class.ts`, `objectType.sprite.json`,
  `objectType.text.json`, `instance.sprite.json`.

## Validate (agent path — run this after every edit)

Zero-dependency Node script. Run it against the project folder you edited (the
user's project, or a bundled example). From the skill directory:

```bash
node scripts/validate.mjs "references/examples/Spell Caster in code"
```

(From elsewhere, give the full path to `validate.mjs` and to the project.)

It parses `project.c3proj` and every JSON under `layouts/`, `objectTypes/`,
`eventSheets/`, then checks:

- All JSON parses (catches trailing-comma / brace typos, with line:col).
- Every layout **instance `type`** resolves to a defined object type or family.
- **uids are unique** within each layout.
- Every object type's `plugin-id` and each attached behavior is in `usedAddons`.
- Each instance's **`instanceVariables`** keys are declared on its object type,
  and each **`behaviors`** block matches a behavior attached to the type.
- **Containers** reference known object types.
- Every script listed in `project.c3proj` exists under `scripts/` (and flags
  `.ts` files on disk that aren't registered).
- Event-sheet conditions/actions reference known objects.

Exit code `0` = no errors (warnings OK), `1` = errors. Add `--json` for
machine-readable output. Verified output on the bundled sample projects:

```
$ node scripts/validate.mjs "references/examples/Spell Caster in code"
  ·  project "Spell Caster in code" — runtime=c3, format=1, savedWith=47604
  ·  checked 9 object types, 1 layout file(s) (16 instances), 0 event sheet(s), 5 registered script(s)

✓ OK — 0 errors, 0 warning(s)
```

A bad instance type produces:

```
  ✖  layout "Layout 1" (layouts\Layout 1.json): instance uid=1 has unknown type "Wizard"
✗ FAILED — 1 error(s), 0 warning(s)
```

## Bundled reference projects (`references/examples/`)

Read these before writing code — they are the source of truth for conventions.
They are **code-only copies** (`.ts` / `.js` / `.json` / `.c3proj`; art and
audio stripped to keep the skill light), so they validate and demonstrate every
pattern but won't open as full games in Construct. Paths are under
`references/examples/`:

- **`Spell Caster in code/`** — small, complete, idiomatic. Best starting point.
  Shows modules (`globals.ts`), a custom instance class (`goblin.ts`), utility
  module (`utilities.ts`), and the `main.ts` lifecycle wiring.
- **`ancientwatcher/`** — single large `main.ts`; top-level `let` instance
  caches typed via `InstanceType.*`; lots of gameplay math.
- **`Gemstone Forger/`** — the richest API showcase: tweens, timers, hierarchy,
  image points, effects, timeline controller, heavy `instVars`.
- **`CommandAndConstruct-main/`** — large, multi-folder `scripts/` tree, the
  only one with a `scripts/tsconfig.json` and `eventSheets/`. Reference for
  structuring a big project.

`PATTERNS.md` maps every other bundled example (`importexport`,
`iteratinginstance`, `Channel Striker Template`, `Obstacle Race Example`,
`Rally Drifting Template`, `Random Cave Example`, `Ship Repair`,
`Web Worker example`) to the specific feature it demonstrates.

The official manual is **not** bundled (it's a 37 MB PDF). `API-REFERENCE.md`
distills the scripting parts you need, with manual page citations if you have a
copy (scripting reference starts ~p.948).

## Typecheck (optional — requires editor-generated types)

The validator checks JSON consistency, **not** TypeScript. To typecheck the
scripts you need `scripts/ts-defs/` and `scripts/tsconfig.json`, which the
**Construct editor generates** (they are gitignored, so repos rarely contain
them). Generate once per project: in Construct, right-click the **Scripts**
folder → **TypeScript → Set up TypeScript for external editor**. That creates
`tsconfig.json`, a `ts-defs/` folder of `.d.ts` files, and `.ts` copies of any
`.js`. It is safe to re-run. Then:

```bash
cd "<project>/scripts" && npx -p typescript@5 tsc --noEmit
```

**Without `ts-defs/`, `tsc` fails with dozens of `Cannot find name 'IRuntime'` /
`'InstanceType' only refers to a type` errors** — those are missing generated
globals, not real bugs (the bundled examples ship no `ts-defs/`). In
that state the Construct editor is the only real typechecker; offline `tsc` only
catches plain-TS logic errors. Read past every Construct-global error.

## TypeScript scripting conventions (from the reference projects)

- **Entry point** is the script with `"script-info": { "purpose": "main" }` in
  `project.c3proj` (e.g. `main.ts`). It calls `runOnStartup(async runtime => …)`.
- **Lifecycle wiring** lives in `runOnStartup` → `beforeprojectstart` →
  `beforelayoutstart`, and `runtime.addEventListener("tick", …)`. Copy the
  shape from `references/examples/Spell Caster in code/scripts/main.ts`.
- **Imports use explicit extensions**: `import Globals from "./globals.ts";`
  (Construct resolves `.ts`/`.js` itself — keep the extension).
- **Globals**: top-level `let`/`const` are module-private. Share mutable state
  via an exported object (`globals.ts` exports `default Globals = {…}`), not via
  `window`/`globalThis`.
- **Custom instance classes**: `export default class Foo extends
  globalThis.InstanceType.Foo { … }`, then in `main.ts`
  `runtime.objects.Foo.setInstanceClass(Foo)`. Declare class fields with types
  outside the constructor; call `super()` first.
- **Ambient types** (no import needed): `IRuntime`, `IWorldInstance`,
  `IObjectType<T>`, `InstanceType.<ObjectName>`, `ISpriteInstance`,
  `IKeyboardObjectType`, etc. — all generated by the editor (see Gotchas).
- **Common API**: `runtime.objects.<Name>.getFirstInstance()`,
  `.createInstance("LayerName", x, y)`, `.instances<T>()`, `runtime.dt`,
  `runtime.random()`, `runtime.layout`, instance `.x/.y/.angle/.angleDegrees`,
  `.destroy()`, `.testOverlap(other)`, `.isVisible`.
- **Scripts in event sheets**: an action with `{ "type": "script", "script":
  "…" }` runs inline JS and can read the exported `Globals` (see `reference/
  examples/CommandAndConstruct-main/eventSheets/Menus/Title screen events.json`).

## Editing scenes / layouts by hand

A layout is `layouts/<Name>.json`: `{ name, layers: [ { name, instances:
[ … ], subLayers: [ … ] } ] }`. Each instance has:

```json
{
  "type": "Goblin",            // must match an objectTypes/*.json "name"
  "properties": { … },          // plugin-specific; copy from a sibling instance
  "uid": 3,                     // unique within the layout
  "sid": 516446619561957,       // stable id; keep large & unique
  "instanceVariables": {},
  "behaviors": {},
  "world": { "x": 722, "y": 672, "width": 56, "height": 104,
             "originX": …, "originY": …, "color": [1,1,1,1], "z": 0, "angle": 0 }
}
```

For the full step-by-step (add/duplicate instance, new object type, layers &
Z-order, instance vars & behaviors) see **`references/RECIPES.md`** — each recipe ends in a
validate run. In short: clone a sibling instance block of the same `type`, give
it a fresh unique `uid` + `sid`, set `world.x/y`. Always re-run `validate.mjs`
after a hand-edit — that is how you catch a bad `type`, a duplicate `uid`, an
undeclared instance variable, or a JSON typo before handing the folder back.

## Gotchas (the non-obvious traps)

- **`ts-defs/` is gitignored and absent.** The Construct editor generates the
  ambient type definitions (`IRuntime`, `InstanceType.*`, `ISpriteInstance`, …)
  into `scripts/ts-defs/`. It is in `.gitignore` (`ts-defs`), so repos never
  contain it. Consequence: **`tsc --noEmit` will fail offline** with dozens of
  `Cannot find name 'IRuntime'` / `'InstanceType' only refers to a type`
  errors. That is expected — those errors are *missing generated globals*, not
  bugs in your code. The editor is the real typechecker. Only trust offline
  `tsc` for plain-TS logic errors, and read past every Construct-global error.
- **Round-trip: when both `.ts` and `.js` exist, Construct runs the `.js`**
  (manual p.910). Real Construct projects often ship both, and the bundled
  examples keep whatever code files they had (`.ts` and/or `.js`). So editing a
  `.ts` alone has
  **no effect at runtime** until it's recompiled to `.js` — either by the user's
  external-editor `tsc` watch, or by Construct's built-in TS support regenerating
  it. Either edit the `.ts` *and* its `.js`, or tell the user to recompile. Never
  hand-edit only the `.js` (it'll be overwritten) or only the `.ts` (it'll be
  ignored). JSON files (layouts/objectTypes/c3proj), by contrast, are read
  directly and rewritten/normalized by Construct on save.
- **`InstanceType` is both a TS built-in and a Construct namespace.** Construct's
  ambient `InstanceType.Foo` shadows the global; without `ts-defs/` present,
  `tsc` reports "only refers to a type, but is being used as a namespace."
- **`uid` vs `sid`.** `uid` is per-layout instance identity (small ints, must be
  unique within the layout). `sid` is a project-wide stable id (big number).
  When cloning an instance, change **both** to fresh unique values.
- **Object types can live in nested subfolders** in `project.c3proj`
  (`objectTypes.subfolders[…]`), but the JSON files are flat-ish on disk under
  `objectTypes/`. The validator keys object types by their `name` field, not by
  path — do the same when reasoning about references.
- **`*.uistate.json` is also gitignored** — purely editor UI state, never author it.

## Troubleshooting (errors actually hit here)

| Symptom | Cause / fix |
|---|---|
| `tsc`: `Cannot find name 'IRuntime'` / `'InstanceType' only refers to a type` | `ts-defs/` not present (gitignored). Expected offline. Open the project in Construct to regenerate, or ignore these specific errors and rely on the editor for Construct-API typechecking. |
| validator: `instance uid=N has unknown type "X"` | A layout instance's `type` doesn't match any `objectTypes/*.json` `name`. Fix the spelling or create the object type. |
| validator: `invalid JSON in layouts\… (line L column C)` | Hand-edit typo (usually a trailing comma or unbalanced brace) at that line. |
| validator: `script "x.ts" is listed in project.c3proj but no matching file` | You removed/renamed a script file but left it in `project.c3proj` `rootFileFolders.script`, or vice-versa. Keep them in sync. |
| validator: `uses plugin "X" which is not in usedAddons` | Add the plugin/behavior to `usedAddons` in `project.c3proj` (the editor does this when you add the plugin in-app). |
| validator: `sets undeclared instance variable "X"` | The instance overrides a var not declared on its object type. Add it to the object type's `instanceVariables[]` first (references/RECIPES.md §4), or remove the override. |
| validator: `behavior block "X" not attached to the object type` | The instance has a `behaviors` block whose key isn't a `behaviorTypes[].name` on its object type. Attach the behavior to the type first (references/RECIPES.md §4). |
| validator: `container references unknown object type "X"` | A `project.c3proj` container lists an object type that doesn't exist. Fix the name or remove it. |
