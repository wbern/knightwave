# Premove orb refinement

The player composes one platform's chained knight move in a floating orb, dispatches it, and begins composing the next platform. The banner is a record of the player's committed moves, not a strip of revealed answers.

## Research and application

- [Nielsen Norman Group: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) recommends directing attention with relative contrast, scale and grouping. It specifically describes grouping by proximity and whitespace, and sparing use of enclosing containers. Application: a dark recessed chessboard, bright raised decks, and a single borderless row of premoves separated by narrow ticks.
- [Apple: Design advanced games for Apple platforms](https://developer.apple.com/videos/play/wwdc2024/10085/) discusses adapting controls for touch and using visual feedback that remains visible when a finger covers a control. Application: taps charge an orb near the knight, rather than requiring the player to inspect a covered button; a launch animation acknowledges dispatch.
- [Game Accessibility Guidelines: Simple controls](https://gameaccessibilityguidelines.com/ensure-controls-are-as-simple-as-possible-or-provide-a-simpler-alternative/) advises reducing unnecessary input complexity. Application: left, right and dispatch on every device; upward swipe has a tap-button alternative, and a player can compose while safely waiting at an edge.

These sources inform the design; the orb metaphor and dispatch behavior are decisions specific to Knightwave, not experimentally validated claims about children.

## Interaction contract

1. Left/right adds or undoes quarter-turned L moves in the orb. This edits the draft, never the knight's current flight.
2. Space, an upward swipe, or the small dispatch arrow sends one nonempty group to the banner and clears the orb. An empty dispatch is ignored. Each group corresponds to exactly one upcoming platform.
3. Groups show their actual world orientation, derived from the previous committed group's final heading. Thin vertical dividers express dispatch boundaries. No NOW heading, answer strip, panel background or boxed icons.
4. A group locks at takeoff. It stays visible during flight, with a small progress underline, and disappears at touchdown. The next draft can be composed during this flight.
5. At an edge without a committed group the knight waits, with a gentle bob. Dispatch resumes motion. A wrong dispatched move still misses; plan using the raised platforms.
6. Backspace or a downward swipe recalls the last unstarted group into the orb, so an accidental commit can be corrected. Escape or the pause button pauses.
7. A swipe must be predominantly vertical and cover a meaningful distance; a drag or canceled gesture must not accidentally append or dispatch a move. Touch-side feedback remains immediate.

## Visual contract

- Maintain the fixed front-facing 3D camera, aligned chess axes and high-resolution sculpted knight.
- Recessed squares use two dark, low-saturation tones. Raised decks retain bright chess surfaces, strong side faces and shadows. Brightness denotes elevation, not whether an answer is correct.
- A physical raised rim traces every square, including the seam between the two squares on each raised deck. Floor rims remain subtle; platform rims read more clearly.
- The energy orb is an animated 3D sphere with a halo; crisp L glyphs sit over its projected screen position. It sits ahead of the knight, and does not display a destination line or landing marker.
- The premove row occupies roughly one icon height on phones. Turn and dispatch controls have comfortable invisible hit areas around small graphics, without large button panels.
- Validate all six landings and capture charging, dispatch, flight, waiting, recall, rising/falling decks and compact/landscape layouts. Automated checks are followed by screenshot inspection.
