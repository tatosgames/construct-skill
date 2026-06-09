// TEMPLATE: shared mutable state.
// Top-level module variables are private, and module *exports* are read-only,
// so share writable globals via an exported object's properties.
// Any script can `import Globals from "./globals.ts"` and read/write these.

const Globals = {
	score: 0,

	// For optional instance references, use the <Type> cast so the property
	// isn't permanently inferred as `null`.
	playerInstance: <InstanceType.Player | null> null,
};

export default Globals;
