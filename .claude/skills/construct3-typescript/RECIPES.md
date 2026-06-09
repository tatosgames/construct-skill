# Construct 3 — task recipes

Step-by-step procedures for the common hand-edit operations. **Every recipe ends
with a validate run** — that is the safety net for hand-editing JSON. Paths are
relative to the project folder (the one containing `project.c3proj`).

```bash
# from the skill directory; <project folder> is the user's project or a bundled example
node validate.mjs "<project folder>"
```

Templates referenced below live in `templates/` (relative to this skill
directory); bundled example projects live in `reference/examples/`.

---

## 1. Place or duplicate an instance in a scene

A layout is `layouts/<Name>.json` → `layers[].instances[]`.

1. Open the target layout JSON and find the layer you want (by `layers[].name`).
2. **Duplicate**: copy an existing instance block of the **same `type`** from
   that layer (it already has the right `properties` keys for its plugin).
   **New instance of a fresh type**: start from `templates/instance.sprite.json`
   (delete the `__comment` line) and set `type` to the object type's name.
3. Give the new block:
   - a **`uid` unique within this layout** (scan the file; pick an unused int),
   - a **fresh large `sid`** (any unused ~15-digit number),
   - `world.x` / `world.y` (and `width`/`height` if needed).
4. Leave `instanceVariables: {}` / `behaviors: {}` unless overriding (recipe 4).
5. Validate. Expect no `unknown type` / `duplicate uid` errors.

> Coordinates: `world.x/y` are layout pixels, origin top-left. `originX/originY`
> are 0–1 fractions of the image (where the hot-spot sits). `angle` is radians.

---

## 2. Create a new object type

1. Pick the plugin. Copy a template:
   - Sprite (has graphics/animations) → `templates/objectType.sprite.json`
   - Text → `templates/objectType.text.json`
   - Otherwise copy an existing `objectTypes/*.json` that uses the same plugin.
2. Save it as `objectTypes/<Name>.json`. Set `name`, a fresh `sid`, and unique
   `sid`s on animations/frames/variables.
3. **Register it in `project.c3proj`** — add `"<Name>"` to `objectTypes.items`
   (or into the right `subfolders[].items`).
4. **Ensure the plugin is in `usedAddons`** in `project.c3proj`. If it's the
   project's first use of that plugin, add an entry:
   `{ "type": "plugin", "id": "Sprite", "name": "Sprite", "author": "Scirra", "bundled": false }`.
5. Validate. The validator will flag a missing plugin (`uses plugin "X" which is
   not in usedAddons`) or a name typo.

> Sprites need image files under `images/` referenced by `imageSpriteId`. Adding
> real artwork is an editor task — the JSON alone gives a placeholder frame; open
> in Construct to import/assign the image.

---

## 3. Layers & Z-order

Layers are `layouts/<Name>.json` → `layers[]` (top of the array … but **draw
order is bottom-of-array = back, top-of-array = front**; confirm against a
sibling layout). Each layer: `{ name, instances: [], subLayers: [] }`.

- **Add a layer**: insert a new `{ "name": "UI", "instances": [], "subLayers": [] }`
  object into `layers[]` at the desired position. Copy the other fields
  (`overriden`, opacity, etc.) from an existing layer so the shape matches.
- **Move an instance between layers**: cut its block from one layer's
  `instances[]` and paste into another's. Its `uid` stays the same.
- **Z within a layer**: instances draw in array order; reorder the blocks, or set
  `world.z`. In code, `runtime.sortZOrder(...)` or `inst.moveToTop()` etc.
- Validate after (catches a broken brace from the move, and uid collisions).

---

## 4. Instance variables & behaviors

**Declare on the object type first, then override per-instance.**

Instance variable:
1. In `objectTypes/<Name>.json`, add to `instanceVariables[]`:
   `{ "name": "health", "type": "number", "initialValue": 5, "desc": "", "show": true, "sid": <fresh> }`
   (`type` ∈ `number` | `string` | `boolean`).
2. (Optional) Override on a specific instance: in the layout, set
   `"instanceVariables": { "health": 3 }` on that instance block.
3. In TypeScript, read/write via `inst.instVars.health`.

Behavior:
1. Confirm the behavior is in `usedAddons` (type `behavior`); add it if not.
2. In `objectTypes/<Name>.json`, add to `behaviorTypes[]`:
   `{ "behaviorId": "Pathfinding", "name": "Pathfinding", "sid": <fresh> }`.
   The **`name`** is the key you'll use on instances and in code.
3. (Optional) Per-instance properties: on the instance block set
   `"behaviors": { "Pathfinding": { "properties": { … } } }` (copy property keys
   from a sibling instance that already has it).
4. In TypeScript, access via `inst.behaviors.Pathfinding`.
5. Validate. The validator errors on `undeclared instance variable "X"` and on a
   `behavior block "X" not attached to the object type` — i.e. it enforces that
   step 1/2 was done before step 2/3.

---

## After any recipe

If you edited `.ts` scripts and the project also has `.js` files, remember
Construct runs the **`.js`** (see SKILL.md "round-trip" gotcha) — the user must
recompile or let Construct's TS support regenerate them. The validator does not
compile TypeScript; for that, see the optional `tsc` step in SKILL.md.
