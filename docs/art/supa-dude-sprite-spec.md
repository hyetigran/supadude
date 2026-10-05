# Supa Dude icon — art specification

The current player is drawn procedurally in Phaser so gameplay has no missing-asset dependency. Final art may replace that drawing, but it must preserve the same silhouette and collision readability.

## Character

- Square superhero icon, not a licensed or copied Geometry Dash icon.
- Cyan outer body (`#38BDF8`) with a near-navy inset (`#172554`).
- Bright off-white outline (`#F8FAFC`) that remains legible against every Level color.
- Small red cape (`#EF4444`) and yellow chest emblem (`#FACC15`) to retain the Supa Dude identity.
- Minimal face with two rectangular eyes.
- Flat colors and clean geometric shapes; no texture that obscures the square silhouette.

## Size and alignment

- Presentation size: 38×38 game pixels.
- Collision body: 28×32 game pixels, centered horizontally and aligned to the icon's feet.
- Art must extend outside the collision body rather than inside it; the visible icon may look slightly more vulnerable than the actual hitbox, never the reverse.
- Rotation origin is the exact center of the square.

## States

The core game does not require a traditional animation sheet. Rotation and translation are driven by the simulation. If authored frames are added later, the only required states are:

1. Running / grounded
2. Airborne
3. Crash burst source
4. Completion pose
5. Flight pose: tilt forward slightly, keep the cape readable, and show the remaining time in the HUD.

Lane Shift and Punch remain removed by ADR-0006. ADR-0007 adds Flight and Jump Orb feedback. The current one-button control scheme uses grounded timing beneath low branches rather than a dedicated Duck pose.

## Neighborhood presentation

Use warm daytime houses, pitched roofs, fences, mailboxes, lawns, and sidewalk/road markings. Interactive Traffic has dark outlines, windows, headlights, and rolling wheels; it visibly approaches the player. Bushes and Trash Cans replace geometric spikes. Low Tree branches and Basketball Hoops carry “STAY LOW” labels. Flight Trampolines use a blue mat and arrow; Jump Orbs use a gold ring and upward arrow, visually distinct from Coins.
