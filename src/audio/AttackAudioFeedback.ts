import type { AudioCue } from '../content/audio/AudioCueDefinitions';
import type { BossPhase, CombatRenderState, EnemyRenderState } from '../simulation/combat/CombatRenderState';

const enemyPhase = (enemy: EnemyRenderState): string => {
  if (!enemy.active) return 'inactive';
  switch (enemy.kind) {
    case 'charger': return enemy.chargerPhase ?? 'inactive';
    case 'orbiter': return enemy.orbiterPhase ?? 'inactive';
    case 'prism-weaver': return enemy.prismWeaverPhase ?? 'inactive';
    case 'fracture-gunner':
    case 'thorn-bastion':
    case 'zigzag-reaver':
    case 'rift-miner': return enemy.fracturePhase ?? 'inactive';
    default: return 'alive';
  }
};

const bossAttackCue = (phase: BossPhase): AudioCue | undefined => {
  switch (phase) {
    case 'sweep-active': return 'laser-ignite';
    case 'ring-active': return 'hostile-ring';
    case 'charge-active':
    case 'curve-active':
    case 'zigzag-active': return 'enemy-dash';
    case 'spikes-active': return 'enemy-spikes';
    case 'replicas-active': return 'replica-spawn';
    // Batteries and mines are sounded by actual ordnance, including late shots.
    default: return undefined;
  }
};

/**
 * Bounded snapshot observer. A phase ENTER makes an attack audible; repeated
 * fixed ticks don't retrigger it. Sustained beds are short, finite ZzFX grains,
 * coalesced across all casters and advanced only by simulation time.
 */
export class AttackAudioFeedback {
  private readonly pending = new Set<AudioCue>();
  private enemyPhases: string[] = [];
  private generations = new Uint32Array(0);
  private bossPhases: string[] = [];
  private boomerangPhases: string[] = [];
  private shotSequences = new Uint32Array(0);
  private mineAges = new Float32Array(0);
  private mineSequences = new Uint32Array(0);
  private mineActive = new Uint8Array(0);
  private chainPhases: string[] = [];
  private laserPhase = 'idle';
  private radialPhase = 'idle';
  private ringPhase = 'idle';
  private angularPhase = 'idle';
  private pulsePhase = 'idle';
  private pulseWave = 0;
  private magneticPhase = 'idle';
  private beamWasActive = false;
  private beamTimer = 0;
  private magnetTimer = 0;

  public constructor(private readonly emit: (cue: AudioCue) => void) {}

  public reset(state: CombatRenderState): void {
    this.pending.clear();
    this.enemyPhases = state.enemies.map(enemyPhase);
    this.generations = Uint32Array.from(state.enemies, enemy => enemy.generation ?? 0);
    this.bossPhases = state.bosses ? state.bosses.map(boss => boss.phase) : [state.boss.phase];
    this.boomerangPhases = state.boomerangs.map(b => b.active ? b.phase : 'inactive');
    this.shotSequences = Uint32Array.from(state.fractureProjectiles, shot => shot.sequence);
    this.mineAges = Float32Array.from(state.fractureMines, mine => mine.ageSeconds);
    this.mineSequences = Uint32Array.from(state.fractureMines, mine => mine.sequence);
    this.mineActive = Uint8Array.from(state.fractureMines, mine => mine.active ? 1 : 0);
    this.chainPhases = state.chainExplosions.map(e => e.active ? e.phase : 'idle');
    this.laserPhase = state.laser.phase;
    this.radialPhase = state.radialPulse.phase;
    this.ringPhase = state.pulseRing.phase;
    this.angularPhase = state.angularSweep.phase;
    this.pulsePhase = state.pulseRingWeapon.phase;
    this.pulseWave = state.pulseRingWeapon.wave ?? 0;
    this.magneticPhase = state.magneticCharge.phase;
    this.beamWasActive = false;
    this.beamTimer = 0;
    this.magnetTimer = 0;
  }

  public update(state: CombatRenderState, dt: number): void {
    this.pending.clear();
    const step = Math.max(0, Math.min(dt, 0.1));
    let beamActive = state.laser.phase === 'active';
    if (beamActive && this.laserPhase !== 'active') this.pending.add('laser-ignite');
    if (state.radialPulse.phase === 'active' && this.radialPhase !== 'active') this.pending.add('hostile-ring');
    if (state.pulseRing.phase === 'active' && this.ringPhase !== 'active') this.pending.add('hostile-ring');
    if (state.angularSweep.phase === 'active' && this.angularPhase !== 'active') this.pending.add('angular-cut');
    this.laserPhase = state.laser.phase;
    this.radialPhase = state.radialPulse.phase;
    this.ringPhase = state.pulseRing.phase;
    this.angularPhase = state.angularSweep.phase;

    for (let index = 0; index < state.enemies.length; index += 1) {
      const enemy = state.enemies[index];
      const phase = enemyPhase(enemy);
      const fresh = this.generations[index] !== (enemy.generation ?? 0) || this.enemyPhases[index] === 'inactive';
      const entered = enemy.active && (fresh || phase !== this.enemyPhases[index]);
      if (entered) {
        if (phase === 'charge' || phase === 'commit'
          || (phase === 'active' && enemy.kind === 'zigzag-reaver')) this.pending.add('enemy-dash');
        if (phase === 'active' && enemy.kind === 'thorn-bastion') this.pending.add('enemy-spikes');
        if (phase === 'active' && enemy.kind === 'prism-weaver') this.pending.add('laser-ignite');
        if (fresh && ((enemy.splitterDepth ?? 0) > 0 || enemy.wardenReplica)) this.pending.add('replica-spawn');
      }
      if (enemy.active && enemy.kind === 'prism-weaver' && phase === 'active') beamActive = true;
      this.enemyPhases[index] = phase;
      this.generations[index] = enemy.generation ?? 0;
    }
    for (let index = 0; index < (state.bosses?.length ?? 1); index += 1) {
      const boss = state.bosses?.[index] ?? state.boss;
      if (boss.active && boss.phase !== this.bossPhases[index]) {
        const cue = bossAttackCue(boss.phase);
        if (cue) this.pending.add(cue);
      }
      if (boss.active && boss.phase === 'sweep-active') beamActive = true;
      this.bossPhases[index] = boss.phase;
    }

    if (beamActive) {
      this.beamTimer -= step;
      if (this.beamTimer <= 0) {
        this.pending.add('laser-sustain');
        this.beamTimer = 0.16;
      }
    } else {
      if (this.beamWasActive) this.pending.add('laser-release');
      this.beamTimer = 0;
    }
    this.beamWasActive = beamActive;

    for (let index = 0; index < state.fractureProjectiles.length; index += 1) {
      const shot = state.fractureProjectiles[index];
      if (shot.active && shot.sequence !== this.shotSequences[index]) this.pending.add('hostile-shot');
      this.shotSequences[index] = shot.sequence;
    }
    for (let index = 0; index < state.fractureMines.length; index += 1) {
      const mine = state.fractureMines[index];
      const same = mine.sequence === this.mineSequences[index];
      if (mine.active && mine.ageSeconds >= mine.armSeconds
        && (!same || !this.mineActive[index] || this.mineAges[index] < mine.armSeconds)) this.pending.add('mine-arm');
      // Cleanup/despawn isn't an explosion: require the actual lifetime crossing.
      if (!mine.active && this.mineActive[index] && same
        && mine.ageSeconds >= mine.detonateSeconds) this.pending.add('mine-explode');
      this.mineSequences[index] = mine.sequence;
      this.mineAges[index] = mine.ageSeconds;
      this.mineActive[index] = mine.active ? 1 : 0;
    }
    for (let index = 0; index < state.boomerangs.length; index += 1) {
      const b = state.boomerangs[index];
      if (b.active && b.phase === 'returning' && this.boomerangPhases[index] !== 'returning'
        && b.evolution !== 'singularity_return') this.pending.add('boomerang-return');
      this.boomerangPhases[index] = b.active ? b.phase : 'inactive';
    }
    for (let index = 0; index < state.chainExplosions.length; index += 1) {
      const explosion = state.chainExplosions[index];
      const phase = explosion.active ? explosion.phase : 'idle';
      if (phase === 'active' && this.chainPhases[index] !== 'active') this.pending.add('chain-burst');
      this.chainPhases[index] = phase;
    }
    const pulse = state.pulseRingWeapon;
    if (pulse.phase === 'active' && (this.pulsePhase !== 'active' || this.pulseWave !== (pulse.wave ?? 0))) {
      this.pending.add(pulse.evolution === 'echo_shock' && pulse.wave === 1 ? 'pulse-return' : 'pulse-ring-fire');
    }
    this.pulsePhase = pulse.phase;
    this.pulseWave = pulse.wave ?? 0;
    const magnetic = state.magneticCharge;
    if (magnetic.phase === 'attract') {
      this.magnetTimer -= step;
      if (this.magneticPhase !== 'attract' || this.magnetTimer <= 0) {
        this.pending.add('magnetic-capture');
        this.magnetTimer = 0.26;
      }
    } else this.magnetTimer = 0;
    if ((magnetic.phase === 'detonate' || magnetic.phase === 'collapse')
      && this.magneticPhase !== magnetic.phase) this.pending.add('magnetic-collapse');
    this.magneticPhase = magnetic.phase;
    for (const cue of this.pending) this.emit(cue);
  }
}
