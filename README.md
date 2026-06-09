# construct3-typescript — a Claude skill

A self-contained [Agent Skill](https://agentskills.io) that helps AI agents
**write TypeScript for [Construct 3](https://www.construct.net) games** and
**edit Construct scenes/layouts by hand** — safely and idiomatically.

## What it's for

Construct 3 is a browser-based game editor. A project is a folder of JSON files
(`project.c3proj`, `layouts/`, `objectTypes/`, `eventSheets/`) plus TypeScript
under `scripts/`. Two things make AI assistance tricky:

1. **There's no headless runtime** — you can't "run" a `.c3proj` from a terminal
   to check your work. The editor lives in the browser.
2. **The editor normally enforces all the cross-references** between those JSON
   files (instance → object type → plugin → behavior → instance variable). When
   you hand-edit the files outside the editor, *nothing* does — so a typo
   silently corrupts the project.

This skill closes both gaps:

- A **zero-dependency validator** (`scripts/validate.mjs`) re-checks a project's
  consistency after every hand-edit (instance types resolve, uids are unique,
  plugins/behaviors/instance-variables are declared, scripts exist, JSON parses).
- **Distilled docs + a pattern cookbook** drawn from 15 real Construct projects,
  so generated code follows Construct's actual TypeScript conventions
  (`runOnStartup`, `IRuntime`, instance subclassing, tweens/timers/behaviors,
  families, 3D camera, web workers, …).
- **Templates** for the common artifacts (entry script, instance class, object
  type, layout instance block).

**Use it when** you're adding/editing Construct scripts, editing a layout/scene
JSON, adding an object type, wiring scripts into the runtime, or validating a
`.c3proj` after hand-edits.

## Install

```bash
# Claude Code
npx skills add tatosgames/SkillConstruct -a claude-code

# Codex
npx skills add tatosgames/SkillConstruct -a codex

# Antigravity
npx skills add tatosgames/SkillConstruct -a antigravity

# All three at once
npx skills add tatosgames/SkillConstruct -a claude-code -a codex -a antigravity
```

## What's inside

```
skills/construct3-typescript/
  SKILL.md                     man page — start here
  scripts/validate.mjs         the harness: validates a Construct project after hand-edits
  references/RECIPES.md        step-by-step scene/code edit procedures
  references/API-REFERENCE.md  distilled runtime scripting API
  references/PATTERNS.md       cookbook of cited snippets + "which example shows what"
  references/examples/         15 real projects, code-only (.ts/.js/.json/.c3proj)
  assets/templates/            paste-and-edit starters (main.ts, objectType.json, …)
```

## Use it

After installing, ask Claude to "write Construct 3 TypeScript", "edit a Construct
scene", "add an object type", or "validate my Construct project". Or run the
validator directly:

```bash
node skills/construct3-typescript/scripts/validate.mjs "path/to/your/project"
```

## Author / License

Built by **Luca Contato (Rising Pixel)**. MIT — see [`LICENSE`](LICENSE).
