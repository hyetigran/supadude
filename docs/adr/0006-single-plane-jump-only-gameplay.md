# Use single-plane, jump-only precision gameplay

Status: Accepted — 2026-09-20

## Context

The three-Lane design put Sidewalk, Tree Lawn, and Street on separate depth bands while using a side-view camera. In play, those bands read as stacked horizontal tracks rather than navigable depth. Lane Shift, Jump, Duck, Powers, Lives, Checkpoints, and a separate Boss Fight also created several competing decision systems inside a short auto-runner.

The desired experience is now the classic Geometry Dash cube-mode loop: one readable path, constant forward motion, one-button jump timing, fatal contact, quick retry, and visible 0–100% mastery.

## Decision

Supa Dude will use one side-view Ground plane and one gameplay input: Jump.

- One deterministic `Runner` module owns fixed-step horizontal motion, jump physics, landable Solid Blocks, fatal Hazards, Coins, Crash/retry, Attempts, Progress, and completion.
- A Crash restarts the full Level from 0% after a short delay. There are no Lives or Checkpoints.
- The Level remains finite, fixed, and hand-authored.
- Phaser is an input/render/audio adapter over `RunnerFrame`; renderers do not maintain independent travel clocks or decide collision.
- Supa Dude keeps original branding, superhero iconography, environment, geometry layouts, and audio. Geometry Dash is a mechanics reference only.

## Consequences

- Lane, Duck, Power, life/checkpoint, and Boss Fight modules are removed instead of adapted.
- Collision now uses continuous world-space player/geometry overlap, not a pose label sampled when an obstacle reaches one x-coordinate.
- Solid Block tops are playable surfaces; side and underside contact are fatal.
- Holding Jump repeats on landing, enabling one-button rhythmic sequences.
- New mechanics such as pads, orbs, portals, gravity inversion, vehicles, or alternate forms require separate decisions; they are not implied by this ADR.

This supersedes ADR-0004 and the Lives/Checkpoint assumptions referenced by ADR-0005. ADR-0003's finite authored Level decision remains in force. ADR-0001 and ADR-0002 are unchanged.
