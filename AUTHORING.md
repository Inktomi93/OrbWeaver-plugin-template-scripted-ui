# Authoring Orbweaver scripted UI plugins

This repository contains two independently buildable plugins:

- The repository root is a scripted house-UI plugin. `src/main.ts` registers the surface and `src/ui.ts`
  computes its house-rendered tree in the browser guest.
- `examples/frame/` is a custom-frame plugin. Its server source registers an isolated document and its
  `src/frame.ts` supplies the document's separately checked browser script.

A Git repository has one installable root. The root scripted example is directly installable as checked in.
To distribute the frame example as the repository plugin, move its manifest, source directory, and generated
`main.js` into the root layout, copy its `ui/assets/` directory, and remove the scripted plugin's root entries.

The exact contracts come from `@orb/plugin-sdk/main`, `/ui`, and `/frame`. Each source is compiled in its own
world so DOM, server host calls, and scripted UI calls cannot leak across runtimes.

Author all three runtime worlds as TypeScript scripts without imports or exports. JSX is not an authoring
boundary: house UI uses typed object trees, while a custom frame supplies an HTML string and a separately
checked DOM script. The toolchain emits the self-contained JavaScript that Orbweaver installs.

## The shortest complete workflow

1. Change root `manifest.json` to your own ID, name, description, and version.
2. Edit `src/main.ts` and `src/ui.ts`.
3. Increase the manifest version for every distributed behavior or asset change.
4. Run `pnpm build` once. It refreshes the root plugin and the nested frame example.
5. Commit the manifest, TypeScript, and generated root `main.js`/`ui.js`; then push.
6. Paste the public repository URL into Orbweaver's Git install field, review the requested capabilities,
   and enable it.

CI runs `pnpm check` for both examples without rewriting. It fails when generated JavaScript is missing,
stale, or obsolete. `pnpm run pack` is optional and writes ignored ZIPs for manual upload or bundle URLs.

## Layout and build products

```text
manifest.json                   scripted plugin manifest
src/main.ts                     server QuickJS registration source
src/ui.ts                       browser QuickJS scripted-surface source
main.js                         generated, committed server entry
ui.js                           generated, committed browser entry
ui/assets/starter-mark.png      admitted raster used by the scripted house surface
examples/frame/manifest.json    independent frame plugin manifest
examples/frame/src/main.ts      frame registration in the server guest
examples/frame/src/frame.ts     frame document script with DOM types
examples/frame/main.js          generated, committed frame-plugin entry
examples/frame/ui/assets/       frame plugin's own admitted raster images
```

`pnpm build` runs these independent compiler worlds:

```text
src/main.ts                    @orb/plugin-sdk/main   -> main.js
src/ui.ts                      @orb/plugin-sdk/ui     -> ui.js
examples/frame/src/main.ts     @orb/plugin-sdk/main   -> examples/frame/main.js
examples/frame/src/frame.ts    @orb/plugin-sdk/frame  -> embedded in that main.js
```

The frame compiler replaces exactly one `/* @orb-frame-script */` marker inside the main source. It rejects a
missing or duplicate marker, and it never ships `frame.js` as a separate install entry.

## Manifest, identity, and updates

For the root scripted plugin:

- `id` is a lowercase slug, 2–20 characters, unique per installer. Changing it creates a separate install,
  grant set, and storage namespace.
- `version` is exactly `major.minor.patch`. Increase it whenever distributed bytes change. A greater version
  with the same `id` is an update; downgrades are refused.
- `hostVersion` is `1`; `entry` is `main.js`; `uiEntry` is `ui.js` when the root ships scripted UI.
- `capabilities` lists requested authority. Scripted UI registration requires `ui.surface`; a custom frame
  uses `ui.frame`. Declaring authority does not grant it.
- `netHosts` is required for network capabilities, contains exact hostnames, and is part of consent.
- Optional `matchAutomationEvents` includes automation-caused event facts when true.

The presence of `ui.js` and `uiEntry` must agree. If you remove `src/ui.ts`, remove `uiEntry` and the generated
`ui.js`; `pnpm build` removes obsolete output and `pnpm check` refuses it.

An update preserves plugin-private storage and previously granted capabilities that remain declared. A new
capability or network host disables the plugin until the installer reviews the wider request. Installation,
update, grant, and enable happen while the server is running; no restart or fetched-source compilation is
needed.
After pushing a greater manifest version and its generated entries to the same public Git source, use
**Check for updates** on the installed plugin and then **Update**. Keep the ID unchanged when the new commit
is meant to replace the existing install.

## Activation and consent

Top-level `main.js` executes at activation and registers resident surfaces, commands, frames, tools, events,
transforms, or macros. Disabling or updating tears those registrations down. Enabling activates the admitted
bundle again.

An ungranted host call throws, including registration. Guard each optional feature:

```ts
const host = orb.host(1);

if (host.grants.includes("ui.surface")) {
  host.ui.register({ /* ... */ });
}
```

The frame example uses the same guard for `ui.frame`. Keep features independently guarded when the installer
may grant only part of the manifest request. Catch expected failures inside handlers; three consecutive
crashed invocations auto-disable a plugin. Host calls have a five-second outer deadline and invocation CPU,
settlement, and in-flight-call bounds.

## Runtime 1: server main

`src/main.ts` runs in server-side QuickJS. Its only application door is `orb.host(1)`. It has no Node APIs,
DOM, module loader, imports, exports, `fetch`, timers, `Date`, `performance`, or `Math.random`.

Use deterministic injected seams:

- `host.clock.nowEpochMs()`
- `host.random.next()`
- `host.ids.mint()`
- `host.tokens.count(text)`
- `host.log.info`, `warn`, and `error`

The root example uses this world only to register a `tier: "scripted"` settings surface. A scripted surface
has no static `spec`; its matching browser guest must render the whole tree. Surface IDs must agree across
`main.ts` and `ui.ts`.

The main host also supports the full capability surface summarized below: chat reads and controlled writes,
lore, storage, tools, transforms, macros, events, notifications, model and image spends, search, character
and databank operations, network calls, private plugin events, and house UI.

## Runtime 2: scripted house UI

`src/ui.ts` runs in a browser QuickJS worker. It draws Orbweaver's typed house components; it does not receive
the DOM or arbitrary CSS. Its only door is `orb.ui(1)`.

Local APIs:

- `ui.render(surfaceId, tree)` publishes a complete house tree for a registered scripted surface.
- `ui.onEvent(handler)` installs one local action/field handler; a second call replaces the first.
- `ui.clock`, `ui.random`, `ui.tokens`, and `ui.log` are deterministic local seams.

The relayed `ui.host` subset is deliberately small and rechecks grants on the server:

- `chat.listMessages`, `chat.getVariables`
- `variables.get`, `set`, `delete`
- `storage.get`, `set`, `delete`, `list`

There is no UI-guest network call, tool registration, room write, DOM, timer, `Date`, or `Math.random`. Each
relay is a real round trip. Render immediately, keep handlers bounded, batch startup reads, and compute local
interactions locally. A worker that misses its deadline is terminated and its surface disappears.

The default `ui.ts` keeps a local string list and filter. It renders once at startup and rerenders after every
field event, demonstrating the intended no-network keystroke path.

## House surfaces and interaction

The exact anchor and tier matrix is in [SUPPORT.md](SUPPORT.md#surface-mounts).

Surface IDs start with a lowercase letter and contain only lowercase letters, digits, and underscores.
Keep them at most 41 characters. Use the same ID in registration and `ui.render`, such as `starter_browser`.
This applies to frame registrations too; plugin slugs and DOM element IDs follow different rules.

The house vocabulary includes:

- layout: `stack`, `row`, `section`
- display: `text`, `badge`, `meter`, `keyValue`, `list`, `image`, `markdown`, `icon`
- controls: `textField`, `numberField`, `toggle`, `select`, `tabs`, `slider`, `button`, `confirmButton`
- browse structures: `grid`, `masterDetail`, `searchBar`

The SDK supplies the legal fields, bindings, and curated icons. Specs are bounded to 32 KiB, 256 nodes, and
depth 8. Message footers are static-only, at most 8 nodes and depth 2. Host rendering supplies theme,
spacing, focus behavior, and accessibility; plugins cannot impersonate application chrome.

Static main-runtime surfaces may publish state with `host.ui.setState`; scripted surfaces instead publish the
whole tree through `ui.render`. `host.ui.toast` is transient and plugin-attributed. `host.ui.openDialog` can
open only this plugin's registered dialog after a person-initiated round trip.

### Commands and composer placements

`host.ui.registerCommand` creates a slash command, Plugins menu item, and command-palette item. It supports up
to 16 typed arguments (`string`, `number`, `enum`, `boolean`) and optional `group` metadata.

Composer targets are the closed, checked list in [SUPPORT.md](SUPPORT.md#composer-placements).

A command may use each target at most once, with a bounded label and curated icon. Orbweaver owns attribution,
overflow, keyboard behavior, and invocation. There are no arbitrary toolbar or menu injection points.

## Runtime 3: isolated custom frame

A frame is for UI that the house vocabulary cannot express: canvas work, a bespoke visualization, or other
custom pixels. `examples/frame/src/main.ts` registers it with `host.ui.registerFrame`; its `src/frame.ts`
runs inside the resulting document with DOM types.

The document has an opaque origin, a restrictive content policy, no network, no cookies or local storage, no
access to the application DOM, and no `orb` global. It receives `--sandbox-bg` and `--sandbox-fg` theme
variables plus the host font. Frame registration currently supports `settings`, `chat-flank`, and `tool-card`
anchors. HTML is limited to 64,000 characters, CSS to 16,000, and a plugin to 8 frames.

The frame SDK declares the raw `postMessage` call/result shapes for the admitted host relay. If you use it,
check `event.source === parent`, mint distinct call IDs, handle `{ ok: false, error: "refused" }`, and keep at
most four calls in flight. The included counter example deliberately needs no relay: its DOM state is local
to the frame and resets when the frame remounts.

Orbweaver injects the immutable `orbPluginAssetUrl(bundlePath)` helper before authored frame scripts run.
Pass a flat admitted path such as `ui/assets/starter-mark.png`; the active frame handle supplies owner and
plugin identity, and the route rechecks the installed path. The helper returns a routed URL suitable for an
`img` or other passive same-origin load. It does not grant arbitrary asset IDs, filesystem paths, or network
access. The included frame assigns that URL to its checkerboard image.

## Hooks available from main

### Events

`host.events.on` subscribes to the closed taxonomy. Capability: `events.subscribe`.

See [SUPPORT.md](SUPPORT.md#event-hooks) for every chat and domain event name.

Facts expose different optional fields per event and may have no chat scope. They are visibility-filtered for
the installer. There is no plugin timer or scheduler.

### Tools, transforms, and macros

- `host.tools.register` declares a model tool with JSON Schema parameters and an `unknown` handler input.
- `host.transforms.register` hooks `user_input` or `assembled_dynamic` under a 250 ms deadline.
- `host.transforms.registerDisplay` changes only the installer's rendered view, never canon.
- `host.macros.register` supplies a namespaced no-argument value macro once per turn.

### Private plugin events

`host.pubsub.emit` and `host.pubsub.on` connect plugins owned by the same installer. A subscriber has no
implicit room handle; include needed context in the payload. Capability: `plugin_events`.

## Capabilities

[SUPPORT.md](SUPPORT.md#capabilities-and-host-calls) lists every capability and the calls each runtime can make.

Room-state writes still require room-host authority. Some operations become attributed confirmation cards;
others refuse. Installer-owned library operations remain scoped to the installer. Capability declaration is
always an ask and every effect is rechecked at the host boundary.

## Assets

House UI can render installer-owned asset IDs returned by host operations such as image generation or
`net.fetchAsset`. It can also render a shipped PNG, JPEG, GIF, or WebP placed directly under `ui/assets/`.
Use `bundleAsset: "ui/assets/starter-mark.png"` on an image node, declared grid tile, or detail-stage hero.
That value is an installed-asset name resolved through this plugin's own map; it is not an arbitrary URL.
Nested asset directories and non-raster files are refused.

Frames use the same admitted files through `orbPluginAssetUrl("ui/assets/starter-mark.png")`. The helper is
available only inside a routed Orbweaver plugin frame and returns a handle-scoped URL. Remote fetch remains
unavailable inside the frame.

## Optional ZIPs and size limits

`pnpm run pack` produces:

- `dist/scripted-ui-starter.orb-plugin.zip`
- `dist/custom-frame-starter.orb-plugin.zip`

Packing compiles current TypeScript in memory and does not refresh committed root output. Run `pnpm check`
when the Git repository itself is also the distribution source. Orbweaver's install funnel remains the final
authority for manifests, admitted entries, budgets, and consent.

The manifest is limited to 64 KiB; `main.js` and `ui.js` are each limited to 1 MiB. IDs are 2–20-character
lowercase slugs, names at most 80 characters, descriptions at most 500, and authors at most 120. House specs
and frames have the tighter limits described above.

## Troubleshooting

- If `pnpm check` reports stale or missing generated output, run `pnpm build` and commit every generated
  entry with the TypeScript and manifest change. Do not hand-edit generated JavaScript.
- If the scripted surface is absent, confirm `uiEntry` names committed root `ui.js` and the registered and
  rendered surface IDs match. Also confirm the installer granted `ui.surface`.
- If a frame build fails, keep exactly one `/* @orb-frame-script */` marker in its HTML and keep DOM code in
  `src/frame.ts`. The frame has no network access or application DOM access.
- If Git installation cannot find a plugin or image, confirm the chosen example's manifest, generated entry,
  and flat `ui/assets/` files all occupy that repository's root layout. Orbweaver does not build fetched
  source or reach into `examples/frame/`.
- If an update is not offered, keep the installed ID, increase the three-part manifest version, commit all
  changed generated entries and assets, push that commit, and run **Check for updates** again.
- If the SDK rejects a host call or tree field, consult [SUPPORT.md](SUPPORT.md) and the installed type
  contract. Do not cast around the runtime boundary.

The [showcase plugins](https://github.com/Inktomi93/OrbWeaver/tree/main/packages/showcase-plugins) provide
larger examples against the same SDK and toolchain. Use [SUPPORT.md](SUPPORT.md) for the checked capability,
hook, host-call, surface, and placement registry rather than inferring support from a declaration alone.
