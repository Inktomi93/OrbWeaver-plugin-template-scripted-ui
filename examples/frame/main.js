"use strict";
const host = orb.host(1);
if (host.grants.includes("ui.frame")) {
    host.ui.registerFrame({
        id: "starter-frame",
        anchor: "chat-flank",
        title: "Custom frame starter",
        html: `<main><img id="starter-mark" alt="Violet checkerboard starter mark"><h1>Frame starter</h1><output id="count">0</output><button id="increment" type="button">Increment</button><script>"use strict";
const output = document.querySelector("#count");
const button = document.querySelector("#increment");
const mark = document.querySelector("#starter-mark");
if (mark !== null)
    mark.src = orbPluginAssetUrl("ui/assets/starter-mark.png");
let count = 0;
button?.addEventListener("click", () => {
    count += 1;
    if (output !== null)
        output.textContent = String(count);
});</script></main>`,
        css: `main{font:inherit;color:var(--sandbox-fg);background:var(--sandbox-bg);padding:1rem}img{width:2rem;height:2rem;image-rendering:pixelated}button{display:block;margin-top:.75rem}`,
    });
}
