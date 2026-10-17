# Optional robber mini-bosses within the running course

Status: Superseded by ADR-0011 — 2026-10-17

## Decision

At the user's request, introduce three fixed Robber Mini-Boss encounters. This supersedes ADR-0004's exclusion of multiple mini-bosses and extends ADR-0006's removal of bosses. Encounters preserve the auto-run loop: no separate arena, Checkpoint, or mandatory combat gate.

Each robber is a jumpable, fatal-contact enemy with two health points. Fire, Water, and Electricity can each damage it through existing nearest-compatible-target aiming, range, cooldown, and buffered shooting rules. Health indicators and hit effects expose damage; a second hit removes the robber for the Attempt. Retry restores health. Players without a power can jump over the encounter. The QA panel includes a robber toggle, and default course completion remains tested in both difficulties.
