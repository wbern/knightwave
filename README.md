# Knightwave

A playable Babylon.js chess arcade game: an upright illustrated knight, an overhead 8×8 chessboard, rising and falling platforms, a rhythm-style move queue, chained L-shaped jumps, and an original 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without sign-in or local setup. `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No accounts, external audio downloads, or API keys are needed to play locally.

## Play

- Complete six landings and return home on an 8×8 board, viewed straight overhead with a–h and 1–8 coordinates. The a1 square is dark, and rank 1 is at the bottom.
- Read the move strip above the board. Each icon is one knight L: two squares along the stem, then one across the arrow. Icons are rotated and mirrored in the same directions as the board. Each group represents one jump; the active group appears under NOW and the strip slides forward after landing.
- Queue Left/Right or A/D during a run-up or in midair. On a phone, use the left/right half of the play area or turn buttons. YOUR PREMOVE shows the L moves you have selected, with immediate feedback.
- Each tap chains a quarter-turned knight move. Right destinations in grid units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate. The next jump uses the final leg's heading. The piece stays upright and the board stays still.
- The knight rides along each raised platform at 5.2 world units per second and jumps automatically at its edge. Platforms rise ahead and fall behind. Movement cues live in the icon strip; board trails, target markers, arrows and landing-preview rings have been removed.
- Opposite taps undo turns, and corrections remain available until touchdown. An unselected jump continues straight and misses its landing.
- Space starts/pauses; Escape pauses/resumes; M toggles sound. A miss ends the attempt; six correct landings complete the circuit. Both offer immediate retry.
- Every L leg fits within the board, and raised runways do not intersect. The circuit and geometry are in `src/board.js`.
- The best circuit score is stored on this device under `knightwave-board-best` when browser storage is available.

## Graphics and audio

The camera is fixed directly overhead with orthographic projection. The checkerboard uses 64 light/dark squares and standard chess coordinates. Responsive framing keeps the board, move strip and controls apart on desktop, portrait phones and landscape screens.

`public/knight-piece.svg` is an original vector chess knight adapted from the game's established mark, with a carved mane, eye, muzzle and stepped pedestal. Its texture has explicit high-resolution dimensions for WebGL upload and transparency. The artwork stays upright, grows slightly during a jump and rocks immediately on input. Jump sparkles use a dedicated star texture and particle system. The piece, mark, favicon and L glyphs are hand-drawn vector assets.

Four-unit squares, raised decks, actual flight and move icons share a coordinate frame. Platforms rise over 0.85 seconds; departed decks tilt, shrink, fade and disappear after 1.1 seconds. Their surfaces follow the board's checker pattern. Rendering uses the display pixel ratio up to 2×.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained movement, mirrored turns, corrections, exact L trajectories, rotated landing directions, circuit closure, bounded paths, nonintersecting runways, platform rise/fall lifecycles and exact agreement between each rotated/mirrored icon and its physical L legs.

`node verify.mjs` completes the six-jump circuit on desktop and touch-controlled phone viewports. It checks exact landing positions, a fixed overhead camera, an aligned 8×8 board with coordinates, the advancing move queue and premove icons, removal of board route meshes, return to the starting position, victory, midair corrections, run-up and flight pause/resume, sparkles, mute, misses, restart, help, removal of the tap-count overlay and high-resolution phone rendering. It also verifies continuous travel during run-ups and unselected jumps, upcoming platforms rising and departed platforms falling, with motion frozen during pause. The Chrome executable path currently targets macOS.

`node mobilecheck.mjs` checks same-event touch feedback, header controls, landing, pause/resume and landscape layout. Phone browser emulation is not a physical-device benchmark.

`node visualcheck.mjs` plays the complete circuit on desktop and phone, records videos, and captures every jump at launch, middle and landing, plus run-up frames showing platforms rising and falling. Every animation frame checks that the whole board and knight stay visible, the camera remains unchanged, the move strip does not overlap the board and the landing stays on screen. Captures and a JSON report go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL` to check the public deployment with any browser script, and `KNIGHTWAVE_CAPTURES` to change the visual output directory.

Review captures live in `docs/screenshots/`. The game is in `src/main.js`, the board in `src/board.js`, platform animation rules in `src/platforms.js`, move icons in `src/moves.js`, soundtrack in `src/audio.js` and movement rules in `src/rules.js`.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.
