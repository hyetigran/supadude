# Roof landings grant temporary elemental attacks

Status: Accepted — 2026-10-04

## Context

The user requested Fire from red cars and Water from blue cars, and selected temporary attacks (initially automatic; revised to manual shooting at the user’s request): Fire burns Bushes and Water clears Trash Cans.

## Decision

Extend ADR-0007 with explicit elemental metadata on Traffic, shared by artwork and the authoritative Runner. Descending roof landings activate each powered car once per Attempt. Side contact and passing over a car do not grant a power.

An element lasts six seconds of active simulation time. A new powered car replaces the element and refreshes its duration. Pressing F, X, or the on-screen Shoot button fires one shot. Fire and Water auto-aim at the nearest matching ground Hazard within 180 world pixels of the player center in any direction, at most once per 400 ms. Cleared Hazards remain absent until retry. Yellow Traffic roofs grant Electricity, which auto-aims at the nearest Fire Hydrant within the same range. Traffic always retains its collision and roof-support rules. This revises the earlier electricity-destroys-cars behavior at the user’s request. Other Hazards retain their collision rules. Flight can coexist with an element. Shoot is a separate input from Jump. Holding does not repeat, one press during cooldown is queued until the next shot is ready (additional presses do not stack), and a shot with no matching target still produces a visible blast and consumes the cooldown. This supersedes the one-input restriction in ADR-0006 and ADR-0007.

Shoot taps up to 150 ms before initial power acquisition are buffered; a tap on the landing tick can fire immediately after acquisition. Pending shots clear on death, retry, and power expiry. This revises the original cooldown input policy to avoid silently dropping rapid taps.

The renderer displays red/blue/yellow car bodies, roof labels, a player aura, attack effects, a countdown, and a touch Shoot button while powered. Pause stops the gameplay timer. Retry restores all powered cars and cleared Hazards and removes the active element.

## Consequences

The course remains playable using its existing jump timings in both difficulties. Power acquisition rewards roof landings and gives situational relief without immunity to traffic, overhead hazards, or the other element's target. Tests cover acquisition, target matching, range/cooldown, replacement, expiry, retry, and manual input gating.
