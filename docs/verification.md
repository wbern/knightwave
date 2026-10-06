# Combo and independent-scroll update validation

Validated locally on 2026-10-06. The public site still runs the previous version; this update has not been published.

- `pnpm test`: 19 tests passed. Includes all eight knight moves, ordered input/draft/queue behavior, icon transforms, rounded flight and tricks, branches and captures, falling-square rejection, 120 predicted queued landings, bounded storage and level/scroll progression.
- `pnpm build`: production build passed.
- CPU integration: the actual `src/main.js` loop and DOM event handlers ran using Babylon NullEngine and Happy DOM, with audio mocked and textures disabled. All four layouts completed 24 successful landings each through level three. Tests checked native-shaped key/pointer events, single-touch rejection and double-tap dispatch, complete and incomplete drafts, captured-piece score bonuses, multi-hop committed groups, pause, retry, idle scrolling loss, fixed north-facing resets, constant mesh count (285), and bounded logical/render pools. Every simulated frame asserted camera advancement exactly equals elapsed scrolling time times the eased scroll speed, independently of the knight's displacement. Every airborne frame also checked the transformed knight mesh bounds, including trick rotations, against the projected visible arena. Upper-edge dispatch clearance now accounts for jump height and the knight silhouette. [Report](verification/combo-cpu-report.json).
- Projected mesh previews were inspected for board width, square/knight proportions, capture silhouette and side boundaries. The CPU rasterizer used actual transformed game triangles with depth buffering, approximate lighting and schematic HUD elements. These previews do not verify browser CSS, glow, shadows, native touch timing or GPU rendering.

## pnpm migration

The project pins pnpm 10.34.5, uses `pnpm-lock.yaml`, and permits the esbuild install script. The former npm lockfile was converted using pnpm with locally cached metadata derived from its existing entries and installed manifests. All 68 package versions and integrity hashes were compared and preserved, including all optional dependency edges and Linux esbuild/Rollup binaries. A frozen lockfile-only validation passed. Tests and the build passed through pnpm with the existing installed modules; a fresh dependency install and the updated GitHub workflow still need network access. CI installs pnpm before configuring the Node/pnpm cache, then runs a frozen install, tests and build.

## Remaining browser and deployment checks

The current managed sandbox prevents opening the local preview listener (`listen EPERM`) and aborts Chrome on launch. A read-only GitHub remote check also failed because `github.com` could not resolve. These environment restrictions prevent running the native browser checks or publishing this build in this session.

Once preview/browser/network access is available, run:

```sh
pnpm dev --port 5179
pnpm check:browser
```

Inspect the desktop, phone, compact and landscape captures under `/tmp/knightwave-combos`, including intro, forks, level-up and game-over. Then publish via the existing `main` GitHub Pages workflow and repeat `verify.mjs` against `KNIGHTWAVE_URL=https://pages.bernting.se/knightwave/`.

The existing images in `docs/screenshots` belong to the previous released build.
