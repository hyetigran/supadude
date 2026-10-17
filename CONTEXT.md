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
Fatal suburban obstacles: Bushes, Trash Cans, Fire Hydrants, Fallen Trees, Construction Pits, low Tree branches, and Basketball Hoops. Hydrants and fallen trunks are jumped over; construction pits are ground-level hazards that must be cleared in a jump. Low overhead obstacles are marked “STAY LOW”; the current one-button version passes beneath them by staying grounded.

**Flight Trampoline**:
A blue mat that grants four seconds of Flight when Supa Dude lands on it from above. Running through it does not activate it. Each mat can activate once per Attempt.

**Flight**:
Temporary airborne control: hold Jump to climb, release to descend. A visible countdown measures active play time. Flight is bounded within the viewport, does not grant invulnerability, and expires back into ordinary gravity.

**Jump Orb**:
A gold orb that automatically applies a second upward impulse on airborne contact. It triggers once per Attempt, requires no second button press, and does not activate while flying. This is a localized double jump, not an unrestricted midair action.

**Car Power**:
Landing on a red Traffic roof grants Fire; a blue roof grants Water; a yellow roof grants Electricity. Each powered car activates once per Attempt. The latest landing replaces the active element and grants six seconds of active play time. Press F, X, or the on-screen Shoot button to fire once. Fire burns nearby Bushes; Water clears nearby Trash Cans; Electricity destroys nearby Fire Hydrants. Holding the button does not repeat. One shot can queue during cooldown, and taps up to 150 ms before power acquisition are buffered. All three powers auto-aim at the nearest compatible target within 180 world pixels in any direction, measured from the player center. Attacks and fire at most once every 400 ms. Cleared Hazards stay gone for the Attempt. Other obstacles remain fatal. Powers and cleared obstacles reset on retry; Flight can coexist with a Car Power.

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

**QA Settings**:
The QA button opens a paused settings panel from the main menu, active play, or Pause. Adjust speed (0.25–2× the chosen difficulty), jump height (0.5–2×), gravity (0.5–2×), and obstacle frequency (0.5–2×, implemented by scaling all authored course positions). Toggle each Hazard type, Traffic, Flight Trampolines, and Jump Orbs. Apply restarts the Level; Cancel restores the previous screen; Reset Defaults edits the form before applying. Settings persist across retries and menu returns until page reload. Extreme combinations need not be completable. The default authored course remains unchanged by QA settings.

**Pause**:
Freezes simulation and offers Resume or Main Menu. Main Menu ends the current Attempt and returns to the difficulty selection screen.

**Robber Battle**:
Two arena fights trigger at 50% and 90% of the Level. Auto-scroll, Traffic, Hazards, Coins, Flight, and Car Power expiration freeze during combat; course objects are hidden. A/D or Left/Right move along the sidewalk; Space or tap jumps. There is no up/down movement and no separate arena floor. Descending onto a robber deals one damage, knocks the robber back, and bounces Supa Dude. Each jump can stomp once. Jump requires a fresh press, and landing has 350 ms of recovery before another jump; holding Jump never repeats during combat. F/X or Shoot uses an active Car Power to auto-aim at the nearest robber within 260 pixels, with the usual 400 ms cooldown and one queued shot. Each robber has two health and chases Supa Dude, warns for 450 ms, punches, then recovers. There are two robbers per fight by default; QA can set 1–50 or disable battles.

Supa Dude begins each fight with three health: two extra hits before the third hit ends the Attempt. A hit grants one second of protection against overlapping punches. Battle health does not grant protection on the course and refills for the next fight. Defeating all robbers shows a brief victory beat, then resumes the exact saved course position and jump state. Losing restarts the whole Attempt and restores both fights. Pause freezes combat too.

**Boss Practice**:
QA's “Go to 50% fight” and “Go to 90% fight” buttons apply the current form settings, enable battles, and start the chosen fight immediately. Retry returns to that fight with full health. Earlier fights are marked skipped; winning resumes the course at the chosen milestone, initially airborne to clear geometry at the skipped approach. Normal play retains its saved position and jump state when entering and leaving combat.

## Mobile display and controls

Mobile and tablet layouts provide a floating horizontal joystick in the left half of the playfield during Robber Battles only and a Power button in the bottom-right. Tap or hold the unobstructed playfield to Jump or control Flight. Touching the left playfield during a battle anchors the joystick at that finger position; drag horizontally to move and release to return it to its visible bottom-left resting position. The resting joystick is visible throughout active battles to make the control discoverable. The initial touch is neutral. The right playfield remains available for Jump. The movement touch zone disappears entirely on the auto-running course. Touch controls appear at viewport widths up to 1366 CSS pixels, including desktop browser tablet previews with a mouse. Wider desktop layouts use keyboard controls. To test locally, use a tablet-sized viewport, open QA and choose “Go to 50% fight”, then press and drag the left playfield to reposition and use the floating joystick. Power enables only while a Car Power is active and fires once per press. Controls do not trigger Jump and support simultaneous movement, screen taps, and shooting. Cancelled touches and focus loss release input. The complete 800×450 logical playfield fits the available screen without cropping or changing physics. Canvas rendering uses device pixel density up to 2×; overlay controls use CSS pixels and follow the fitted canvas on resize, with safe-area padding and dynamic viewport height for mobile browser chrome.
