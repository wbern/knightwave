# Premove orb and scrolling-board refinement

The player composes ordered knight moves in a fixed UI orb. Space sends a desktop plan; double-tapping the orb sends a touch plan. The slim banner records committed moves and provides no answers.

## Research and application

- [Nielsen Norman Group: Visual Hierarchy](https://www.nngroup.com/articles/visual-hierarchy-ux-definition/) recommends directing attention with relative contrast, scale and grouping. It specifically describes grouping by proximity and whitespace, and sparing use of enclosing containers. Application: a dark recessed chessboard, bright raised decks, and a single borderless row of premoves separated by narrow ticks.
- [Apple: Design advanced games for Apple platforms](https://developer.apple.com/videos/play/wwdc2024/10085/) discusses adapting controls for touch and using visual feedback that remains visible when a finger covers a control. Application: side taps charge a separate UI orb between the controls; a launch animation acknowledges dispatch.
- [Game Accessibility Guidelines: Simple controls](https://gameaccessibilityguidelines.com/ensure-controls-are-as-simple-as-possible-or-provide-a-simpler-alternative/) advises reducing unnecessary input complexity. Application: left, right and dispatch on every device; upward swipe has a tap-button alternative, and a player can compose while safely waiting on a square.

These sources inform the design; the orb metaphor and dispatch behavior are decisions specific to Knightwave, not experimentally validated claims about children.


## Current interaction contract

1. Four direction controls compose ordered perpendicular pairs. The first direction is two squares and the second one square. Partial input responds immediately with a dashed stem. Every complete pair has its own rotated or mirrored L glyph.
2. A draft may contain four pairs. Incomplete drafts cannot dispatch. Parallel input replaces the unfinished stem, and recall clears the draft before retrieving a prior unstarted group.
3. Double-tap dispatch applies to the orb only, so entering a pair does not accidentally send it. A single orb touch has visual feedback but never launches. Space or a mouse click dispatches on desktop.
4. Sent groups lock once execution begins. Each pair lands separately, completed icons disappear, and the group's underline reflects total progress. The next draft remains editable.
5. Autoscrolling advances independently of the knight. A queued jump to a valid platform above the visible area waits for the platform to arrive; it cannot pull the camera forward.
6. Both fork options continue the course. Captures earn extra points, with actual mesh silhouettes and gold rails differentiating them from empty mint-edged decks. A detour can spend scrolling safety.

## Visual contract

The board contains precisely eight files, dark recessed squares, low raised platforms and physical side rails. Desktop width is capped; mobile keeps gutters and a borderless four-direction pad beside the orb. A shallow square platform retains its chess identity. The camera never rotates or follows position. Small progress and level cues stay above the board; the danger seam stays at its bottom. Lighting stays steady, and aerial trick rotations settle north before each landing.

## Progression reference

The exact Knight Strike source was found in the user's local chess project: `chessreel/src/components/KnightStrike/useKnightStrikeGame.ts`, `src/utils/knight-strike-difficulty.ts`, `src/config/knight-strike-config.ts`, and `src/routes/tools.knight-strike.tsx`. Its increasing 11, 12, 13… milestones and brief level-up feedback inform this game's progression. Knightwave counts all successful landings and raises speed monotonically instead of copying Knight Strike's periodic difficulty waves.
