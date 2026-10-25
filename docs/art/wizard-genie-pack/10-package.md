# 10 Package

Copy one complete block per request. Attach the listed references through Wizard Genie; local filenames are not public image URLs.

## package-and-check

References: `approved-art-style.png`

```text
Package the Supa Dude assets created so far into characters, traffic, obstacles, pickups, scenery, backgrounds, effects and ui folders. Keep each editable/original source and its prompt alongside an exports folder. Include only actual generated files in the asset manifest; mark anything unfinished as missing rather than claiming it exists.

For PNGs record filenames, actual dimensions, transparency and ground/effect anchors. For animations include the final keyed sheet, frame dimensions, rows, columns, playback fps and named frame tags. Preserve source references. Keep optional audio separate.

Create a review contact sheet and one composited gameplay preview using these exports, not newly regenerated approximations. Check consistency against approved-art-style.png; intact white head and black limbs; matching body proportions between frames; no chroma fringe or cropped capes; readable Traffic roofs and obstacle edges; separated power silhouettes; open backgrounds; and matching parallax tile joins. Review at intended gameplay size. Do not change gameplay, physics or collisions during packaging.

Include a missing-assets list, never placeholder files presented as finished art. Keep gameplay previews separate from runtime assets. The three background layers are sky (0–0.1 course scroll), neighborhood (~0.5), ground (1.0); these values are tuning suggestions. Do not bake interactive objects into them. For any effects delivered as still PNGs, identify them as stills; animation can be supplied by scale, rotation and fade in the game. Do not invent sprite-sheet metadata.
```
