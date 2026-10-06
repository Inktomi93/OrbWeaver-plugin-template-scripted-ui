# Orbweaver scripted UI plugin starter

This starter has authored TypeScript and checked generated JavaScript. Orbweaver can install the scripted
house-UI example directly from this repository's Git URL.

## Make your plugin

1. Select **Use this template** to make your own repository.
2. Clone your repository. Install Node 26 and pnpm 12.6.0, then run `pnpm install --frozen-lockfile`.
3. Give the scripted plugin its own ID, name, and version in `manifest.json`. Edit `src/main.ts` and `src/ui.ts`.
4. Run `pnpm build`, then commit the source, manifest, `main.js`, and `ui.js` together and push.
5. Paste the public Git repository URL into Orbweaver's Plugins screen, review its requested capabilities, then enable it.

Orbweaver reads the root `manifest.json`, `main.js`, and `ui.js` from Git. It never runs the repository's
build scripts. CI runs `pnpm check` for both examples and refuses missing, stale, or obsolete generated
JavaScript without rewriting it. The GitHub-pinned SDK and toolchain dependencies give your editor types
without an Orbweaver installation.

## Custom frame example

`examples/frame` is a separate plugin that owns pixels inside an isolated frame and loads its shipped image
through the frame-scoped `orbPluginAssetUrl` helper. The same `pnpm build` builds
it. `pnpm run pack` creates optional ZIPs for both examples in `dist/`. A Git repository has one installable
root, so to distribute the frame example directly from Git, copy its `manifest.json`, `src/`, and generated
`main.js`, and `ui/assets/` into the repository-root layout and remove the scripted root files.

See [AUTHORING.md](AUTHORING.md) for the three runtime boundaries, lifecycle, UI vocabulary, assets,
capabilities, constraints, and update rules. [SUPPORT.md](SUPPORT.md) is the checked map of hooks, host calls,
capabilities, and placement points; `pnpm check` also refuses a stale copy.

For larger working examples, browse Orbweaver's
[showcase plugins](https://github.com/Inktomi93/OrbWeaver/tree/main/packages/showcase-plugins).
