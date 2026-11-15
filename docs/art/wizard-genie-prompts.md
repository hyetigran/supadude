# Supa Dude — Wizard Genie asset prompts

For complete prompts with every asset name and motion already filled in, use the [copy-and-paste pack](wizard-genie-pack/README.md) or [download the ZIP with both reference images](supa-dude-wizard-genie-prompts.zip). The guide below explains the workflow.

Use these in order in Wizard Genie. This pack covers the game's visual assets; the final step includes optional audio prompts. It does not generate anything until you submit the prompts there.

## 1. Upload the two references and establish the project rules

Upload:

- [approved-art-style.png](references/approved-art-style.png): the selected cleaner-cartoon scene, with blue car, trampoline, and green Trash Can. This defines the visual treatment.
- [mc-run.png](../../assets/art/hero/mc-run.png): the approved in-game MC run sheet. This defines character identity (the original MC image was removed 2026-11-14).

Generated Traffic sprites (2026-11-14, awaiting owner review, not wired into the game): `assets/art/traffic/{car,van}-{blue,red,yellow}.png`, each with a `.json` recording dimensions, roof endpoints, groundY and wheel anchors. Red/yellow are code recolors of the blue body only, on identical canvases. The wheels are a separate layer: the body PNGs have the tire interiors cut out (the outer tire outline stays on the body), and one shared spoked `assets/art/traffic/wheel.png` (200x200, pivot at its centre, outer radius 93.5) is drawn on top at each `anchors.wheels` hub centre, scaled by `wheelLayer.scale` (car 1.0, van 0.7433) and rotated by distance / radius. The wheel's tire colours and ring radii are measured from the approved tires. A 5-spoke hub was added so the rotation is visible.

Attach the relevant reference images to later generations too; do not rely only on chat memory. The file paths in this document identify local files, not public reference-image URLs.

Paste this setup prompt:

```text
We are creating reusable assets for Supa Dude, a 2D side-view suburban superhero game. Treat the uploaded approved-art-style image as the primary art direction and the uploaded original MC image as the character identity reference.

Lock this visual language: clean bold black outer outlines, rounded shapes, sparse thin interior lines, mostly flat colors, one broad cel-shadow shape, small restrained highlights, sunny playful palette. Houses get simple window trim, one divider, a door panel and doorstep. Cars get windows, a door seam, handle, mirror, lights and simple wheel hubs. Trees and bushes use three or four broad foliage lobes and one shadow patch. Match the selected cleaner-cartoon image's detail level.

No photorealism, 3D rendering, pixel art, hatching, halftone, paper grain, dense texture, individual leaves, bark marks, roof shingles, elaborate architecture or garden clutter. No text, logos, watermark or baked checkerboard.

Use side elevation throughout. Supa Dude faces right. Traffic faces left. The MC is a thin black stick figure with oversized white circular head, two small black oval eyes, curved smile and red cape. No suit, shoes, gloves, hair or chest emblem. There is no ducking.

Generate only the asset or step I request, not a complete scene or an entire library at once. Keep characters, scenery, gameplay objects, effects and interface elements separate. Preserve references, prompts and original outputs. Use descriptive filenames. Do not change gameplay code or physics while creating these assets.
```

## 2. Set up exports

Wizard Genie's live tools support reference-image generation, native transparency on supported models, AutoSprite V3, and Corridor Key.

Paste:

```text
For isolated static assets, use reference-image generation with genuine transparent PNG output when the chosen model supports it. GPT Image 1.5 currently exposes a transparent-background setting; use the actual setting, not just the word transparent in the prompt. Start with square source canvases for props and taller canvases for characters where supported. Leave clear padding, preserve the whole silhouette, and do not crop line ends or capes. Source dimensions are production masters, not in-game sizes.

If a model produces opaque output, use a uniform green or blue chroma plate and Wizard Genie's Corridor Key to obtain the final RGBA PNG. Choose a plate color absent from that asset: green works for the MC and blue car; blue works for green foliage and green trashcans. For assets containing both colors, prefer native transparency or key separate component assets before assembly. Keep ground shadows separate.

For character animation, create a clean chroma master, use AutoSprite V3, then Corridor Key for the transparent sprite sheet. Preserve sheet metadata and animation tags. Do not deliver the chroma MP4 as the final sprite.

Keep all poses of a character on a consistent canvas, at the same visual scale, with consistent ground and effect anchors. Record actual export dimensions and anchors; do not invent metadata. Save final keyed sheets, frame dimensions, columns, rows, playback fps and tag ranges together. Check that the MC's white head and black limbs survive background removal.
```

## 3. Create the MC master

Use both references. For AutoSprite, request a green-screen master rather than keying it before animation.

```text
Create one full-body production master of Supa Dude using the original MC for identity and the approved cleaner-cartoon scene for style. Oversized white round head, two small black oval eyes, happy curved smile, very thin black stick-line torso and limbs, rounded line ends, small flowing red cape at the neck. Preserve the original proportions.

Side-facing body looking right, with a slight face turn so both eyes and smile remain readable. Relaxed neutral standing pose, arms slightly separated from torso, legs separated enough to read. Keep the entire figure centered with generous padding around head, limbs and cape. Uniform pure green chroma background, no ground, no contact shadow, no scenery, no effects or props. No clothing or superhero emblem.

Save as mc-master. Register this master as the Supa Dude character in AutoSprite V3 so subsequent animations share the same source identity. Show me the master before making its animation set.
```

## 4. Animate the MC

Start with Running, Jump rise, and Flight loop. Once those retain the MC's proportions, use the same character for the remaining motions.

Paste this wrapper, inserting one row from the table:

```text
Using the existing Supa Dude AutoSprite character, create this motion:
[MOTION FROM TABLE]

Keep the side camera locked, facing right, identical head size, thin stick limbs, facial features, outline weight and red cape attachment. Preserve the chroma background. No zoom, camera movement, scenery, extra characters, text, powers or particles. Keep the character inside the frame with padding. Movement through the Level will be controlled by the game: do not animate the character travelling across the screen or a full jump trajectory.

Use a short source clip within the tool's supported duration. After generation, run AutoSprite Corridor Key and wait until the transparent sheet is complete. Inspect the frames and tag the usable motion. Use actual sheet metadata, not guessed frame counts. For airborne actions, use a compatible airborne start pose rather than starting from standing.
```

| File / motion | Insert this motion prompt |
| --- | --- |
| `mc-run` | Loop a cheerful run in place. Alternate bent stick legs and gently swinging arms; cape trails left. No horizontal drift. |
| `mc-idle` | Loop a restrained ready stance with a tiny body bob and gentle cape movement. |
| `mc-jump-rise` | Show the upward Jump pose: leading knee raised, other leg trailing, arms balancing, cape lifting. Keep body origin steady so the game supplies vertical travel. |
| `mc-jump-apex` | Hold a readable airborne apex pose with tucked legs and trailing cape. |
| `mc-fall` | Show a descending pose with feet preparing to meet the Ground. Keep body origin steady. |
| `mc-land` | One small landing compression and quick recovery to running; keep feet aligned to the shared ground anchor. |
| `mc-flight-start` | Transition from an airborne pose into a forward superhero lean. Leading arm extends, legs trail, cape flows left. |
| `mc-flight-loop` | Loop the forward airborne superhero pose with a small cape flutter, no translation or rotation of the whole figure. |
| `mc-flight-end` | Recover from forward flight into the ordinary falling pose. |
| `mc-shoot-ground` | One quick forward arm extension and recovery from a grounded ready pose. No projectile; effects will be separate. |
| `mc-shoot-air` | One quick forward arm extension from an airborne pose. Preserve the airborne leg position. No projectile. |
| `mc-hit` | A brief readable recoil with a surprised face and quick recovery; no gore. |
| `mc-stomp` | A brief downward feet-leading airborne pose for landing on a robber; no horizontal travel. |
| `mc-crash` | A short playful startled reaction with a loose limb splay; the separate Crash effect will hide the transition. |
| `mc-victory` | A cheerful fist-up celebration with a bouncing cape, finishing in a holdable pose. |

Source clip length is not the gameplay action duration. Playback tags, holds and timing are integration work; do not force every Jump or attack to last as long as its generated video.

## 5. Establish five static proof assets

Generate a blue car, green Trash Can, blue Flight Trampoline, cream house and green tree using the prompts below. Compare them with the MC and approved reference at gameplay size before expanding the library. This checks consistency without spending the whole asset budget first.

Use this wrapper for every isolated static asset in steps 5–9:

```text
Create ONE isolated reusable 2D game asset:
[ASSET PROMPT]

Match the uploaded approved cleaner-cartoon reference exactly in detail level, bold rounded outlines, simple shapes, broad cel shadows and sunny palette. Side elevation. Complete object with padding, no ground or cast shadow, no scenery, no words or labels. Use the transparent-output or chroma-and-Corridor-Key workflow already established. Save as [FILENAME]. Generate one object per output, not an asset sheet or contact sheet.
```

## 6. Traffic

Use the approved blue car result as the reference for the other car colors. Create a van master separately, then recolor it. Roofs remain visibly landable; keep each model's silhouette and roof position identical across color variants.

| Filename | Asset prompt |
| --- | --- |
| `car-blue` | Rounded blue compact hatchback facing LEFT, two black tires with simple gray hubs, pale-blue windows, one door seam, handle, small mirror and headlight. One broad lower-body shadow. Match the approved blue car. |
| `car-red` | Recolor only the approved compact car's blue body to red. Preserve silhouette, windows, wheels, lights, roof, anchor and canvas exactly. |
| `car-yellow` | Recolor only the approved compact car's blue body to yellow. Preserve all geometry and non-body colors. |
| `van-blue` | Rounded blue small suburban van facing LEFT, longer cabin than the compact car, two windows, simple sliding-door seam, handle, mirror, two tires, lights and broad lower-body shadow. |
| `van-red` | Recolor only the approved van body to red. Preserve roof, geometry, wheels and canvas. |
| `van-yellow` | Recolor only the approved van body to yellow. Preserve roof, geometry, wheels and canvas. |

Rotating wheels were adopted (2026-11-14, option A): the shared `wheel.png` with a 5-spoke hub is layered over wheel-free bodies, as described above. Keep plain hubs only for still assets; do not animate a complete car driving across its source canvas. If separate rotating wheels are needed, export the approved wheels and wheel-less body with measured matching anchors rather than independently redrawing them.

## 7. Obstacles, interactive objects and finish

| Filename | Asset prompt |
| --- | --- |
| `bush` | Low green bush made of three or four rounded foliage lobes, one broad darker-green shadow patch, no leaf marks or twigs. Clear solid outer mass. |
| `trashcan` | Green wheeled Trash Can matching the approved image: closed hinged lid, top rim, side handle, two small dark wheels and three restrained vertical ribs. |
| `trashcan-lid` | Only the detached lid of the approved green Trash Can, matching its proportions and hinge side. |
| `hydrant` | Short red Fire Hydrant: domed cap, two side outlets, one circular front fitting, simple base and one shadow patch. |
| `fallen-tree` | Horizontal brown fallen trunk with a simple broken end and two short branch stubs, minimal interior marks. Grounded jump-obstacle silhouette. |
| `pit-overlay` | A side-view Construction Pit opening for the sidewalk: clearly defined left and right concrete lips, dark interior and simple broken ends. Transparent outside the opening; no continuous pavement across the gap. |
| `tree-overhead` | Simple trunk and low horizontal branch with broad green foliage. Clearly defined underside clearance; no decorative hanging leaves that hide the contact edge. No Duck symbol or instruction. |
| `basketball-hoop` | Suburban hoop with plain pole, white rectangular backboard, red rim and a few net lines. Clear overhead clearance, simple construction. |
| `trampoline` | Small blue Flight Trampoline matching the approved image: low oval mat, dark center, rounded blue edge and four short legs. |
| `coin` | Warm gold Coin with bold circular outline, one rim line and one small white highlight. Plain center; no arrow or text. |
| `jump-orb` | Gold open ring with a simple upward arrow inside, clearly distinct from a filled Coin. Sparse outline and highlight. |
| `finish-gate` | Friendly finish arch or gate with simple posts and a checkered top band. Clear opening, no text and no baked scenery. |

The pit overlay must be integrated with an actual pavement gap; it cannot simply be pasted over an uninterrupted sidewalk. Do not change collision shapes to match an arbitrary generated picture.

For Trampoline activation, derive three matching states from the approved master: rest, compressed mat, and rebound. Keep frame, legs, canvas, size and ground anchor unchanged. These can be discrete frames rather than a generated video.

## 8. Neighborhood modules

| Filename | Asset prompt |
| --- | --- |
| `house-cream` | Simple cream suburban house with coral triangular roof, chimney, two trimmed windows with one divider each, red door with one inset panel, and a doorstep. One broad eave shadow. No elaborate porch. |
| `house-peach` | Variation of the cream house with peach walls and a different door/window arrangement. Same scale, construction detail and outline weight. |
| `house-blue` | Variation with pale-blue walls, warm cream trim and a simple dark roof. Same scale and detail budget. |
| `fence` | Short section of six plain wooden pickets with one crossbar, warm tan, simple shadow. No wood grain. |
| `tree` | Brown trunk with a crown of three or four large rounded green lobes and one broad shadow patch. No leaf texture or bark marks. |
| `mailbox` | Small suburban mailbox on a plain post, rounded lid, small red flag, one simple shadow. |
| `cloud` | One soft rounded off-white cloud cluster, minimal outline or none, no texture. |
| `contact-shadow` | One restrained soft oval shadow on transparency, no character or object. |

Decorative copies of Bushes and hoops should have lower contrast and remain off the playable route so they do not impersonate Hazards.

## 9. Elemental effects and common feedback

Generate effects separately from the MC. Use the isolated-asset wrapper for stills; if animation is needed, preserve the same shape vocabulary and follow the AutoSprite/keyed-sheet process. For Water use green chroma; for green obstacle fragments use blue or native alpha.

| Filename | Asset prompt |
| --- | --- |
| `fire-projectile` | Compact right-facing orange flame with pale-yellow core and two small ember accents. Rounded flame tongues, clear dark outline, no smoke cloud. |
| `water-projectile` | Compact right-facing curling blue water jet with white highlight and three rounded droplets, clean dark outline. |
| `lightning-projectile` | Short angular yellow zigzag edged in dark ink with one small sharp spark. Clearly distinct from Fire and Water. |
| `fire-impact` | Small orange flare and brief soot puff at a central impact point, playful rather than realistic. |
| `water-impact` | Small curling blue splash with a few droplets, transparent center gaps, no giant puddle. |
| `lightning-impact` | Compact jagged yellow star pop with two small sparks, no full-screen glow. |
| `flight-trail` | Short tapered pale streak following an airborne character, minimal shape, no character included. |
| `landing-dust` | Two or three small cream puffs spreading from a shared ground point. |
| `coin-sparkle` | Three small warm-gold star sparkles, clean readable shape. |
| `crash-burst` | Compact playful red, white and dark comic burst, no character parts or gore. |
| `completion-confetti` | Sparse small red, gold and blue paper shapes with open space between them. |

One shared ground attack pose and one airborne attack pose can serve all three elements. Keep projectiles and muzzle effects separate, and attach them to a measured hand anchor in the game. For curved auto-aim, separate the travelling effect from any trail rather than baking a fixed hand-to-target beam into an image.

## 10. Robbers for the existing battles

This character design is a production proposal; match the hero's simplicity and avoid adding more detailed human anatomy.

```text
Create one friendly cartoon robber antagonist in the approved cleaner-cartoon style. Use the same round-head/stick-limb construction and outline weight as Supa Dude, but a light-gray head, simple dark eye mask, small dark cap and no cape. Compact recognizable silhouette, no weapon, no text. Side-facing neutral pose, arms and legs visibly separated, full figure with padding on a uniform green chroma background. Save as robber-master and register as a separate AutoSprite V3 character.
```

Use the animation wrapper from step 4 with this robber identity and generate: `robber-idle`, `robber-run` (in place), `robber-windup` (clear arm pullback), `robber-punch` (one short unarmed strike), `robber-recover`, `robber-hit`, and `robber-defeat` (playful topple, no gore). Key every completed clip. Attack warning, contact and recovery are separate tags so the game can preserve its existing timings.

## 11. Build the subtle parallax background

Parallax is useful here, but keep it restrained. Use three visual layers; no foreground decoration needs to cover the MC.

| Visual layer | Wizard Genie slot | Suggested scroll factor |
| --- | --- | --- |
| Opaque sky/clouds | Background / 2 | 0 to 0.1 |
| Houses, trees and fences | Midground / 1 | About 0.5 |
| Sidewalk and road | Ground / 0 | 1.0 |

These are proposed tuning values, not mandatory changes to gameplay. Leave Foreground / slot 3 unused for the first pass. Cars, Hazards, interactive Trampolines, Coins and Jump Orbs stay separate from all decorative layers and follow their authoritative game positions.

Sky prompt:

```text
Create only an opaque sunny-sky layer for the Supa Dude cleaner-cartoon style. Bright blue sky, generous open space and two or three simple off-white rounded clouds, restrained color variation, no houses, foliage, ground, MC, traffic, objects, words or UI. Wide landscape, preferably 21:9 on a supporting model. Make left and right edges match for horizontal repetition. Fill the full frame; no transparency or chroma background. Save as bg-sky.
```

Neighborhood prompt:

```text
Build a reusable neighborhood midground strip from our approved house, fence and tree modules. Preserve those asset designs and their detail level. Arrange two simple houses, a short fence and a few broad trees along one common baseline, with generous open gaps. Softer outlines and lower contrast than interactive objects. No MC, Traffic, obstacles, collectibles, interactive trampoline, sidewalk or road.

Use a wide shared canvas, transparent above and between silhouettes. Keep complete houses and trees inside the frame with empty transparent side margins so the strip can repeat cleanly. Preserve a consistent house scale. Export a true-alpha PNG as bg-neighborhood and record the canvas size and baseline. Prefer assembling the already-approved transparent modules over redrawing them. If generating a new layer, use a model with native alpha, or separately key components before assembly: the layer contains both green foliage and blue windows.
```

Ground prompt:

```text
Create a horizontally repeating side-view Ground strip for Supa Dude. Warm light-gray sidewalk with sparse slab dividers, one clean curb edge, and a darker asphalt road one step below. Match the approved cleaner-cartoon reference. A little broad cel shading, no gravel texture, cracks, grass tufts or baked cast shadows. No characters, Traffic, obstacles, pits, collectibles or props.

Keep the sidewalk top edge perfectly horizontal and at a recorded consistent height. Left and right borders must match exactly with no gap or duplicated slab seam. Transparent above the strip. Export as ground-street with its canvas dimensions, top surface and curb line recorded. This is decorative art; preserve the game's actual collision and road offset when integrating.
```

In Wizard Genie's parallax workflow, keep Background slot 2 opaque. If Ground or Midground is generated on chroma, use Parallax Corridor Key and its final transparent PNG. Native-alpha layers need no keying. Check the horizontal join visually; an AI prompt alone does not guarantee a seamless tile.

## 12. Interface assets

Generate one item at a time using this prompt and one item from the list:

```text
Create one isolated Supa Dude interface element: [ITEM]. Match the approved cleaner-cartoon style: rounded shape, bold dark outline, clean fill, very limited shadow and generous internal space. Transparent outside. No label text, numbers or baked drop shadow. Keep the silhouette readable at small display size. Save as [FILENAME].
```

Items: `icon-jump` upward arrow; `icon-flight` small wing/streak; `icon-fire` rounded flame; `icon-water` droplet; `icon-electricity` zigzag; `icon-coin` matching Coin; `icon-heart` battle health; `icon-pause` two bars; `icon-play` right triangle; `icon-home` house; `icon-settings` simple gear; `button-base` rounded button; `panel-base` cream comic panel; `progress-track` long rounded empty track.

Create normal, pressed and disabled button treatments from the same approved button geometry. Draw progress fill and live text in the interface rather than baking percentages, labels, or player names into an image. Large panels and tracks need suitable scalable borders, not stretched corner artwork.

## 13. Package and check the visual library

```text
Package the Supa Dude assets created so far into characters, traffic, obstacles, pickups, scenery, backgrounds, effects and ui folders. Keep each editable/original source and its prompt alongside an exports folder. Include only actual generated files in the asset manifest; mark anything unfinished as missing rather than claiming it exists.

For PNGs record filenames, actual dimensions, transparency and ground/effect anchors. For animations include the final keyed sheet, frame dimensions, rows, columns, playback fps and named frame tags. Preserve source references. Keep optional audio separate.

Create a review contact sheet and one composited gameplay preview using these exports, not newly regenerated approximations. Check consistency against approved-art-style.png; intact white head and black limbs; matching body proportions between frames; no chroma fringe or cropped capes; readable Traffic roofs and obstacle edges; separated power silhouettes; open backgrounds; and matching parallax tile joins. Review at intended gameplay size. Do not change gameplay, physics or collisions during packaging.
```

## 14. Optional audio pass

The art reference does not define a new soundtrack. If replacing the existing synthesized sounds, use these as separate requests after the visual library is stable:

- Jump: “Short friendly cartoon springy jump whoosh, clean transient, no voice, no music.”
- Landing: “Small soft cartoon landing tap with a brief puff, no heavy impact, voice or music.”
- Coin: “One bright playful collectible chime, clean short tail, no voice or music.”
- Flight: “Brief light superhero boost whoosh, airy and cheerful, no voice or music.”
- Fire: “Compact playful flame whoosh and pop, no realistic explosion, voice or music.”
- Water: “Short clean cartoon water jet and splash, no voice or music.”
- Electricity: “Short playful electrical zap and crackle, no sustained harsh buzz, voice or music.”
- Crash: “Brief playful comic impact, readable transient, no gore, scream or music.”
- Completion: “Short cheerful superhero success flourish, no vocals.”

For animation-synced audio, first check the AutoSprite clip's existing sound and extract it through the supported sound-export workflow if it fits; generate replacements only where needed. Request separate files rather than a single sound montage.
