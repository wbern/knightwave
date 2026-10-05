# Premove orb refinement

The player composes one platform's chained knight move in a fixed UI orb, dispatches it, and begins composing the next platform. The banner is a record of the player's committed moves, not a strip of revealed answers.

## Research and application

- [Nielsen Norman Group: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) recommends directing attention with relative contrast, scale and grouping. It specifically describes grouping by proximity and whitespace, and sparing use of enclosing containers. Application: a dark recessed chessboard, bright raised decks, and a single borderless row of premoves separated by narrow ticks.
- [Apple: Design advanced games for Apple platforms](https://developer.apple.com/videos/play/wwdc2024/10085/) discusses adapting controls for touch and using visual feedback that remains visible when a finger covers a control. Application: side taps charge a separate UI orb between the controls; a launch animation acknowledges dispatch.
- [Game Accessibility Guidelines: Simple controls](https://gameaccessibilityguidelines.com/ensure-controls-are-as-simple-as-possible-or-provide-a-simpler-alternative/) advises reducing unnecessary input complexity. Application: left, right and dispatch on every device; upward swipe has a tap-button alternative, and a player can compose while safely waiting on a square.

These sources inform the design; the orb metaphor and dispatch behavior are decisions specific to Knightwave, not experimentally validated claims about children.

## Interaction contract

1. Left/right adds or undoes quarter-turned L moves in the orb. This edits the draft, never the knight's current flight.
2. Space, an upward swipe, or a tap on the orb sends one nonempty group to the banner and clears the orb. An empty dispatch is ignored. Each group corresponds to exactly one upcoming platform.
3. Groups show their actual world orientation, derived from the previous committed group's final heading. Thin vertical dividers express dispatch boundaries. No NOW heading, answer strip, panel background or boxed icons.
4. A group locks at takeoff. It stays visible during flight, with a small progress underline, and disappears at touchdown. The next draft can be composed during this flight.
5. On a square without a committed group the knight waits, with a gentle bob. Dispatch resumes motion. A wrong dispatched move still misses; plan using the raised platforms.
6. Backspace or a downward swipe recalls the last unstarted group into the orb, so an accidental commit can be corrected. Escape or the pause button pauses.
7. A swipe must be predominantly vertical and cover a meaningful distance; a drag or canceled gesture must not accidentally append or dispatch a move. Touch-side feedback remains immediate.

## Visual contract

- Maintain the fixed front-facing 3D camera, aligned chess axes and high-resolution sculpted knight.
- Recessed squares use two dark, low-saturation tones. Raised decks retain bright chess surfaces, shallow side faces and shadows. Their tops sit 0.925 world units above the floor, keeping the board recognizable. Brightness denotes elevation, not whether an answer is correct.
- A physical raised rim traces every square, with each raised platform occupying exactly one square. Floor rims remain subtle; platform rims read more clearly.
- The energy orb is a shaded SVG sphere and orbit fixed below the board between the controls. Landscape places it beside the board. Crisp L glyphs show the editable draft; only charge and dispatch animate the orb. It has no enclosing panel and occupies no game-world space.
- The premove row occupies roughly one icon height on phones. Turn and dispatch controls have comfortable invisible hit areas around small graphics, without large button panels.
- Jumps depart from square centers without a run-up. A 0.30-second pause makes each queued landing readable before the next jump.
- Scene lighting and glow remain constant. Local landing sparkles replace full-screen flashes.
- Airborne L corners are rounded at a 0.28-square radius with steady arc-length travel; exact landing squares and final headings stay unchanged. The committed chain determines full spins and barrel rolls around a centered model pivot, finishing before touchdown.
- Validate all six landings and capture charging, dispatch, flight, waiting, recall, rising/falling decks and compact/landscape layouts. Automated checks are followed by screenshot inspection.
