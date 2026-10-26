# Supa Dude hero exports — review set

All 15 requested motions have keyed PNG sheets and JSON metadata. These are review exports, not a claim of final production approval.

Each frame is 768×768 pixels. PNGs use genuine RGBA transparency. JSON records actual columns, rows, frame count, 15 fps playback, named tags, zero-based frame indices, source-frame mapping, scale, translation, measured source bounds and export pivots. The selected sequences intentionally omit damaged frames and long holds; their timing differs from the untrimmed source clips.

`manifest.json` indexes the set. `review.html` is a standalone local playback review page; `overview.jpg` and per-motion contact sheets show static previews. Preview backgrounds and labels are not baked into the sprite PNGs.

## Export alignment

The export operation only resizes and places already-keyed frames. Original generator outputs, videos, keyed masters, prompts and job records remain in the parent `animations` and `poses` directories. `../export_sheets.py` reproduces the export with Pillow.

Scale uses a constant factor per animation to make the median opaque white head width 128 pixels. Grounded clips use a measured support baseline placed at y=660 and retain source bob. Airborne clips align the measured white-head bottom-center to (430,320), removing translation at that documented proxy. This is an export pivot, not a measured anatomical hip or a game collision anchor. Ground reference is (384,660). No gameplay or physics integration is included.

## Checks and remaining limitations

- All 15 sheets passed RGBA, dimensions, tag-index and padding checks. Every selected frame has an opaque white head and at least eight pixels of silhouette padding.
- Contact sheets were inspected during generation. Empty shooting/crash frames and visibly damaged sampled frames were excluded from tags. Rejected generations are preserved.
- Playback is unverified: browser security policy blocked opening the local review page. No server was started, per project rules. Loop seams and fast sparse action transitions still require playback review.
- Generation changed body proportions between some poses. Head size normalization does not repair differing torso or limb lengths; the airborne variants often have longer limbs than the original grounded clips.
- Flight-loop rear-arm motion is greater than requested cape-only movement. Apex legs are bent, with feet less tightly tucked than the specification. Some arms overlap the torso or cape in transitional poses.
- Head-based airborne alignment does not guarantee a steady hip origin during flight rotation. Cross-action transitions and effect attachment points require final art alignment before game use.

These limitations are retained explicitly rather than labeling the set production-ready.
