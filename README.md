# construct3-typescript — a Claude skill

A self-contained [Agent Skill](https://skills.sh) for writing **TypeScript code
for Construct 3** games and **editing scenes/layouts by hand**, with a
zero-dependency project **validator** and a library of cited patterns drawn from
15 real Construct projects.

## Install

```bash
npx skills add tatosgames/SkillConstruct
```

(The `skills` CLI auto-discovers the skill from `.claude/skills/`.)

## What's inside

```
.claude/skills/construct3-typescript/
  SKILL.md            man page — start here
  validate.mjs        the harness: validates a Construct project after hand-edits
  RECIPES.md          step-by-step scene/code edit procedures
  API-REFERENCE.md    distilled runtime scripting API
  PATTERNS.md         cookbook of cited snippets + "which example shows what"
  templates/          paste-and-edit starters (main.ts, objectType.json, …)
  reference/examples/ 15 real projects, code-only (.ts/.js/.json/.c3proj)
```

## Use it

After installing, ask Claude to "write Construct 3 TypeScript", "edit a Construct
scene", "add an object type", or "validate my Construct project". Or run the
validator directly:

```bash
node .claude/skills/construct3-typescript/validate.mjs "path/to/your/project"
```

## License

MIT (see `LICENSE`).
