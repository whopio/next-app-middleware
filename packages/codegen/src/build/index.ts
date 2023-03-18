import {
  Imports,
  renderRouter,
} from "@next-app-middleware/runtime/dist/router/ejected";
import { transform } from "@swc/core";
import fse from "fs-extra";
import { join } from "path";
import { format } from "prettier";
import { FlattenedRoute, RouteTypes, SegmentLayout } from "../types";
import CancelToken from "../util/CancelToken";
import logger from "../util/log";
import collectLayout from "./collect-layout";
import collectPublicFiles from "./collect-public";
import { addRoutesToMap, ejectMatcherMap, toMatcherMap } from "./eject";
import getConfigRewrites from "./get-config-rewrites";
import getPages, { getRoutes, getSimilarPages } from "./get-pages";
import { mergeLayouts, resolveLayouts, validateLayout } from "./layout";
import readHooksConfig from "./read-config";
import { flattenMergedRoute, OnSegment, traverseRoute } from "./route";

const { outputFile, stat } = fse;

/**
 * @returns true if tsconfig.json exists
 */
const isTypescript = async () => {
  try {
    const stats = await stat(join(process.cwd(), "tsconfig.json"));
    return stats.isFile();
  } catch {
    return false;
  }
};

const generate = async (isTypescriptPromise: Promise<boolean>) => {
  const hooksPromise = readHooksConfig();
  const publicPromise = collectPublicFiles();
  const layout = await collectLayout();
  const pages = getPages(layout);
  const externalLayout = getSimilarPages(pages);
  validateLayout(externalLayout);
  const routes = Object.entries(externalLayout).map(([key, layouts]) => {
    const resolvedLayouts = resolveLayouts(layouts);
    const mergedRoutes = mergeLayouts(resolvedLayouts);
    return [
      key,
      flattenMergedRoute(mergedRoutes) as FlattenedRoute | SegmentLayout,
    ] as const;
  });
  const imports: Imports = {
    "forward.dynamic": new Set(),
    "forward.static": new Set(),
    middleware: new Set(),
    redirect: new Set(),
    rewrite: new Set(),
  };
  const externals: SegmentLayout[] = [];
  const onSegment: OnSegment<undefined> = (segment, { type }) => {
    switch (type) {
      case RouteTypes.MIDDLEWARE: {
        imports.middleware.add(segment.location);
        break;
      }
      case RouteTypes.DYNAMIC_FORWARD: {
        imports["forward.dynamic"].add(segment.location);
        break;
      }
      case RouteTypes.STATIC_FORWARD: {
        imports["forward.static"].add(segment.location);
        break;
      }
      case RouteTypes.NEXT: {
        if (segment.external) {
          externals.push(segment);
        } else {
          if (segment.redirect) imports.redirect.add(segment.location);
          if (segment.rewrite) imports.rewrite.add(segment.location);
        }
        break;
      }
      default: {
        const _exhaustive: never = type;
        return _exhaustive;
      }
    }
  };
  routes.forEach(([, route]) => {
    if (route instanceof Array) traverseRoute(route, onSegment);
    else onSegment(route, { type: RouteTypes.NEXT });
  });
  const routeEndpoints = getRoutes(layout);
  const ejectedBranches = ejectMatcherMap(
    addRoutesToMap(toMatcherMap(routes), routeEndpoints)
  );
  const ejectedRouter = renderRouter({
    branches: ejectedBranches,
    publicFiles: await publicPromise,
    hooks: await hooksPromise,
    imports,
  });
  const configRewrites = getConfigRewrites(externals);
  if (await isTypescriptPromise) {
    logger.info("using typescript");
    return {
      code: format(ejectedRouter, { parser: "babel-ts" }),
      rewrites: configRewrites,
    };
  } else {
    logger.info("using javascript");
    const { code } = await transform(ejectedRouter, {
      jsc: {
        parser: {
          syntax: "typescript",
          dynamicImport: true,
        },
        target: "es2022",
      },
      module: {
        type: "es6",
      },
      sourceMaps: false,
    });
    return {
      code: format(code, { parser: "babel" }),
      rewrites: configRewrites,
    };
  }
};

export const build = async (token?: CancelToken) => {
  const isTypescriptPromise = isTypescript();
  const { code, rewrites } = await generate(isTypescriptPromise);
  if (token && token.cancelled) return { cancelled: true };
  await outputFile(
    join(
      process.cwd(),
      `middleware.${(await isTypescriptPromise) ? "ts" : "js"}`
    ),
    code
  );
  return { cancelled: false, rewrites };
};
