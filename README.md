# Knightwave

A playable Babylon.js chess arcade game: a sculpted 3D knight, an endless scrolling chess grid, rising and falling platforms, an energy-orb premove composer, north-facing L jumps, and an original 160 BPM soundtrack.

## Open in your browser

[Play Knightwave](https://pages.bernting.se/knightwave/). GitHub Pages hosts the game publicly, without sign-in or local setup. `.github/workflows/pages.yml` checks movement rules, builds the game, and publishes changes pushed to `main`.

## Run

```sh
npm install
npm run dev -- --port 5179
```

Open the printed local URL. `npm run build` produces the standalone browser game in `dist`. No accounts, external audio downloads, or API keys are needed to play locally.

## Play

- Keep landing on an endless grid viewed from above and in front. Files a–h stay horizontal, and ranks continue increasing upward. Bright platforms are raised; dark recessed squares are below them.
- Compose a group of L moves in the fixed UI energy orb: Left/Right or A/D on desktop, side taps or turn arrows on a phone. An opposite tap undoes a turn. Each icon means two squares along the stem, then one across the arrow.
- Press Space or swipe upward to dispatch the group for one upcoming platform. The draft clears so you can compose the next group. Tapping the orb is an alternative to the swipe.
- The borderless banner contains only your dispatched premoves. Thin vertical dividers separate platform groups; it never displays the correct answer automatically. Icons show the actual orientation of their moves. Long queues scroll horizontally on touchscreens.
- Every L begins facing up: two ranks forward and one file left or right. A group of N right moves lands N files right and 2N ranks forward; left mirrors the lateral distance. Every group and every icon uses the same north-facing reference. Drafts contain up to four L moves.
- Each platform occupies one square. The knight jumps directly from its center using the next dispatched group, with a 0.30-second settling pause between queued jumps. If no group is ready, it waits for you. Once takeoff begins, that group is locked; edits in the orb prepare future jumps. The banner underlines the executing group's flight progress and removes it at touchdown.
- Swipe down or press Backspace to clear an unsent draft, then recall the last unstarted group for correction. A group already in flight cannot be recalled. Empty sends are ignored, and a full eight-group queue cannot accept extra groups.
- Escape or the pause button pauses; M toggles sound. Space starts or retries when outside a run. A wrong dispatched move ends the attempt and offers immediate retry. Correct landings keep generating the next platforms, without a finish line.
- Platforms rise ahead and fall behind. Board trails, route arrows and landing-preview rings are absent. Successive platforms lie farther up the grid and occupy distinct squares. `src/board.js` generates the course deterministically, keeps targets within the central files for readable framing, and retains at most 11 nearby stops. The ground continues beyond those files.
- The best run score is stored on this device under `knightwave-board-best` when storage is available.

The interaction refinement and primary research sources are recorded in [the premove orb design notes](docs/design/premove-orb.md).

## Graphics and audio

The orthographic camera retains a roughly 44-degree front view and translates forward smoothly with the knight. It never rotates. A soft fade keeps the scrolling ground clear of the banner and controls. Twelve columns and 24 rows are recycled two rows at a time to preserve checker parity. Two merged meshes draw the dark checker squares, and one merged mesh draws all their physical rims. The ground has no enclosing finite frame. Five reusable single-square platforms cover the occupied square, approaching landings and departed squares. Ranks scroll while the familiar a–h file labels stay in place. Responsive framing keeps the knight and landing square visible on desktop, portrait phones and landscape screens.

`src/knight.js` builds an original porcelain chess knight from sculpted neck and muzzle sections, paired ears, eyes, a carved mane and a turned pedestal. It follows rounded airborne bends, rocks immediately on input and briefly compresses on landing. A centered trick pivot adds a complete shuv-it, a barrel roll for longer chains, and a double spin for three or more L moves. Tricks settle before touchdown, facing north; chess landing coordinates remain exact. A directional light casts soft shadows from the knight and decks onto the board; a separate shadow directly beneath the piece makes its ground position readable throughout flight. The 4.8-unit jump arc visibly lifts the whole piece, and a slim underline on the executing premove group tracks flight progress without revealing a route. Jump sparkles use a dedicated star texture and particle system. The mark, favicon and L glyphs are hand-drawn vector assets; the earlier `public/knight-piece.svg` remains as source artwork.

An illustrated energy orb stays fixed in the UI below the board, between the mobile turn controls. A shaded SVG sphere and orbit surround crisp editable L glyphs. Dispatch sends the glyphs toward the banner and briefly expands the orb, paired with a synthesized sound. Landscape places the orb in the free area beside the board. Scene glow and lighting stay constant; landing feedback uses local sparkles without a full-screen brightness flash.

Four-unit squares, shallow raised decks, flight and move icons share a coordinate frame. Platforms sit 0.925 world units above the recessed floor (about a quarter of a square's width), retaining bright checker tops, rims, short side faces and inset supports. They rise over 0.85 seconds; departed decks tilt, shrink, fade and disappear after 1.1 seconds. Rendering uses the display pixel ratio up to 2×. `src/flight.js` rounds airborne corners and samples arc length for steady travel, while the logical chess legs remain in `src/rules.js`.

`public/cosmic-sky.png` is an original background created with the built-in imagegen tool. Prompt: “Use case: stylized-concept. Asset type: seamless-looking panoramic cosmic sky background texture for a neon rainbow-road 3D arcade game. Create a premium game art starfield, landscape 3:2 composition. Deep midnight navy and aubergine space, delicate faraway stars as fine pinpoints, flowing violet and lavender nebula clouds with a tiny soft teal aurora on the right, subtly shimmering dust. Rich, dreamy, euphoric and uplifting, painterly atmospheric sci-fi game skybox art. Keep overall dark and low contrast so the bright gameplay road reads clearly. Nebula details strongest at outer edges, quieter spacious center. No planets, no road, no characters, no chess pieces, no foreground objects, no typography, no UI, no watermark. Intended to be placed behind separately rendered 3D planets and game graphics.”

The original soundtrack, *Stardust Overdrive*, is synthesized in Web Audio: four-on-the-floor kick, snare, hats, layered bass, stereo-detuned chord stabs, arpeggios, and delay. No music recordings are copied. Jump and landing sounds are generated in the same audio engine. Fonts are loaded from Google Fonts with local system fallbacks.

## Verification

`npm test` checks forward L geometry, mirrored inputs, upright icons, bounded queue capacity over 1,000 groups, deterministic course generation and bounded lookahead over 2,000 landings, platform lifecycles, exact rounded-flight endpoints, steady travel speed and completed aerial tricks.

`node verify.mjs` plays 12 landings on desktop and native touch-controlled phone layouts. It checks exact destinations, continued play beyond the former six-jump finish, forward-facing resets, nonrotating camera movement, bounded mesh counts and course storage, dark materials, single-square platforms, premoves, recall, pause, miss and retry. `KNIGHTWAVE_JUMPS` can extend the run. Chrome paths currently target macOS.

`node mobilecheck.mjs` checks same-event orb feedback, canceled drags, side-origin swipes, orb dispatch, recall, pause and landscape resizing. Phone emulation is not a physical-device benchmark.

`node visualcheck.mjs` plays ten jumps on each of desktop, portrait phone, compact phone and landscape layouts. Videos and captures cover composition, launch, tricks, landing and platform transitions. Every animation frame checks the knight and landing square against the visible play area, a fixed UI orb, constant glow, forward orientation, camera rotation and bounded rendering pools. Captures and JSON reports go to `/tmp/knightwave-visual`. Set `KNIGHTWAVE_URL`, `KNIGHTWAVE_CAPTURES`, `KNIGHTWAVE_LAYOUTS`, or `KNIGHTWAVE_JUMPS` to select a deployment, capture directory, layout or run length.

Review captures live in `docs/screenshots/`. The game is in `src/main.js`, the sculpted knight in `src/knight.js`, the board in `src/board.js`, the premove state and gesture rules in `src/premoves.js`, platform animation rules in `src/platforms.js`, move icons in `src/moves.js`, soundtrack in `src/audio.js` and movement rules in `src/rules.js`.

Optional WebMCP state and premove tools are feature-detected. This browser does not expose a supported WebMCP context, so WebMCP integration validation is unavailable.
