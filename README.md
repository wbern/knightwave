# Knightwave

A playable Babylon.js chess arcade game: a sculpted porcelain knight, a finite rainbow chessboard, chained L-shaped jumps, and an original 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without sign-in or local setup. `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No accounts, external audio downloads, or API keys are needed to play locally.

## Play

- Complete six landings and return home on a bounded 9×9 board. The entire board stays visible, with a faint complete route, an amber active target and mint jump preview.
- Each jump launches automatically after a 2.25-second planning beat. A shrinking ring shows the time remaining.
- Tap Left/Right or A/D while planning or in midair. On a phone, use the left/right half of the play area or the visible turn buttons. Inputs update the route and knight pose in the same event handler.
- Each tap chains a quarter-turned chess knight move. Right destinations in grid units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate. The knight faces the final leg after landing, and the next jump uses that direction. The camera stays fixed.
- The mint L shows every leg: two squares forward, one across. The ring marks your selected landing. Opposite taps undo turns; corrections remain available until touchdown.
- Space starts/pauses; Escape pauses/resumes; M toggles sound. A miss ends the attempt; six correct landings complete the circuit. Both offer immediate retry.
- The circuit uses one, two and three chained turns in both directions. Every intermediate leg fits on the board. The circuit and geometry live in `src/board.js`.
- The best circuit score is stored on this device under `knightwave-board-best` when browser storage is available.

## Graphics and audio

The knight is a real 3D mesh with a sculpted neck and muzzle, paired ears, eyes, carved mane and turned chess pedestal. Its facing follows the actual L-shaped motion. The camera has a fixed orthographic projection, a roughly 41° elevation and 45° azimuth. It never rotates or follows the knight. Responsive framing fits the whole board between the header and controls, leaving room to plan ahead.

Four-unit squares, landing markers, selected paths and actual flight share the same coordinate frame. Thin rainbow edges, glowing rails and crystals identify the finite play area. Rendering uses the display pixel ratio up to 2×. Jump sparkles use a dedicated star texture and particle system. The mark and favicon are hand-drawn SVG assets.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained movement, mirrored turns, corrections, exact L trajectories, rotated landing directions, circuit closure and every intermediate leg staying on the board.

`node verify.mjs` completes the six-jump circuit on desktop and touch-controlled phone viewports. It checks exact landing positions, a fixed orthographic camera, return to the starting position, victory, midair corrections, planning and flight pause/resume, sparkles, mute, misses, restart, help, removal of the tap-count overlay and high-resolution phone rendering. The Chrome executable path currently targets macOS.

`node mobilecheck.mjs` checks same-event touch feedback, header controls, landing, pause/resume and landscape layout. Phone browser emulation is not a physical-device benchmark.

`node visualcheck.mjs` plays the complete circuit on desktop and phone, records videos, and captures launch, middle and landing frames for single and multiple turns in both directions. Every animation frame checks that the whole board and knight stay visible, the camera remains unchanged and the landing stays on screen. Captures and a JSON report go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL` to check the public deployment with any browser script, and `KNIGHTWAVE_CAPTURES` to change the visual output directory.

Review captures live in `docs/screenshots/`. The game is in `src/main.js`, the board in `src/board.js`, soundtrack in `src/audio.js` and movement rules in `src/rules.js`.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.
