import type { InputManager } from "./InputManager";

export class TouchControls {
  private readonly root = document.createElement("nav");
  private readonly movementZone = document.createElement("div");
  private readonly compactViewport = window.matchMedia("(max-width: 1366px)");
  private originX = 0;
  private readonly joystick = document.createElement("button");
  private readonly thumb = document.createElement("span");
  private readonly power = document.createElement("button");
  private readonly abort = new AbortController();
  private readonly resize: ResizeObserver;
  private joystickPointer: number | null = null;
  private powerPointer: number | null = null;

  constructor(private readonly input: InputManager, canvas: HTMLCanvasElement) {
    this.root.className = "touch-controls";
    this.root.setAttribute("aria-label", "Game controls");
    this.joystick.className = "control-joystick";
    this.joystick.type = this.power.type = "button";
    this.joystick.setAttribute("aria-label", "Drag left or right to move during battles");
    this.thumb.className = "joystick-thumb";
    this.thumb.textContent = "↔";
    this.joystick.append(this.thumb);
    this.power.className = "control-power";
    this.power.setAttribute("aria-label", "Use special power");
    this.power.textContent = "Power";
    this.movementZone.className = "movement-zone";
    this.movementZone.append(this.joystick);
    this.root.append(this.movementZone, this.power);
    document.body.append(this.root);

    const position = (): void => {
      const rect = canvas.getBoundingClientRect();
      Object.assign(this.root.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px` });
    };
    this.resize = new ResizeObserver(position);
    this.resize.observe(canvas);
    window.addEventListener("resize", position, { signal: this.abort.signal });
    position();

    this.movementZone.addEventListener("pointerdown", (event) => {
      if (this.joystick.disabled || this.joystickPointer !== null) return;
      event.preventDefault();
      this.joystickPointer = event.pointerId;
      this.movementZone.setPointerCapture(event.pointerId);
      this.originX = event.clientX;
      const rect = this.movementZone.getBoundingClientRect();
      this.joystick.style.left = `${event.clientX - rect.left}px`;
      this.joystick.style.top = `${event.clientY - rect.top}px`;
      this.joystick.hidden = false;
      this.move(event.clientX);
    });
    this.movementZone.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.joystickPointer) this.move(event.clientX);
    });
    this.power.addEventListener("pointerdown", (event) => {
      if (this.power.disabled || this.powerPointer !== null) return;
      event.preventDefault();
      this.powerPointer = event.pointerId;
      this.power.setPointerCapture(event.pointerId);
      this.power.classList.add("pressed");
      input.press("shoot", "touch-power");
    });
    this.power.addEventListener("click", (event) => {
      if (event.detail === 0 && !this.power.disabled) input.trigger("shoot");
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"] as const) {
      this.movementZone.addEventListener(type, (event) => {
        if (event.pointerId === this.joystickPointer) this.releaseJoystick();
      });
      this.power.addEventListener(type, (event) => {
        if (event.pointerId === this.powerPointer) this.releasePower();
      });
    }
    this.root.addEventListener("contextmenu", (event) => event.preventDefault());
    window.addEventListener("blur", () => this.clear(), { signal: this.abort.signal });
    document.addEventListener("visibilitychange", () => this.clear(), { signal: this.abort.signal });
    this.update(false, false, null);
  }

  private move(clientX: number): void {
    const offset = Math.max(-28, Math.min(28, clientX - this.originX));
    this.thumb.style.transform = `translateX(${offset}px)`;
    for (const direction of ["left", "right"] as const) {
      const held = direction === "left" ? offset < -8 : offset > 8;
      if (held) this.input.press(direction, "touch-joystick");
      else this.input.release(direction, "touch-joystick");
    }
  }

  update(active: boolean, battle: boolean, power: string | null): void {
    active = active && this.compactViewport.matches;
    this.root.hidden = !active;
    this.movementZone.hidden = !active || !battle;
    this.joystick.disabled = !active || !battle;
    this.joystick.hidden = this.joystick.disabled;
    this.power.disabled = !active || power === null;
    if (this.joystick.disabled) this.releaseJoystick();
    if (this.power.disabled) this.releasePower();
    const label = power ? `${power} ⚡` : "Power";
    if (this.power.textContent !== label) this.power.textContent = label;
    this.power.classList.toggle("powered", power !== null);
  }

  private releaseJoystick(): void {
    this.input.release("left", "touch-joystick");
    this.input.release("right", "touch-joystick");
    this.joystickPointer = null;
    this.joystick.style.left = "64px";
    this.joystick.style.top = "calc(100% - 52px)";
    this.thumb.style.transform = "translateX(0)";
  }

  private releasePower(): void {
    this.input.release("shoot", "touch-power");
    this.powerPointer = null;
    this.power.classList.remove("pressed");
  }

  private clear(): void {
    this.input.clearAll();
    this.releaseJoystick();
    this.releasePower();
  }

  destroy(): void {
    this.clear();
    this.resize.disconnect();
    this.abort.abort();
    this.root.remove();
  }
}
