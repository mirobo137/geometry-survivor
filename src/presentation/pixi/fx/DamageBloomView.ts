import { Container, Graphics, GraphicsContext } from 'pixi.js';

/** Two consumers, one bounded transform-only impact lifecycle. No hitbox. */
export class DamageBloomView {
  public readonly root = new Container();
  private readonly slots: {
    root: Container; core: Graphics; seam: Graphics; shell: Graphics;
    age: number; radius: number;
  }[] = [];
  private readonly reducedMotion: boolean;
  private readonly duration: number;

  public constructor(private readonly kind: 'enemy' | 'player', capacity: number) {
    this.reducedMotion = typeof window !== 'undefined'
      && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.duration = kind === 'player' ? 0.28 : 0.18;
    const core = new GraphicsContext();
    const seam = new GraphicsContext();
    const shell = new GraphicsContext();
    if (kind === 'enemy') {
      // An asymmetric contact lens: dark separation, warm metal, ivory slit.
      shell.poly([-1.05, 0, -.3, -.22, .16, -.12, .92, 0, .14, .18, -.32, .29]).fill(0x111827);
      shell.poly([-.84, 0, -.28, -.14, .73, 0, -.25, .18]).fill(0xffb96c);
      seam.poly([-.86, -.04, -.17, -.1, .17, -.62, .12, -.09, .78, .02,
        .15, .1, -.08, .52, -.14, .11]).fill(0xffdfac);
      core.poly([-.56, 0, -.09, -.075, .58, 0, -.1, .08]).fill(0xfff7e6);
    } else {
      // Four separated hull-stress plates, never a full expanding hazard ring.
      for (let i = 0; i < 4; i += 1) {
        const angle = i * Math.PI / 2 + Math.PI / 4;
        const transform = (points: number[]): number[] => points.map((_, index) => {
          const x = points[index - index % 2];
          const y = points[index - index % 2 + 1];
          return index % 2 === 0 ? x * Math.cos(angle) - y * Math.sin(angle)
            : x * Math.sin(angle) + y * Math.cos(angle);
        });
        shell.poly(transform([.64,-.29,.93,-.21,1.09,0,.93,.21,.64,.29,.81,0])).fill(0x151c30);
        shell.poly(transform([.73,-.24,.91,-.17,1.03,0,.91,.17,.73,.24,.88,0])).fill(0xf0607d);
        seam.poly(transform([.77,-.22,.95,-.13,1.04,0,.98,.02,.9,-.1])).fill(0xffbfad);
        core.poly(transform([.64,-.1,.82,0,.64,.1,.72,0])).fill(0xffefe3);
      }
    }
    this.root.eventMode = 'none';
    for (let i = 0; i < capacity; i += 1) {
      const root = new Container();
      const slot = { root, shell: new Graphics(shell), seam: new Graphics(seam), core: new Graphics(core), age: this.duration, radius: 1 };
      root.addChild(slot.shell, slot.seam, slot.core);
      root.visible = false;
      this.root.addChild(root);
      this.slots.push(slot);
    }
    // Contexts are shared by this pool only; destruction has one explicit owner.
    this.root.on('destroyed', () => { core.destroy(); seam.destroy(); shell.destroy(); });
  }

  public get activeCount(): number {
    let count = 0;
    for (const slot of this.slots) if (slot.root.visible) count += 1;
    return count;
  }

  public play(x: number, y: number, radius: number): void {
    const slot = this.slots.find(candidate => !candidate.root.visible);
    if (!slot) return; // Drop decoration on saturation, never allocate/recycle a live hit.
    slot.age = 0;
    slot.radius = radius;
    slot.root.position.set(x, y);
    // This is a material fracture axis, not a claim about projectile direction.
    slot.root.rotation = this.kind === 'enemy' ? -0.5 + Math.sin(x * .13 + y * .17) * .8 : 0;
    slot.root.visible = true;
    this.pose(slot);
  }

  public update(deltaSeconds: number): void {
    const delta = Math.min(.1, Math.max(0, deltaSeconds));
    if (delta === 0) return;
    for (const slot of this.slots) {
      if (!slot.root.visible) continue;
      slot.age += delta;
      if (slot.age >= this.duration) { slot.root.visible = false; continue; }
      this.pose(slot);
    }
  }

  public clear(): void {
    for (const slot of this.slots) slot.root.visible = false;
  }

  private pose(slot: typeof this.slots[number]): void {
    const p = slot.age / this.duration;
    const release = this.reducedMotion ? 0 : 1 - (1 - p) ** 3;
    slot.root.scale.set(slot.radius);
    slot.shell.scale.set(this.kind === 'player' ? 1 + release * .22 : .8 + release * .4);
    slot.shell.alpha = (1 - p) ** 2;
    slot.seam.scale.set(this.kind === 'player' ? 1 + release * .22 : 1 + release * .5);
    slot.seam.alpha = (1 - p) ** 2 * .85;
    slot.core.alpha = Math.max(0, 1 - p / .32) * .95;
    slot.core.scale.set(this.kind === 'player' ? 1 : .8 + release * .25);
  }
}
