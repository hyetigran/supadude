# Robber Battles and practice

Players fight at 50% and 90%, or practice either fight through QA.

## Sub-features

- `battle-entry` enters each fight from the course.
- `battle-practice` starts each practice fight with its independent count.
- `battle-combat` moves, jumps, stomps, takes damage, and wins or retries.
- `battle-touch` uses the floating joystick on tablet-sized layouts.

## How to get to it (user POV)

Reach 50% or 90% normally. Alternatively open QA and choose Go to 50% fight or Go to 90% fight. Choose Boss difficulty in QA before launching practice.

## Driving it with cua_repl

Preconditions: QA open. For shooting, acquire an active Car Power through normal play first.

- Choose Go to 50% fight by current AX index. Capture two robbers and three player health. Reload and repeat Go to 90% fight, requiring three robbers.
- Set each count independently through its labeled slider and launch the corresponding practice entry. Count rendered robbers and compare with the chosen setting.
- Run `await tab.pressKey(null, "a", {durationMs:250})`, then D, Left, and Right in separate observations. Require horizontal movement on the sidewalk.
- Press Space, release, and press again after landing recovery. Capture stomp damage and bounce. In Medium, held Jump must not repeat. Select Easy through QA and prove held Jump repeats there.
- Allow damage and observe health loss, protection after a hit, and practice retry at the selected fight. Defeat all robbers using real movement and jumps. Require course motion to resume at the milestone.
- In a viewport at most 1366 CSS pixels wide, inspect the resting joystick. Drag from the left playfield with `tab.drag([x1,y1], [x2,y2])` using fresh screenshot coordinates. Require horizontal movement and a resting joystick after release. Tap the right playfield to Jump.

## Gotchas

- Practice skips earlier course traversal. It cannot prove natural battle entry or powered shooting.
- Fresh practice has no Car Power. Report that missing precondition if the selected journey requires shooting.
- Medium needs fresh jump presses and landing recovery. Holding Jump is not a substitute.
- Returning from victory must restore course motion. A victory frame alone is incomplete evidence.
