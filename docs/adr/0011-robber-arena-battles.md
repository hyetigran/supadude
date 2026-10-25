# Robber arena battles at 50% and 90%

Status: Accepted — 2026-10-17

## Decision

Replace ADR-0010's optional roadside robbers with two mandatory arena fights at 50% and 90% of the authored Level. This user-requested change also revises ADR-0004's single-boss decision and ADR-0006's jump-only movement during these fights.

Runner owns battle entry, fixed-step combat, loss/retry, and resumption. A dedicated RobberBattle model owns bounded horizontal movement, airborne stomps, auto-aimed powered shooting, enemies, and health. Normal course physics and power timers are suspended while the arena is active, and the renderer hides course objects. After victory, the course resumes its saved position and jump state. There are no checkpoints.

A/D or Left/Right move along the existing sidewalk; Space/tap jumps. The earlier two-axis arena box is removed at the user’s request. Each jump requires a fresh press, has at most one damaging stomp, and is followed by 350 ms of landing recovery. Successful stomps knock the robber away. Each robber takes two stomps or powered shots. Robbers pursue, visibly wind up for 450 ms, punch within reach, and recover for 900 ms. Supa Dude has three health per battle, one second of damage immunity after a hit, and fresh health at each encounter. Course collisions remain fatal outside battle. A lost fight retries the full Level.

QA can launch the 50% or 90% battle directly using the current settings, automatically enabling encounters. Practice retries return to the selected fight, skip earlier encounters, and resume the course airborne after victory. QA defaults to two robbers at 50% and three at 90%, supports independent counts of 1–50 for each fight, and can disable encounters. Frequency changes scale encounter positions along with the Level so the percentages remain fixed. Tests cover combat with and without powers, health regeneration, collision isolation, pause, progression, and retry; authored course jump tests run with arena encounters disabled to isolate platforming.

## Boss difficulty

QA offers Medium (default) and Easy independently of the course's Normal/Hard speed setting. Medium retains the sidewalk combat restrictions above. Easy restores held-jump repetition and consecutive bounce attacks: no landing recovery, no single-stomp restriction, and no stomp knockback. This changes only jumping/stomping rules; horizontal-only movement, enemy punches, health, and shooting are shared. Both regular encounters and practice fights receive the selected difficulty.

Defaults are two robbers at 50% and three at 90%. QA provides separate 1–50 count controls for each fight; neither changes the other. Practice shortcuts use the corresponding count, and Reset Defaults restores two and three.
