import { MAX_ROBBERS } from "../game/RobberBattle";
import { defaultQASettings, OBSTACLE_OPTIONS, type QASettings } from "../game/QASettings";

/** Native form controls keep the test panel usable by keyboard and on small screens. */
export class QAPanel {
  private dialog?: HTMLDialogElement;

  show(settings: QASettings, apply: (settings: QASettings, battle?: 0.5 | 0.9) => void, cancel: () => void): void {
    this.destroy();
    const dialog = document.createElement("dialog");
    this.dialog = dialog;
    dialog.style.cssText = "box-sizing:border-box;width:min(560px,94vw);max-height:90vh;overflow:auto;background:#172033;color:#f8fafc;border:2px solid #6cbac7;border-radius:14px;padding:24px;font:16px Arial,sans-serif";
    dialog.innerHTML = `<form method="dialog">
      <h2 style="margin:0 0 8px">QA · Gameplay settings</h2>
      <p style="color:#cbd5e1;line-height:1.4">The game is paused. Apply restarts the level. Settings last until you reload. Extreme settings may make the course impossible.</p>
      <fieldset style="margin:18px 0;padding:12px"><legend>Jump to boss fight</legend>
        <p>Apply these settings and start the fight immediately. Battles are enabled automatically.</p>
        <button value="battle50">Go to 50% fight</button> <button value="battle90">Go to 90% fight</button>
      </fieldset>
      <div data-sliders></div>
      <fieldset style="margin:18px 0;padding:12px"><legend>Obstacle types</legend><div data-obstacles style="display:grid;grid-template-columns:1fr 1fr;gap:12px"></div></fieldset>
      <fieldset style="margin:18px 0;padding:12px"><legend>Power objects</legend><div data-powers style="display:flex;gap:16px;flex-wrap:wrap"></div></fieldset>
      <p style="color:#cbd5e1;font-size:14px">Frequency changes spacing: 2× means half the distance between encounters. Speed multiplies the selected difficulty.</p>
      <div style="display:flex;gap:12px;flex-wrap:wrap"><button type="button" data-reset>Reset defaults</button><button value="cancel">Cancel</button><button value="apply">Apply & restart</button></div>
    </form>`;
    dialog.setAttribute("aria-label", "QA gameplay settings");
    const ranges = [
      ["robberCount", "Robbers per fight", 1, MAX_ROBBERS, 1],
      ["speed", "Speed", 0.25, 2, 0.05], ["jumpHeight", "Jump height", 0.5, 2, 0.1],
      ["gravity", "Gravity", 0.5, 2, 0.1], ["frequency", "Obstacle frequency", 0.5, 2, 0.1],
    ] as const;
    for (const [key, title, min, max, step] of ranges) {
      const label = document.createElement("label");
      label.style.cssText = "display:block;margin:16px 0";
      label.innerHTML = `${title} <output></output><input name="${key}" aria-label="${title}" type="range" min="${min}" max="${max}" step="${step}" style="display:block;width:100%;margin-top:10px">`;
      const input = label.querySelector("input")!;
      input.value = String(settings[key]);
      const update = () => { label.querySelector("output")!.textContent = key === "robberCount" ? input.value : `${Number(input.value).toFixed(2)}×`; };
      input.addEventListener("input", update); update();
      dialog.querySelector("[data-sliders]")!.append(label);
    }
    const checkbox = (parent: string, key: string, title: string, checked: boolean) => {
      const label = document.createElement("label");
      const input = document.createElement("input"); input.type = "checkbox"; input.name = key; input.checked = checked;
      label.append(input, ` ${title}`); dialog.querySelector(parent)!.append(label);
    };
    for (const [kind, title] of OBSTACLE_OPTIONS) checkbox("[data-obstacles]", kind, title, settings.hazards.includes(kind));
    checkbox("[data-obstacles]", "robbers", "Robber battles", settings.robbers);
    checkbox("[data-obstacles]", "cars", "Cars", settings.cars);
    checkbox("[data-powers]", "flightPads", "Flight trampolines", settings.flightPads);
    checkbox("[data-powers]", "jumpOrbs", "Jump orbs", settings.jumpOrbs);
    for (const button of dialog.querySelectorAll("button")) button.style.cssText = "padding:12px 16px;border:1px solid #6cbac7;border-radius:6px;background:#245764;color:white;font:inherit;cursor:pointer";
    dialog.querySelector("[data-reset]")!.addEventListener("click", () => this.show(defaultQASettings(), apply, cancel));
    dialog.addEventListener("close", () => {
      if (!["apply", "battle50", "battle90"].includes(dialog.returnValue)) { this.destroy(); cancel(); return; }
      const form = new FormData(dialog.querySelector("form")!);
      const next: QASettings = { robbers: form.has("robbers"), robberCount: Number(form.get("robberCount")), speed: Number(form.get("speed")), jumpHeight: Number(form.get("jumpHeight")),
        gravity: Number(form.get("gravity")), frequency: Number(form.get("frequency")),
        hazards: OBSTACLE_OPTIONS.filter(([kind]) => form.has(kind)).map(([kind]) => kind),
        cars: form.has("cars"), flightPads: form.has("flightPads"), jumpOrbs: form.has("jumpOrbs") };
      const battle = dialog.returnValue === "battle50" ? 0.5 : dialog.returnValue === "battle90" ? 0.9 : undefined;
      if (battle) next.robbers = true;
      this.destroy(); apply(next, battle);
    });
    // Do not let form keyboard input reach Phaser's jump/shoot/pause bindings.
    for (const event of ["keydown", "keyup", "pointerdown", "pointerup"]) dialog.addEventListener(event, (e) => e.stopPropagation());
    document.body.append(dialog); dialog.showModal();
  }

  destroy(): void { this.dialog?.remove(); this.dialog = undefined; }
}
