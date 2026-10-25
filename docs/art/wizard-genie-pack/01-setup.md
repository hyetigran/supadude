# 01 Setup

Copy one complete block per request. Attach the listed references through Wizard Genie; local filenames are not public image URLs.

## project-setup

References: `approved-art-style.png`, `supa-dude-final.png`

```text
We are creating reusable assets for Supa Dude, a 2D side-view suburban superhero game. Treat the uploaded approved-art-style image as the primary art direction and the uploaded original MC image as the character identity reference.

Lock this visual language: clean bold black outer outlines, rounded shapes, sparse thin interior lines, mostly flat colors, one broad cel-shadow shape, small restrained highlights, sunny playful palette. Houses get simple window trim, one divider, a door panel and doorstep. Cars get windows, a door seam, handle, mirror, lights and simple wheel hubs. Trees and bushes use three or four broad foliage lobes and one shadow patch. Match the selected cleaner-cartoon image's detail level.

No photorealism, 3D rendering, pixel art, hatching, halftone, paper grain, dense texture, individual leaves, bark marks, roof shingles, elaborate architecture or garden clutter. No text, logos, watermark or baked checkerboard.

Use side elevation throughout. Supa Dude faces right. Traffic faces left. The MC is a thin black stick figure with oversized white circular head, two small black oval eyes, curved smile and red cape. No suit, shoes, gloves, hair or chest emblem. There is no ducking.

Generate only the asset or step I request, not a complete scene or an entire library at once. Keep characters, scenery, gameplay objects, effects and interface elements separate. Preserve references, prompts and original outputs. Use descriptive filenames. Do not change gameplay code or physics while creating these assets.

The stick-figure character in these references is the requested new art direction even if existing code or older design documents describe a square icon. Create assets only; do not modify the game. Approaching traffic remains a left-facing side-view sprite moving toward the hero; do not make front-facing or perspective-zoom sprites.
```

## export-settings

References: `approved-art-style.png`

```text
For isolated static assets, use reference-image generation with genuine transparent PNG output when the chosen model supports it. Check the selected model’s available settings and enable its actual transparent-background setting when supported; the word transparent alone is insufficient. Start with square source canvases for props and taller canvases for characters where supported. Leave clear padding, preserve the whole silhouette, and do not crop line ends or capes. Source dimensions are production masters, not in-game sizes.

If a model produces opaque output, use a uniform green or blue chroma plate and Wizard Genie's Corridor Key to obtain the final RGBA PNG. Choose a plate color absent from that asset: green works for the MC and blue car; blue works for green foliage and green trashcans. For assets containing both colors, prefer native transparency or key separate component assets before assembly. Keep ground shadows separate.

For character animation, create a clean chroma master, use AutoSprite V3, then Corridor Key for the transparent sprite sheet. Preserve sheet metadata and animation tags. Do not deliver the chroma MP4 as the final sprite.

Keep all poses of a character on a consistent canvas, at the same visual scale, with consistent ground and effect anchors. Record actual export dimensions and anchors; do not invent metadata. Save final keyed sheets, frame dimensions, columns, rows, playback fps and tag ranges together. Check that the MC's white head and black limbs survive background removal.
```
