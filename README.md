# Knightwave

A playable Babylon.js chess arcade game: a sculpted porcelain knight, rising and falling neon platforms on a finite chess grid, chained L-shaped jumps, and an original 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without sign-in or local setup. `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No accounts, external audio downloads, or API keys are needed to play locally.

## Play

- Complete six landings and return home on a bounded 9×9 board. The entire board stays visible, with hollow platform outlines, an amber landing deck and a mint jump preview.
- The knight rides forward along each raised platform at 5.2 world units per second and jumps automatically at its edge. Chevrons show its direction; a shrinking takeoff ring shows when the next jump begins.
- Tap Left/Right or A/D during a run-up or in midair. On a phone, use the left/right half of the play area or the visible turn buttons. Inputs update the route and knight pose in the same event handler.
- Each tap chains a quarter-turned chess knight move. Right destinations in grid units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate. The knight faces the final leg after landing, and the next jump uses that direction. The camera stays fixed.
- The mint L shows every leg: two squares forward, one across. The ring marks your selected landing. Opposite taps undo turns; corrections remain available until touchdown.
- Space starts/pauses; Escape pauses/resumes; M toggles sound. A miss ends the attempt; six correct landings complete the circuit. Both offer immediate retry.
- The circuit uses one, two and three chained turns in both directions. Every intermediate leg fits on the board, and raised runway decks do not intersect. The circuit and geometry live in `src/board.js`.
- The best circuit score is stored on this device under `knightwave-board-best` when browser storage is available.

## Graphics and audio

The knight is a real 3D mesh with a sculpted neck and muzzle, paired ears, eyes, carved mane and turned chess pedestal. Its facing follows the actual L-shaped motion. The camera has a fixed orthographic projection, a roughly 41° elevation and 45° azimuth. It never rotates or follows the knight. Responsive framing fits the whole board between the header and controls, leaving room to plan ahead.

Four-unit squares, landing decks, selected paths and actual flight share the same coordinate frame. Amber platforms show the next safe landing, mint identifies the platform being ridden, and purple platforms rise ahead. Permanent hollow footprints preview future decks. Platforms rise over 0.85 seconds; departed decks accelerate downward and disappear after 1.1 seconds. A subdued grid shows the finite play area without suggesting that empty squares can be landed on. Rendering uses the display pixel ratio up to 2×. Jump sparkles use a dedicated star texture and particle system. The mark and favicon are hand-drawn SVG assets.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained movement, mirrored turns, corrections, exact L trajectories, rotated landing directions, circuit closure, bounded paths, nonintersecting runways and platform rise/fall lifecycles.

`node verify.mjs` completes the six-jump circuit on desktop and touch-controlled phone viewports. It checks exact landing positions, a fixed orthographic camera, return to the starting position, victory, midair corrections, run-up and flight pause/resume, sparkles, mute, misses, restart, help, removal of the tap-count overlay and high-resolution phone rendering. It also verifies continuous travel during run-ups and unselected jumps, upcoming platforms rising and departed platforms falling, with motion frozen during pause. The Chrome executable path currently targets macOS.

`node mobilecheck.mjs` checks same-event touch feedback, header controls, landing, pause/resume and landscape layout. Phone browser emulation is not a physical-device benchmark.

`node visualcheck.mjs` plays the complete circuit on desktop and phone, records videos, and captures every jump at launch, middle and landing, plus run-up frames showing platforms rising and falling. Every animation frame checks that the whole board and knight stay visible, the camera remains unchanged and the landing stays on screen. Captures and a JSON report go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL` to check the public deployment with any browser script, and `KNIGHTWAVE_CAPTURES` to change the visual output directory.

Review captures live in `docs/screenshots/`. The game is in `src/main.js`, the board in `src/board.js`, platform animation rules in `src/platforms.js`, soundtrack in `src/audio.js` and movement rules in `src/rules.js`.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.
