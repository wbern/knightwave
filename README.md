# Knightwave

A playable Babylon.js arcade runner: a porcelain chess-knight cutout, floating rainbow chessboard roads, chained L-shaped jump rotations, and an original euphoric 160 BPM soundtrack.

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
- Each tap adds a quarter-turn and chains a rotated chess knight move. Right destinations in chessboard units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate.
- Opposite taps undo turns. The mint ring previews the current landing. You can correct until touchdown.
- Space starts/pauses; Escape pauses/resumes; M toggles sound. A missed landing ends the run, with immediate retry.
- The opening six jumps teach one, two, then three taps in both directions. Later jumps mix these, with a gradual cruise speed increase.
- The best score is stored on this device when browser storage is available.

## Graphics and audio

The forward-facing knight is a custom extruded polygon mesh with an inlaid mane, eyes, turned chess pedestal, stepped collars and glowing rim. The chase camera rides low behind it. Cruising speed is 34 world units per second, twice the original version, and rendering uses the display pixel ratio up to 2×. It is not a font glyph or emoji. The road, arches, planets and landing previews are real Babylon.js geometry. Jump sparkles use a dedicated star texture and a particle system. The whole course uses eight-unit chess squares; landing anchors equal the knight-move coordinates with no additional forward gap, and jumps trace each L-shaped leg. The mark and favicon are hand-drawn SVG assets.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained knight movement, mirrored turns, correction equivalence, introductory progression, exact L-shaped trajectories and agreement between paths and landing coordinates.

`node verify.mjs` runs Chrome browser playtesting (the executable path currently targets macOS): eight consecutive jumps, an overspin corrected in midair, pause/resume during a jump, mute/unmute, a deliberate miss, restart, help, and two touch-controlled phone jumps. It also checks early input acceptance, removal of the tap-count overlay, lower camera height, forward orientation, sparkles, exact road spacing and high-resolution phone rendering. `node mobilecheck.mjs` checks phone screenshots, the header controls staying in the viewport, touch landing, same-event input feedback without a frame wait, pause/resume and landscape layout. These use the same input handlers as play.

Visually inspected desktop start, midair and game-over views, plus 390×844 phone start, airtime and pause, and 844×390 landscape. Revised washed-out lighting, title clipping, logo glyph, crowded phone header, and phone camera framing based on screenshots. The current version also removes center guidance, lowers the camera, doubles cruising speed, adds outlined lanes and airborne sparkles, raises rendering resolution, and accepts taps immediately. Browser tests reported no page exceptions. Desktop gameplay measured approximately 60 FPS on the test machine; phone-sized emulation approximately 44–60 FPS. These measurements are not physical-phone benchmarks.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.

Review captures live in `docs/screenshots/`. Game implementation is in `src/main.js`; soundtrack in `src/audio.js`; movement rules in `src/rules.js`.
