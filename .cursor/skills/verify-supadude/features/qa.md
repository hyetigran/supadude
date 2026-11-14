# QA settings

Players can pause the game, adjust gameplay, and restart with the selected settings.

## Sub-features

- `qa-apply` applies independent counts and gameplay settings.
- `qa-cancel` discards draft changes and restores the previous screen.
- `qa-reset` resets the form before applying.
- `qa-session` retains applied settings until page reload.

## How to get to it (user POV)

Click QA from the main menu, active play, or Pause. Each entry must be checked separately for full coverage.

## Driving it with cua_repl

Preconditions: a fresh tab with the visible SUPA DUDE menu and default settings.

- Open QA by clicking its visible canvas button. Run `await tab.getAXState()`. Require QA gameplay settings, counts 2 and 3, and Medium (default).
- Set the current Robbers at 50% slider with `await tab.setValue(index, "4")`. Capture AX and require 4 while Robbers at 90% remains 3.
- Click Apply & restart using its current AX index. Capture the running game. Reopen QA and require counts 4 and 3. This second view proves the settings were applied.
- Change the first count to 5. Click Cancel. Reopen QA and require 4 and 3, proving the draft was discarded.
- Click Reset defaults. Require counts 2 and 3, all gameplay multipliers 1, and Medium (default). Click Cancel, reopen QA, and require 4 and 3. Reset alone must not apply defaults.
- Click Reset defaults again, then Apply & restart. Reopen QA and require counts 2 and 3. Apply a count of 4 again, reload with `await tab.reload()`, and reopen QA. Require 2 and 3 after reload.
- Repeat opening and cancellation from active play and Pause. Cancel must return to the same prior screen. Save screenshots and AX at each assertion.

## Gotchas

- Reset defaults rebuilds the dialog and invalidates old AX indices.
- Settings remain in memory only. Reload deliberately clears them.
- Opening QA pauses gameplay. Applying starts a new Attempt.
- Extreme settings can make the Level impossible. Do not treat an altered course as proof of the default course.
