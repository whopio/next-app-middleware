import {
  Imports,
  renderRouter,
} from "@next-app-middleware/runtime/dist/router/ejected";
import fse from "fs-extra";
import { join } from "path";
import { format } from "prettier";
import { FlattenedRoute } from "../types";
import CancelToken from "../util/CancelToken";
import collectLayout from "./collect-layout";
import collectPublicFiles from "./collect-public";
import { ejectMatcherMap, toMatcherMap } from "./eject";
import getPages, { getSimilarPages } from "./get-pages";
import { mergeLayouts, resolveLayouts, validateLayout } from "./layout";
import readHooksConfig from "./read-config";
import { flattenMergedRoute, traverseRoute } from "./route";

const { outputFile } = fse;

const generate = async () => {
  const hooksPromise = readHooksConfig();
  const publicPromise = collectPublicFiles();
  const layout = await collectLayout();
  let segmentAmount = 0;
  const pages = getPages(layout);
  pages.forEach((page) => {
    const segments = page.internalPath.split("/").length - 2;
    if (segments > segmentAmount) segmentAmount = segments;
  });
  const externalLayout = getSimilarPages(pages);
  validateLayout(externalLayout);
  const routes = Object.entries(externalLayout).map(([key, layouts]) => {
    const resolvedLayouts = resolveLayouts(layouts);
    const mergedRoutes = mergeLayouts(resolvedLayouts);
    return [key, flattenMergedRoute(mergedRoutes) as FlattenedRoute] as const;
  });
  const imports: Imports = {
    forward: new Set(),
    middleware: new Set(),
    redirect: new Set(),
    rewrite: new Set(),
  };
  routes.forEach(([, route]) => {
    traverseRoute(route, (segment, type) => {
      if (type === 0) {
        imports.middleware.add(segment.location);
      } else if (type === 1) {
        if (segment.redirect) imports.redirect.add(segment.location);
        if (segment.rewrite) imports.rewrite.add(segment.location);
      } else {
        imports.forward.add(segment.location);
      }
    });
  });
  const ejectedBranches = ejectMatcherMap(toMatcherMap(routes));
  return format(
    renderRouter({
      branches: ejectedBranches,
      publicFiles: await publicPromise,
      segmentAmount,
      hooks: await hooksPromise,
      imports,
    }),
    { parser: "babel-ts" }
  );
};

export const build = async (token?: CancelToken) => {
  const code = await generate();
  if (token && token.cancelled) return true;
  await outputFile(join(process.cwd(), "middleware.ts"), code);
  return false;
};
