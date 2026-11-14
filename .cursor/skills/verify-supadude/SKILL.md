---
name: verify-supadude
description: Verify SupaDude's Phaser browser game through real keyboard, canvas, and QA form interactions. Use after gameplay or UI changes to launch an isolated instance, drive mapped features, and preserve evidence.
---

# Verify SupaDude

Read [the feature map](features/README.md) before choosing a journey. Use `cua_repl` for browser input. Vitest covers mechanics but does not prove the rendered game.

## Launch

Run commands from the repository root. Install dependencies with `npm install` only when absent. Run `npm run build`. A failed build blocks verification.

Start `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort` in an owned terminal session. Record the session identifier and actual listener PID. If the sandbox denies the listener, request execution outside that sandbox. If the port is occupied, choose another unused port and update every URL. Never reuse or stop its existing owner.

Create a fresh browser tab with `await cua.createBrowserTab("iab", "http://127.0.0.1:4173", {visible:false})`. Read the returned browser documentation. The recipe below calls the returned tab `tab`.

Require the Vite ready log, a rendered SUPA DUDE menu, Normal and Hard buttons, and the QA button. A responding HTTP server alone is insufficient. The game has no persistent data directory, auth, migrations, or seed service. A new page initializes the authored Level and default settings. Separate ports and tabs isolate gameplay. Do not double-drive a tab or browser session another agent owns. Shared source edits and Vite HMR still affect all instances using this checkout.

Teardown is described under Cleanup. Perform it after failures too.

## Doctor

Run this read-only shell check, then inspect the browser screenshot.

```sh
lsof -nP -iTCP:4173 -sTCP:LISTEN
curl --fail --show-error http://127.0.0.1:4173/
git rev-parse HEAD
git status --short
```

Match the listener PID to the owned launch session. Check `ps -p PID -o pid=,ppid=,command=` and `lsof -a -p PID -d cwd` using that actual PID. Require this checkout, the Supa Dude page title, and the usable menu. If sandbox networking blocks curl, record the failure and use the owned browser tab to confirm the same URL renders the game. Record revision and dirty state because HEAD alone does not identify an uncommitted build. If anything looks wrong, repeat Doctor before input.

## Drive

Use `await tab.getScreenshot()` to locate canvas controls. They are not DOM buttons. Never invent ARIA selectors for them. Prefer Space, H, and Escape where the map lists keyboard entries. Use `await tab.pressKey(null, "space")` or `await tab.pressKey(null, "Escape")` after dismissing forms and returning focus to the game.

For QA, click the visible QA control using coordinates from a fresh screenshot, then run `await tab.getAXState()`. Use current AX indices with `tab.click(index)` and `tab.setValue(index, "4")`. Refresh AX after each action batch. Indices change when the form is rebuilt. Native form controls also support documented Playwright locators such as `tab.playwright.getByRole("button", {name:"Apply & restart", exact:true})` and `tab.playwright.getByLabel("Robbers at 50%", {exact:true})`.

Canvas layout uses an 800 by 450 logical playfield fitted to the viewport. Coordinates in screenshots are CSS pixels, not logical game coordinates. Inspect each fresh layout. Never call Runner setters, dispatch synthetic events, or invoke scene methods to establish a passing result.

## Evidence

Create `artifacts/verification/<run-id>/` before driving. Choose a timestamp run ID. Preserve a transcript with feature IDs, entry points, input commands, observed values, pass or fail, revision, dirty state, and launch session. Save screenshots before and after meaningful actions and full AX text for forms. Use the REPL filesystem module to save returned screenshot bytes and AX text when supported. Screenshots must show the actual UI, not recreated artwork.

Prove actions and resulting state. Reopen QA to check applied settings and Cancel behavior. Reload to prove the session reset boundary. For gameplay, capture the HUD and visible movement, health, power countdowns, crashes, or results that establish the claimed transition. No database or leaderboard writes exist in this checkout. Do not claim those planned features passed. No dry-run mode or mock backend is used. If future changes add external effects, inspect those effects separately and mock only an existing production boundary.

Report missing preconditions as failed or blocked journeys. Do not disable mechanics to claim the default course passes. Full feature coverage requires all mapped entries; the generator's initial proof can cover one entry and must name the rest as unverified.

## Cleanup

Close only the browser tab created by this run with `await tab.close()`. Send Ctrl-C to the owned terminal session. If the terminal has no interactive stdin, terminate only the recorded listener PID after reconfirming its command and working directory. Check that it exited and that the chosen port has no listener. Never kill by process name.

Remove only scratch state created by this run. Do not remove `artifacts/verification/<run-id>/`. Confirm its transcript, AX files, and nonempty screenshot files still exist after teardown.

## Helpers

No helper executable or new dependency is required. The commands above use the repository's npm scripts and the browser tool's documented API. Run `npm test` for supplemental mechanics checks. Use `/maintain-verification-skill` when routes, controls, or gameplay change.
