import type { PlayerState } from '../PlayerModel';

export interface WeaponScheduleCallbacks {
  readonly fireProjectile: (player: PlayerState) => void;
  readonly fireChain: (player: PlayerState) => void;
}

/** Owns only elapsed cooldown time and trigger order for authored weapons. */
export class WeaponScheduler {
  private projectileAccumulator = 0;
  private chainAccumulator = 0;

  public constructor(private readonly callbacks: WeaponScheduleCallbacks) {}

  public update(
    dtSeconds: number,
    projectileCooldownSeconds: number,
    chainEnabled: boolean,
    chainCooldownSeconds: number,
    player: PlayerState
  ): void {
    const dt = Math.min(Math.max(dtSeconds, 0), 0.1);
    if (dt <= 0) return;

    this.projectileAccumulator += dt;
    const projectileCooldown = Math.max(0.001, projectileCooldownSeconds);
    while (this.projectileAccumulator >= projectileCooldown) {
      this.projectileAccumulator -= projectileCooldown;
      this.callbacks.fireProjectile(player);
    }

    if (!chainEnabled) return;
    this.chainAccumulator += dt;
    const chainCooldown = Math.max(0.001, chainCooldownSeconds);
    while (this.chainAccumulator >= chainCooldown) {
      this.chainAccumulator -= chainCooldown;
      this.callbacks.fireChain(player);
    }
  }

  public reset(): void {
    this.projectileAccumulator = 0;
    this.chainAccumulator = 0;
  }
}
