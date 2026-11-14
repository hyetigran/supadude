# Start, Jump, and retry

Players select Normal or Hard, Jump through the authored Level, and retry automatically after a Crash.

## Sub-features

- `play-normal` starts Normal.
- `play-hard` starts Hard with faster forward motion.
- `play-jump` jumps and repeats held Jump on landing.
- `play-retry` restarts at 0% with an increased Attempt Count.

## How to get to it (user POV)

Choose NORMAL or HARD on the main menu. Space, Enter, or Up starts Normal. H starts Hard. During play, Space, Up, or tapping the unobstructed playfield triggers Jump.

## Driving it with cua_repl

Preconditions: fresh default menu for each difficulty.

- Run `await tab.pressKey(null, "space")`. Capture the disappearing menu and NORMAL HUD with increasing Progress.
- Reload and run `await tab.pressKey(null, "h")`. Capture HARD in the HUD. Check each visible button and alternate start key in separate fresh attempts.
- Press Space during play and capture airborne movement. Hold with `await tab.pressKey(null, "space", {durationMs:800})` and capture repeated jumps on landing. Repeat with Up and visible playfield taps.
- Reload, start Normal, and give no Jump input. Observe a Crash and automatic retry. Capture successive HUD screenshots showing Attempt Count increasing and Progress returning near 0%.

## Gotchas

- The start gesture does not establish a gameplay Jump. Send a separate input.
- QA settings change the course. Reload before default-course evidence.
- Canvas screenshots are required because HUD text is absent from AX.
