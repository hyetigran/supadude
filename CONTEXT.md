# Supa Dude

A 2D browser-based side-scrolling auto-runner. The player controls Supa Dude, a stick-figure character who auto-runs through a single finite, hand-authored neighborhood Level (length comparable to a long Geometry Dash level) and must dodge obstacles, collect power-ups, and defeat the Final Boss to reach the end.

## Language

**Supa Dude**:
The player-controlled stick-figure protagonist. Auto-runs continuously; the player only controls dodging. Visually a classic stick figure (circle head, line limbs) with a small cape and chest emblem/mask to nod at the "Supa" name.

**Level**:
The single, finite, hand-authored playthrough content — start to end, including all Obstacles, power-up Cars, and the Final Boss. There is only one Level (no procedural generation, no multiple stages).
_Avoid_: Run, stage

**Checkpoint**:
A fixed save point in the Level (placed immediately before the Final Boss) that a respawn returns to after Lives reach 0. Resets Lives to full; does not reset Score (Coins collected) — see ADR-0005.

**Attempt**:
One continuous playthrough of the Level from either the start or the most recent Checkpoint, ending in either reaching the end of the Level or losing all Lives (triggering a respawn at the last Checkpoint).

**Sidewalk Lane**:
The lane nearest the houses. Its obstacle vocabulary is the Trash Can (Ground) and Awning (Overhead).

**Tree Lawn Lane**:
The middle lane and the starting Lane for each Attempt. Its obstacle vocabulary is the Fire Hydrant and Utility Box (Ground) and Low Branch (Overhead).

**Street Lane**:
The lane farthest from the houses. Its obstacle vocabulary is the Motorcycle and Power-up Cars (Ground) and Street Banner (Overhead).

**Lane Shift**:
A move from the current Lane to one adjacent Lane in the order Sidewalk Lane ↔ Tree Lawn Lane ↔ Street Lane. A Lane Shift never skips over the Tree Lawn Lane or wraps between the two outer Lanes.
_Avoid_: Lane switch

**Obstacle**:
A Lane-specific hazard that Supa Dude must clear. Each Obstacle type belongs to exactly one Lane and is either a Ground Obstacle or an Overhead Obstacle.

**Ground Obstacle**:
An Obstacle positioned at ground level that Supa Dude clears with Jump.
_Avoid_: Low obstacle, jump obstacle

**Overhead Obstacle**:
An Obstacle positioned above ground level that Supa Dude clears with Duck.
_Avoid_: High obstacle, duck obstacle

**Motorcycle**:
A plain Ground Obstacle in the Street Lane that grants no Power. Visually distinct from Power-up Cars so the Street reads as mixed traffic, not only cars.
_Avoid_: Bike, scooter

**Blocker Obstacle**:
A Tree Lawn Lane Obstacle that can be cleared normally or destroyed by its matching Power. A Low Branch is Wood and can be destroyed with Fire Power; a Utility Box is Electric and can be destroyed with Water Power.

**Low Branch**:
A Wood Overhead Obstacle in the Tree Lawn Lane. Duck clears it; Fire Power can destroy it instead.

**Utility Box**:
An Electric Ground Obstacle in the Tree Lawn Lane. Jump clears it; Water Power can destroy it instead.

**Power-up Car**:
A Ground Obstacle in the Street Lane that grants a Power when Supa Dude jumps onto it. Red grants Fire Power, blue grants Water Power, and grey grants no Power.

**Power**:
A temporary ability (Fire or Water) collected from a matching Power-up Car. It destroys matching Blocker Obstacles on contact while active; only one Power can be held at a time.

**Fire Power**:
A Power from a red Power-up Car that destroys Wood Low Branches.

**Water Power**:
A Power from a blue Power-up Car that destroys Electric Utility Boxes.

**Final Boss**:
The single fixed encounter in the Level, placed near the end. Reaching it stops auto-running and starts a Boss Fight; the Checkpoint sits immediately before it. Shares Supa Dude's normal 3 Lives — losing them all respawns at that Checkpoint. See ADR-0004 for why this is one encounter, not several.
_Avoid_: Mini-Boss, Enemy

**Boss Fight**:
The dodge-and-riposte combat loop against the Final Boss: the boss telegraphs an attack, the player dodges with Jump/Duck, and enough consecutive successful dodges opens a Vulnerable Window in which Punch damages the boss. Ends when the boss's HP reaches 0.

**Vulnerable Window**:
A brief period after the Final Boss is successfully dodged enough times in a row, during which Punch connects and deals damage. Outside this window, Punch has no effect.

**Punch**:
Supa Dude's melee attack input, usable only during the Final Boss's Vulnerable Window. Not available/used outside the Boss Fight.

**Lives**:
Supa Dude's remaining hit points for the current Attempt. Starts at 3, capped at 3. Colliding with an Obstacle costs one Life; reaching 0 triggers a respawn at the last Checkpoint. Losing Lives never costs Score (see ADR-0005).
_Avoid_: Health, HP

**Heart**:
A collectible on the track that restores one Life, up to the cap of 3.
_Avoid_: Health pickup, life pickup

**Coin**:
A collectible scattered through the Level. Contributes to a "collected / total" completion stat shown on the results screen, and is the basis of Score — collecting one increments Score by 1 (see ADR-0005). Not required to reach the end of the Level.

**Score**:
The number of Coins collected while completing the Level, tie-broken by total completion time. Higher is better. Only recorded once the Level is completed end-to-end. Dying (a Checkpoint respawn) never costs Score — see ADR-0005 for why this changed from an earlier deaths-based definition.
_Avoid_: Distance, points

**Leaderboard**:
The global, cross-device ranking of completed Level attempts by most Coins collected (tie-broken by completion time), backed by Supabase. Only Accounts (not Guests) can submit a completed Score.

**Account**:
An email/password identity created via Supabase Auth. Optional — a player can play as a Guest indefinitely; an Account is only needed to submit a Score to the Leaderboard.
_Avoid_: User, login

**Username**:
The public display name attached to an Account, chosen at signup and shown on the Leaderboard. The Account's email is never displayed publicly.
_Avoid_: Nickname, display name, handle

**Guest**:
A player who has not created an Account. Can play unlimited Attempts; upon completing the Level, is prompted to log in/sign up to submit their Score, or skip.
