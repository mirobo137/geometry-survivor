import type { Texture } from 'pixi.js';
import { getArsenalTexture, type ArsenalArtId } from './ArsenalTextures';

/** Fixed pool/sequence slots, not a history of attacks. A late image is eligible
 * for the next attack, never half way through the current vector fallback. */
export class CastArt {
  private readonly slots = new Map<string | number, { clock: number; token?: number; art: Map<ArsenalArtId, Texture | null> }>();

  public begin(slot: string | number, active: boolean, clock: number, token?: number): void {
    if (!active) { this.slots.delete(slot); return; }
    const previous = this.slots.get(slot);
    if (!previous || clock < previous.clock || token !== previous.token) {
      this.slots.set(slot, { clock, token, art: new Map() });
    } else previous.clock = clock;
  }

  public get(slot: string | number, id: ArsenalArtId): Texture | null {
    const entry = this.slots.get(slot);
    if (!entry) return getArsenalTexture(id);
    if (!entry.art.has(id)) entry.art.set(id, getArsenalTexture(id));
    return entry.art.get(id) ?? null;
  }

  public clear(): void { this.slots.clear(); }
}
