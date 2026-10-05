# Supa Dude — Product Requirements Document

## 1. Overview

Supa Dude is a 2D browser-based, single-plane precision auto-runner. The player guides a square superhero icon through one finite, hand-authored course using one button for Jump and temporary Flight. The target experience is the classic Geometry Dash cube-mode loop: read the geometry, internalize the rhythm, crash, retry quickly, and reach 100%.

Supa Dude retains original visuals, sounds, course layouts, and branding. Geometry Dash is a mechanical reference, not an asset or content source.

Terminology follows `CONTEXT.md`. Architectural decisions live in `docs/adr/`.

## 2. Core gameplay

### 2.1 Auto-run and Jump

- Supa Dude moves forward at a constant speed; the player never controls horizontal movement.
- Jump is the primary control; during Flight the same input controls ascent.
- Jump works only while grounded on the Ground or a car roof.
- Holding Jump repeats it immediately after landing; an airborne Jump Orb grants a single automatic double jump.
- Airborne rotation is visual feedback derived from the same deterministic simulation as collision.

### 2.2 Neighborhood course and powers

- The Level is fixed and hand-authored. A single Ground plane remains beneath the course.
- Cars and vans travel on the road, 24 world pixels below the sidewalk, with roofs reachable from the sidewalk and fatal sides/undersides. Rendering and collision share the same deterministic movement function.
- Bushes and Trash Cans replace geometric spikes. Low Tree branches and Basketball Hoops require staying grounded in the one-button version; each is marked “STAY LOW”.
- Landing on a blue Flight Trampoline grants four seconds of flight. Hold Jump to rise; release to descend. The HUD shows remaining time. Flight ends into normal gravity and never grants invulnerability.
- Touching a gold Jump Orb in midair automatically applies a second jump impulse. It does not require another press and does not trigger while flying.
- Power objects activate once per Attempt and reset on Crash. Pause freezes movement and ability timers.
- Ground sequences stay dense; flight sections include a clear landing area before ground hazards resume. The course contains two flight sections and two jump orbs.
- Visible geometry must cover its collision area. Neighborhood scenery is visually distinct from obstacles.

### Difficulty

- The start screen offers Normal and Hard, with mouse/touch buttons and Space/Enter or H shortcuts.
- Hard increases forward speed by 23%; jump height, gravity, and Flight duration remain unchanged.
- HUD and results identify the selected mode. Automatic retries keep it; a new playthrough returns to mode selection.

### 2.3 Failure and retry

- Any fatal contact causes a Crash; there are no Lives or health points.
- A Crash freezes the current frame briefly, plays feedback, then automatically restarts from 0%.
- Each restart increments Attempt Count and resets Coins and successful-Attempt time.
- There are no Checkpoints in normal play.

### 2.4 Progress and completion

- HUD shows Attempt Count, integer Progress percentage, and Coins collected.
- A persistent progress bar maps traveled distance to 0–100%.
- Reaching the finish gate completes the Level and stops simulation.
- Results show Attempts, Completion Time for the successful Attempt, and Coins collected.

### 2.5 Coins

- Coins are optional and placed on intentional jump arcs.
- Coins reset when an Attempt restarts.
- Score is the number of Coins collected in the completed Attempt, with Completion Time as a future Leaderboard tie-breaker.

## 3. Controls

| Action | Desktop | Pointer / mobile |
|---|---|---|
| Jump / hold Jump | Space or Up Arrow | Press and hold anywhere in the play area |
| Flight (while powered) | Hold Space / Up to rise; release to descend | Hold to rise; release to descend |
| Pause | Escape, P, or pause button | Pause button |

The pause target is at least 44×44 CSS/game pixels. Browser pinch zoom remains available. Decorative motion respects `prefers-reduced-motion`; core track movement remains because it communicates gameplay state.

## 4. Presentation

- **Player:** a compact square superhero icon with a red cape, face, and chest emblem. It rotates in air and snaps square on landing.
- **Environment:** a daytime suburban neighborhood with houses, pitched roofs, yards, fences, mailboxes, trees, a sidewalk, and road markings with a single readable Ground plane.
- **Hazards:** approaching cars/vans, bushes, trash cans, low branches, and basketball hoops; blue trampolines and gold jump orbs have distinct shapes and labels.
- **Feedback:** synthesized jump, landing, coin, crash, pause, orb, flight, and completion sounds; particles and short screen shake; a reduced-motion fallback.
- **Readability:** gameplay geometry, player, and HUD must remain distinguishable without relying on color alone.

## 5. Technical design

- Phaser 3, TypeScript, and Vite remain the client stack.
- `Runner` is the authoritative pure gameplay module. It owns fixed-step motion, collision, Coins, Crash/retry, Attempt Count, Progress, and completion.
- Phaser classes render authored Level geometry and shared deterministic Traffic positions and consume `RunnerFrame`; they do not make collision decisions or maintain a second distance clock.
- Simulation runs at a fixed 120 Hz and clamps unusually long browser frames.
- The Level remains finite and authored, preserving ADR-0003.
- Supabase remains the planned Account/Leaderboard backend; it is not required for local gameplay.

## 6. Explicitly removed by the single-plane pivot

- Three Lanes and Lane Shift
- Dedicated Duck control (overhead obstacles now use stay-grounded timing)
- Lives, Hearts, and Checkpoints
- Power-up Cars, Fire/Water Powers, and Blockers
- Final Boss, Punch, and the separate Boss Fight loop

## 7. Follow-up work

- Playtest and tune speed, gravity, jump impulse, hitbox forgiveness, and authored spacing.
- Expand the verified completion timing test as final course patterns are authored.
- Produce final icon/environment art and a music track without changing gameplay geometry.
- Decide whether the planned Account/Leaderboard scope is still worthwhile for the portfolio release.

### Car elemental powers

- Land on a red car roof for six seconds of Fire; land on a blue car roof for six seconds of Water.
- Press F, X, or the on-screen Shoot button: Fire burns Bushes ahead; Water clears Trash Cans ahead (180 px range, 400 ms between attacks).
- One active element; a new powered roof replaces it and refreshes its timer. Each car activates once per Attempt.
- Show roof labels, a colored aura, attack effects, and an active countdown. Each press fires one shot; holding does not repeat.
- Other collisions remain fatal. Timers pause with gameplay; cars, powers, and cleared obstacles reset on retry.
