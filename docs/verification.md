# Combo and independent-scroll update validation

Validated locally on 2026-10-06. Native browser and soundtrack results are recorded below.

- `pnpm test`: 19 tests passed. Includes all eight knight moves, ordered input/draft/queue behavior, icon transforms, rounded flight and tricks, branches and captures, falling-square rejection, 120 predicted queued landings, bounded storage and level/scroll progression.
- `pnpm build`: production build passed.
- CPU integration: the actual `src/main.js` loop and DOM event handlers ran using Babylon NullEngine and Happy DOM, with audio mocked and textures disabled. All four layouts completed 24 successful landings each through level three. Tests checked native-shaped key/pointer events, single-touch rejection and double-tap dispatch, complete and incomplete drafts, captured-piece score bonuses, multi-hop committed groups, pause, retry, idle scrolling loss, fixed north-facing resets, constant mesh count (285), and bounded logical/render pools. Every simulated frame asserted camera advancement exactly equals elapsed scrolling time times the eased scroll speed, independently of the knight's displacement. Every airborne frame also checked the transformed knight mesh bounds, including trick rotations, against the projected visible arena. Upper-edge dispatch clearance now accounts for jump height and the knight silhouette. [Report](verification/combo-cpu-report.json).
- Projected mesh previews were inspected for board width, square/knight proportions, capture silhouette and side boundaries. The CPU rasterizer used actual transformed game triangles with depth buffering, approximate lighting and schematic HUD elements. These previews do not verify browser CSS, glow, shadows, native touch timing or GPU rendering.

## pnpm migration

The project pins pnpm 10.34.5, uses `pnpm-lock.yaml`, and permits the esbuild install script. The former npm lockfile was converted using pnpm with locally cached metadata derived from its existing entries and installed manifests. All 68 package versions and integrity hashes were compared and preserved, including all optional dependency edges and Linux esbuild/Rollup binaries. A frozen lockfile-only validation passed. Tests and the build passed through pnpm with the existing installed modules; a fresh dependency install and the updated GitHub workflow still need network access. CI installs pnpm before configuring the Node/pnpm cache, then runs a frozen install, tests and build.

## Native browser and soundtrack validation

Validated on the local Mac on 2026-10-06:

- `node --test src/*.test.js`: all 19 tests passed.
- `node node_modules/vite/bin/vite.js build`: production build passed, including the four bundled M4A recordings. Vite reports its existing large-chunk warning.
- `node verify.mjs`: desktop and phone checks passed for combos, double-tap dispatch, captures, level changes, camera-independent scrolling, pause, multi-hop groups and retry. Screenshots and audits are under `/tmp/knightwave-combos`.
- Remaining native browser checks also passed for compact phone (375×667) and landscape (844×390). Screenshots and frame audits are under `/tmp/knightwave-remaining`. Desktop/phone and compact/landscape board, midair and capture-choice screenshots were inspected for framing and control placement. The obsolete menu soundtrack title was updated to *Nebula Checkmate Run*.
- `node audiocheck.mjs`: all four recordings decoded and played; checked level order, phrase continuity, final speed cap, looping configuration, pause/resume, mute and resetting to the slowest recording on retry.
- Chrome DevTools MCP 1.6.0 initialized through the same launcher used by `~/gc2`, advertised its browser tools, opened the local game and evaluated its title and `window.knightwave` availability. Project configuration is in `.codex/config.toml`. Restart the Codex client/session to expose newly configured MCP tools.

The local `pnpm` shim requires an unavailable `corepack`; `npx --yes pnpm@10.34.5` runs the pinned package manager. The release checks use a frozen pnpm install, tests and build.

## Deployment verification

The existing `main` GitHub Pages workflow publishes the game. After deployment, repeat `verify.mjs` against `KNIGHTWAVE_URL=https://pages.bernting.se/knightwave/`.

The existing images in `docs/screenshots` belong to the previous released build.
