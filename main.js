"use strict";
// Register a house-rendered surface. Its fast interactions live in ui.ts.
const host = orb.host(1);
if (host.grants.includes("ui.surface")) {
    host.ui.register({
        id: "starter-browser",
        anchor: "settings",
        title: "Scripted UI starter",
        tier: "scripted",
    });
}
