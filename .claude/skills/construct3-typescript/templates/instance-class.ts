// TEMPLATE: a custom instance subclass for an object type named `Enemy`.
// Wire it up in main.ts with: runtime.objects.Enemy.setInstanceClass(EnemyInstance);
// Construct generates globalThis.InstanceType.<Name> for every object type.

import Globals from "./globals.ts";

export default class EnemyInstance extends globalThis.InstanceType.Enemy {
	// TypeScript requires class fields to be declared with their type
	// outside the constructor.
	health: number;
	speed: number;

	constructor() {
		super(); // must be first
		this.health = 5;
		this.speed = 80;
	}

	// `this.runtime` is always available (from IInstance).
	// Static factory helpers are a common pattern:
	static Create(runtime: IRuntime) {
		return runtime.objects.Enemy.createInstance("Main", 100, 100) as EnemyInstance;
	}

	Move() {
		const dt = this.runtime.dt;
		this.x += Math.cos(this.angle) * this.speed * dt;
		this.y += Math.sin(this.angle) * this.speed * dt;
	}
}
