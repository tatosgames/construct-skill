// TEMPLATE: project entry-point script.
// Register this file in project.c3proj with "script-info": { "purpose": "main" }.
// Replace `Player` / `Enemy` with your object names. Delete what you don't need.

import Globals from "./globals.ts";
import EnemyInstance from "./enemy.ts";

runOnStartup(async (runtime: IRuntime) => {
	// Runs before the runtime finishes loading — the only place you can
	// call setInstanceClass (no instances exist yet).
	runtime.objects.Enemy.setInstanceClass(EnemyInstance);

	runtime.addEventListener("beforeprojectstart",
		() => OnBeforeProjectStart(runtime));
});

function OnBeforeProjectStart(runtime: IRuntime) {
	// Runs just before the first layout starts.
	runtime.layout.addEventListener("beforelayoutstart",
		() => OnBeforeLayoutStart(runtime));

	runtime.addEventListener("tick", () => Tick(runtime));
}

function OnBeforeLayoutStart(runtime: IRuntime) {
	// Runs every time a layout starts (and on restart). Re-cache instances
	// here because restarting a layout re-creates all of them.
	Globals.playerInstance = runtime.objects.Player.getFirstInstance();
}

function Tick(runtime: IRuntime) {
	const dt = runtime.dt;
	// per-frame game logic
}
