import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Node 22.16 has built-in TypeScript stripping; no package install is needed.
const root = fileURLToPath(new URL('../', import.meta.url));
const testFile = fileURLToPath(new URL('../tests/core/optics.test.ts', import.meta.url));
const coreRoot = new URL('../Assets/Scripts/Core/', import.meta.url).href;

// Lens requires extensionless imports. Resolve those imports to the same .ts
// files for Node, without copying/transpiling source or changing Lens settings.
const loaderSource = `
export async function resolve(specifier, context, nextResolve) {
  if (context.parentURL && (specifier.startsWith('./') || specifier.startsWith('../'))) {
    const target = new URL(specifier, context.parentURL);
    if (target.href.startsWith(${JSON.stringify(coreRoot)}) && !target.pathname.split('/').pop().includes('.')) {
      return nextResolve(target.href + '.ts', context);
    }
  }
  return nextResolve(specifier, context);
}
`;
const loaderUrl = 'data:text/javascript,' + encodeURIComponent(loaderSource);
const bootstrapSource = `import { register } from 'node:module'; register(${JSON.stringify(loaderUrl)}, ${JSON.stringify(import.meta.url)});`;
const bootstrapUrl = 'data:text/javascript,' + encodeURIComponent(bootstrapSource);
const run = spawnSync(process.execPath, [
  '--experimental-strip-types', '--experimental-default-type=module', '--import', bootstrapUrl, '--test', testFile,
], {
  cwd: root, stdio: 'inherit',
});
if (run.error) throw run.error;
process.exitCode = run.status ?? 1;
