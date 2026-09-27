import { describe, expect, it } from 'vitest';
import { CombatSimulation } from '../simulation/combat/CombatSimulation';
import type { CombatRenderState, BossPhase } from '../simulation/combat/CombatRenderState';
import type { AudioCue } from '../content/audio/AudioCueDefinitions';
import { AttackAudioFeedback } from './AttackAudioFeedback';

const fixture = () => {
  const simulation = new CombatSimulation();
  const state = simulation.renderState;
  const sounds: AudioCue[] = [];
  const audio = new AttackAudioFeedback(cue => sounds.push(cue));
  audio.reset(state);
  return { simulation, state, sounds, audio };
};

describe('attack audio at real damage phases', () => {
  it('ignites once, sustains across ticks and releases the laser once', () => {
    const { state, sounds, audio } = fixture();
    const active: CombatRenderState = { ...state, laser: { ...state.laser, phase: 'active' } };
    for (let i = 0; i < 60; i += 1) audio.update(active, 1 / 60);
    expect(sounds.filter(cue => cue === 'laser-ignite')).toHaveLength(1);
    expect(sounds.filter(cue => cue === 'laser-sustain').length).toBeGreaterThanOrEqual(5);
    audio.update(state, 1 / 60);
    audio.update(state, 1 / 60);
    expect(sounds.filter(cue => cue === 'laser-release')).toHaveLength(1);
    const length = sounds.length;
    for (let i = 0; i < 60; i += 1) audio.update(state, 1 / 60);
    expect(sounds).toHaveLength(length);
  });

  it('recognizes kind-specific phases even with the other pooled phases inactive', () => {
    const { state, sounds, audio } = fixture();
    const enemy = state.enemies[0];
    const actors = [
      { ...enemy, active: true, kind: 'charger' as const, chargerPhase: 'charge' as const },
      { ...enemy, active: true, kind: 'orbiter' as const, orbiterPhase: 'commit' as const },
      { ...enemy, active: true, kind: 'prism-weaver' as const, prismWeaverPhase: 'active' as const },
      { ...enemy, active: true, kind: 'thorn-bastion' as const, fracturePhase: 'active' as const }
    ];
    audio.update({ ...state, enemies: actors }, 1 / 60);
    expect(sounds).toEqual(expect.arrayContaining(['enemy-dash', 'laser-ignite', 'laser-sustain', 'enemy-spikes']));
    expect(sounds.filter(cue => cue === 'enemy-dash')).toHaveLength(1);
  });

  it('sounds all boss attack families and coalesces simultaneous beams', () => {
    const cases: [BossPhase, AudioCue][] = [
      ['sweep-active', 'laser-ignite'], ['ring-active', 'hostile-ring'],
      ['charge-active', 'enemy-dash'], ['curve-active', 'enemy-dash'],
      ['zigzag-active', 'enemy-dash'], ['spikes-active', 'enemy-spikes'],
      ['replicas-active', 'replica-spawn']
    ];
    for (const [phase, cue] of cases) {
      const { state, sounds, audio } = fixture();
      const boss = { ...state.boss, active: true, phase };
      audio.update({ ...state, bosses: [boss, boss] }, 1 / 60);
      expect(sounds.filter(sound => sound === cue), phase).toHaveLength(1);
    }
  });

  it('does not keep replaying a splitter-child spawn while it remains alive', () => {
    const { state, sounds, audio } = fixture();
    const child = { ...state.enemies[0], active: true, kind: 'splitter' as const, splitterDepth: 1, generation: 1 };
    for (let i = 0; i < 120; i += 1) audio.update({ ...state, enemies: [child] }, 1 / 60);
    expect(sounds.filter(cue => cue === 'replica-spawn')).toHaveLength(1);
  });

  it('sounds every compression burst and Echo return at activation, not telegraph', () => {
    const { state, sounds, audio } = fixture();
    const pulse = { ...state.pulseRingWeapon, evolution: 'compression_wave' as const, phase: 'telegraph' as const };
    audio.update({ ...state, pulseRingWeapon: pulse }, 1 / 60);
    expect(sounds).toHaveLength(0);
    for (const wave of [0, 1, 2]) {
      audio.update({ ...state, pulseRingWeapon: { ...pulse, phase: 'active', wave } }, 1 / 60);
    }
    expect(sounds.filter(cue => cue === 'pulse-ring-fire')).toHaveLength(3);
    audio.update({ ...state, pulseRingWeapon: { ...pulse, evolution: 'echo_shock', phase: 'active', wave: 1 } }, 1 / 60);
    expect(sounds).toContain('pulse-return');
  });

  it('Event Horizon sustains without a fake blast; Polar sounds both detonations', () => {
    const { state, sounds, audio } = fixture();
    for (let i = 0; i < 90; i += 1) {
      audio.update({ ...state, magneticCharge: { ...state.magneticCharge, phase: 'attract' } }, 1 / 60);
    }
    audio.update(state, 1 / 60);
    expect(sounds.filter(cue => cue === 'magnetic-capture').length).toBeGreaterThan(3);
    expect(sounds).not.toContain('magnetic-collapse');
    for (const phase of ['detonate', 'collapse'] as const) {
      audio.update({ ...state, magneticCharge: { ...state.magneticCharge, phase } }, 1 / 60);
    }
    expect(sounds.filter(cue => cue === 'magnetic-collapse')).toHaveLength(2);
  });

  it('tracks actual hostile shots and mine explosions, excluding cleanup', () => {
    const { state, sounds, audio } = fixture();
    const mine = { ...state.fractureMines[0], active: true, sequence: 1, ageSeconds: 1 };
    const shot = { ...state.fractureProjectiles[0], active: true, sequence: 1 };
    audio.update({ ...state, fractureMines: [mine], fractureProjectiles: [shot] }, 1 / 60);
    expect(sounds).toEqual(expect.arrayContaining(['hostile-shot', 'mine-arm']));
    audio.update({ ...state, fractureMines: [{ ...mine, active: false }] }, 1 / 60);
    expect(sounds).not.toContain('mine-explode');
    audio.update({ ...state, fractureMines: [mine] }, 1 / 60);
    audio.update({ ...state, fractureMines: [{ ...mine, active: false, ageSeconds: 3 }] }, 1 / 60);
    expect(sounds).toContain('mine-explode');
    audio.reset(state);
    sounds.length = 0;
    audio.update(state, 1 / 60);
    expect(sounds).toHaveLength(0);
  });
});
