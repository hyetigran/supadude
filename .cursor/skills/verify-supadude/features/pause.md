# Pause and Main Menu

Players freeze the Attempt, resume it, or end it by returning to difficulty selection.

## Sub-features

- `pause-freeze` freezes movement and timers.
- `pause-resume` continues the same Attempt.
- `pause-menu` returns to difficulty selection.

## How to get to it (user POV)

During play, press Escape or click the pause icon. Resume through RESUME, Space, Escape, or Enter. MAIN MENU returns to the start screen.

## Driving it with cua_repl

Preconditions: active play with QA closed.

- Run `await tab.pressKey(null, "Escape")`. Require PAUSED. Capture two screenshots separated by another observation and require unchanged player, Traffic, and Progress.
- Run `await tab.pressKey(null, "Escape")`. Require PAUSED to disappear and motion to continue without resetting Attempt Count. Repeat with Space, Enter, and the visible RESUME button.
- Pause again and click MAIN MENU using a fresh screenshot. Require SUPA DUDE and both difficulty buttons. Start again and require a new Attempt at the beginning.
- Repeat pause entry through the visible pause icon. Open QA from Pause, Cancel, and require PAUSED again.

## Gotchas

- Pause is unavailable while already paused or after completion.
- Canvas buttons have no DOM roles. Do not invent text locators.
- A fixed screenshot alone cannot prove a frozen timer. Capture observations over elapsed time.
