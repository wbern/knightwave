# Knightwave

A playable Babylon.js chess arcade game: a sculpted 3D knight, a fixed front-facing 8×8 chessboard, rising and falling platforms, an energy-orb premove composer, chained L-shaped jumps, and an original 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without sign-in or local setup. `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No accounts, external audio downloads, or API keys are needed to play locally.

## Play

- Complete six landings and return home on an 8×8 board, viewed from above and in front with a–h and 1–8 coordinates. Rank 1 is at the bottom. Bright platforms are raised; dark recessed squares are below them.
- Compose a group of L moves in the fixed UI energy orb: Left/Right or A/D on desktop, side taps or turn arrows on a phone. An opposite tap undoes a turn. Each icon means two squares along the stem, then one across the arrow.
- Press Space or swipe upward to dispatch the group for one upcoming platform. The draft clears so you can compose the next group. Tapping the orb is an alternative to the swipe.
- The borderless banner contains only your dispatched premoves. Thin vertical dividers separate platform groups; it never displays the correct answer automatically. Icons show the actual orientation of their moves. Long queues scroll horizontally on touchscreens.
- Each tap chains a quarter-turned knight move. Right destinations in grid units are `(1,2)`, `(3,1)`, `(2,-1)`, then `(0,0)`. Left mirrors the horizontal coordinate. The next group follows the previous group's final heading.
- Each platform occupies one square. The knight jumps directly from its center using the next dispatched group, with a 0.30-second settling pause between queued jumps. If no group is ready, it waits for you. Once takeoff begins, that group is locked; edits in the orb prepare future jumps. The banner underlines the executing group's flight progress and removes it at touchdown.
- Swipe down or press Backspace to clear an unsent draft, then recall the last unstarted group for correction. A group already in flight cannot be recalled. Empty sends are ignored, and a full six-platform queue cannot accept extra groups.
- Escape or the pause button pauses; M toggles sound. Space starts or retries when outside a run. A wrong dispatched move ends the attempt; six correct landings complete the circuit. Both outcomes offer immediate retry.
- Platforms rise ahead and fall behind. Board trails, route arrows and landing-preview rings are absent. Every L leg fits within the board, and single-square platforms do not overlap. The circuit is in `src/board.js`.
- The best circuit score is stored on this device under `knightwave-board-best` when storage is available.

The interaction refinement and primary research sources are recorded in [the premove orb design notes](docs/design/premove-orb.md).

## Graphics and audio

The camera is fixed above the front edge at roughly 44 degrees with orthographic projection. Files stay horizontal and ranks stay vertical on screen, so the board keeps its chess orientation while height remains visible. The checkerboard uses 64 recessed squares in two dark tones and standard chess coordinates. Eighteen shared physical rails form a raised rim around every square; raised platforms have brighter tops, side faces and rims around each single square. Responsive framing keeps the board, move strip and controls apart on desktop, portrait phones and landscape screens.

`src/knight.js` builds an original porcelain chess knight from sculpted neck and muzzle sections, paired ears, eyes, a carved mane and a turned pedestal. It follows rounded airborne bends, rocks immediately on input and briefly compresses on landing. A centered trick pivot adds a complete shuv-it, a barrel roll for longer chains, and a double spin for three or more L moves. Tricks settle before touchdown, facing the next platform; chess landing coordinates remain exact. A directional light casts soft shadows from the knight and decks onto the board; a separate shadow directly beneath the piece makes its ground position readable throughout flight. The 4.8-unit jump arc visibly lifts the whole piece, and a slim underline on the executing premove group tracks flight progress without revealing a route. Jump sparkles use a dedicated star texture and particle system. The mark, favicon and L glyphs are hand-drawn vector assets; the earlier `public/knight-piece.svg` remains as source artwork.

An illustrated energy orb stays fixed in the UI below the board, between the mobile turn controls. A shaded SVG sphere and orbit surround crisp editable L glyphs. Dispatch sends the glyphs toward the banner and briefly expands the orb, paired with a synthesized sound. Landscape places the orb in the free area beside the board. Scene glow and lighting stay constant; landing feedback uses local sparkles without a full-screen brightness flash.

Four-unit squares, shallow raised decks, flight and move icons share a coordinate frame. Platforms sit 0.925 world units above the recessed floor (about a quarter of a square's width), retaining bright checker tops, rims, short side faces and inset supports. They rise over 0.85 seconds; departed decks tilt, shrink, fade and disappear after 1.1 seconds. Rendering uses the display pixel ratio up to 2×. `src/flight.js` rounds airborne corners and samples arc length for steady travel, while the logical chess legs remain in `src/rules.js`.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks chained movement, mirrored turns, corrections, exact L trajectories, rotated landing directions, circuit closure, bounded paths, single-square platforms without overlaps, platform rise/fall lifecycles and exact agreement between each rotated/mirrored icon and its physical L legs.

`src/premoves.test.js` checks draft isolation, FIFO dispatch, group orientations, flight locking, recall, empty/full queue boundaries and swipe discrimination. `src/flight.test.js` verifies exact endpoints, mirrored rounded routes, continuous heading, steady travel speed and complete tricks that settle before touchdown.

`node verify.mjs` completes all six jumps on desktop and touch-controlled phone layouts using Space and native touch swipes. It checks exact landings, a fixed aligned camera, dark recessed materials, physical square rims, an empty answer-free banner, borderless compact styling, orb composition, group dividers, dispatch, draft clearing, locked flights, recalling future groups, safe waiting, pause, win, miss, retry, sound and help. Every landing is recorded even when input is faster than the animation. Chrome paths currently target macOS.

`node mobilecheck.mjs` checks same-event orb feedback, canceled drags, a dispatch swipe starting on a side without an extra turn, tap-button dispatch, downward recall, pause and landscape layout. Touch input is exercised through Chrome's native input dispatch; phone emulation is not a physical-device benchmark.

`node visualcheck.mjs` plays six jumps on desktop, portrait phone, compact phone and landscape layouts, records videos, and captures waiting, charged drafts, launch, flight, landing and platform transitions. Every animation frame checks board and knight visibility, fixed UI orb placement, constant scene glow, a fixed camera and separation from the premove banner. Captures and a JSON report go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL` to check a public deployment and `KNIGHTWAVE_CAPTURES` to choose a capture directory.

Review captures live in `docs/screenshots/`. The game is in `src/main.js`, the sculpted knight in `src/knight.js`, the board in `src/board.js`, the premove state and gesture rules in `src/premoves.js`, platform animation rules in `src/platforms.js`, move icons in `src/moves.js`, soundtrack in `src/audio.js` and movement rules in `src/rules.js`.

Optional WebMCP state and rotation tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.
