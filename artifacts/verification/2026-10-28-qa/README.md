# Verification record

Date: 2026-10-28. Target: real local SupaDude in Codex's in-app browser. No stand-in or mocked backend.

Revision: c2daf5316d10f17ab7b00ae58ea25a6de6c0d953. Initial checkout was clean. Only the generated skill and proof files were added during the run.

Build: `npm run build` passed. Vite warned about bundle size. No application source changed.

Launch: `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`. Initial sandbox attempt failed with EPERM and exited. Retried with approved execution outside the sandbox. Session 69526 owned listener PID 54050. Vite 8.2.0 reported ready. Browser rendered the Supa Dude menu. `lsof` confirmed the port and checkout. The sandboxed curl check could not retrieve the page, so browser rendering supplied the HTTP and usability evidence. No auth or seed setup was needed.

## Executed actions

1. Clicked visible QA at screenshot coordinates 1140,54. Observed defaults 2 and 3 with Medium difficulty. Saved 01-defaults.txt and 01-defaults.png.
2. Ran `tab.setValue(19, '4')` on the observed first-count slider. Saved 02-edit.txt. The second count stayed 3.
3. Clicked current Apply & restart index 59. Observed live gameplay and saved 03-running.png.
4. Reopened QA through its visible button. Observed counts 4 and 3. Saved 04-applied.txt and 04-applied.png. qa-apply passed for the main-menu entry.
5. Changed the first count to 5 and clicked Cancel. Reopened QA. Observed 4 and 3 in 05-cancelled.txt. qa-cancel passed from active play.
6. Clicked Reset defaults. Observed 2 and 3 in 06-reset-draft.txt. Clicked Cancel. After the viewport resized, inspected a fresh screenshot and clicked QA at 724,297. Observed 4 and 3 in 07-reset-cancelled.txt. Reset altered only the draft.
7. Called `tab.reload()`. Observed the start menu. Reopened QA and observed 2 and 3 in 08-reloaded.txt and 08-reloaded.png. qa-session passed.

The AX snapshots were checked against literal expected values for both independent sliders. All nonempty screenshots survived cleanup. Frontmatter, required sections, all Markdown links, and the four-heading contract for five feature files passed structural checks.

## Coverage limits

The initial proof covers QA apply, cancel, draft reset, and page reset. Reset followed by Apply, QA entry from Pause, altered physics effects, battles, powers, and full course completion remain unverified. The feature map retains those journeys without weakening their expected results. No new helper executable was introduced.

## Cleanup

Closed the owned browser tab. Sandbox denied process termination, so used approved execution outside the sandbox to confirm PID 54050's exact Vite command and send TERM. Confirmed port 4173 had no listener afterward. Proof files remain in this directory.
