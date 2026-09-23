/**
 * Generates src/generated/i18n.generated.ts from the English translations so every i18n key used
 * in code is type-checked. The file is committed; `--check` (run by `pnpm typecheck`) fails when
 * it is stale instead of rewriting it, so a forgotten regeneration cannot pass silently.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateI18nTypes } from 'nestjs-i18n';

const root = process.cwd();
const output = join(root, 'src/generated/i18n.generated.ts');
const check = process.argv.includes('--check');

const read = (): string | null => {
  try {
    return readFileSync(output, 'utf8');
  } catch {
    return null;
  }
};

const before = read();
// Keys of all locales are merged; the locale-completeness test guarantees they are identical.
await generateI18nTypes({ path: join(root, 'src/i18n'), output, watch: false });
const after = read();

if (check && before !== after) {
  console.error('src/generated/i18n.generated.ts was stale and has been regenerated. Commit it.');
  process.exit(1);
}
