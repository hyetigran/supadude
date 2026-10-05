# Supa Dude

A 2D browser-based, single-plane auto-runner. Supa Dude moves forward at a constant speed through one finite, hand-authored Level. The player jumps and can Shoot while a Car Power is active, and must learn the course's timing, clear suburban obstacles, collect optional Coins, and reach 100%.

The mechanical reference is classic Geometry Dash cube-mode: fixed side camera, precision jumping, powered shooting, fatal contact, fast full-Level retries, and visible completion progress. Supa Dude keeps its own character, neighborhood-inspired presentation, colors, sounds, and authored course; it does not copy Geometry Dash branding or assets.

## Language

**Supa Dude**:
The player-controlled square superhero icon. Supa Dude auto-runs continuously and rotates in quarter-turns while airborne. A cape and chest emblem preserve the original character identity.

**Level**:
The one finite, hand-authored course from 0% to 100%. Its course definitions are fixed; Traffic moves deterministically toward Supa Dude as it approaches. There is no runtime random generation.
_Avoid_: Run, stage, endless mode

**Attempt**:
One continuous traversal beginning at 0%. Touching an uncleared Hazard or the side/underside of Traffic ends the Attempt. After a short death beat, the next Attempt restarts automatically from 0%.

**Attempt Count**:
The number of Attempts made in the current play session. It begins at 1 and increments on every automatic restart.

**Jump**:
The primary gameplay action. Jump applies a fixed upward impulse while Supa Dude is grounded. Holding Jump automatically jumps again on the first simulation tick after landing; an ordinary Jump never creates a midair double-jump. While flying, hold to rise and release to descend.

**Ground**:
The continuous baseline beneath the Level. Supa Dude may run and jump from it.

**Traffic**:
Approaching cars and vans replacing the old Solid Blocks. Cars sit 24 world pixels below the sidewalk on the road. Their roofs remain reachable from the sidewalk; roof landing and side/underside collisions use the same lowered position as the artwork. The same deterministic world position is used for drawing and collision. Traffic freezes on Pause or Crash and resets on retry.

**Hazard**:
Fatal suburban obstacles: Bushes, Trash Cans, low Tree branches, and Basketball Hoops. Low overhead obstacles are marked “STAY LOW”; the current one-button version passes beneath them by staying grounded.

**Flight Trampoline**:
A blue mat that grants four seconds of Flight when Supa Dude lands on it from above. Running through it does not activate it. Each mat can activate once per Attempt.

**Flight**:
Temporary airborne control: hold Jump to climb, release to descend. A visible countdown measures active play time. Flight is bounded within the viewport, does not grant invulnerability, and expires back into ordinary gravity.

**Jump Orb**:
A gold orb that automatically applies a second upward impulse on airborne contact. It triggers once per Attempt, requires no second button press, and does not activate while flying. This is a localized double jump, not an unrestricted midair action.

**Car Power**:
Landing on a red Traffic roof grants Fire; a blue roof grants Water. Each powered car activates once per Attempt. The latest landing replaces the active element and grants six seconds of active play time. Press F, X, or the on-screen Shoot button to fire once. Fire burns nearby Bushes; Water clears nearby Trash Cans. Holding the button does not repeat. Attacks reach 180 world pixels ahead and fire at most once every 400 ms. Cleared Hazards stay gone for the Attempt. Other obstacles remain fatal. Powers and cleared obstacles reset on retry; Flight can coexist with a Car Power.

**Crash**:
Fatal contact with a Hazard or a non-top face of Traffic. A Crash briefly freezes the Level, then begins a new Attempt from 0%.
_Avoid_: Lose a Life, Checkpoint respawn

**Coin**:
An optional collectible placed on a jump path. Coins reset on Crash and count only within the current Attempt.

**Progress**:
Supa Dude's distance divided by Level length, displayed as an integer percentage and a bottom-screen progress bar. Reaching 100% completes the Level.

**Completion Time**:
Active play time for the successful Attempt. Pause time and earlier failed Attempts are excluded.

**Score**:
Coins collected in the completed Attempt. Higher is better; Completion Time can break ties. Attempt Count is shown as mastery feedback but is not currently part of Score.

**Leaderboard**:
The planned global ranking of completed Attempts by Score and Completion Time, backed by Supabase. Only Accounts can submit; Guests can always play.

**Account**:
An optional email/password identity backed by Supabase Auth. It is only required for future Leaderboard submission.
_Avoid_: User, login

**Username**:
The public name attached to an Account. Email is never displayed publicly.

**Guest**:
A player without an Account. Guests can play unlimited Attempts.

**Difficulty**:
Normal uses the original forward speed. Optional Hard mode increases forward speed by 23%, keeping jump physics and the four-second Flight timer unchanged. Choose at the start; automatic retries preserve the chosen mode.
