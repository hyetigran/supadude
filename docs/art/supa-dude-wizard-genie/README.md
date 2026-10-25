# Supa Dude — copy-and-paste asset prompt pack

These prompts create assets in Wizard Genie. They do not change the game or wire anything into it. The approved cleaner-cartoon image controls style; the original hero controls character identity.

## Start here

1. Upload `references/approved-art-style.png` and `references/supa-dude-final.png` to Wizard Genie.
2. Paste the two setup prompts in `01-setup.md`.
3. Generate `mc-master`, then `mc-run`, `mc-jump-rise` and `mc-flight-loop` from `02-hero.md`.
4. Generate five proof assets: `car-blue`, `trashcan`, `trampoline`, `house-cream`, and `tree`. Compare them with the approved reference and hero at gameplay size before expanding the library.
5. Continue through the remaining prompts. Each block is complete: copy one block per request. When a prompt lists a generated asset as a reference, attach that exported result. For recolors and state changes, use the existing approved asset as an edit reference.
6. Create the three background layers after the scenery modules. Run the packaging prompt last. Audio is optional because the game already has synthesized effects.

No square superhero, no ducking, no front-facing traffic, and no detailed textured scenery. Traffic approaches through game movement, not perspective enlargement. Hero animation is in place; the game supplies travel. Fire clears Bushes, Water clears Trash Cans, and Electricity clears Fire Hydrants; do not depict every obstacle or vehicle exploding.

The current game still describes a square rotating icon in older code/domain documentation. These prompts intentionally follow your newer stick-figure art direction. Replacing that rendering is a later integration task.

The robber design is a proposed extension using the same simple stick-figure construction. All other art follows the approved references. No new enemy types are required.

## Files

- [01-setup.md](01-setup.md) — 2 prompts
- [02-hero.md](02-hero.md) — 16 prompts
- [03-traffic.md](03-traffic.md) — 6 prompts
- [04-gameplay-objects.md](04-gameplay-objects.md) — 14 prompts
- [05-scenery.md](05-scenery.md) — 8 prompts
- [06-effects.md](06-effects.md) — 14 prompts
- [07-robber.md](07-robber.md) — 8 prompts
- [08-backgrounds.md](08-backgrounds.md) — 3 prompts
- [09-interface.md](09-interface.md) — 22 prompts
- [10-package.md](10-package.md) — 1 prompts
- [11-optional-audio.md](11-optional-audio.md) — 9 prompts

`prompts.json` contains the same prompts as structured data. It is a generation plan, not a manifest claiming assets already exist. Reference PNGs are included in the ZIP. Source video duration is not gameplay action duration; use exported frame metadata and select usable tags during later integration.
