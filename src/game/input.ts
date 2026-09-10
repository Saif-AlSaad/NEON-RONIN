export interface InputState {
  moveX: number; // -1 to 1
  jump: boolean; // edge triggered
  jumpHeld: boolean;
  attack: boolean; // edge triggered
  attackHeld: boolean;
  shuriken: boolean; // edge triggered
  shurikenHeld: boolean;
  special: boolean; // edge triggered
  dash: boolean; // edge triggered
  parry: boolean; // edge triggered
  parryHeld: boolean;
}

export class InputManager {
  private keys = new Set<string>();
  private prevKeys = new Set<string>();
  private prevPadButtons: boolean[] = [];
  private touchX = 0;
  private touchActions = new Set<string>();
  private prevTouchActions = new Set<string>();
  private gamepadIndex: number | null = null;
  public onGamepadConnected?: (name: string) => void;

  constructor() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("gamepadconnected", this.onGamepadConn);
    window.addEventListener("gamepaddisconnected", this.onGamepadDisconn);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
      e.preventDefault();
    }
    this.keys.add(k);
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };

  private onGamepadConn = (e: GamepadEvent) => {
    this.gamepadIndex = e.gamepad.index;
    this.onGamepadConnected?.(e.gamepad.id || "Controller");
  };

  private onGamepadDisconn = (e: GamepadEvent) => {
    if (this.gamepadIndex === e.gamepad.index) {
      this.gamepadIndex = null;
    }
  };

  public setTouchMovement(x: number) {
    this.touchX = Math.max(-1, Math.min(1, x));
  }

  public triggerTouchAction(action: string, isDown: boolean) {
    if (isDown) {
      this.touchActions.add(action);
    } else {
      this.touchActions.delete(action);
    }
  }

  public vibrate(durationMs = 80, weak = 0.4, strong = 0.6) {
    // Try gamepad haptics first
    if (this.gamepadIndex !== null && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads[this.gamepadIndex];
      const actuator = (pad as any)?.vibrationActuator;
      if (actuator && typeof actuator.playEffect === "function") {
        actuator.playEffect("dual-rumble", {
          startDelay: 0,
          duration: durationMs,
          weakMagnitude: weak,
          strongMagnitude: strong,
        }).catch(() => {});
      }
    }
    // Mobile navigator haptics fallback
    if (typeof navigator.vibrate === "function") {
      try {
        navigator.vibrate(durationMs);
      } catch {}
    }
  }

  public poll(): InputState {
    let moveX = 0;

    // 1. Keyboard Movement
    if (this.keys.has("a") || this.keys.has("arrowleft")) moveX -= 1;
    if (this.keys.has("d") || this.keys.has("arrowright")) moveX += 1;

    // 2. Touch Movement
    if (Math.abs(this.touchX) > 0.1) {
      moveX = this.touchX;
    }

    // Keyboard Buttons
    const kJump = this.keys.has(" ") || this.keys.has("w") || this.keys.has("arrowup");
    const kAttack = this.keys.has("j");
    const kShuriken = this.keys.has("k");
    const kSpecial = this.keys.has("l");
    const kDash = this.keys.has("shift");
    const kParry = this.keys.has("f") || (this.keys.has("s") && kAttack) || (this.keys.has("arrowdown") && kAttack);

    // Touch Buttons
    const tJump = this.touchActions.has("jump");
    const tAttack = this.touchActions.has("attack");
    const tShuriken = this.touchActions.has("shuriken");
    const tSpecial = this.touchActions.has("special");
    const tDash = this.touchActions.has("dash");
    const tParry = this.touchActions.has("parry");

    // 3. Gamepad Polling
    let gJump = false, gAttack = false, gShuriken = false, gSpecial = false, gDash = false, gParry = false;
    let currPadButtons: boolean[] = [];

    if (this.gamepadIndex !== null && navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = pads[this.gamepadIndex];
      if (pad && pad.connected) {
        // Stick / Dpad move
        const axisX = pad.axes[0] ?? 0;
        if (Math.abs(axisX) > 0.25) moveX = axisX;
        if (pad.buttons[14]?.pressed) moveX = -1;
        if (pad.buttons[15]?.pressed) moveX = 1;

        gJump = !!pad.buttons[0]?.pressed; // A / Cross
        gParry = !!pad.buttons[1]?.pressed; // B / Circle
        gAttack = !!pad.buttons[2]?.pressed; // X / Square
        gShuriken = !!pad.buttons[3]?.pressed; // Y / Triangle
        gSpecial = !!pad.buttons[4]?.pressed || !!pad.buttons[6]?.pressed; // LB / LT
        gDash = !!pad.buttons[5]?.pressed || !!pad.buttons[7]?.pressed; // RB / RT

        currPadButtons = [gJump, gParry, gAttack, gShuriken, gSpecial, gDash];
      }
    }

    // Consolidated down states
    const isJumpDown = kJump || tJump || gJump;
    const isAttackDown = kAttack || tAttack || gAttack;
    const isShurikenDown = kShuriken || tShuriken || gShuriken;
    const isSpecialDown = kSpecial || tSpecial || gSpecial;
    const isDashDown = kDash || tDash || gDash;
    const isParryDown = kParry || tParry || gParry;

    // Consolidated previous states for edge detection
    const wasJumpDown = this.prevKeys.has(" ") || this.prevKeys.has("w") || this.prevKeys.has("arrowup") ||
      this.prevTouchActions.has("jump") || (this.prevPadButtons[0] ?? false);
    const wasAttackDown = this.prevKeys.has("j") || this.prevTouchActions.has("attack") || (this.prevPadButtons[2] ?? false);
    const wasShurikenDown = this.prevKeys.has("k") || this.prevTouchActions.has("shuriken") || (this.prevPadButtons[3] ?? false);
    const wasSpecialDown = this.prevKeys.has("l") || this.prevTouchActions.has("special") || (this.prevPadButtons[4] ?? false);
    const wasDashDown = this.prevKeys.has("shift") || this.prevTouchActions.has("dash") || (this.prevPadButtons[5] ?? false);
    const wasParryDown = this.prevKeys.has("f") || this.prevTouchActions.has("parry") || (this.prevPadButtons[1] ?? false);

    const state: InputState = {
      moveX: Math.max(-1, Math.min(1, moveX)),
      jump: isJumpDown && !wasJumpDown,
      jumpHeld: isJumpDown,
      attack: isAttackDown && !wasAttackDown,
      attackHeld: isAttackDown,
      shuriken: isShurikenDown && !wasShurikenDown,
      shurikenHeld: isShurikenDown,
      special: isSpecialDown && !wasSpecialDown,
      dash: isDashDown && !wasDashDown,
      parry: isParryDown && !wasParryDown,
      parryHeld: isParryDown,
    };

    // Save previous states
    this.prevKeys = new Set(this.keys);
    this.prevTouchActions = new Set(this.touchActions);
    this.prevPadButtons = currPadButtons;

    return state;
  }

  public dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("gamepadconnected", this.onGamepadConn);
    window.removeEventListener("gamepaddisconnected", this.onGamepadDisconn);
  }
}
