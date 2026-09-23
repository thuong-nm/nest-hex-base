/**
 * Unit specs live under test/ at the path of the file they cover:
 * src/modules/users/domain/events/user-registered.event.ts
 *   -> test/modules/users/domain/events/user-registered.event.spec.ts
 *
 * Fails when a spec sits inside src/, or when a mirrored spec has no source file (usually a spec
 * left behind after its source was renamed or moved).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
// test/ folders that mirror src/. The rest (fakes/, i18n/, e2e/) are not tied to one source file.
const MIRRORED = ['modules', 'shared'];

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

const problems: string[] = [];

for (const file of walk(join(root, 'src'))) {
  if (!file.endsWith('.spec.ts')) continue;
  const rel = relative(join(root, 'src'), file);
  problems.push(`${relative(root, file)}: move it to test/${rel}`);
}

for (const folder of MIRRORED) {
  for (const file of walk(join(root, 'test', folder))) {
    if (!file.endsWith('.spec.ts')) continue;
    const source = join(root, 'src', relative(join(root, 'test'), file)).replace(
      /\.spec\.ts$/,
      '.ts',
    );
    if (!existsSync(source)) {
      problems.push(`${relative(root, file)}: no source file at ${relative(root, source)}`);
    }
  }
}

if (problems.length > 0) {
  console.error('Test layout violations:\n' + problems.map((p) => `  - ${p}`).join('\n'));
  process.exit(1);
}
process.stdout.write('Test layout OK\n');
