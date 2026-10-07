# Arcade controls, finishes and difficulty bands

Validated locally on 2026-10-06, with all 30 unit checks passing again before release on 2026-10-07. This release includes arcade controls, natural hops, illuminated paths and difficulty bands.

- `pnpm test`: 30 tests passed. Covers all eight destinations and all three orderings of each three-press move, incomplete/invalid triples, original-order recall and distinct curves for equivalent endpoints, impulse-driven hops with heavier descent, upright travel lean, spring contact, four-fork route previews and increasing path complexity, immutable queued groups, bounded storage, forward finish choices, three-level difficulty bands and combo jump speeds.
- `pnpm build`: production build passed. The existing large-chunk notice remains.
- `pnpm check:audio`: all four recordings decoded and played. Verified difficulty mapping, phase position during explicit track changes, looping, pause/resume, mute, retry, 180 ms recording fades, an audible pause cue after its 70 ms music fade, and audible original victory/game-over motifs after the recording becomes silent.
- `pnpm check:levels`: 36 native-touch landings passed with four-move charged combos. Checked finish celebrations for levels 1, 2 and 3; frozen scrolling; pausing during each celebration; queued moves carried across goals; music restarting; Intermediate music/scroll speed at level 4; earned combo reactions on all 36 landings; per-hop four-move airtime under 0.4 seconds; the reached level on game over; fade and retry to Easy.
- `pnpm check:browser`: desktop, phone, compact phone and landscape all passed with native three-press inputs and single-tap dispatch. Each completed 12 landings, captures, finish-line/clear checks, independent-scrolling frame audits, pause, multi-hop groups, idle loss and retry; no page errors or scene/framing invariant failures. Captures and reports are under `/tmp/knightwave-lit-paths`.
- Astra inspected desktop and phone finish-line, orb-charge and clear-card visuals. It also checked desktop/landscape/compact starts and all HUD/control bounds at 375px and 320px widths. Visual captures are under `/tmp/kw-*`.

The stable production preview at `http://127.0.0.1:5180/` is used for browser checks so dev-server hot reloads cannot interrupt a run. The editable local game remains at `http://127.0.0.1:5179/`.

The local pnpm shim needs an unavailable Corepack. Use `npx --yes pnpm@10.34.5` to run the pinned version.

## Difficulty bands

| Levels | Difficulty | Recording | Scroll speed |
| --- | --- | --- | --- |
| 1–3 | Easy | 0.50× | 3.2 |
| 4–6 | Intermediate | 1.00× | 3.85 |
| 7–9 | Advanced | 1.26× | 4.5 |
| 10+ | Expert | 1.50× | 5.15 |

The final three landings reveal the finish stripe. The goal celebration lasts 1.7 seconds, followed by 1.5 seconds of scrolling grace on the next course segment. Multi-move groups accelerate both jumps and landing dwell, up to about 1.7× for four charged moves. Meshes for finish lines and celebrations are created once and reused.

## Natural hops and illuminated paths

Easy single hops take 0.58 seconds; four-move charged hops take 0.34 seconds. A brief grounded crouch leads into a 2.4-unit impulse-driven rise, heavier fall and springy contact squash. The piece stays upright and leans subtly into travel. Curves preserve takeoff and landing directions from the raw three presses. Landing dwell is 0.12 seconds before combo acceleration.

Four forks are always planned ahead, following charged moves or the automatic forward route, and previews stop at the finish. Early paths use gentle upward staircases. Later levels increasingly use sideways bends and zigzags, with optional capture detours. Glowing corners, path dashes, twinkling platform highlights and mint/lavender edge rails make progression readable. Desktop framing shows approximately two forks at once; portrait mobile shows nearly four, with the remaining route revealed as the board scrolls.

Astra inspected native hops on desktop and mobile: upright motion, visible crouch/apex/contact and four successful combo landings with no page errors. Captures are `/tmp/knightwave-hop-{desktop,mobile}-{launch,apex,landing,combo}.png`. The final board-light module uses 48 pooled meshes; 100 repeated updates kept the integrated scene at 510 meshes. Final board captures are `/tmp/knightwave-route-lights-{desktop,mobile}-final.png`.

The combo label is positioned after the scene transform update, avoiding a first-frame flash at the screen corner. Landing compression also settles during level-clear celebrations.

After raising the luminous rails above the physical board edge, the final production build passed a desktop/mobile native-hop smoke check: both rails enabled at y=-1.62, four future route links, upright landing, constant meshes and no page errors. Final captures are `/tmp/knightwave-final-{desktop,mobile}.png`.
