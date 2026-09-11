import type { PlayerState } from '../PlayerModel';

export interface WeaponScheduleCallbacks {
  readonly fireProjectile: (player: PlayerState) => void;
  readonly fireChain: (player: PlayerState) => void;
  readonly fireBoomerang?: (player: PlayerState) => void;
}

/** Owns only elapsed cooldown time and trigger order for authored weapons. */
export class WeaponScheduler {
  private projectileAccumulator = 0;
  private chainAccumulator = 0;
  private boomerangAccumulator = 0;

  public constructor(private readonly callbacks: WeaponScheduleCallbacks) {}

  public update(
    dtSeconds: number,
    projectileCooldownSeconds: number,
    chainEnabled: boolean,
    chainCooldownSeconds: number,
    player: PlayerState,
    projectileEnabled = true,
    boomerangEnabled = false,
    boomerangCooldownSeconds = 1
  ): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return;

    if (projectileEnabled) {
      this.projectileAccumulator += dt;
      const projectileCooldown = Math.max(0.001, projectileCooldownSeconds);
      while (this.projectileAccumulator >= projectileCooldown) {
        this.projectileAccumulator -= projectileCooldown;
        this.callbacks.fireProjectile(player);
      }
    } else {
      this.projectileAccumulator = 0;
    }

    if (boomerangEnabled && this.callbacks.fireBoomerang) {
      this.boomerangAccumulator += dt;
      const boomerangCooldown = Math.max(0.001, boomerangCooldownSeconds);
      while (this.boomerangAccumulator >= boomerangCooldown) {
        this.boomerangAccumulator -= boomerangCooldown;
        this.callbacks.fireBoomerang(player);
      }
    } else {
      this.boomerangAccumulator = 0;
    }

    if (chainEnabled) {
      this.chainAccumulator += dt;
      const chainCooldown = Math.max(0.001, chainCooldownSeconds);
      while (this.chainAccumulator >= chainCooldown) {
        this.chainAccumulator -= chainCooldown;
        this.callbacks.fireChain(player);
      }
    } else {
      this.chainAccumulator = 0;
    }
  }

  public reset(): void {
    this.projectileAccumulator = 0;
    this.chainAccumulator = 0;
    this.boomerangAccumulator = 0;
  }
}
