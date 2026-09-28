"use strict";
// This file runs in a browser QuickJS worker. It draws house controls, not DOM elements.
const ui = orb.ui(1);
const examples = ["A quiet library", "A stormy harbor", "A hidden garden"];
let filter = "";
function render() {
    const visible = examples.filter((example) => example.toLowerCase().includes(filter.toLowerCase()));
    ui.render("starter-browser", {
        kind: "stack",
        gap: "field",
        children: [
            { kind: "image", bundleAsset: "ui/assets/starter-mark.png", alt: "Violet checkerboard starter mark", aspect: "square" },
            { kind: "text", value: "Filter this list without a server round trip.", voice: "gloss" },
            { kind: "textField", name: "filter", label: "Find a scene", value: filter },
            { kind: "list", items: visible.length > 0 ? visible : ["No matching scene"] },
        ],
    });
}
ui.onEvent((event) => {
    if (event.event.type === "field" && event.event.name === "filter") {
        filter = event.event.value;
        render();
    }
});
render();
