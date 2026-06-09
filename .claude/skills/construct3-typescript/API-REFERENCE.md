# Construct 3 scripting — API reference (distilled)

Distilled from the official Construct 3 manual and the bundled example projects
under `reference/examples/`. Page numbers cite the manual (not bundled — it's a
37 MB PDF) in case you have a copy: the scripting reference starts around
**p.948** (`IRuntime`), with per-plugin instance interfaces under "Plugin
interfaces." When `ts-defs/` is present (see SKILL.md), the `.d.ts` files are the
authoritative source.

## Lifecycle & entry point

`runOnStartup(async (runtime: IRuntime) => { … })` is the only place the
runtime is handed to you, and the only place `setInstanceClass` is valid (runs
before any instance exists). Event order (manual p.949):

```
runOnStartup
  → "beforeprojectstart"   (runtime event)
     → ILayout "beforelayoutstart"  (first layout)
        → 'On start of layout' (event sheet)
     → "afterprojectstart"
  → per frame: "tick"  then  "tick2"
```

Exceptions thrown in a `runOnStartup` callback are reported automatically.

## IRuntime (the `runtime` object) — key members (manual p.948–950)

| Member | What it is |
|---|---|
| `runtime.objects.<Name>` | `IObjectType` for an object. Use `runtime.objects["0Name"]` if the name isn't a valid JS identifier. |
| `runtime.dt` | Delta-time in seconds since last frame. Multiply movement by this. |
| `runtime.layout` | `ILayout` for the current layout. |
| `runtime.getLayout(nameOrIndex)` / `getAllLayouts()` | Look up layouts (name is case-insensitive). |
| `runtime.goToLayout(nameOrIndex)` | Switch layout (takes effect at end of tick). |
| `runtime.getInstanceByUid(uid)` | Get an `IInstance` by its layout uid. |
| `runtime.random()` | Random float [0,1). |
| `runtime.keyboard` / `runtime.mouse` / `runtime.touch` | Input interfaces (if the plugin is added). |
| `runtime.addEventListener(name, cb)` | Listen for `"tick"`, `"beforeprojectstart"`, `"mousedown"`, `"keydown"`, … |
| `runtime.callFunction(name, …args)` | Call a function defined in the event sheet. |
| `runtime.globalVars` | Read/write event-sheet global variables. |
| `runtime.sortZOrder(iterable, cb)` | Sort instances' Z order. |

## IObjectType `runtime.objects.<Name>` (manual p.~5366)

| Method | Notes |
|---|---|
| `getFirstInstance()` | First instance or **`null`**. Add `!` if you know it exists. |
| `getAllInstances()` / `instances()` | All instances. Both accept a generic: `instances<EnemyInstance>()`. |
| `getInstanceByUid(uid)` | Instance by uid, or null. |
| `createInstance(layerNameOrIndex, x, y, createHierarchy?, template?)` | Create a new instance on a layer. Returns the instance. |
| `setInstanceClass(Class)` | Use a custom subclass for all instances (call in `runOnStartup` only). |

## IInstance / IWorldInstance — common members

`IInstance` is the base; `IWorldInstance` adds world (on-layout) properties.
Plugin-specific derivatives add more (`ISpriteInstance`, `ITextInstance`, …).

- `this.runtime` — back-reference to `IRuntime` (always available).
- `.x`, `.y`, `.width`, `.height`, `.angle` (radians), `.angleDegrees`.
- `.isVisible`, `.opacity`, `.zElevation`, `.layer`.
- `.destroy()`, `.testOverlap(other)`, `.containsPoint(x, y)`.
- `.instVars.<name>` — typed instance variables (when declared on the type).
- `.behaviors.<Name>` — behavior interface (e.g. `.behaviors.Pathfinding`).
- Sprite: `.setAnimation(name)`, `.animationFrame`, `.setAnimationFrame()`.
- Text: `.text`.

## Families

A family is accessed exactly like an object type via `runtime.objects.<Family>`,
typed as `IFamily<ISpriteInstance>` (or the relevant base). `getAllInstances()`,
`instances()`, `createInstance()` all work on it. (Channel Striker Template.)

## Behaviors in code — `inst.behaviors.<Name>`

The `<Name>` key is the behavior's **name** as attached to the object type (the
same key the validator checks against `behaviorTypes[].name`). Common ones seen
in the examples:

- **Timer** — `inst.behaviors.Timer` (`ITimerBehaviorInstance<T>`):
  `startTimer(seconds, "tag", "once" | "regular")`,
  `addEventListener("timer", e => …)` where `e.tag` says which fired.
- **Tween** — `inst.behaviors.Tween`: `startTween(property, value, time, ease,
  { tags, startValue })` returns a tween whose `.finished` is a Promise;
  `tweensByTags("tag")` yields running tweens, each with a `.value`.
- **Car** / movement behaviors — read/write properties, e.g.
  `car.behaviors.Car.isIgnoringInput = false`.

## Plugin object interfaces (globals)

| Accessor | Interface | Plugin |
|---|---|---|
| `runtime.keyboard` | `IKeyboardObjectType` | Keyboard |
| `runtime.mouse` | `IMouseObjectType` | Mouse |
| `runtime.timelineController` | `ITimelineControllerObjectType` | Timelines — `play(name).finished`, `allTimelines()` |
| `runtime.objects.Camera3D` | `I3DCameraObjectType` | 3D Camera — `lookAtPosition(...)`; world instances have `.zElevation` |
| `runtime.objects.AdvancedRandom` | `IAdvancedRandomObjectType` | AdvancedRandom — `classic2d(x,y)` noise, permutation tables |
| `runtime.objects.DrawingCanvas` | `IDrawingCanvasInstance` | Drawing Canvas |

## Hierarchies, sprites, effects (IWorldInstance / ISpriteInstance)

- Hierarchy: `parent.addChild(child, { transformX, transformY, transformOpacity,
  destroyWithParent })`, `getChildAt(i)`, `children()` (iterator), `moveToTop()`,
  `moveToBottom()`.
- Sprite: `setAnimation(name)`, `animationName`, `setAnimationFrame()`,
  `imageWidth` / `imageHeight`, `setSize(w, h)`, named image points via
  `getImagePointX(name)` / `getImagePointY(name)`.
- Effects (shaders): `inst.effects[i].setParameter(index, value)`.

## DOM access & `importsForEvents.ts`

Scripts run in the page, so you can use Web APIs directly (`document`,
`HTMLElement`, `classList`, `style.setProperty`, `new Worker(...)`). Functions
declared in **`importsForEvents.ts`** are exposed to event sheets (so an event
can call them). Workers live under `files/` and are loaded by their **`.js`**
name with `{ type: "module" }`. (Ship Repair, Web Worker example.)

## TypeScript specifics (manual p.911–913)

- **Ambient generated types** (no import): `IRuntime`, `IInstance`,
  `IWorldInstance`, `IObjectType<T>`, `ISpriteInstance`, `ITextInstance`,
  `IKeyboardObjectType`, `InstanceType.<ObjectName>`, behavior/effect types, etc.
  Generated into `scripts/ts-defs/` by the editor — gitignored, see SKILL.md.
- **Null safety**: `getFirstInstance()` etc. can return `null`. Use the
  non-null assertion `!` only when you're certain: `…getFirstInstance()!`.
- **Subclassing returns base type**: `runtime.objects.Goblin.getFirstInstance()`
  is typed `InstanceType.Goblin`, not your `GoblinInstance`. Pass the generic to
  recover it: `getFirstInstance<GoblinInstance>()!`.
- **Custom class fields** must be declared with their type outside the
  constructor; call `super()` first. Custom props (e.g. `ammo`) are plain JS
  properties, unrelated to Construct instance variables. Prefer private `#field`
  or `_`-prefixed names to avoid clashing with future engine APIs (manual p.935).
- **Imports keep their extension**: `import X from "./x.ts"`.

## Object names must be valid JS identifiers

Construct allows object names that JS doesn't (e.g. starting with a digit). Such
names get mangled in the `InstanceType` namespace and must be accessed as
`runtime.objects["0Sprite"]`. Keep object names alphabetic-first to avoid this.
