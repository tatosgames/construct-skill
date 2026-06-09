
// Import any other script files here, e.g.:
// import * as myModule from "./mymodule.js";

let keyboard: IKeyboardObjectType;
let playerInst: IWorldInstance;

const PLAYER_SPEED = 200; // pixels per second

runOnStartup(async runtime =>
{
	// Code to run on the loading screen.
	// Note layouts, objects etc. are not yet available.

	runtime.addEventListener("beforeprojectstart", () => OnBeforeProjectStart(runtime));
});

async function OnBeforeProjectStart(runtime: IRuntime)
{
	// Code to run just before 'On start of layout' on
	// the first layout. Loading has finished and initial
	// instances are created and available to use here.

	keyboard = runtime.keyboard;
	playerInst = runtime.objects.player.getFirstInstance()!;

	runtime.addEventListener("tick", () => Tick(runtime));
}

function Tick(runtime: IRuntime)
{
	const speed = PLAYER_SPEED * runtime.dt;

	if (keyboard.isKeyDown("ArrowLeft"))
		playerInst.x -= speed;
	if (keyboard.isKeyDown("ArrowRight"))
		playerInst.x += speed;
	if (keyboard.isKeyDown("ArrowUp"))
		playerInst.y -= speed;
	if (keyboard.isKeyDown("ArrowDown"))
		playerInst.y += speed;
}
