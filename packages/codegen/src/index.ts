import { parse } from "@swc/core";
import fse from "fs-extra";
import _glob from "glob";
import { join } from "path";
import { promisify } from "util";

const glob = promisify(_glob);
const { readFile, readdir, stat } = fse;

const dynamicSegmentRegex = /\[(.*)\]/;
const isDynamicSegment = (segment: string) => dynamicSegmentRegex.test(segment);

const routeGroupSegmentRegex = /\((.*)\)/;
const isRouteGroupSegment = (segment: string) =>
  routeGroupSegmentRegex.test(segment);

type SegmentLayout = {
  rewrite: string[];
  page: boolean;
  middleware: boolean;
  location: string;
  internalPath: string;
  externalPath: string;
  children: Record<string, SegmentLayout>;
};

const hasMiddleware = (filesAndFolders: string[]) =>
  filesAndFolders.includes("middleware.ts") ||
  filesAndFolders.includes("middleware.js");
const hasPage = (filesAndFolders: string[]) =>
  filesAndFolders.includes("page.tsx") ||
  filesAndFolders.includes("page.js") ||
  filesAndFolders.includes("page.jsx");
const hasRewrite = (filesAndFolders: string[]) => {
  return filesAndFolders.find((fileOrFolder) =>
    /^rewrite\.(?:js|ts)/.test(fileOrFolder)
  );
};

const collectRewrites = async (dir: string, filesAndFolders: string[]) => {
  const rewriteFile = hasRewrite(filesAndFolders);
  if (rewriteFile) {
    return await collectModuleExports(join(dir, rewriteFile));
  } else return [];
};

const collectChildren = async (
  dir: string,
  externalPath: string,
  filesAndFolders: string[],
  rewrite: string[]
) => {
  const children: Record<string, SegmentLayout> = {};
  await Promise.all(
    filesAndFolders.map(async (fileOrFolder) => {
      const stats = await stat(join(dir, fileOrFolder));
      if (stats.isDirectory()) {
        if (isRouteGroupSegment(fileOrFolder)) {
          children[fileOrFolder] = await collectLayout(
            join(dir, fileOrFolder),
            externalPath
          );
        } else {
          const match = dynamicSegmentRegex.exec(fileOrFolder);
          if (match) {
            if (rewrite.includes(match[1])) {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                externalPath
              );
            } else {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                join(externalPath, `:${match[1]}`)
              );
            }
          } else {
            children[fileOrFolder] = await collectLayout(
              join(dir, fileOrFolder),
              join(externalPath, fileOrFolder)
            );
          }
        }
      }
    })
  );
  return children;
};

const collectLayout = async (dir: string = "app", externalPath = "/") => {
  const filesAndFolders = await readdir(dir);
  const rewrite = await collectRewrites(dir, filesAndFolders);
  const layout: SegmentLayout = {
    location: dir,
    internalPath:
      dir === "app"
        ? "/"
        : "/" +
          dir
            .replace(/^app\//, "")
            .split("/")
            .map((segment) => {
              if (routeGroupSegmentRegex.test(segment)) return false;
              const match = dynamicSegmentRegex.exec(segment);
              if (!match) return segment;
              else return `:${match[1]}`;
            })
            .filter(Boolean)
            .join("/") +
          "/",
    externalPath: externalPath === "/" ? "/" : externalPath + "/",
    rewrite,
    page: hasPage(filesAndFolders),
    middleware: hasMiddleware(filesAndFolders),
    children: await collectChildren(
      dir,
      externalPath,
      filesAndFolders,
      rewrite
    ),
  };
  return layout;
};

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

const validateLayout = () => {};

const generate = async (layout: SegmentLayout) => {};

collectLayout().then((layout) => console.log(JSON.stringify(layout, null, 2)));
