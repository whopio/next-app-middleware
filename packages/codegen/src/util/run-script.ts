import Module from "module";
import { dirname } from "path";
import { runInNewContext } from "vm";
import fse from "fs-extra";
import { transform } from "@swc/core";

const { readFile } = fse;

type WrappedModule<T = unknown> = (
  exports: any,
  req: typeof require,
  module: any,
  __filename: string,
  __dirnaname: string
) => T;

const executeScript = <T = unknown>(src: string, location: string): T => {
  const wrapped = Module.wrap(src);
  const mod = { exports: {} };
  const script: WrappedModule = runInNewContext(wrapped, global);
  script(mod.exports, require, mod, location, dirname(location));
  return mod.exports as T;
};

const runScrpt = async <T = unknown>(path: string) => {
  const raw = await readFile(path, {
    encoding: "utf-8",
  });
  const { code } = await transform(raw, {
    jsc: {
      parser: {
        syntax: "typescript",
        tsx: false,
      },
      target: "es5",
    },
    module: {
      type: "commonjs",
    },
  });
  return executeScript<T>(code, path.replace(/\.ts$/, ".js"));
};

export default runScrpt;
