# Knightwave

A playable Babylon.js arcade runner: a sculpted porcelain chess knight, floating rainbow chessboard roads, chained L-shaped jump rotations, and an original euphoric 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without a sign-in or local setup. The workflow in `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No server, accounts, external audio downloads, or API keys are needed to play locally.

## Play

- The knight cruises and jumps automatically.
- The solid rainbow road is your destination. Hollow outlines show other lanes, and the mint L-shaped trace shows your selected route. There is no tap-count overlay.
- Tap Left/Right or A/D at any time, including during the jump. Early inputs are buffered for takeoff and give immediate visual feedback. On a phone, tap the left/right half of the play area or the visible turn buttons.
- Each tap adds a quarter-turn and chains a rotated chess knight move. Right destinations in chessboard units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate. These coordinates use the current road’s direction; the landing road turns into the final leg, and the following jump uses that new direction.
- Opposite taps undo turns. The mint ring previews the current landing. You can correct until touchdown.
- Space starts/pauses; Escape pauses/resumes; M toggles sound. A missed landing ends the run, with immediate retry.
- The opening six jumps teach one, two, then three taps in both directions. Later jumps mix these, with a gradual cruise speed increase.
- The best score is stored on this device when browser storage is available.

## Graphics and audio

The forward-facing knight is a real mesh sculpted from elliptical neck and muzzle sections, with paired ears, eyes, carved mane, turned chess pedestal, stepped collars and glowing rim. Its orientation follows the actual L-shaped motion. The camera rides behind the travel direction, eases its heading through corners, keeps the horizon level, and uses one orbit for both position and aim so turns cannot pull the knight out of the frame. Cruising speed is 34 world units per second, and rendering uses the display pixel ratio up to 2×. Jump sparkles use a dedicated star texture and particle system.

The course uses eight-unit chess squares. Landing anchors and road headings match the final knight move. Three-turn landings use short connectors to avoid crossing the departure road. The hollow landing outlines, path, actual flight and roads share the same coordinate frame. The sky artwork maps onto a world-space dome with mirrored wrapping; its features turn with the camera. The mark and favicon are hand-drawn SVG assets.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained knight movement, mirrored turns, correction equivalence, introductory progression, exact L-shaped trajectories and agreement between paths and landing coordinates, and landing-road direction matching the final leg in all four world orientations.

`node verify.mjs` runs Chrome browser playtesting (the executable path currently targets macOS): eight consecutive jumps, an overspin corrected in midair, pause/resume during a jump, mute/unmute, a deliberate miss, restart, help, and two touch-controlled phone jumps. It also checks early input acceptance, removal of the tap-count overlay, camera height, forward orientation, sparkles, exact rotated road spacing, nonintersecting road decks and high-resolution phone rendering. `node mobilecheck.mjs` checks phone screenshots, the header controls staying in the viewport, touch landing, same-event input feedback without a frame wait, pause/resume and landscape layout. These use the same input handlers as play.

`node visualcheck.mjs` plays six jumps on desktop and six using phone controls, records videos, and captures launch, middle and landing frames for single and multiple turns in both directions. Every animation frame is checked for knight clipping, a level horizon, and the landing remaining visible immediately before touchdown. Captures and a JSON report go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL` to test the public game instead of the local development server, for this script or `verify.mjs`.

Visually reviewed desktop and phone sequences throughout flight, plus the start, game-over, pause and landscape layouts. The 3D revision corrects mismatched road and knight directions, replaces the edge-on slab with a sculpted horse, removes the independent camera easing that clipped the knight during turns, maps the sky into world space, and prevents intersecting departure/landing decks. Browser tests report no page exceptions. Phone browser emulation is not a physical-device benchmark.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.

Review captures live in `docs/screenshots/`. Game implementation is in `src/main.js`; soundtrack in `src/audio.js`; movement rules in `src/rules.js`.
