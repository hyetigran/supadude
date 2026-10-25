# 08 Backgrounds

Copy one complete block per request. Attach the listed references through Wizard Genie; local filenames are not public image URLs.

## bg-sky

References: `approved-art-style.png`

```text
Create only an opaque sunny-sky layer for the Supa Dude cleaner-cartoon style. Bright blue sky, generous open space and two or three simple off-white rounded clouds, restrained color variation, no houses, foliage, ground, MC, traffic, objects, words or UI. Wide landscape, preferably 21:9 on a supporting model. Make left and right edges match for horizontal repetition. Fill the full frame; no transparency or chroma background. Save as bg-sky.

Inspect the output repeated three times horizontally. Repair any edge discontinuity before export. Keep foreground slot 3 unused.
```

## bg-neighborhood

References: `approved-art-style.png`, `house-cream`, `house-peach`, `house-blue`, `fence`, `tree`

```text
Build a reusable neighborhood midground strip from our approved house, fence and tree modules. Preserve those asset designs and their detail level. Arrange two simple houses, a short fence and a few broad trees along one common baseline, with generous open gaps. Softer outlines and lower contrast than interactive objects. No MC, Traffic, obstacles, collectibles, interactive trampoline, sidewalk or road.

Use a wide shared canvas, transparent above and between silhouettes. Keep complete houses and trees inside the frame with empty transparent side margins so the strip can repeat cleanly. Preserve a consistent house scale. Export a true-alpha PNG as bg-neighborhood and record the canvas size and baseline. Prefer assembling the already-approved transparent modules over redrawing them. If generating a new layer, use a model with native alpha, or separately key components before assembly: the layer contains both green foliage and blue windows.

Inspect the output repeated three times horizontally. Repair any edge discontinuity before export. Keep foreground slot 3 unused.
```

## ground-street

References: `approved-art-style.png`

```text
Create a horizontally repeating side-view Ground strip for Supa Dude. Warm light-gray sidewalk with sparse slab dividers, one clean curb edge, and a darker asphalt road one step below. Match the approved cleaner-cartoon reference. A little broad cel shading, no gravel texture, cracks, grass tufts or baked cast shadows. No characters, Traffic, obstacles, pits, collectibles or props.

Keep the sidewalk top edge perfectly horizontal and at a recorded consistent height. Left and right borders must match exactly with no gap or duplicated slab seam. Transparent above the strip. Export as ground-street with its canvas dimensions, top surface and curb line recorded. This is decorative art; preserve the game's actual collision and road offset when integrating.

Inspect the output repeated three times horizontally. Repair any edge discontinuity before export. Keep foreground slot 3 unused.
```
