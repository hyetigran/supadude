# mc-run v2 — rework prompt

Replaces `mc-run` from [02-hero.md](../02-hero.md). Generate in Wizard Genie with the same workflow (motion clip → AutoSprite Corridor Key → transparent sheet).

## Why v1 failed

Review of all 46 source frames (`assets/art/hero/curation-v2/mc-run-all.jpg`):

- **Wrong gait.** The prompt asked for a "cheerful run" with "gently swinging arms", and got a jog: upright torso, short stride, little vertical push. That reads as too slow for a fast-paced runner.
- **Legs can't be told apart.** Both stick legs are identical black lines. At the passing pose they cross and merge into one stroke (source frames 2, 7, 12, 17), so the stride looks like it shuffles instead of alternating.
- **Arms don't pump.** Most frames show only one arm hanging forward. The far arm is hidden behind the torso, so there is no arm-against-leg opposition, which is the main cue that tells a viewer a stick figure is running.

Trimming can't fix any of these, so regenerate.

## Prompt

References: `approved-art-style.png`, `mc-master`

```text
Using the existing Supa Dude AutoSprite character, create this motion:
Save as mc-run-v2. Loop a FAST, energetic superhero sprint in place — a dash, not a jog. Torso leans forward about 15 degrees with the head leading. Quick cadence: about three full strides per second.

Legs: big stride with high knee drive. The front knee lifts to hip height, and the back leg kicks out straight behind with the foot well off the ground. Include a brief airborne moment where both feet are off the ground. The two legs must stay clearly separated in every frame. Never draw them crossing or merging into one line. At the passing pose, the lifted knee is clearly forward and bent.

Arms: both arms always visible and pumping hard, opposite to the legs. When the left leg is forward, the right arm is forward. Bent elbows, fists punching forward and swinging back past the hips. One arm in front of the torso, one behind it.

Cape: streams straight back horizontally from the neck with a quick flutter, never hanging down.

Small vertical bob: the body is lowest when a foot plants and highest during the airborne moment. No horizontal drift.

Keep the side camera locked, facing right, identical head size, thin stick limbs, facial features, outline weight and red cape attachment. Preserve the chroma background. No zoom, camera movement, scenery, extra characters, text, powers, speed lines, dust or particles. Keep the character inside the frame with padding. Movement through the Level will be controlled by the game: do not animate the character travelling across the screen.

Use a short source clip within the tool's supported duration. After generation, run AutoSprite Corridor Key and wait until the transparent sheet is complete.

Match the attached approved-art-style.png: clean bold rounded black outer outlines, sparse interior lines, rounded shapes, flat sunny colors and one broad cel-shadow patch. Keep the cleaner cartoon detail level. No textures, hatching, halftone, photorealism, 3D, lettering, logos or watermark.
```

## Acceptance check (before curation)

- [ ] The body leans forward and the pace reads as a sprint at 15 fps.
- [ ] Both arms are visible and swing opposite to the legs.
- [ ] The legs never merge. The passing frame shows a raised forward knee.
- [ ] At least one frame per cycle has both feet off the ground.
- [ ] Head size and cape attachment match `mc-master`.

## Hand-back

Put the sheet PNG, the sheet JSON and the source MP4 in `assets/art/hero/animations/`, using the `mc-run-v2` prefix. The next step is to curate one clean cycle: for a stick figure with identical legs, the cycle only needs about 4 to 6 distinct poses (contact → down → passing → up → airborne), played at roughly 15 to 20 fps.
