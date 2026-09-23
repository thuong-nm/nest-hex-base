// `pnpm gen:module <context> [entity]` scaffolds a bounded context that passes typecheck, lint,
// lint:arch and test straight away. See AGENTS.md "Recipe: add a bounded context".
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = import.meta.dirname;
const TEMPLATES = join(ROOT, 'plop-templates/module');
const SCHEMA = join(ROOT, 'prisma/schema.prisma');
const OWNERSHIP = join(ROOT, 'prisma/ownership.json');
const APP_MODULE = join(ROOT, 'src/app.module.ts');
const APP_MODULE_MARKER = '    // gen:module inserts new bounded contexts above this line';

const KEBAB = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const pascal = (s) => s.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
const camel = (s) => pascal(s).replace(/^./, (c) => c.toLowerCase());
const constant = (s) => s.replaceAll('-', '_').toUpperCase();
const snake = (s) => s.replaceAll('-', '_');
const singular = (s) =>
  s.endsWith('ies')
    ? `${s.slice(0, -3)}y`
    : s.endsWith('s') && !s.endsWith('ss')
      ? s.slice(0, -1)
      : s;

const locales = () =>
  readdirSync(join(ROOT, 'src/i18n'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

function validateEntity(value) {
  if (!KEBAB.test(value)) return 'Use kebab-case: lowercase letters, digits and dashes.';
  const schema = readFileSync(SCHEMA, 'utf8');
  if (new RegExp(`^model\\s+${pascal(value)}\\s`, 'm').test(schema)) {
    return `Prisma model ${pascal(value)} already exists.`;
  }
  return true;
}

/** @param {import('plop').NodePlopAPI} plop */
export default function (plop) {
  plop.setHelper('pascal', pascal);
  plop.setHelper('camel', camel);
  plop.setHelper('constant', constant);
  plop.setHelper('snake', snake);

  plop.setActionType('patch-files', (answers) => {
    const context = answers.context;
    const entity = answers.entity;
    const Entity = pascal(entity);

    const schema = readFileSync(SCHEMA, 'utf8');
    writeFileSync(
      SCHEMA,
      `${schema.trimEnd()}

// ---------- module: ${context} ----------

model ${Entity} {
  id        String   @id @db.Uuid
  name      String
  createdAt DateTime @map("created_at") @db.Timestamptz(3)
  updatedAt DateTime @map("updated_at") @db.Timestamptz(3)

  @@map("${snake(context)}")
}
`,
    );

    const ownership = JSON.parse(readFileSync(OWNERSHIP, 'utf8'));
    ownership[context] = [camel(entity)];
    writeFileSync(OWNERSHIP, `${JSON.stringify(ownership, null, 2)}\n`);

    const appModule = readFileSync(APP_MODULE, 'utf8');
    if (!appModule.includes(APP_MODULE_MARKER)) {
      throw new Error(`Marker not found in src/app.module.ts: "${APP_MODULE_MARKER.trim()}"`);
    }
    const importLine = `import { ${pascal(context)}Module } from './modules/${context}/index.js';\n`;
    writeFileSync(
      APP_MODULE,
      appModule
        .replace(/^(import [^\n]+\n)(?!import )/m, `$1${importLine}`)
        .replace(APP_MODULE_MARKER, `    ${pascal(context)}Module,\n${APP_MODULE_MARKER}`),
    );
    return 'patched prisma/schema.prisma, prisma/ownership.json, src/app.module.ts';
  });

  plop.setActionType('regenerate', (answers) => {
    execSync('pnpm exec prisma generate', { cwd: ROOT, stdio: 'ignore' });
    execSync('pnpm i18n:types', { cwd: ROOT, stdio: 'ignore' });
    execSync(
      `pnpm exec prettier --write src/app.module.ts src/modules/${answers.context} ` +
        `test/modules/${answers.context} test/fakes/${answers.context} prisma/ownership.json "src/i18n/*/${answers.context}.json"`,
      { cwd: ROOT, stdio: 'ignore' },
    );
    return 'regenerated Prisma client and i18n types, formatted new files';
  });

  plop.setGenerator('module', {
    description: 'Scaffold a bounded context (hexagonal module)',
    prompts: [
      {
        type: 'input',
        name: 'context',
        message: 'Context name (kebab-case, usually plural, e.g. "orders"):',
        validate: (value) => {
          if (!KEBAB.test(value)) return 'Use kebab-case: lowercase letters, digits and dashes.';
          if (existsSync(join(ROOT, 'src/modules', value)))
            return `src/modules/${value} already exists.`;
          return true;
        },
      },
      {
        type: 'input',
        name: 'entity',
        message: 'Aggregate name (kebab-case, singular, e.g. "order"):',
        default: (answers) => singular(answers.context),
        // Without a TTY (CI, AI agents) the prompt would abort; fall back to the default instead.
        // A boolean, not a function: node-plop refuses CLI bypass values for function `when`s,
        // which would break `pnpm gen:module <context> <entity>`.
        when: process.stdin.isTTY === true,
        validate: validateEntity,
      },
    ],
    actions: (answers) => {
      answers.entity ??= singular(answers.context);
      const invalid = validateEntity(answers.entity);
      if (invalid !== true) throw new Error(invalid);

      const base = 'src/modules/{{context}}';
      const file = (path, template) => ({
        type: 'add',
        path: `${base}/${path}`,
        templateFile: `${TEMPLATES}/${template}`,
      });
      // Unit specs mirror their source path under test/ (src/modules/x/a.ts -> test/modules/x/a.spec.ts).
      const testFile = (path, template) => ({
        type: 'add',
        path: `test/modules/{{context}}/${path}`,
        templateFile: `${TEMPLATES}/${template}`,
      });
      return [
        file('domain/entities/{{entity}}.entity.ts', 'entity.ts.hbs'),
        file('domain/events/{{entity}}-created.event.ts', 'event.ts.hbs'),
        file('domain/errors/{{context}}.errors.ts', 'errors.ts.hbs'),
        file('domain/value-objects/.gitkeep', 'gitkeep.hbs'),
        file('application/ports/{{entity}}.repository.port.ts', 'repository.port.ts.hbs'),
        file('application/dto/create-{{entity}}.command.ts', 'command.ts.hbs'),
        file('application/dto/{{entity}}.result.ts', 'result.ts.hbs'),
        file('application/use-cases/create-{{entity}}.use-case.ts', 'create.use-case.ts.hbs'),
        file('application/use-cases/get-{{entity}}.use-case.ts', 'get.use-case.ts.hbs'),
        file(
          'infrastructure/persistence/prisma-{{entity}}.repository.ts',
          'prisma.repository.ts.hbs',
        ),
        file('infrastructure/persistence/{{entity}}.mapper.ts', 'mapper.ts.hbs'),
        file('infrastructure/adapters/.gitkeep', 'gitkeep.hbs'),
        file('interface/http/{{context}}.controller.ts', 'controller.ts.hbs'),
        file('interface/http/dto/create-{{entity}}.request.dto.ts', 'request.dto.ts.hbs'),
        file('interface/http/dto/{{entity}}.response.dto.ts', 'response.dto.ts.hbs'),
        file('{{context}}.module.ts', 'module.ts.hbs'),
        file('index.ts', 'index.ts.hbs'),
        testFile(
          'application/use-cases/create-{{entity}}.use-case.spec.ts',
          'create.use-case.spec.ts.hbs',
        ),
        testFile(
          'application/use-cases/get-{{entity}}.use-case.spec.ts',
          'get.use-case.spec.ts.hbs',
        ),
        {
          type: 'add',
          path: 'test/fakes/{{context}}/in-memory-{{entity}}.repository.ts',
          templateFile: `${TEMPLATES}/in-memory.repository.ts.hbs`,
        },
        ...locales().map((lang) => ({
          type: 'add',
          path: `src/i18n/${lang}/{{context}}.json`,
          templateFile: `${TEMPLATES}/i18n.json.hbs`,
        })),
        { type: 'patch-files' },
        { type: 'regenerate' },
        () =>
          [
            `Next steps for "${answers.context}":`,
            '  1. pnpm db:migrate --name add-' + answers.context,
            `  2. Translate src/i18n/<lang>/${answers.context}.json (non-English locales were seeded with English).`,
            '  3. Replace the example "name" field with the real domain model.',
          ].join('\n'),
      ];
    },
  });
}
