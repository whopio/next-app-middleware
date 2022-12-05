import { parse } from "@swc/core";
import { createHash } from "crypto";
import fse from "fs-extra";
import _glob from "glob";
import { join } from "path";
import { promisify } from "util";
import { SegmentLayout } from "./types";

const glob = promisify(_glob);
const { readFile, readdir, stat } = fse;

const dynamicSegmentRegex = /\[(.*)\]/;
const isDynamicSegment = (segment: string) => dynamicSegmentRegex.test(segment);

const routeGroupSegmentRegex = /\((.*)\)/;
const isRouteGroupSegment = (segment: string) =>
  routeGroupSegmentRegex.test(segment);

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
  rewrite: string[],
  getParent: () => SegmentLayout
) => {
  const children: Record<string, SegmentLayout> = {};
  await Promise.all(
    filesAndFolders.map(async (fileOrFolder) => {
      const stats = await stat(join(dir, fileOrFolder));
      if (stats.isDirectory()) {
        if (isRouteGroupSegment(fileOrFolder)) {
          children[fileOrFolder] = await collectLayout(
            join(dir, fileOrFolder),
            externalPath,
            getParent
          );
        } else {
          const match = dynamicSegmentRegex.exec(fileOrFolder);
          if (match) {
            if (rewrite.includes(match[1])) {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                externalPath,
                getParent
              );
            } else {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                join(externalPath, `:${match[1]}`),
                getParent
              );
            }
          } else {
            children[fileOrFolder] = await collectLayout(
              join(dir, fileOrFolder),
              join(externalPath, fileOrFolder),
              getParent
            );
          }
        }
      }
    })
  );
  return children;
};

const collectLayout = async (
  dir: string = "app",
  externalPath = "/",
  getParent?: () => SegmentLayout
) => {
  const filesAndFolders = await readdir(dir);
  const [currentSegment] = dir.split("/").reverse();
  const dynamic = dynamicSegmentRegex.exec(currentSegment)?.[1];
  const rewrite = await collectRewrites(dir, filesAndFolders);
  const hash =
    externalPath === "/"
      ? "/"
      : externalPath
          .split("/")
          .map((segment) => (segment.startsWith(":") ? ":" : segment))
          .join("/") + "/";
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
    hash,
    dynamic,
    rewrite,
    page: hasPage(filesAndFolders),
    middleware: hasMiddleware(filesAndFolders),
    hashes: {
      middleware: createHash("sha1")
        .update(join(dir, "middleware"))
        .digest("hex")
        .slice(0, 12),
      rewrite: rewrite.reduce(
        (acc, val) => ({
          ...acc,
          [val]: createHash("sha1")
            .update(join(dir, "rewrite", val))
            .digest("hex")
            .slice(0, 12),
        }),
        {}
      ),
    },
    children: await collectChildren(
      dir,
      externalPath,
      filesAndFolders,
      rewrite,
      () => layout
    ),
    parent: getParent,
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

const getPages = (layout: SegmentLayout): SegmentLayout[] => {
  const result: SegmentLayout[] = [];
  if (layout.page) result.push(layout);
  for (const child of Object.values(layout.children)) {
    result.push(...getPages(child));
  }
  return result;
};

const getSimilarPages = (pages: SegmentLayout[]) => {
  const result: Record<string, SegmentLayout[]> = {};
  for (const page of pages) {
    if (!result[page.hash]) result[page.hash] = [page];
    else result[page.hash].push(page);
  }
  return result;
};

const getRoute = (page: SegmentLayout): SegmentLayout[] => {
  const result: SegmentLayout[] = [page];
  let getParent = page.parent;
  while (getParent) {
    const parent = getParent();
    result.push(parent);
    getParent = parent.parent;
  }
  return result.reverse();
};

const validateLayout = (externalLayout: Record<string, SegmentLayout[]>) => {
  for (const pages of Object.values(externalLayout)) {
    const externalPath = pages[0].externalPath;
    for (const page of pages.slice(1)) {
      if (page.externalPath !== externalPath)
        throw new Error(
          `Invalid Configuration: ${externalPath} and ${page.externalPath} result in different pages but the same Matcher.`
        );
    }
  }
};

const generate = async (layout: SegmentLayout) => {};

collectLayout().then((layout) => {
  console.log(JSON.stringify(layout, null, 2));
  const pages = getPages(layout);
  const externalLayout = getSimilarPages(pages);
  console.log(externalLayout);
  validateLayout(externalLayout);
});
