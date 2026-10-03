import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const MAX_BUILD_BYTES = 15_000_000; // PLAN_DESARROLLO §9; decimal MB, not MiB.
const targets = process.argv.slice(2);
async function bytes(folder) {
  let total = 0;
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const path = resolve(folder, entry.name);
    if (entry.isDirectory()) total += await bytes(path);
    else total += (await stat(path)).size;
  }
  return total;
}
for (const target of targets.length ? targets : ['local', 'poki', 'crazygames']) {
  const size = await bytes(resolve('dist', target));
  console.log(`${target}: ${size} / ${MAX_BUILD_BYTES} complete artifact bytes (including debug maps)`);
  if (size > MAX_BUILD_BYTES) process.exitCode = 1;
}
