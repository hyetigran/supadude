# Supa Dude — Product Requirements Document

## 1. Overview

Supa Dude is a 2D browser-based side-scrolling auto-runner. The player controls Supa Dude, a stick-figure superhero, as he auto-runs through a single, finite, hand-authored neighborhood level — roughly the length of a long Geometry Dash level (~2-4 minutes of gameplay). The player dodges obstacles, collects power-ups, and defeats a Final Boss to reach the end.

This is a personal/portfolio project. No monetization.

Terminology in this document follows `CONTEXT.md`, which is the source of truth for definitions — consult it if a term here seems ambiguous. Key architectural decisions are recorded in `docs/adr/`.

## 2. Core Gameplay

### 2.1 Auto-run & lanes

- Supa Dude runs automatically at all times outside of Boss Fights — the player never controls forward movement.
- Two parallel lanes: **Road Lane** and **Lawn Lane**. The player switches lanes with a dedicated input (Left/Right on desktop, swipe Left/Right on mobile).
- Independently of lane choice, the player can **Jump** (Up/Space, swipe up) and **Duck** (Down, swipe down) to clear obstacles within the current lane.
- Both lanes carry a comparable density of obstacles — switching lanes is a tactical choice about which hazard pattern to face, not a safe detour. Power-up Cars only appear in the Road Lane. The Lawn Lane's obstacle vocabulary is narrower: only trash can (jump), tree (duck), and Light Pole (switch lanes, or Water Power) ever appear there — see §2.2.

### 2.2 Obstacles

Two shapes appear in either lane, plus one that spans both:

- **Ground Obstacle** — jump over it.
- **Overhead Obstacle** — duck under it.
- **Light Pole** — spans both the Ground and Overhead clearance zones, so neither Jump nor Duck clears it; only switching lanes avoids it, unless destroyed with Water Power (always Electric material).

MVP obstacle roster (8-9 total):
- Ground: trash can, fire hydrant, mailbox, garden gnome, parked bike
- Overhead: low tree branch, clothesline, sprinkler spray, awning

A subset of Ground/Overhead Obstacles are **Blocker Obstacles** — made of Wood (e.g. the tree) or Electric material. These are dodgeable exactly like any other Ground/Overhead obstacle, but can alternatively be destroyed by the matching Power as a bonus/shortcut. The Lawn Lane only ever features plain (non-Blocker) trash can/tree content plus Light Poles — Blocker Obstacles are Road-Lane-only.

### 2.3 Lives & failure

- Supa Dude has **3 Lives**, capped at 3. Colliding with an obstacle costs 1 Life.
- **Hearts** are collectibles that restore 1 Life, up to the cap.
- Reaching 0 Lives respawns the player at the most recent **Checkpoint** with Lives reset to 3. The Checkpoint is placed immediately before the Final Boss.
- This is a shared life pool — Boss Fights use the same 3 Lives as the rest of the level.

### 2.4 Power-up Cars

- Cars appear in the Road Lane in three colors. Jumping on top of one auto-collects its power:
  - **Red → Fire Power** — destroys Wood Blocker Obstacles.
  - **Blue → Water Power** — destroys Electric Blocker Obstacles and Light Poles.
  - **Grey → no power** — behaves as a plain Ground Obstacle.
- A collected Power is held for a fixed duration (e.g. ~5s, to be tuned) and triggered with a dedicated activation input (F on desktop, an on-screen button on mobile).
- Only one Power can be held at a time; collecting a new one replaces the old.

### 2.5 Coins

- Collectibles scattered through the level. Tracked as a "collected / total" completion stat shown on the results screen. Not required to reach the end of the level.
- Each Coin collected is the basis of **Score** — see §2.7. See ADR-0005 for why this changed from an earlier deaths-based Score.

### 2.6 Final Boss

- A single fixed encounter placed near the end of the level, immediately before the finish line. Reaching it **stops auto-run** and starts a **Boss Fight**. See ADR-0004 for why this is one encounter rather than several distributed through the level.
- **Combat loop (dodge-and-riposte):** the boss telegraphs an attack → player dodges with Jump/Duck → enough consecutive successful dodges opens a **Vulnerable Window** → player uses **Punch** (a new input, active only during this window) to deal damage → repeat until the boss's HP (~3-5 hits) reaches 0.
- Getting hit by a boss attack costs a Life exactly like a normal obstacle collision. 0 Lives mid-fight respawns at the Checkpoint immediately before the boss.
- The boss's identity, visual theme, and attack pattern are **not yet finalized** — flagged as follow-up creative/level-design work (see §7).

### 2.7 Scoring & completion

- **Score** = number of Coins collected over the course of completing the level, tie-broken by total completion time. Higher is better. Losing Lives/dying never costs Score.
- Score is only recorded once the level is completed end-to-end — there's no partial-progress score.

## 3. Meta systems

### 3.1 Accounts & identity

- Authentication is **email/password via Supabase Auth**, and is **optional**:
  - A **Guest** can play unlimited attempts with no account.
  - Upon completing the level, a Guest is prompted to log in/sign up to submit their Score to the Leaderboard, or skip.
- Signup collects email, password, and a **Username** — the Username (never the email) is what's shown publicly on the Leaderboard.

### 3.2 Leaderboard

- Global, cross-device ranking of completed attempts, sorted by most Coins collected, tie-broken by completion time.
- Backed by Supabase (Postgres + auto-generated API + row-level security for basic score validation). See ADR-0002.
- Only Accounts (not Guests) can appear on it.

## 4. Controls

| Action | Desktop | Mobile |
|---|---|---|
| Jump | Up / Space | Swipe up |
| Duck | Down | Swipe down |
| Switch lane | Left / Right | Swipe left / right |
| Activate Power | F | On-screen button |
| Punch (Boss Fight only) | E | On-screen button |

## 5. Art & audio

- **Character:** Supa Dude is a classic stick figure (circle head, line limbs) with a small cape and chest emblem/mask, nodding at the "Supa" name.
- **Environment:** single seamless looping neighborhood background (houses, sidewalk, trees) — no zone transitions.
- **Asset pipeline:** hand-drawn/vector sprite sheets (Aseprite, Figma, or Illustrator), exported as PNG sprite sheets + JSON atlas. Needed poses: run, jump, duck, lane-switch, hit, punch, idle/game-over, plus the Final Boss (poses TBD once designed).
- **Audio:** basic SFX (jump, duck, coin pickup, heart pickup, hit, punch, boss defeat, game over) plus one looping background music track. Royalty-free/CC or custom.

## 6. Technical

- **Engine:** Phaser 3. See ADR-0001 for rationale and rejected alternatives (Kaplay, PixiJS, Godot).
- **Language/build:** TypeScript + Vite.
- **Backend:** Supabase (Postgres, Auth, auto-generated REST API). See ADR-0002 and ADR-0003.
- **Deployment:** static site on Vercel or Netlify, auto-deploy on push.
- **Level structure:** one finite, hand-authored level — not procedurally generated. See ADR-0003 for why this superseded the original endless-runner scope.

## 7. Open follow-up work (not blocking PRD sign-off)

- The Final Boss's identity, visual theme, and specific attack pattern.
- Exact level length/pacing and precise obstacle/power-up/coin placement (level design pass).
- Tuning values: Power duration, boss HP, dodge-streak length required to open a Vulnerable Window, obstacle spawn density/pacing curve.
- Password-reset flow and any account-management UI beyond signup/login.

## 8. Reference documents

- `CONTEXT.md` — glossary of all terms used in this document.
- `docs/adr/0001-phaser-3-as-game-engine.md`
- `docs/adr/0002-supabase-for-leaderboard-backend.md`
- `docs/adr/0003-finite-authored-level-not-endless-runner.md`
- `docs/adr/0004-single-final-boss-not-three-mini-bosses.md`
- `docs/adr/0005-score-is-coins-not-deaths.md`
