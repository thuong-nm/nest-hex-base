/**
 * Architecture rules (see AGENTS.md "Hard rules"). `pnpm lint:arch` fails on any violation.
 * Rule 7 (table ownership) cannot be expressed as an import rule; it is checked by
 * scripts/check-table-ownership.ts, which `lint:arch` also runs.
 *
 * In `to.path`/`to.pathNot`, `$1` refers to the first capture group of `from.path`
 * (it is NOT expanded inside `from.pathNot`).
 */
const KERNEL = '^src/shared/kernel/';
const PRISMA_CLIENT = ['^src/generated/prisma/', '(^|/)node_modules/@prisma/'];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'rule-1-domain-purity',
      comment: 'domain/ imports nothing except its own domain/ and shared/kernel.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/domain/' },
      to: { pathNot: ['^src/modules/$1/domain/', KERNEL] },
    },
    {
      name: 'rule-2-application-purity',
      comment: 'application/ imports only its own domain/, its own application/ and shared/kernel.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/application/' },
      to: { pathNot: ['^src/modules/$1/(domain|application)/', KERNEL] },
    },
    {
      name: 'kernel-purity',
      comment: 'shared/kernel is pure TypeScript: no framework, no infrastructure, no modules.',
      severity: 'error',
      from: { path: KERNEL },
      to: { pathNot: KERNEL },
    },
    {
      name: 'rule-4-prisma-only-in-persistence',
      comment:
        'Prisma is only touched by persistence adapters and the shared database module; ' +
        'repositories map Prisma models to domain entities.',
      severity: 'error',
      from: {
        pathNot: [
          '^src/modules/[^/]+/infrastructure/persistence/',
          '^src/shared/infrastructure/database/',
          '^src/generated/prisma/',
        ],
      },
      to: { path: PRISMA_CLIENT },
    },
    {
      name: 'rule-4-prisma-service-only-in-persistence',
      comment: 'PrismaService is injected only into repositories (and infra health checks).',
      severity: 'error',
      from: {
        pathNot: [
          '^src/modules/[^/]+/infrastructure/persistence/',
          '^src/shared/infrastructure/(database|health)/',
        ],
      },
      to: { path: '^src/shared/infrastructure/database/prisma\\.service\\.ts$' },
    },
    {
      name: 'rule-5-no-cross-module-internals',
      comment: 'Another module may only be reached through its index.ts facade.',
      severity: 'error',
      from: { path: '^src/modules/([^/]+)/' },
      to: {
        path: '^src/modules/',
        pathNot: ['^src/modules/$1/', '^src/modules/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'rule-5-facade-only-from-adapters',
      comment:
        "Only the consumer's infrastructure adapters, its event handlers (interface/events, to " +
        "subscribe to the provider's event classes) and its <context>.module.ts (to import the " +
        "provider's Nest module) may import another module's facade.",
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/',
        pathNot: [
          '^src/modules/[^/]+/infrastructure/',
          '^src/modules/[^/]+/interface/events/',
          '^src/modules/[^/]+/[^/]+\\.module\\.ts$',
        ],
      },
      to: { path: '^src/modules/[^/]+/index\\.ts$', pathNot: '^src/modules/$1/' },
    },
    {
      name: 'module-binding-only-in-module-file',
      comment:
        'Adapters are bound to ports only in <context>.module.ts; nothing else imports adapters.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/',
        pathNot: ['^src/modules/[^/]+/infrastructure/', '^src/modules/[^/]+/[^/]+\\.module\\.ts$'],
      },
      to: { path: '^src/modules/$1/infrastructure/' },
    },
    {
      name: 'interface-not-from-inside',
      comment: 'Dependencies point inward: nothing depends on the interface layer.',
      severity: 'error',
      from: {
        path: '^src/modules/([^/]+)/(domain|application|infrastructure)/',
      },
      to: { path: '^src/modules/$1/interface/' },
    },
    {
      name: 'shared-not-depend-on-modules',
      comment: 'Shared infrastructure is generic: it must not know any bounded context.',
      severity: 'error',
      from: { path: '^src/shared/' },
      to: { path: '^src/modules/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'not-to-dev-dep',
      comment: 'Production code must not import devDependencies.',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'not-to-test',
      comment:
        'Production code must not import test code (test/ is not built, so `#test/*` has no dist target).',
      severity: 'error',
      from: { path: '^src/' },
      to: { path: '^test/' },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules', '^src/generated/'] },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['development', 'import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types', 'typings'],
    },
    reporterOptions: { text: { highlightFocused: true } },
  },
};
