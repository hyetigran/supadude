# Supa Dude sprite sheet — generation spec

Hand this to an AI image tool (or an artist) to produce the player character's first real sprite sheet, replacing the current stick-figure-drawn-from-rectangles placeholder. See `PRD.md` §5 and `CONTEXT.md` for the character concept; see `src/game/VisualScale.ts` for the proportions this must match.

## Character description (reuse verbatim across every prompt)

> A simple, iconic superhero stick figure: a plain circle head (no face detail needed, or a minimal one), thin straight-line limbs, a small flowing cape, and a small chest emblem/mask nodding at the name "Supa Dude." Flat colors, bold clean silhouette, no gradients or textures — must read clearly at small size while scrolling past a busy background. Primary cape/accent color: `#D62828` (warm red). Body lines in black or near-black. Transparent background.

## Canvas + grid

- **Cell size**: 300×300 px, transparent background, character centered with feet a small margin above the bottom edge (leave room for the cape flowing behind and a jump pose reaching upward).
- **Sheet layout**: single PNG, 4 columns × 4 rows = 16 cells total, 1200×1200 px overall. Fill left-to-right, top-to-bottom in exactly this order — this order is load-bearing, `PlayerSpriteAnim.ts` indexes frames by position, not by filename:

| # | Row,Col | Pose | Notes |
|---|---|---|---|
| 0 | 0,0 | Idle | Standing, relaxed, cape at rest |
| 1 | 0,1 | Run 1 | Stride start — front leg forward |
| 2 | 0,2 | Run 2 | Mid-stride, legs crossing |
| 3 | 0,3 | Run 3 | Stride peak — back leg forward |
| 4 | 1,0 | Run 4 | Mid-stride, legs crossing (opposite of #2) |
| 5 | 1,1 | Run 5 | Stride start, opposite leg (mirror of #1) |
| 6 | 1,2 | Run 6 | Mid-stride (mirror of #2) — loops back to Idle/Run 1 |
| 7 | 1,3 | Jump 1 | Crouch/launch — knees bent, arms driving down |
| 8 | 2,0 | Jump 2 | Apex — legs tucked, cape trailing up |
| 9 | 2,1 | Jump 3 | Descending — legs extending for landing |
| 10 | 2,2 | Duck | Compressed low crouch — squashed toward the ground, arms tucked (must read as clearly shorter, not just squished) |
| 11 | 2,3 | Lane switch | Slight lean/lateral lunge in the dodge direction, cape swinging |
| 12 | 3,0 | Hit | Recoil — flinch backward, arms up defensively |
| 13 | 3,1 | Punch 1 | Wind-up — arm cocked back |
| 14 | 3,2 | Punch 2 | Strike — arm fully extended forward |
| 15 | 3,3 | Punch 3 | Follow-through/recovery |

Run is a 6-frame loop (0→5→0), so frame 6 (Run 6) must flow visually back into frame 0 (Idle) without a pop.

## Proportions (must match `VisualScale.ts`, scaled 4× for a crisp high-res source)

| Constant | Game px | Sprite px (×4) |
|---|---|---|
| `PLAYER_STAND_HEIGHT` (feet → head top) | 68 | 272 |
| `PLAYER_HEAD_RADIUS` | 11 | 44 (diameter 88) |
| `PLAYER_BODY_WIDTH` | 6 | 24 |
| Duck height (`DUCK_SCALE_Y` 0.55×) | 37 | 150 |

Keep the standing silhouette's total height at roughly 272px within the 300px cell (leaves ~28px margin split above/below); the duck pose should occupy roughly 150px of that same cell height, feet aligned to the same baseline as every other frame so swapping frames doesn't shift the character vertically.

## Export

- PNG, transparent background, no anti-aliasing halos/fringing at the trim edges (matters for a scrolling game against a colored background).
- Single flat 1200×1200 file — no sub-folders, no per-frame files.
- Save as `public/sprites/supa-dude.png`.

Once this exists, the engine side (Phaser `spritesheet` loader with `frameWidth: 300, frameHeight: 300`, wired through `PreloadScene` and `PlayerSpriteAnim.ts`) is already built and will pick it up automatically — no code changes needed to go from "no art" to "art live," just drop the PNG in place.
