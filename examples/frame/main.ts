const host = orb.host(1);
host.ui.registerFrame({
  id: "starter-frame",
  anchor: "chat-flank",
  title: "Custom frame starter",
  html: `<main><h1>Frame starter</h1><output id="count">0</output><button id="increment" type="button">Increment</button><script>/* @orb-frame-script */</script></main>`,
  css: `main{font:inherit;color:var(--sandbox-fg);background:var(--sandbox-bg);padding:1rem}button{display:block;margin-top:.75rem}`,
});
