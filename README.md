# Knightwave

A Babylon.js chess arcade game with ordered knight combos, rising single-square platforms, capture forks, independent scrolling, increasing levels and an original upbeat soundtrack.

## Play and run

The existing public version is [Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages checks and publishes `main` via `.github/workflows/pages.yml`.

```sh
pnpm install --frozen-lockfile
pnpm dev --port 5179
```

`pnpm build` produces the standalone game in `dist`.

## Controls

- Enter two perpendicular directions. The first travels two squares; the second travels one. Up then Left = two up, one left. Right then Up = two right, one up. All eight knight moves work. Arrow keys or WASD compose on desktop; four direction buttons compose on mobile.
- The UI orb shows complete L icons and a dashed first direction while a pair is incomplete. A parallel second input replaces the first direction. Up to four complete moves fit in a draft.
- Space sends a group on desktop. Double tap the orb on mobile; a single touch never sends. Mouse users can click the orb. Sent groups appear in a borderless banner, separated by thin dividers.
- Each pair executes as one jump. A group may contain several consecutive jumps. Its completed icons disappear as it executes, and its underline tracks progress through the whole group. Eight groups may be queued, and completing one frees capacity.
- During flight, inputs edit future plans. Backspace or a downward swipe on the board clears the current draft, then recalls the last unstarted group. A group already executing is locked.
- Escape/pause freezes gameplay and scrolling. M toggles sound. Space starts or retries outside a run.

## Board, scoring and progression

Exactly eight files a–h form the endless strip. The board has physical side rails, subtle recessed checker squares and shallow bright raised destinations. Its maximum desktop width is 650 pixels; portrait framing reserves side gutters and space for a compact four-direction pad and the fixed UI orb. The camera stays at a front-facing 3D angle of approximately 58 degrees.

The camera **only autoscrolls**; it never follows the knight's movement or turns. After three seconds of grace, it advances at 3.2 world units/second. Level 1 needs 11 successful landings, then levels need 12, 13, and so on. Each level increases scrolling speed by 0.65 units/second with a brief eased transition and a borderless level-up cue. These increasing milestone counts are adapted from the user's local Knight Strike implementation in `chessreel/src/components/KnightStrike/useKnightStrikeGame.ts`. Landings on empty squares also count toward levels.

A thin lower seam marks the scrolling danger edge. Waiting or moving backward consumes safety; running past that edge ends the run. Committed moves to valid platforms beyond the upper visible area wait until their destination enters the view. Sideways and backward combos remain available, so a plan can make S shapes and detours while the camera continues on its own clock.

Each fork provides two legal destinations, with at least one forward option. Every third fork offers a genuine 3D capture piece on a gold-edged square alongside an empty option. A landing earns 100 points plus a capped landing streak bonus. Captures add 150 for a pawn, 300 for a bishop or 400 for a rook. Backward captures can be risky near the danger seam; the empty forward route stays available. Captured pieces disappear, with local sparkles, score feedback and sound. Fallen squares cannot count as valid landings.

Generation is deterministic from the chosen position, so previewing future queued moves cannot change the fork. Three recent landings and two next choices are retained; ten reusable rendering slots also accommodate future branch previews. The ground recycles 24 rows in two-row increments to preserve checker parity. Two merged meshes draw the floor and one draws its raised rims. Rendering stays bounded through long runs.

The knight resets to face north on landing. Rounded airborne corners, complete spins and barrel rolls make the 3D jump readable while preserving exact chess coordinates. Lighting and glow remain steady. The board clears the banner and controls; no route lines reveal the correct move.

## Assets and music

The porcelain knight in `src/knight.js` and capture pawn, rook and bishop in `src/pieces.js` are original mesh assets with turned pedestals and recognisable silhouettes. Native SVG L glyphs encode the actual ordered directions, and a dedicated sparkle texture drives jump particles. The UI orb is a shaded SVG illustration.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The *Nebula Checkmate Run* recordings from Suno are bundled in `public/audio`. Level 1 uses 0.50×, level 2 uses 1.00×, level 3 uses 1.26×, and level 4 onward uses 1.50×. Each recording loops, and level changes retain the corresponding phrase position. Pause/resume retains playback position; retries begin with the slowest recording. Mute controls both music and the Web Audio jump, capture and level-up effects. The original music brief is in [docs/audio/music-prompt.txt](docs/audio/music-prompt.txt).

## Browser MCP

`.codex/config.toml` enables Chrome DevTools MCP using the same launcher as `~/gc2`. It requires `/Users/willi/gc2/assets/scripts/chrome-devtools-mcp.sh`; the launcher selects installed Chrome and starts an isolated headless browser. Run `codex mcp list` from this directory to confirm configuration, then restart the Codex client/session to load newly added MCP tools.

## Verification

`pnpm test` covers all eight moves, ordered drafts, immutable dispatched groups, partial inputs, rotated/mirrored icons, rounded flight, deterministic branch previews, capture alternatives, invalid fallen squares, bounded storage, 120 queued landings, increasing level thresholds and continuous scrolling.

`pnpm check:audio` checks all four recordings, phrase continuity, looping, pause/resume, mute and retry against the dev server. `pnpm check:smoke` plays desktop and phone layouts; `pnpm check:mobile` checks all three phone layouts; `pnpm check:browser` checks desktop, phone, compact and landscape. The shared `playcheck.mjs` uses native keys and touches, checks double-tap dispatch, captures, level changes, every-frame camera independence, multi-hop groups, pause, scrolling loss and retry. It captures intro, board, fork, level-up and game-over screens for inspection. Override `CHROME_PATH`, `KNIGHTWAVE_URL`, `KNIGHTWAVE_JUMPS`, `KNIGHTWAVE_LAYOUTS` or `KNIGHTWAVE_CAPTURES` as needed.

Current validation status is recorded in [docs/verification.md](docs/verification.md). Existing screenshots under `docs/screenshots` predate this update unless labelled as CPU geometry previews. A CPU projection is not a substitute for checking the running browser's shaders and CSS.
