[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js required](https://img.shields.io/badge/Node.js-required-green.svg)](https://nodejs.org)
[![skills.sh compatible](https://img.shields.io/badge/skills.sh-compatible-blueviolet.svg)](https://skills.sh)

# construct3-typescript

An [Agent Skill](https://agentskills.io) for **writing Construct 3 TypeScript** and
**safely editing game scenes by hand** — with a zero-dependency validator and distilled
docs drawn from 15 real projects.

Compatible with **Claude Code**, **Codex**, **Antigravity**, and
[any agent supported by skills.sh](https://skills.sh).

## Why

Construct 3 is a browser-based game editor. A project is a folder of JSON files
(`project.c3proj`, `layouts/`, `objectTypes/`, `eventSheets/`) plus TypeScript
under `scripts/`. Two things make AI assistance tricky:

1. **There's no headless runtime** — you can't "run" a `.c3proj` from a terminal
   to check your work. The editor lives in the browser.
2. **The editor normally enforces all cross-references** between those JSON files
   (instance → object type → plugin → behavior → instance variable). When you
   hand-edit outside the editor, *nothing* does — so a typo silently corrupts the
   project.

This skill closes both gaps with a validator harness and distilled documentation.

## Quick install

```bash
npx skills add tatosgames/construct-skill
```

The CLI auto-detects which coding agents you have installed. To target a specific
agent or install to multiple at once, use the `-a` flag (see below).

## Install

### Supported agents

| Agent | CLI flag | Global install path |
|-------|----------|---------------------|
| Claude Code | `claude-code` | `~/.claude/skills/construct3-typescript/` |
| Codex | `codex` | `~/.codex/skills/construct3-typescript/` |
| Antigravity | `antigravity` | `~/.antigravity/skills/construct3-typescript/` |

```bash
# One agent
npx skills add tatosgames/construct-skill -a claude-code
npx skills add tatosgames/construct-skill -a codex
npx skills add tatosgames/construct-skill -a antigravity

# All three at once
npx skills add tatosgames/construct-skill -a claude-code -a codex -a antigravity
```

To remove:

```bash
npx skills remove tatosgames/construct-skill -a claude-code
```

## What's inside

```
skills/construct3-typescript/
```

| Path | Purpose |
|------|---------|
| `SKILL.md` | Man page — injected into the agent's context at install |
| `scripts/validate.mjs` | Zero-dependency validator — run after every hand-edit |
| `references/RECIPES.md` | Step-by-step: place instances, create object types, layers, behaviors |
| `references/API-REFERENCE.md` | Distilled `IRuntime` / `IObjectType` / `IInstance` scripting API |
| `references/PATTERNS.md` | Cited snippets from 15 real projects + "which example shows what" |
| `references/examples/` | 15 real Construct 3 projects (code-only: `.ts` / `.js` / `.json`) |
| `assets/templates/` | Paste-and-edit starters: `main.ts`, `objectType.json`, instance block |

## What the validator checks

`scripts/validate.mjs` is a zero-dependency Node.js script that validates a Construct 3
project folder and exits `0` on success, `1` on errors, `2` if no `project.c3proj` is found.

| Check | What it catches |
|-------|----------------|
| JSON parsing | Malformed JSON with line:column error reporting |
| Instance types | Layout instances whose `type` doesn't resolve to a known object type |
| Unique UIDs | Duplicate `uid` values within the same layout |
| Plugin / behavior declarations | Object types using plugins/behaviors not listed in `usedAddons` |
| Instance variables | Per-instance overrides not declared on the object type |
| Script registration | Scripts listed in `project.c3proj` that don't exist on disk; `.ts` files on disk that aren't registered |

Supports `--json` for machine-readable output (useful in CI).

## Use it

After installing, ask your agent naturally — the skill is automatically in context:

```
"Write a TypeScript module that spawns enemies on a timer"
"Add a Sprite object type named Enemy with a health instance variable"
"Place three instances of the Player object at the top of Layout 1"
"Add a Tween behavior to the Player object type"
"Validate my Construct project"
```

Or run the validator directly:

```bash
# Against a bundled example (from the skill root)
node scripts/validate.mjs "references/examples/Spell Caster in code"

# Against your own project (any path)
node ~/.claude/skills/construct3-typescript/scripts/validate.mjs "path/to/your/project"
```

Example output:

```
✔  JSON: 24 files parsed OK
✔  Instance types: all resolve
✔  UIDs: all unique
✔  Plugins/behaviors: all declared
✔  Scripts: all registered and present on disk
No errors found.
```

## Development

The skill is self-contained — everything lives inside `skills/construct3-typescript/`.
`SKILL.md` is the entry point injected into the agent; the rest are companion references
loaded on demand.

**Adding a new example project**

1. Strip all binary assets, keeping only `.ts`, `.js`, `.json`, and `.c3proj` files.
2. Drop the folder into `references/examples/`.
3. Run the validator to confirm it passes: `node scripts/validate.mjs "references/examples/<YourProject>"`.
4. Add a row to the "which example demonstrates what" table in `references/PATTERNS.md`.

**Updating recipes or patterns**

Edit `references/RECIPES.md` or `references/PATTERNS.md` directly — these are plain
Markdown. Keep each recipe's last step as a validate run so agents follow the same
discipline.

**Testing the validator**

```bash
# Should exit 0
node scripts/validate.mjs "references/examples/Spell Caster in code"

# All bundled examples
for d in references/examples/*/; do
  echo "--- $d"; node scripts/validate.mjs "$d"
done
```

## Author / License

Built by **[Luca Contato](https://risingpixel.it) (Rising Pixel)** · MIT — see [`LICENSE`](LICENSE)

---

*Found a bug or want to contribute? Open an issue or PR on [GitHub](https://github.com/tatosgames/construct-skill).*
