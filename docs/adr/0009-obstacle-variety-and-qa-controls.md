# Obstacle variety and configurable QA play

Status: Accepted — 2026-10-17

## Decision

Add authored Fire Hydrants, Fallen Trees, and Construction Pits in existing ground-Hazard slots, preserving default course spacing. Existing overhead Trees remain. Construction Pits are fatal ground-level openings drawn into the sidewalk; jumping clears them. Electricity clears Fire Hydrants instead of Traffic, revising ADR-0008. Fire and Water retain their target types.

Pause offers explicit Resume and Main Menu actions. Returning to the menu ends the Attempt and restores difficulty selection.

A QA button opens native, keyboard-accessible settings while simulation is paused. Speed, jump height, gravity, frequency, individual obstacle categories, and power objects are configurable. Apply restarts with a single configured Level shared by rendering and simulation. Frequency scales the finite authored course positions, including Coins and power objects, rather than introducing random spawning. Settings persist in the scene across restarts and menu returns; page reload restores defaults. Cancel makes no changes. Extreme QA configurations are not guaranteed completable.

This extends ADR-0003 while retaining a deterministic finite Level and ADR-0006's authoritative Runner architecture. Default Normal and Hard completion tests remain required.
