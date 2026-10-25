# Supa Dude — character art specification

Use [the art direction](art-direction.md) for shared drawing rules, palette, environment, effects, and production scope.

## Identity

The supplied [character reference](references/supa-dude-final.png) defines Supa Dude: an oversized white round head, black oval eyes and curved smile, black stick limbs, and a red cape. Preserve those proportions and simple construction.

The approved direction is the [cleaner-cartoon style reference](references/approved-art-style.png), selected by the user on 2026-10-17: a sunny suburb, bold outlines, simple rounded shapes, a few deliberate details, and broad cel shadows. Use this image for visual treatment and the original character reference for MC identity. This replaces the square superhero icon, cyan body, rectangular eyes, and chest emblem. The square silhouette is no longer an art requirement.

## Drawing and orientation

- Bold near-black contours, rounded line ends, and restrained hand-drawn variation.
- White head, friendly face, black limbs, and red cape.
- Side-facing body with enough face turn to keep the expression visible.
- Stable proportions and cape attachment across poses.
- Transparent sprite background; render contact shadows separately.
- Match nearby props' ink and lighting while keeping the MC visually simpler.
- Match the approved cleaner-cartoon reference's detail level; keep the face and limbs free of added texture or costume detail.

## Pose coverage

1. Running / grounded, with a readable repeating stride.
2. Jump and descent, using articulated limbs rather than whole-character quarter-turns.
3. Brief Flight boost: activation, forward flight, and return to falling.
4. Fire, Water, and Electricity attacks with consistent effect attachment points. A shared arm pose may support all three effects.
5. Crash reaction and burst source.
6. Completion pose.
7. Battle movement, hit reaction, and airborne stomp for the existing Robber Battles.

There is no Duck pose. Grounded timing beneath overhead Hazards does not imply ducking.

## Scale, anchors, and collision

Determine final visual scale in a gameplay proof scene. The old 38×38 presentation size and 28×32 collision body describe the square placeholder and are not an approved target for this character art.

Use consistent ground and effect anchors. Keep the visible contact region aligned with gameplay collision. Thin limbs and a moving cape need an explicit hitbox-overlay review; a rectangular body cannot be assumed to match every pose. Do not silently resize collision or change Jump physics during asset replacement.

Review at actual desktop and mobile display sizes before fixing export dimensions and frame counts. The smile, head shape, cape, and action must remain readable.

## Documentation transition

The renderer and `CONTEXT.md` still describe or display the square placeholder. This specification defines its intended replacement; it does not imply integration has happened. Flight and attacks follow ADR-0007 and ADR-0008; battle pose coverage follows ADR-0011.
