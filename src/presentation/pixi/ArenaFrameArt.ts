import type { Graphics } from 'pixi.js';
import { getArenaRadiusAtAngle, type ArenaBoundary } from '../../simulation/ArenaBoundary';

/** Aster Loom: fixed-count articulated containment hardware, owned by ArenaView. */
export const ARENA_ART = {
  ink: 0x080f20, metal: 0x26394f, face: 0x42576a, bevel: 0x819799,
  energy: 0x67d9ca, hot: 0xd7fff0, gold: 0xb9a778
} as const;

// Radial offsets are cosmetic. Offset zero is always the simulation boundary.
function ribbon(g: Graphics, b: ArenaBoundary, start: number, end: number,
  inner: number, outer: number, color: number, alpha: number): void {
  const steps = Math.max(2, Math.ceil((end - start) * 24));
  g.beginPath();
  for (let i = 0; i <= steps; i++) {
    const a = start + (end - start) * i / steps;
    const r = getArenaRadiusAtAngle(b, a) + outer;
    if (i === 0) g.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  for (let i = steps; i >= 0; i--) {
    const a = start + (end - start) * i / steps;
    const r = Math.max(0, getArenaRadiusAtAngle(b, a) + inner);
    g.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  g.closePath().fill({ color, alpha });
}

export function drawContainmentFrame(frame: Graphics, lights: Graphics, mounts: Graphics,
  b: ArenaBoundary): void {
  frame.clear(); lights.clear(); mounts.clear();
  const tau = Math.PI * 2;
  for (let i = 0; i < 24; i++) {
    const a = i * tau / 24 + 0.024;
    const z = (i + 1) * tau / 24 - 0.024;
    // Stepped cross-section: cavity, raised plate, bevel and recessed light slot.
    ribbon(frame, b, a, z, 4, 19, ARENA_ART.ink, 0.96);
    ribbon(frame, b, a + 0.006, z - 0.006, 7, 17, ARENA_ART.metal, 1);
    ribbon(frame, b, a + 0.012, z - 0.012, 12, 17, ARENA_ART.face, 0.8);
    ribbon(frame, b, a + 0.012, z - 0.012, 17, 18, ARENA_ART.bevel, 0.56);
    ribbon(frame, b, a + 0.03, z - 0.03, 8, 10.5, ARENA_ART.ink, 1);
    ribbon(lights, b, a + 0.035, z - 0.035, 8.5, 9.5, ARENA_ART.energy, i % 3 ? 0.38 : 0.84);
    if (i % 3 === 0) ribbon(frame, b, a + 0.028, a + 0.045, 12, 16, ARENA_ART.gold, 0.85);
  }
  for (let i = 0; i < 12; i++) {
    const a = i * tau / 12;
    const r = getArenaRadiusAtAngle(b, a);
    const c = Math.cos(a), s = Math.sin(a);
    const plate = (coords: number[], color: number, alpha = 1): void => {
      mounts.beginPath();
      for (let j = 0; j < coords.length; j += 2) {
        const x = c * (r + coords[j]) - s * coords[j + 1];
        const y = s * (r + coords[j]) + c * coords[j + 1];
        if (!j) mounts.moveTo(x, y); else mounts.lineTo(x, y);
      }
      mounts.closePath().fill({ color, alpha });
    };
    plate([-5,-4, 8,-9, 24,-9, 30,-4, 30,4, 24,9, 8,9, -5,4], ARENA_ART.ink);
    plate([3,-3, 10,-7, 23,-7, 27,-3, 27,3, 23,7, 10,7, 3,3], ARENA_ART.metal);
    plate([10,-7, 23,-7, 27,-3, 15,-3, 5,0], ARENA_ART.bevel, 0.65);
    plate([15,3, 27,3, 23,7, 10,7, 5,0], ARENA_ART.face);
    plate([0,0, 10,-2.2, 22,-2.2, 24,0, 22,2.2, 10,2.2], ARENA_ART.ink);
    plate([1,0, 11,-0.9, 19,-0.9, 21,0, 19,0.9, 11,0.9], ARENA_ART.hot, 0.9);
  }
}

export function drawArenaFloor(g: Graphics, b: ArenaBoundary): void {
  g.clear();
  // Banded radial falloff leaves the selected background visible in the centre.
  ribbon(g, b, 0, Math.PI * 2, -b.radius, 0, 0x0b1b29, 0.2);
  for (let i = 0; i < 16; i++) {
    ribbon(g, b, 0, Math.PI * 2, -48 + i * 3, -45 + i * 3,
      0x214b54, 0.008 + i * 0.008);
  }
  // Quiet survey dashes only near the rim; no full-screen grid behind enemies.
  for (let i = 0; i < 72; i++) {
    const a = i * Math.PI * 2 / 72;
    const r = getArenaRadiusAtAngle(b, a);
    const major = i % 6 === 0;
    g.beginPath().moveTo(Math.cos(a) * (r - 10), Math.sin(a) * (r - 10))
      .lineTo(Math.cos(a) * (r - (major ? 21 : 14)), Math.sin(a) * (r - (major ? 21 : 14)))
      .stroke({ color: 0x6ca79f, width: major ? 1.2 : 0.8, alpha: major ? 0.35 : 0.18 });
  }
}
