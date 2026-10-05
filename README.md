# Supa Dude

An original, single-plane precision auto-runner built with Phaser 3, TypeScript, and Vite. Jump through a suburban neighborhood, land on flight trampolines, and chain gold jump orbs to reach 100%.

## Development

```sh
npm install
npm run dev
```

Quality checks:

```sh
npm test
npm run build
```

## Architecture

- `src/game/Runner.ts` is the authoritative fixed-step gameplay module.
- `src/game/Level.ts` contains hand-authored obstacles, power objects, and the shared Traffic movement function.
- `src/scenes/GameScene.ts` adapts input and renders `RunnerFrame` snapshots.
- `CONTEXT.md` defines the domain language.
- `docs/adr/` records architectural decisions; ADR-0006 documents the single-plane pivot; ADR-0007 adds neighborhood Traffic, Flight Trampolines, and Jump Orbs.

The gameplay reference is classic Geometry Dash cube-mode, but all branding, visuals, sounds, and course content are original to Supa Dude.
