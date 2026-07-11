import { describe, expect, it } from "vitest";
import { BossFight } from "./BossFight";

const SEQUENCE = ["ground", "overhead", "ground", "overhead"] as const;

describe("BossFight", () => {
  it("starts in the telegraph phase with the first attack in the sequence", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    expect(fight.getPhase()).toEqual({ type: "telegraph", attack: "ground" });
  });

  it("starts with the given HP", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    expect(fight.getHp()).toBe(4);
  });

  it("a correctly-dodged attack (jumping a ground attack) advances the streak and moves to the next telegraphed attack", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    const hit = fight.resolveAttack("jumping");
    expect(hit).toBe(false);
    expect(fight.getPhase()).toEqual({ type: "telegraph", attack: "overhead" });
  });

  it("an undodged attack (grounded for a ground attack) hits, resets the streak, and moves to the next telegraphed attack", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    const hit = fight.resolveAttack("grounded");
    expect(hit).toBe(true);
    expect(fight.getPhase()).toEqual({ type: "telegraph", attack: "overhead" });
  });

  it("the wrong dodge pose (ducking a ground attack) still counts as a hit", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    expect(fight.resolveAttack("ducking")).toBe(true);
  });

  it("opens the Vulnerable Window once the dodge streak reaches the required length", () => {
    const fight = new BossFight(2, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // ground -> dodged, streak 1
    expect(fight.getPhase().type).toBe("telegraph");
    fight.resolveAttack("ducking"); // overhead -> dodged, streak 2 == required
    expect(fight.getPhase()).toEqual({ type: "vulnerable" });
  });

  it("a hit partway through a streak resets it back to zero", () => {
    const fight = new BossFight(2, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // dodged, streak 1
    fight.resolveAttack("grounded"); // overhead attack, not ducking -> hit, streak resets
    fight.resolveAttack("jumping"); // ground attack again -> dodged, streak back to 1 (not 2)
    expect(fight.getPhase().type).toBe("telegraph"); // not vulnerable yet
  });

  it("resolveAttack outside the telegraph phase is a no-op that never hits", () => {
    const fight = new BossFight(1, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // streak 1 == required -> vulnerable
    expect(fight.getPhase().type).toBe("vulnerable");
    expect(fight.resolveAttack("grounded")).toBe(false);
    expect(fight.getPhase().type).toBe("vulnerable");
  });

  it("punch does nothing outside the Vulnerable Window", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    expect(fight.punch()).toBe(false);
    expect(fight.getHp()).toBe(4);
  });

  it("punch deals 1 damage during the Vulnerable Window and returns to telegraph", () => {
    const fight = new BossFight(1, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // -> vulnerable
    const connected = fight.punch();
    expect(connected).toBe(true);
    expect(fight.getHp()).toBe(3);
    expect(fight.getPhase().type).toBe("telegraph");
  });

  it("punch resets the dodge streak so a fresh streak is needed for the next Vulnerable Window", () => {
    const fight = new BossFight(2, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // ground -> dodged, streak 1
    fight.resolveAttack("ducking"); // overhead -> dodged, streak 2 == required -> vulnerable
    fight.punch(); // HP 3, back to telegraph, streak should be reset
    expect(fight.getPhase().type).toBe("telegraph");
    // a single dodge should NOT immediately reopen the Vulnerable Window if the streak truly reset
    const phaseAttack = (fight.getPhase() as { type: "telegraph"; attack: "ground" | "overhead" }).attack;
    fight.resolveAttack(phaseAttack === "ground" ? "jumping" : "ducking");
    expect(fight.getPhase().type).toBe("telegraph"); // still building the streak, not vulnerable again yet
  });

  it("reaching 0 HP via punch marks the fight defeated", () => {
    const fight = new BossFight(1, 1, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // -> vulnerable
    fight.punch(); // HP 1 -> 0
    expect(fight.getHp()).toBe(0);
    expect(fight.isDefeated()).toBe(true);
    expect(fight.getPhase()).toEqual({ type: "defeated" });
  });

  it("punch is a no-op once defeated", () => {
    const fight = new BossFight(1, 1, [...SEQUENCE]);
    fight.resolveAttack("jumping");
    fight.punch();
    expect(fight.punch()).toBe(false);
    expect(fight.getHp()).toBe(0);
  });

  it("expireVulnerableWindow with no Punch returns to telegraph without changing HP", () => {
    const fight = new BossFight(1, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // -> vulnerable
    fight.expireVulnerableWindow();
    expect(fight.getHp()).toBe(4);
    expect(fight.getPhase().type).toBe("telegraph");
  });

  it("expireVulnerableWindow resets the dodge streak, same as punch", () => {
    const fight = new BossFight(2, 4, [...SEQUENCE]);
    fight.resolveAttack("jumping"); // ground -> dodged, streak 1
    fight.resolveAttack("ducking"); // overhead -> dodged, streak 2 == required -> vulnerable
    fight.expireVulnerableWindow();
    const phaseAttack = (fight.getPhase() as { type: "telegraph"; attack: "ground" | "overhead" }).attack;
    fight.resolveAttack(phaseAttack === "ground" ? "jumping" : "ducking");
    expect(fight.getPhase().type).toBe("telegraph"); // not vulnerable again from a single dodge
  });

  it("expireVulnerableWindow outside the Vulnerable Window is a no-op", () => {
    const fight = new BossFight(3, 4, [...SEQUENCE]);
    const before = fight.getPhase();
    fight.expireVulnerableWindow();
    expect(fight.getPhase()).toEqual(before);
  });

  it("the attack sequence cycles once it runs out of authored entries", () => {
    const fight = new BossFight(99, 4, ["ground", "overhead"]);
    fight.resolveAttack("jumping"); // ground -> dodged
    expect(fight.getPhase()).toEqual({ type: "telegraph", attack: "overhead" });
    fight.resolveAttack("ducking"); // overhead -> dodged
    expect(fight.getPhase()).toEqual({ type: "telegraph", attack: "ground" }); // cycled back
  });
});
