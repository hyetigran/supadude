# Hero curation — second pass

Reviewed all 46 frames in each of the 15 current source sheets (690 source frames), using numbered contact sheets. Original sheets and the first review export remain untouched.

This pass removes weak motion and unnecessary holds, but restores adjacent frames where the earlier sparse selection caused large pose jumps. More frames in a short transition can be better than fewer disconnected poses. No new AI generations, repainting, interpolation, gameplay changes, or servers.

## Main changes

- Jump rise, apex, fall and stomp use stable single-frame holds; game movement supplies travel.
- Idle and flight flutter use short forward/reverse sequences. Their frame arrays are authoritative; do not replace them with a simple from/to range.
- Flight start/end retain consecutive transition frames. Ground shooting and hit cut long holds while retaining extension/recoil/recovery frames.
- Crash keeps only surprised splay. Victory keeps one arm raise and a final hold.
- Landing drops the prolonged squat and unrelated run cycle. Air shooting removes tangled windup and empty frames, but is only a short gesture, not a full recovery.

## Export inventory

| Motion | Unique frames | FPS | Primary duration | Assessment |
|---|---:|---:|---|---|
| mc-run | 5 | 15 | 0.33s | provisional |
| mc-idle | 6 | 12 | 0.83s | trimmed |
| mc-jump-rise | 1 | 15 | hold | hold-preferred |
| mc-jump-apex | 1 | 15 | hold | hold-preferred |
| mc-fall | 1 | 15 | hold | hold-preferred |
| mc-land | 11 | 24 | 0.46s | provisional |
| mc-flight-start | 12 | 24 | 0.50s | trimmed |
| mc-flight-loop | 3 | 10 | 0.40s | trimmed |
| mc-flight-end | 19 | 30 | 0.63s | provisional |
| mc-shoot-ground | 17 | 24 | 0.71s | provisional |
| mc-shoot-air | 8 | 24 | 0.33s | provisional |
| mc-hit | 16 | 24 | 0.67s | provisional |
| mc-stomp | 1 | 15 | hold | hold-preferred |
| mc-crash | 7 | 20 | 0.35s | trimmed |
| mc-victory | 7 | 18 | 0.39s | trimmed |

Each PNG uses 768×768 frames and genuine RGBA transparency. JSON records the exact grid, selected source frames, explicit playback order, tag FPS and placement measurements. Source sheets are sampled at 15 fps; higher tag rates are intentional editorial speed changes. The WebP previews repeat for review and add a 600ms hold to non-looping actions; they are previews, not final sprite assets. Single-frame holds have no meaningful cycle duration.

## Quality limits

Full-sheet static review and export/preview decode checks are complete. Live playback and cross-action continuity are NOT verified. Prior browser policy blocked local-file playback; no attempt was made to bypass it or start a server.

Body proportions, limb merging, weak leg alternation in run, front-facing recoil in hit, and altered fist ends in victory originate in the generated drawings. Frame trimming cannot repair those. Provisional motions should be regenerated or redrawn before production. Read each clip's curation.notes for its exact cut and remaining defect.

Head size is normalized, but torso/leg proportions are not. Airborne alignment still uses a measured head-bottom proxy rather than anatomical hip tracking. These exports are a tighter review set, not a production sign-off.

## Reproducibility

The edit decisions are in ../curation-v2/selection.json; ../export_sheets.py reads that selection and writes this separate export directory. Original outputs, prompts, source metadata and first-pass exports are preserved. No generation credits were spent in this pass.
