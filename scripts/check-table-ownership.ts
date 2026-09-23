/**
 * Rule 7: a module reads and writes only its own tables.
 *
 * dependency-cruiser sees imports, not `prisma.user.findMany()` calls, so this script scans every
 * persistence file for Prisma model delegates (`<client>.<model>.<op>(`) and checks each one
 * against prisma/ownership.json. Model names come from the generated client so new models
 * cannot slip through unmapped.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const modulesDir = join(root, 'src/modules');
const ownership = JSON.parse(readFileSync(join(root, 'prisma/ownership.json'), 'utf8')) as Record<
  string,
  string[] | string
>;

const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8');
const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map(
  ([, name]) => name!.charAt(0).toLowerCase() + name!.slice(1),
);

const owners = new Map<string, string>();
const problems: string[] = [];

for (const [context, owned] of Object.entries(ownership)) {
  if (context.startsWith('$')) continue;
  for (const model of owned as string[]) owners.set(model, context);
}
for (const model of models) {
  if (!owners.has(model)) problems.push(`Model "${model}" has no owner in prisma/ownership.json`);
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.ts') ? [path] : [];
  });
}

const delegate = new RegExp(`\\.(${models.join('|')})\\s*\\.\\s*[a-zA-Z]+\\s*\\(`, 'g');

for (const context of existsSync(modulesDir) ? readdirSync(modulesDir) : []) {
  const contextDir = join(modulesDir, context);
  if (!statSync(contextDir).isDirectory()) continue;
  for (const file of walk(contextDir)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(delegate)) {
      const model = match[1]!;
      const owner = owners.get(model);
      if (owner !== context) {
        const line = source.slice(0, match.index).split('\n').length;
        problems.push(
          `${relative(root, file)}:${line} uses model "${model}" owned by "${owner ?? 'nobody'}"`,
        );
      }
    }
  }
}

if (problems.length > 0) {
  console.error(`Table ownership violations (rule 7):\n  ${problems.join('\n  ')}`);
  process.exit(1);
}
process.stdout.write(`Table ownership OK (${models.length} models).\n`);
