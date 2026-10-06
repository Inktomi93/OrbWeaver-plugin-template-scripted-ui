const host = orb.host(1);
if (host.grants.includes("ui.frame")) {
  host.ui.registerFrame({
    id: "starter_frame",
    anchor: "chat-flank",
    title: "Custom frame starter",
    html: `<main><img id="starter-mark" alt="Violet checkerboard starter mark"><h1>Frame starter</h1><output id="count">0</output><button id="increment" type="button">Increment</button><script>/* @orb-frame-script */</script></main>`,
    css: `main{font:inherit;color:var(--sandbox-fg);background:var(--sandbox-bg);padding:1rem}img{width:2rem;height:2rem;image-rendering:pixelated}button{display:block;margin-top:.75rem}`,
  });
}
