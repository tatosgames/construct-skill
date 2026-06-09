# Construct 3 scripting — patterns cookbook

Real, copy-able patterns extracted from the bundled example projects under
`references/examples/`. Each is cited `(Project — file)` so you can open the full
source, e.g. `references/examples/Gemstone Forger/scripts/main.ts`. Snippets are
verbatim or lightly trimmed. Pair this with `API-REFERENCE.md` (the interfaces)
and `RECIPES.md` (editing the JSON).

## Which example demonstrates what

| Want to see… | Look at |
|---|---|
| Minimal module import/export | `importexport/` (`main.ts`, `myClass.ts`) |
| Iterating all instances of a type | `iteratinginstance/` |
| Custom instance subclass | `Spell Caster in code/` (`goblin.ts`) |
| Big single-file game, instance caching | `ancientwatcher/`, `Channel Striker Template/` |
| Tweens, Timers, hierarchy, image points, effects, timelines | `Gemstone Forger/` |
| Families | `Channel Striker Template/` |
| Instance arrays + per-instance Timer | `Obstacle Race Example/` |
| 3D camera | `Rally Drifting Template/` |
| Procedural generation (AdvancedRandom), DrawingCanvas | `Random Cave Example/` |
| DOM / HTML overlay + `importsForEvents.ts` | `Ship Repair/` |
| Web Workers | `Web Worker example/` (`files/myworker.ts`) |
| Multi-folder project, event sheets + inline script | `CommandAndConstruct-main/` |

---

## Modules: import / export
```ts
// myClass.ts
export class MyClass { /* … */ }
// main.ts — keep the .ts extension in the path
import { MyClass } from "./myClass.ts";
```
(importexport — main.ts / myClass.ts)

## Iterate every instance of an object type
```ts
for (const inst of runtime.objects.Piggy.instances()) {
    inst.width *= 1.1;
    inst.height *= 1.1;
}
```
(iteratinginstance — main.ts). `getAllInstances()` returns an array you can
`.sort()` / `.filter()` / `.map()`; `instances()` is a lazy iterator.

## Cache instances on layout start (re-cache every start — restart re-creates them)
```ts
function onBeforeLayoutStart() {
    player = runtime.objects.Player.getFirstInstance()!;
    keyboard = runtime.keyboard;
}
```
(Channel Striker Template / ancientwatcher — main.ts)

## Families
```ts
let threats: IFamily<ISpriteInstance>;
threats = runtime.objects.Threats;          // a family is accessed like an object type
for (const t of threats.getAllInstances()) {
    t.destroy();
    for (const c of t.children()) c.destroy();
}
```
(Channel Striker Template — main.ts)

## Instance variables in code (`inst.instVars.<name>`)
```ts
if (c.instVars.characterID == PLAYER_ID) { /* … */ }
gem.instVars.gemX = newX;
```
(Obstacle Race Example / Gemstone Forger — main.ts). The `instVars` names are
exactly those declared on the object type — the validator enforces that.

## Behavior: Timer
```ts
const timer = runtime.objects.Timer.getFirstInstance()!.behaviors.Timer;
timer.addEventListener("timer", e => onTimer(e));   // e.tag identifies which
timer.startTimer(1.0, "readytimer", "once");        // "once" | "regular"
```
(Obstacle Race Example — main.ts). Typed form, when you need the event type:
```ts
type TimerBehaviorInstance = ITimerBehaviorInstance<InstanceType.TimerManager>;
type TimeEvent = TimerBehaviorEvent<InstanceType.TimerManager, TimerBehaviorInstance>;
```
(Gemstone Forger — main.ts)

## Behavior: Tween (returns a tween with a `.finished` promise)
```ts
gem.behaviors.Tween.startTween(
    "position", [x, y], MOVE_TIME, "in-out-sine", { tags: "move" });

const t = gem.behaviors.Tween.startTween(
    "value", 2, FLASH_TIME, "in-out-sine", { startValue: 1, tags: "flash" });
t.finished.then(() => { /* runs when the tween completes */ });

for (const t of gem.behaviors.Tween.tweensByTags("flash"))
    gem.effects[0].setParameter(2, t.value);   // drive a shader param from a tween
```
(Gemstone Forger — main.ts)

## Behavior: Car (read/write behavior properties)
```ts
car.behaviors.Car.isIgnoringInput = false;
```
(Rally Drifting Template — main.ts)

## Timeline Controller
```ts
const tc = runtime.timelineController;                 // ITimelineControllerObjectType
tc.play("Success").finished.then(() => runtime.goToLayout("Game"));
if (Array.from(tc.allTimelines()).some(t => t.isPlaying)) return;
```
(Gemstone Forger — main.ts)

## Hierarchy / children
```ts
parent.addChild(child, {
    transformX: true, transformY: true,
    transformOpacity: true, destroyWithParent: true });
const firstChild = gem.getChildAt(0) as ISpriteInstance;
gem.moveToBottom();                 // also moveToTop()
for (const c of inst.children()) c.destroy();
```
(Gemstone Forger / Channel Striker Template — main.ts)

## Sprite: animations, size, image points
```ts
gem.setAnimation("2");              // by name
const name = gem.animationName;
newGem.setSize(0.01, 0.01);
newGem.setSize(newGem.imageWidth, newGem.imageHeight);
const tx = board.getImagePointX("TL");   // named image point
const ty = board.getImagePointY("TL");
```
(Gemstone Forger — main.ts)

## 3D camera + z-elevation
```ts
let camera: I3DCameraObjectType = runtime.objects.Camera3D;
const camLookZ = car.zElevation + 5;
camera.lookAtPosition(camX, camY, camZ, camLookX, camLookY, camLookZ, 0, 0, 1);
```
(Rally Drifting Template — main.ts)

## Procedural generation with AdvancedRandom
```ts
let advRnd: IAdvancedRandomObjectType = runtime.objects.AdvancedRandom;
map[i][j] = 1 - Math.round(advRnd.classic2d(i, j));   // perlin-style noise
```
(Random Cave Example — main.ts). Also uses `InstanceType.DrawingCanvas` via
`runtime.objects.DrawingCanvas.getFirstInstance()!`.

## DOM / HTML overlay, and `importsForEvents.ts`
Functions in `importsForEvents.ts` are callable from event sheets and run in the
page context, so they can touch the DOM directly:
```ts
let menu: HTMLDivElement;
function rotateLeft() {
    angle -= step;
    menu.style.setProperty("--rot", `${angle}deg`);   // drive CSS custom property
}
function showMenu() { viewport.classList.remove("hidden"); }
```
(Ship Repair — importsForEvents.ts)

## Web Worker (offload heavy work)
```ts
// main.ts — note ".js" name and type:"module" (Construct compiles .ts → .js)
worker = new Worker("myworker.js", { type: "module" });
worker.addEventListener("message", OnMessageFromWorker);
worker.postMessage({ type: "add", firstNumber: 37, secondNumber: 5 });
```
```ts
// files/myworker.ts — the worker side
self.addEventListener("message", e => { /* switch on e.data.type */ });
self.postMessage({ type: "ready" });
```
(Web Worker example — main.ts / files/myworker.ts). The worker file lives under
`files/`, not `scripts/`.

## Keyboard / mouse input via runtime events
```ts
runtime.addEventListener("keydown", e => onKeyDown(e));   // e: KeyboardEvent
// inside: switch (e.code) { case "ArrowLeft": …; case "KeyR": … }
runtime.addEventListener("mousedown", e => OnMouseDown(e, runtime));
```
(Random Cave / Obstacle Race / Spell Caster — main.ts). `runtime.keyboard` /
`runtime.mouse` are the plugin object interfaces; raw DOM events come through
`runtime.addEventListener`.

## Global accessors quick list (seen across the examples)
| Code | Interface |
|---|---|
| `runtime.keyboard` | `IKeyboardObjectType` |
| `runtime.mouse` | `IMouseObjectType` |
| `runtime.timelineController` | `ITimelineControllerObjectType` |
| `runtime.objects.Camera3D` | `I3DCameraObjectType` |
| `runtime.objects.AdvancedRandom` | `IAdvancedRandomObjectType` |
| `inst.behaviors.Timer` | `ITimerBehaviorInstance<T>` |
| `inst.behaviors.Tween` | tween behavior interface |
