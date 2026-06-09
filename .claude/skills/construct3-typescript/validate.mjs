#!/usr/bin/env node
// Construct 3 project validator.
//
// Cross-checks a Construct 3 project folder (one that contains a
// `project.c3proj`) so that hand-edits to scene/layout JSON, object-type
// JSON, the c3proj manifest, or the scripts list stay internally
// consistent. Construct's own editor enforces these invariants; when you
// edit the files by hand (the whole point of the construct3-typescript
// skill) nothing does, so run this afterwards.
//
// Usage:
//   node validate.mjs <projectDir>          # default project dir = cwd
//   node validate.mjs <projectDir> --json   # machine-readable output
//
// Exit code 0 = no errors (warnings allowed), 1 = at least one error,
// 2 = could not even load the project (e.g. no project.c3proj).
//
// Zero dependencies. Node >= 18.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, basename, relative, sep } from "node:path";

const args = process.argv.slice(2);
const jsonMode = args.includes("--json");
const projectDir = args.find(a => !a.startsWith("--")) ?? process.cwd();

const errors = [];
const warnings = [];
const info = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const note = (m) => info.push(m);

function readJson(file) {
	const text = readFileSync(file, "utf8");
	try {
		return JSON.parse(text);
	} catch (e) {
		// Surface line/col so a hand-edit typo is easy to find.
		throw new Error(`invalid JSON in ${relative(projectDir, file)}: ${e.message}`);
	}
}

// Recursively collect every *.json file under a sub-directory of the project.
function jsonFilesUnder(dir) {
	const out = [];
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...jsonFilesUnder(p));
		else if (entry.name.toLowerCase().endsWith(".json")) out.push(p);
	}
	return out;
}

// Recursively collect every script/file leaf name on disk under a dir.
function filesUnder(dir, exts) {
	const out = [];
	if (!existsSync(dir)) return out;
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (entry.isDirectory()) out.push(...filesUnder(p, exts));
		else if (!exts || exts.some(e => entry.name.toLowerCase().endsWith(e))) out.push(p);
	}
	return out;
}

// Walk a Construct folder tree node ({items, subfolders}) yielding all items.
function* walkFolderTree(node) {
	if (!node) return;
	for (const it of node.items ?? []) yield it;
	for (const sf of node.subfolders ?? []) yield* walkFolderTree(sf);
}

function main() {
	const c3projPath = join(projectDir, "project.c3proj");
	if (!existsSync(c3projPath)) {
		err(`no project.c3proj found in ${projectDir} (is this a Construct 3 project folder?)`);
		return;
	}

	let proj;
	try {
		proj = readJson(c3projPath);
	} catch (e) {
		err(e.message);
		return;
	}

	note(`project "${proj.name}" — runtime=${proj.runtime}, format=${proj.projectFormatVersion}, savedWith=${proj.savedWithRelease}`);

	// ---- usedAddons: the set of plugin and behavior ids available ----
	const pluginIds = new Set();
	const behaviorIds = new Set();
	for (const a of proj.usedAddons ?? []) {
		if (a.type === "plugin") pluginIds.add(a.id);
		else if (a.type === "behavior") behaviorIds.add(a.id);
	}
	// Construct's built-in System object is always available, no addon entry.
	pluginIds.add("System");

	// ---- object types: read every objectTypes/**/*.json, key by `name` ----
	// For each, remember the declared instance-variable names and the
	// behavior *names* (the key used in a layout instance's `behaviors`).
	const objectTypeNames = new Set();
	const objectTypes = new Map(); // name -> { ivNames:Set, behaviorNames:Set }
	const objectTypeFiles = jsonFilesUnder(join(projectDir, "objectTypes"));
	for (const f of objectTypeFiles) {
		let ot;
		try { ot = readJson(f); } catch (e) { err(e.message); continue; }
		if (!ot.name) { warn(`object type ${relative(projectDir, f)} has no "name"`); continue; }
		objectTypeNames.add(ot.name);

		const ivNames = new Set((ot.instanceVariables ?? []).map(v => v.name));
		const behaviorNames = new Set();
		// plugin-id must be a used addon (or System).
		if (ot["plugin-id"] && !pluginIds.has(ot["plugin-id"])) {
			err(`object type "${ot.name}" uses plugin "${ot["plugin-id"]}" which is not in usedAddons`);
		}
		// each attached behavior must be a used addon.
		for (const bt of ot.behaviorTypes ?? []) {
			const id = bt.behaviorId ?? bt.id;
			if (id && !behaviorIds.has(id)) {
				err(`object type "${ot.name}" uses behavior "${id}" which is not in usedAddons`);
			}
			if (bt.name) behaviorNames.add(bt.name);
		}
		objectTypes.set(ot.name, { ivNames, behaviorNames });
	}

	// ---- family names (instances can reference a family instead of a type) ----
	const familyNames = new Set();
	for (const it of walkFolderTree(proj.families)) {
		if (typeof it === "string") familyNames.add(it);
		else if (it && it.name) familyNames.add(it.name);
	}

	const knownInstanceTypes = new Set([...objectTypeNames, ...familyNames]);

	// Built-in pseudo-objects that never appear in objectTypes/: the System
	// object and the project's Functions object (named by proj.functionsName).
	const builtinClasses = new Set(["System", proj.functionsName].filter(Boolean));

	// ---- layouts: every instance.type must resolve; uids unique per layout ----
	const layoutFiles = jsonFilesUnder(join(projectDir, "layouts"));
	let totalInstances = 0;
	for (const f of layoutFiles) {
		let layout;
		try { layout = readJson(f); } catch (e) { err(e.message); continue; }
		if (!layout.layers) continue; // e.g. ObjectBank.json is not a layout
		const rel = relative(projectDir, f);
		const seenUids = new Map();

		const visitLayer = (layer) => {
			for (const inst of layer.instances ?? []) {
				totalInstances++;
				if (!knownInstanceTypes.has(inst.type)) {
					err(`layout "${layout.name}" (${rel}): instance uid=${inst.uid} has unknown type "${inst.type}"`);
				}
				if (inst.uid !== undefined) {
					if (seenUids.has(inst.uid)) {
						err(`layout "${layout.name}" (${rel}): duplicate uid ${inst.uid} (types "${seenUids.get(inst.uid)}" and "${inst.type}")`);
					} else {
						seenUids.set(inst.uid, inst.type);
					}
				}
				// Stricter checks only apply to plain object types (not
				// families, whose members' vars/behaviors we don't resolve).
				const ot = objectTypes.get(inst.type);
				if (ot) {
					// Every instance-variable override must be declared on the type.
					for (const k of Object.keys(inst.instanceVariables ?? {})) {
						if (!ot.ivNames.has(k)) {
							err(`layout "${layout.name}" (${rel}): instance uid=${inst.uid} (${inst.type}) sets undeclared instance variable "${k}"`);
						}
					}
					// Every behavior block must correspond to a behavior on the type.
					for (const k of Object.keys(inst.behaviors ?? {})) {
						if (!ot.behaviorNames.has(k)) {
							err(`layout "${layout.name}" (${rel}): instance uid=${inst.uid} (${inst.type}) has behavior block "${k}" not attached to the object type`);
						}
					}
				}
			}
			for (const sub of layer.subLayers ?? []) visitLayer(sub);
		};
		for (const layer of layout.layers) visitLayer(layer);
	}

	// ---- event sheets: script-referenced objectClasses must resolve ----
	const eventSheetFiles = jsonFilesUnder(join(projectDir, "eventSheets"));
	for (const f of eventSheetFiles) {
		let es;
		try { es = readJson(f); } catch (e) { err(e.message); continue; }
		const rel = relative(projectDir, f);
		const visit = (ev) => {
			if (!ev || typeof ev !== "object") return;
			for (const c of ev.conditions ?? []) {
				if (c.objectClass && !builtinClasses.has(c.objectClass) &&
					!knownInstanceTypes.has(c.objectClass)) {
					warn(`event sheet "${es.name}" (${rel}): condition references unknown object "${c.objectClass}"`);
				}
			}
			for (const a of ev.actions ?? []) {
				if (a.objectClass && !builtinClasses.has(a.objectClass) &&
					!knownInstanceTypes.has(a.objectClass)) {
					warn(`event sheet "${es.name}" (${rel}): action references unknown object "${a.objectClass}"`);
				}
			}
			for (const child of ev.children ?? []) visit(child);
		};
		for (const ev of es.events ?? []) visit(ev);
	}

	// ---- containers: every member must be a known object type ----
	// Construct stores containers as an array; each container is either an
	// array of object-type names, or an object with a `name`/`items` field.
	for (const container of proj.containers ?? []) {
		const members = Array.isArray(container)
			? container
			: (container.items ?? container.members ?? []);
		for (const m of members) {
			const name = typeof m === "string" ? m : (m && m.name);
			if (name && !objectTypeNames.has(name)) {
				err(`container references unknown object type "${name}"`);
			}
		}
	}

	// ---- scripts: every script listed in c3proj must exist on disk ----
	const scriptNamesInProj = [...walkFolderTree(proj.rootFileFolders?.script)]
		.map(it => (typeof it === "string" ? it : it.name))
		.filter(Boolean);
	const scriptFilesOnDisk = filesUnder(join(projectDir, "scripts"));
	const diskBasenames = new Set(scriptFilesOnDisk.map(p => basename(p)));
	for (const name of scriptNamesInProj) {
		if (!diskBasenames.has(basename(name))) {
			err(`script "${name}" is listed in project.c3proj but no matching file exists under scripts/`);
		}
	}
	// Reverse: .ts files on disk not registered in the project are dead weight.
	const registered = new Set(scriptNamesInProj.map(n => basename(n)));
	for (const p of scriptFilesOnDisk) {
		const b = basename(p);
		if (b.endsWith(".ts") && !registered.has(b)) {
			// the matching .js may be registered instead (Construct compiles .ts -> .js)
			const js = b.replace(/\.ts$/, ".js");
			if (!registered.has(js)) {
				note(`script ${relative(projectDir, p)} exists on disk but is not registered in project.c3proj`);
			}
		}
	}

	note(`checked ${objectTypeNames.size} object types, ${layoutFiles.length} layout file(s) (${totalInstances} instances), ${eventSheetFiles.length} event sheet(s), ${scriptNamesInProj.length} registered script(s)`);
}

try {
	main();
} catch (e) {
	err(`unexpected: ${e.stack || e.message}`);
}

if (jsonMode) {
	console.log(JSON.stringify({ ok: errors.length === 0, errors, warnings, info }, null, 2));
} else {
	for (const m of info) console.log(`  ·  ${m}`);
	for (const m of warnings) console.log(`  ⚠  ${m}`);
	for (const m of errors) console.log(`  ✖  ${m}`);
	console.log("");
	if (errors.length === 0) {
		console.log(`✓ OK — 0 errors, ${warnings.length} warning(s)`);
	} else {
		console.log(`✗ FAILED — ${errors.length} error(s), ${warnings.length} warning(s)`);
	}
}

process.exit(errors.length === 0 ? 0 : (info.length === 0 && errors.some(e => e.includes("no project.c3proj")) ? 2 : 1));
