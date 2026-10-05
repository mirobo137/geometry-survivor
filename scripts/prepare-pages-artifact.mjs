import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, resolve } from 'node:path';

const distRoot = resolve('dist');
const sourceRoot = resolve(distRoot, 'local');
const pagesRoot = resolve(distRoot, 'pages');

if (resolve(sourceRoot, '..') !== distRoot || resolve(pagesRoot, '..') !== distRoot) {
  throw new Error('Build paths must remain directly inside dist/.');
}
if (!(await stat(sourceRoot).catch(() => null))?.isDirectory()) {
  throw new Error('Missing dist/local. Build the local target before staging Pages.');
}

async function listFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

const sourceFiles = await listFiles(sourceRoot);
const maps = sourceFiles.filter((path) => extname(path) === '.map');
if (maps.length === 0) {
  throw new Error('Local build produced no source maps; refusing to deploy without diagnostics.');
}
const mapPaths = new Set(maps);
const linkedMaps = new Set();
const sourceMapUrlAtEnd = /(?:\/\/[#@]\s*sourceMappingURL=([^\s]+)|\/\*[#@]\s*sourceMappingURL=([^\s*]+)\s*\*\/)\s*$/;

for (const path of sourceFiles.filter((file) => ['.js', '.css'].includes(extname(file)))) {
  const content = await readFile(path, 'utf8');
  const match = content.match(sourceMapUrlAtEnd);
  if (!match) continue;
  const mapPath = resolve(dirname(path), match[1] ?? match[2]);
  if (!mapPaths.has(mapPath)) {
    throw new Error(`Diagnostic bundle points to a missing source map: ${path}`);
  }
  linkedMaps.add(mapPath);
}
if (linkedMaps.size === 0 || linkedMaps.size !== maps.length) {
  throw new Error(`Expected every local source map to be linked from its exact JS/CSS bundle (${linkedMaps.size}/${maps.length}).`);
}

await rm(pagesRoot, { recursive: true, force: true });
await mkdir(pagesRoot, { recursive: true });
await cp(sourceRoot, pagesRoot, {
  recursive: true,
  filter: (path) => extname(path) !== '.map'
});

const copiedFiles = await listFiles(pagesRoot);
let strippedMapLinks = 0;
const sourceMapLinkAtEnd = /(?:\r?\n)?(?:\/\/[#@]\s*sourceMappingURL=[^\r\n]*|\/\*[#@]\s*sourceMappingURL=[\s\S]*?\*\/)\s*$/;
for (const path of copiedFiles.filter((file) => ['.js', '.css'].includes(extname(file)))) {
  const content = await readFile(path, 'utf8');
  const clean = content.replace(sourceMapLinkAtEnd, '');
  if (clean !== content) {
    await writeFile(path, clean, 'utf8');
    strippedMapLinks++;
  }
}

const publicFiles = await listFiles(pagesRoot);
if (publicFiles.some((path) => extname(path) === '.map')) {
  throw new Error('A source map leaked into the public Pages staging directory.');
}
for (const path of publicFiles.filter((file) => ['.js', '.css'].includes(extname(file)))) {
  if (sourceMapLinkAtEnd.test(await readFile(path, 'utf8'))) {
    throw new Error(`A sourceMappingURL comment leaked into public output: ${path}`);
  }
}
const mapBytes = await Promise.all(maps.map(async (path) => (await stat(path)).size))
  .then((sizes) => sizes.reduce((total, size) => total + size, 0));
console.log(`Pages staging: ${publicFiles.length} public files; stripped ${strippedMapLinks} map links and excluded ${maps.length} source maps (${mapBytes} bytes). Diagnostic bundles remain linked in dist/local for CI upload.`);
