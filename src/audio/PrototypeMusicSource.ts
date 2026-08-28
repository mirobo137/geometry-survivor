import { MUSIC_PATTERN } from '../content/audio/MusicDefinitions';

const SAMPLE_RATE = 22_050;
const LOOP_SECONDS = 4;
const TWO_PI = Math.PI * 2;
let cachedSource: string | null = null;

/** Generated local source for Howler; replace with local WebM/MP3 after licensing final music. */
export const createPrototypeMusicWavDataUri = (): string => {
  if (cachedSource) return cachedSource;
  const sampleCount = SAMPLE_RATE * LOOP_SECONDS;
  const wav = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(wav);
  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);
  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / SAMPLE_RATE;
    const step = MUSIC_PATTERN[Math.floor(time / 0.5) % MUSIC_PATTERN.length];
    const envelope = Math.max(0, 1 - (time % 0.5) * 2);
    const bass = Math.sin(TWO_PI * step.bass * time) * 0.16 * envelope;
    const lead = Math.sign(Math.sin(TWO_PI * step.lead * time)) * 0.045 * envelope;
    const harmony = step.harmony.reduce((sum, frequency) => sum + Math.sin(TWO_PI * frequency * time), 0) * 0.018 * envelope;
    view.setInt16(44 + index * 2, Math.round(Math.max(-1, Math.min(1, bass + lead + harmony)) * 32767), true);
  }
  const bytes = new Uint8Array(wav);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  cachedSource = `data:audio/wav;base64,${btoa(binary)}`;
  return cachedSource;
};

const writeAscii = (view: DataView, offset: number, value: string): void => {
  for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
};
