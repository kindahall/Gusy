import { spawn } from 'node:child_process';
import { readdir, rm, mkdir } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const testsDir = join(root, 'tests');
const outDir = join(root, '.e2e-build');

await rm(outDir, { recursive: true, force: true });
await mkdir(outDir, { recursive: true });

const testFiles = (await readdir(testsDir))
  .filter((file) => file.endsWith('.e2e.test.ts'))
  .sort()
  .map((file) => join(testsDir, file));

if (!testFiles.length) {
  console.error('No E2E tests found.');
  process.exit(1);
}

await build({
  entryPoints: testFiles,
  outdir: outDir,
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'node20',
  outExtension: { '.js': '.mjs' },
  sourcemap: false
});

const builtTests = testFiles.map((file) => join(outDir, `${basename(file, '.ts')}.mjs`));
const child = spawn(process.execPath, ['--test', ...builtTests], {
  cwd: root,
  stdio: 'inherit'
});

const code = await new Promise((resolve) => {
  child.on('close', resolve);
});

await rm(outDir, { recursive: true, force: true });
process.exit(typeof code === 'number' ? code : 1);
