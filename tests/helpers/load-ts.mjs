import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import ts from 'typescript';

const root = fileURLToPath(new URL('../../', import.meta.url));
const nativeRequire = createRequire(new URL('../../package.json', import.meta.url));

/** Load actual TS dependencies in an isolated test context, including @/ aliases. */
export function loadTs(relativePath, { globals = {}, mocks = {} } = {}) {
  const cache = new Map();
  function load(file) {
    const filename = [file, `${file}.ts`, `${file}.tsx`].find(existsSync);
    if (!filename) throw new Error(`Missing test dependency: ${file}`);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loadedModule = { exports: {} };
    cache.set(filename, loadedModule);
    const source = ts.transpileModule(readFileSync(filename, 'utf8'), {
      fileName: filename,
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    vm.runInNewContext(source, {
      module: loadedModule, exports: loadedModule.exports, process, URL, URLSearchParams, Date, Intl,
      ...globals,
      require(name) {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        if (name.startsWith('@/')) return load(resolve(root, 'src', name.slice(2)));
        if (name.startsWith('.')) return load(resolve(dirname(filename), name));
        return nativeRequire(name);
      },
    }, { filename });
    return loadedModule.exports;
  }
  return load(resolve(root, relativePath));
}
