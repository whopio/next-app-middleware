import { parse } from "@swc/core";
import { createHash } from "crypto";
import fse from "fs-extra";
import { join } from "path";
import { renderMiddleware, RenderSegmentImportArgs } from "./render";
import { ExternalLayout, LayoutType, SegmentLayout } from "./types";
import { format } from "prettier";
import { watch } from "chokidar";

const { readFile, readdir, stat, outputFile } = fse;

const dynamicSegmentRegex = /\[(.*)\]/;
const isDynamicSegment = (segment: string) => dynamicSegmentRegex.test(segment);

const routeGroupSegmentRegex = /\((.*)\)/;
const isRouteGroupSegment = (segment: string) =>
  routeGroupSegmentRegex.test(segment);

const middlewareRegex = /^(middleware\.(?:t|j)s)$/;
const findMiddleware = (filesAndFolders: string[]) =>
  filesAndFolders.find((fileOrfolder) => middlewareRegex.test(fileOrfolder));

const pageRegex = /^(page\.(?:tsx|jsx?))$/;
const findPage = (filesAndFolders: string[]) =>
  filesAndFolders.find((fileOrfolder) => pageRegex.test(fileOrfolder));

const rewriteRegex = /^(rewrite\.(?:t|j)s)$/;
const findRewrite = (filesAndFolders: string[]) =>
  filesAndFolders.find((fileOrfolder) => rewriteRegex.test(fileOrfolder));

const collectRewrites = async (dir: string, filesAndFolders: string[]) => {
  const rewriteFile = findRewrite(filesAndFolders);
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
            rewrite,
            getParent
          );
        } else {
          const match = dynamicSegmentRegex.exec(fileOrFolder);
          if (match) {
            if (rewrite.includes(match[1])) {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                externalPath,
                rewrite,
                getParent
              );
            } else {
              children[fileOrFolder] = await collectLayout(
                join(dir, fileOrFolder),
                join(externalPath, `:${match[1]}`),
                rewrite,
                getParent
              );
            }
          } else {
            children[fileOrFolder] = await collectLayout(
              join(dir, fileOrFolder),
              join(externalPath, fileOrFolder),
              rewrite,
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
  parentRewrite: string[] = [],
  getParent?: () => SegmentLayout
) => {
  const filesAndFolders = await readdir(dir);
  const [currentSegment] = dir.split("/").reverse();
  const dynamic = dynamicSegmentRegex.exec(currentSegment)?.[1];
  const rewrite = isRouteGroupSegment(currentSegment)
    ? parentRewrite
    : await collectRewrites(dir, filesAndFolders);
  const hash =
    externalPath === "/"
      ? "/"
      : externalPath
          .split("/")
          .map((segment) => (segment.startsWith(":") ? ":" : segment))
          .join("/") + "/";
  const layoutPage = findPage(filesAndFolders);
  const layoutMiddleware = findMiddleware(filesAndFolders);
  const layoutRewrite = findRewrite(filesAndFolders);
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
    segment: currentSegment,
    group: isRouteGroupSegment(currentSegment),
    hash,
    dynamic,
    rewrite,
    page: !!layoutPage,
    middleware: !!layoutMiddleware,
    files: {
      middleware: layoutMiddleware,
      page: layoutPage,
      rewrite: layoutRewrite,
    },
    hashes: {
      middleware:
        !!layoutMiddleware &&
        createHash("sha1")
          .update(join(dir, "middleware"))
          .digest("hex")
          .slice(0, 12),
      rewrite: isRouteGroupSegment(currentSegment)
        ? {}
        : rewrite.reduce(
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

const validateLayout = (externalLayout: ExternalLayout) => {
  for (const pages of Object.values(externalLayout)) {
    const externalPath = pages[0].externalPath;
    for (const page of pages.slice(1)) {
      if (page.externalPath !== externalPath)
        throw new Error(
          `Invalid Configuration: ${pages[0].location} and ${page.location} result in different pages but the same Matcher.`
        );
      const sameInternalPath = pages.find(
        (test) => test !== page && test.internalPath === page.internalPath
      );
      if (sameInternalPath)
        throw new Error(
          `Invalid Configuration: ${sameInternalPath.location} and ${page.location} result in the same external and internal path, but different routing.`
        );
    }
  }
};

type MergedRoute = [
  current: SegmentLayout,
  next?: MergedRoute | 1,
  rewrite?: MergedRoute
];

type FlattenedRoute = [
  current: string,
  currentSegment: SegmentLayout,
  next?: FlattenedRoute | 1,
  rewrite?: FlattenedRoute | 1
];

const resolveLayouts = (pages: SegmentLayout[]) => {
  const resolved = pages
    .sort(({ location: locationA }, { location: locationB }) => {
      const diff = locationA.split("/").length - locationB.split("/").length;
      if (diff === 0) return locationA.length - locationB.length;
      else return diff;
    })
    .map((layout) => getRoute(layout));
  return resolved;
};

const filterDynamicRoutes =
  (rewrite: string[]) =>
  ([page, ...rest]: SegmentLayout[]) => {
    let current: SegmentLayout | undefined = page;
    while (current && current.group) current = rest.shift();
    if (!current) return false;
    return current.dynamic && rewrite.includes(current.dynamic);
  };

const filterNextRoutes =
  (rewrite: string[]) =>
  ([page, ...rest]: SegmentLayout[]) => {
    let current: SegmentLayout | undefined = page;
    while (current && current.group) current = rest.shift();
    if (!current) return true;
    return !current.dynamic || !rewrite.includes(current.dynamic);
  };

// this assumes that the first page in each collection is the same
const mergeLayouts = (pages: SegmentLayout[][]): MergedRoute => {
  const [[currentPage]] = pages;
  const nextPages = pages.map(([, ...pages]) => pages);
  const hasLast = !!nextPages.find((pages) => pages.length === 0);
  const nexts = nextPages.filter(filterNextRoutes(currentPage.rewrite));
  const rewrites = nextPages.filter(filterDynamicRoutes(currentPage.rewrite));
  if (hasLast && nexts.length > 1) {
    throw new Error("1");
  }
  const next = hasLast ? 1 : nexts.length ? mergeLayouts(nexts) : undefined;
  const rewrite = rewrites.length ? mergeLayouts(rewrites) : undefined;
  return [currentPage, next, rewrite];
};

const getNextDynamicParam = ([current, , rewrite]: MergedRoute): string => {
  if (current.dynamic) return current.dynamic;
  else if (!rewrite) throw new Error("getNextDynamicParam");
  else return getNextDynamicParam(rewrite);
};

const flattenMergedRoute = ([current, next, rewrite]: MergedRoute):
  | FlattenedRoute
  | 1
  | undefined => {
  if (current.middleware) {
    if (rewrite) {
      const flattenedRoute: FlattenedRoute = [
        current.hashes.middleware as string,
        current,
        flattenMergedRoute([{ ...current, middleware: false }, next, rewrite]),
      ];
      return flattenedRoute;
    } else {
      const flattenedRoute: FlattenedRoute = [
        current.hashes.middleware as string,
        current,
        next === 1 ? 1 : next && flattenMergedRoute(next),
        rewrite && flattenMergedRoute(rewrite),
      ];
      return flattenedRoute;
    }
  } else if (rewrite) {
    const param = getNextDynamicParam(rewrite);
    const flattenedRoute: FlattenedRoute = [
      current.hashes.rewrite[param],
      current,
      next === 1 ? 1 : next && flattenMergedRoute(next),
      rewrite && flattenMergedRoute(rewrite),
    ];
    return flattenedRoute;
  } else {
    if (next === 1) return 1;
    return next && flattenMergedRoute(next);
  }
};

const traverseRoute = <T>(
  [hash, current, next, rewrite]: FlattenedRoute,
  onSegment: (hash: string, segment: SegmentLayout) => T
): LayoutType<T> => {
  return [
    onSegment(hash, current),
    next === 1 ? 1 : next && traverseRoute(next, onSegment),
    rewrite === 1 ? 1 : rewrite && traverseRoute(rewrite, onSegment),
  ];
};

const generate = async () => {
  const layout = await collectLayout();
  const pages = getPages(layout);
  const externalLayout = getSimilarPages(pages);
  validateLayout(externalLayout);
  const routes = Object.entries(externalLayout).map(([key, layouts]) => {
    const resolvedLayouts = resolveLayouts(layouts);
    const mergedRoutes = mergeLayouts(resolvedLayouts);
    return [key, flattenMergedRoute(mergedRoutes) as FlattenedRoute] as const;
  });
  const imported: Record<string, RenderSegmentImportArgs> = {};
  let hasMiddleware = false,
    hasRewrite = false;
  const layoutRoutes: Array<[string, LayoutType<string>]> = [];
  routes.forEach(([routeHash, route]) => {
    const replaced = traverseRoute(route, (hash, segment) => {
      if (!imported[hash]) {
        if (hash === segment.hashes.middleware) {
          imported[hash] = [
            hash,
            segment.location,
            segment.internalPath,
            "middleware",
          ];
          hasMiddleware = true;
        } else {
          const [rewrite] =
            Object.entries(segment.hashes.rewrite).find(
              ([, rewriteHash]) => rewriteHash === hash
            ) || [];
          if (!rewrite) throw new Error("3");
          imported[hash] = [
            hash,
            segment.location,
            segment.internalPath,
            "rewrite",
            rewrite,
          ];
          hasRewrite = true;
        }
      }
      return `segment_${hash}`;
    });
    layoutRoutes.push([routeHash, replaced]);
  });
  const middleware = renderMiddleware(
    hasMiddleware,
    hasRewrite,
    imported,
    layoutRoutes
  );
  return format(middleware, { parser: "babel-ts" });
};

class CancelToken {
  public cancelled = false;
  public onCancel?: () => void;
  public cancel() {
    this.cancelled = true;
    this.onCancel && this.onCancel();
  }
}

export const build = async (token?: CancelToken) => {
  const code = await generate();
  if (token && token.cancelled) return;
  await outputFile(join(process.cwd(), "middleware.ts"), code);
  console.log("Successfuly built middleware.");
};

export const dev = async () => {
  await build();
  console.log("watching for middleware changes...");
  const middlewareWatcher = watch("app/**/middleware.{ts,js}");
  const rewriteWatcher = watch("app/**/rewrite.{ts,js}");
  let cancelToken: CancelToken;
  const runBuild = (type: string) => (file: string) => {
    console.log(`${type} ${file}`);
    if (cancelToken) cancelToken.cancel();
    cancelToken = new CancelToken();
    build(cancelToken);
  };
  middlewareWatcher
    .on("add", runBuild("added"))
    .on("unlink", runBuild("deleted"));
  rewriteWatcher
    .on("add", runBuild("added"))
    .on("unlink", runBuild("deleted"))
    .on("change", runBuild("changed"));
};
