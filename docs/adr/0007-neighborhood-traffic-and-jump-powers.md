# Neighborhood traffic and contact-triggered jump powers

Status: Accepted — 2026-10-04

## Context

The user requested a suburban setting, approaching traffic in place of geometric blocks, an object to land on for temporary flight, and an orb that supplies a double jump. This extends ADR-0006's jump-only mechanics and supersedes its exclusion of powers and vehicles.

## Decision

- Preserve one side-view course, one primary input, deterministic simulation, fatal contact, and full-Level retries.
- Replace authored blocks with approaching Traffic. Cars sit on the road 24 pixels below the sidewalk, and their lowered roofs remain landable from the sidewalk. Position is a pure function of authored position and Runner distance, shared by rendering and collision; it freezes with simulation and resets on retry.
- A descending landing on a blue Flight Trampoline grants four seconds of Flight. Hold the primary input to climb and release to descend. Flight stays within the viewport, remains vulnerable to obstacles, and uses active simulation time.
- A gold Jump Orb automatically boosts an airborne player once on contact, without a second press. It cannot activate during Flight. All power objects reset on retry.
- Bushes, Trash Cans, Tree branches, and Basketball Hoops supply suburban obstacles. The current control assumption is one button: overhead obstacles allow a grounded player underneath. A dedicated Duck action remains a product choice pending the user's preference.
- Houses, lawns, fences, mailboxes, sidewalk, and road markings supply the environment. These are decorative; interactive obstacles use stronger outlines and power objects have labels.

## Consequences

Runner remains authoritative for motion, collision, ability duration, and activation. The renderer consumes snapshots including ability time and used object IDs. Automated tests cover activation, expiration, retry, moving collision, and completion with both powers at multiple frame rates. The course includes flight landing clearance before ground hazards resume. No flight immunity, extra lane, unrestricted double jump, or persistent upgrade is introduced.
