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

**Road Lane** / **Lawn Lane**:
The two parallel paths Supa Dude can switch between. Each has a fixed suburban obstacle vocabulary: the Road Lane is vehicles only (Motorcycles and Power-up Cars — all cleared by jumping); the Lawn Lane is trash can (jump), tree / low branch (duck), and Light Pole (switch Lanes, or Water Power). Wood/Electric Blocker Obstacles live on the Lawn (tree and Light Pole), not the Road.

**Ground Obstacle**:
An obstacle positioned at ground level that Supa Dude must jump over to avoid. On the Road Lane these are vehicles (Motorcycle, Power-up Car); on the Lawn Lane, the trash can.
_Avoid_: Low obstacle, jump obstacle

**Overhead Obstacle**:
An obstacle positioned above ground level that Supa Dude must duck under to avoid. Lawn Lane only (tree / low branch) — the Road Lane has no Overhead Obstacles.
_Avoid_: High obstacle, duck obstacle

**Motorcycle**:
A plain Ground Obstacle in the Road Lane. Jump to clear; grants no Power. Visually distinct from Power-up Cars so the Road reads as mixed traffic, not only cars.
_Avoid_: Bike, scooter

**Blocker Obstacle**:
A Lawn Obstacle made of Wood (the tree) or Electric material (the Light Pole) that can still be dodged normally (duck / switch Lanes), but can alternatively be destroyed by the matching Power as a bonus/shortcut. Distinct from a Light Pole's dodge rule: a Wood tree is still cleared by Duck when not destroyed.

**Light Pole**:
A Lawn-Lane obstacle spanning the full Ground-to-Overhead height — Jump and Duck don't clear it, so the only way past is switching Lanes, unless destroyed with Water Power (its material is always Electric) as a shortcut that lets Supa Dude stay in-Lane. Never appears on the Road.
_Avoid_: Forced pair, pole obstacle

**Power-up Car**:
A car in the Road Lane that Supa Dude can jump on top of to collect a Power. Comes in three colors: red (grants Fire Power), blue (grants Water Power), grey (no power — behaves as a plain Ground Obstacle, same as a Motorcycle).

**Power**:
A temporary ability (Fire or Water) held after collecting a matching Power-up Car, active for a fixed duration and triggered with a dedicated activation input. Destroys matching Lawn Blocker Obstacles on contact while active. Only one Power can be held at a time — collecting a new one replaces the old.

**Fire Power**:
A Power (from a red Power-up Car) that destroys Wood Blocker Obstacles (trees on the Lawn).

**Water Power**:
A Power (from a blue Power-up Car) that destroys Light Poles (always Electric).

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
