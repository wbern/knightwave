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

- Press the screen to start, or use Space/Enter on desktop. The arcade HUD keeps SCORE and HI at the top.
- Enter three square directions for a knight jump. Up, Up, Left and Left, Up, Up reach the same square; all three orderings work. Use arrows/WASD or the four mobile direction controls.
- Each complete triple charges the orb once. Stack up to four moves: the orb gains glow, charge pips and a multiplier. Incomplete triples stay visible as direction arrows and cannot be sent.
- Space or a single tap on the orb dispatches the whole group. Multi-move groups earn a visible combo and faster jumps and landings; four moves run at about 1.7× the single-move pace.
- Inputs during flight compose future groups. Backspace or a downward board swipe clears the draft, then recalls the last unstarted group with its original three-press ordering. Executing groups stay locked. Eight groups can wait in the queue.
- Escape/pause freezes play and level celebrations. M toggles music and effects.

## Board, scoring and progression

Exactly eight files a–h form the endless strip. The board has physical side rails, subtle recessed checker squares and shallow bright raised destinations. Its maximum desktop width is 650 pixels; mobile framing uses almost the full width with a compact arcade HUD, four-direction pad and a fixed charging orb. The camera stays at a front-facing 3D angle of approximately 58 degrees.

The camera **autoscrolls during play**, independently of knight movement. After three seconds of initial grace, Easy scrolls at 3.2 world units/second. Level 1 needs 11 successful landings, then levels need 12, 13, and so on. Empty landings also count.

The final three jumps reveal a checker finish stripe, end beacons and a darkened board end. Both final choices lead forward through the goal. Crossing the finish freezes the board for a 1.7-second celebration with expanding rings, pooled confetti and a compact CLEAR display. Music fades in 180 ms, an original victory melody plays, then the next level begins with the song restarted and 1.5 seconds of grace. Queued combos carry across the finish. Game over uses the same quick recording fade with a distinct original ending melody and shows the reached level.

Difficulty increases every three levels: levels 1–3 Easy (3.2 units/second), 4–6 Intermediate (3.85), 7–9 Advanced (4.5), and 10 onward Expert (5.15). Jump pace changes with the same bands, plus the charged-combo bonus. The camera resets for the next course segment during the celebration; it never follows a jump during active play.

A thin lower seam marks the scrolling danger edge. Waiting or moving backward consumes safety; running past that edge ends the run. Committed moves to valid platforms beyond the upper visible area wait until their destination enters the view. Sideways and backward combos remain available, so a plan can make S shapes and detours while the camera continues on its own clock.

Each fork provides two legal destinations, with at least one forward option. Every third fork offers a genuine 3D capture piece on a gold-edged square alongside an empty option. A landing earns 100 points plus a capped landing streak bonus. Captures add 150 for a pawn, 300 for a bishop or 400 for a rook. Backward captures can be risky near the danger seam; the empty forward route stays available. Captured pieces disappear, with local sparkles, score feedback and sound. Fallen squares cannot count as valid landings.

Four forks are visible from the opening, with a lit path leading upward. Beginner paths use gentle forward staircases; later levels add more sideways bends, frequent zigzags and optional capture detours. Previews follow the charged branch, or the safe forward branch before input, and stop at the finish. Platforms rise in 0.35 seconds. Generation is deterministic from the chosen position, so previewing future queued moves cannot change the fork. Three recent landings and two next choices are retained; twelve reusable rendering slots also accommodate future branch previews. The ground recycles 24 rows in two-row increments to preserve checker parity. Two merged meshes draw the floor and one draws its raised rims. Rendering stays bounded through long runs.

The knight resets to face north on landing. Impulse-driven hops and flowing curved jumps preserve the original three-press order: Right, Right, Up and Up, Right, Right land together but fly different curves. Single moves take 0.58 seconds on Easy, while a four-move group takes 0.34 seconds per move. A brief crouch leads into a lower 2.4-unit hop with a heavier fall, subtle directional lean and springy landing squash; the piece stays upright. Earned combo landings trigger pooled sparkles, expanding glow rings, compact reactions and a screen-edge pulse over a continuous cosmic background. Lighting and glow remain steady. The board clears the banner and controls; glowing route dashes make the upcoming progression readable.

## Assets and music

The porcelain knight in `src/knight.js` and capture pawn, rook and bishop in `src/pieces.js` are original mesh assets with turned pedestals and recognisable silhouettes. Native SVG L glyphs encode the actual ordered directions, and a dedicated sparkle texture drives jump particles. The UI orb is a shaded SVG illustration.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The downloaded recordings are bundled in `public/audio`: Easy uses 0.50×, Intermediate 1.00×, Advanced 1.26× and Expert 1.50×. Each loops during play and restarts at the next level. Pause plays a short two-note cue with a 70 ms music fade; resume retains playback position. Retries return to Easy. Music has its own gain for end fades while the original victory and game-over melodies play through the effects bus. The game UI contains no music credits.

## Browser MCP

`.codex/config.toml` enables Chrome DevTools MCP using the same launcher as `~/gc2`. It requires `/Users/willi/gc2/assets/scripts/chrome-devtools-mcp.sh`; the launcher selects installed Chrome and starts an isolated headless browser. Run `codex mcp list` from this directory to confirm configuration, then restart the Codex client/session to load newly added MCP tools.

## Verification

`pnpm test` covers all eight moves, three-press drafts, immutable dispatched groups, partial inputs, rotated/mirrored icons, rounded flight, deterministic branch previews, capture alternatives, invalid fallen squares, bounded storage, 120 queued landings, increasing level thresholds and continuous scrolling.

`pnpm check:audio` checks all four recordings, difficulty mapping, fades, looping, pause/resume, mute and retry. `pnpm check:levels` plays 36 native-touch landings with four-move combos, checks all three finish celebrations, pause during clear, music restarts, the Intermediate boundary, game over and retry. `pnpm check:smoke` plays desktop and phone layouts; `pnpm check:mobile` checks all three phone layouts; `pnpm check:browser` checks desktop, phone, compact and landscape. The shared `playcheck.mjs` uses native keys and touches, checks single-tap dispatch, captures, level changes, every-frame camera independence, multi-hop groups, pause, scrolling loss and retry. It captures intro, board, fork, level-up and game-over screens for inspection. Override `CHROME_PATH`, `KNIGHTWAVE_URL`, `KNIGHTWAVE_JUMPS`, `KNIGHTWAVE_LAYOUTS` or `KNIGHTWAVE_CAPTURES` as needed.

Current validation status is recorded in [docs/verification.md](docs/verification.md). Existing screenshots under `docs/screenshots` predate this update unless labelled as CPU geometry previews. A CPU projection is not a substitute for checking the running browser's shaders and CSS.
