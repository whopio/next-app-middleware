import { parse } from "@swc/core";
import fse from "fs-extra";
import { join } from "path";

const { readFile } = fse;

const collectModuleExports = async (path: string) => {
  const code = await readFile(join(process.cwd(), path), { encoding: "utf8" });
  const ast = await parse(code, {
    syntax: "typescript",
  });
  const exports = [];
  for (const item of ast.body) {
    if (item.type === "ExportDeclaration") {
      const { declaration } = item;
      if (declaration.type === "VariableDeclaration") {
        const { declarations } = declaration;
        for (const variableDeclarator of declarations) {
          if (variableDeclarator.id.type === "Identifier")
            exports.push(variableDeclarator.id.value);
        }
      } else if (declaration.type === "FunctionDeclaration")
        exports.push(declaration.identifier.value);
    } else if (item.type === "ExportNamedDeclaration") {
      for (const specifier of item.specifiers) {
        if (specifier.type === "ExportSpecifier") {
          if (specifier.exported) exports.push(specifier.exported.value);
          else exports.push(specifier.orig.value);
        }
      }
    }
  }
  return exports;
};

export default collectModuleExports;
