# Powers and completion

Players use Flight, Jump Orbs, and Car Powers, collect Coins, and finish the Level.

## Sub-features

- `power-flight` activates Flight by landing on a trampoline.
- `power-orb` gains an airborne impulse from a gold orb.
- `power-car` acquires an element and clears a matching Hazard.
- `level-complete` shows Score and Completion Time at 100%.

## How to get to it (user POV)

Start Normal or Hard and traverse the authored Level. Land on a Flight Trampoline or colored Traffic roof. Contact gold Jump Orbs while airborne. Shoot with F, X, or the visible Power button. Reach 100% to finish.

## Driving it with cua_repl

Preconditions: default course, real gameplay input, and sufficient progress to reach each object. Each power needs its corresponding object and target still present.

- Time Space or playfield taps from fresh screenshots to land on a blue trampoline. Capture the Flight countdown. Hold Space to rise, release to descend, and capture expiration back to ordinary gravity.
- Jump into a gold orb while airborne. Capture the second upward impulse. Repeat within the same Attempt and require no second activation of that orb.
- Land on red, blue, and yellow car roofs in separate observed encounters. Capture FIRE, WATER, or ELECTRICITY and its countdown. Press F or X near a matching Bush, Trash Can, or Fire Hydrant. Capture the removed Hazard and continued traversal. Repeat through the visible Power button on a narrow layout.
- Collect a visible Coin and require the Coins HUD to increase. Traverse both battles and reach 100%. Capture LEVEL COMPLETE, Score, and Completion Time. Click, tap, or press a key after the result delay to replay.

## Gotchas

- No canned input sequence for a default full clear is supplied. Report unfinished traversal as unverified, never synthesize Runner state.
- Missing active power or a compatible target blocks shooting proof. Disabling Hazards does not prove clearing them.
- QA practice and altered course settings must be labeled. They do not prove the default completion journey.
- Power and Flight timers freeze during Pause and battles. Compare active play time, not wall time.
