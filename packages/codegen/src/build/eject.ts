import {
  Branch,
  BranchTypes,
} from "@next-app-middleware/runtime/dist/router/ejected";
import { FlattenedRoute, SegmentLayout } from "../types";

type MatcherMap = Map<string, FlattenedRoute | MatcherMap>;

export const toMatcherMap = (
  similarRoutes: (readonly [string, FlattenedRoute])[]
) => {
  const map: MatcherMap = new Map();
  for (const [externalPath, route] of similarRoutes) {
    let currentMap = map;
    const segments = externalPath.slice(1, -1).split("/");
    for (const segment of segments.slice(0, -1)) {
      if (!currentMap.has(segment)) currentMap.set(segment, new Map());
      currentMap = currentMap.get(segment) as MatcherMap;
    }
    currentMap.set(segments[segments.length - 1], route);
  }
  return map;
};

const ejectPage = (page: SegmentLayout, appliedParams: Set<string>): Branch => {
  const segments = page.externalPath.split("/");
  const [segment] = segments.filter(
    (segment) => segment.startsWith(":") && !appliedParams.has(segment.slice(1))
  );

  if (segment) {
    const name = segment.slice(1);
    const index = segments.indexOf(segment) - 1;
    appliedParams.add(name);
    return {
      type: BranchTypes.DYNAMIC,
      name,
      index,
      then: ejectPage(page, appliedParams),
    };
  }

  if (page.rewrite)
    return {
      type: BranchTypes.REWRITE,
      location: page.location,
      internalPath: page.internalPath,
      fallback:
        page.redirect || page.page
          ? ejectPage({ ...page, rewrite: false }, appliedParams)
          : undefined,
    };
  if (page.redirect)
    return {
      type: BranchTypes.REDIRECT,
      location: page.location,
      internalPath: page.internalPath,
      fallback: page.page
        ? ejectPage({ ...page, redirect: false }, appliedParams)
        : undefined,
    };
  return {
    type: BranchTypes.NEXT,
    internalPath: page.internalPath.includes("/:")
      ? page.internalPath
      : undefined,
  };
};

const ejectRoute = (
  [currentSegment, type, next, forward]: FlattenedRoute,
  appliedParams = new Set<string>()
): Branch => {
  const segments = currentSegment.externalPath.split("/");
  const [segment] = segments.filter(
    (segment) => segment.startsWith(":") && !appliedParams.has(segment.slice(1))
  );

  if (segment) {
    const name = segment.slice(1);
    const index = segments.indexOf(segment) - 1;
    appliedParams.add(name);
    return {
      type: BranchTypes.DYNAMIC,
      name,
      index,
      then: ejectRoute([currentSegment, type, next, forward], appliedParams),
    };
  }
  if (typeof type === "number") {
    return {
      type: BranchTypes.MIDDLEWARE,
      internalPath: currentSegment.internalPath,
      location: currentSegment.location,
      then:
        next instanceof Array
          ? ejectRoute(next, appliedParams)
          : next
          ? ejectPage(next, appliedParams)
          : {
              type: BranchTypes.NOT_FOUND,
            },
    };
  } else {
    return {
      type: BranchTypes.FORWARD,
      name: type,
      internalPath: currentSegment.internalPath,
      location: currentSegment.location,
      then:
        next instanceof Array
          ? ejectRoute(next, appliedParams)
          : next
          ? ejectPage(next, appliedParams)
          : {
              type: BranchTypes.NOT_FOUND,
            },
      forward:
        forward instanceof Array
          ? ejectRoute(forward, appliedParams)
          : forward
          ? ejectPage(forward, appliedParams)
          : {
              type: BranchTypes.NOT_FOUND,
            },
    };
  }
};

export const ejectMatcherMap = (
  map: FlattenedRoute | MatcherMap,
  depth = 0
): Branch => {
  if (map instanceof Map) {
    const defaultCase = map.get(":");
    return {
      type: BranchTypes.SWITCH,
      index: depth,
      cases: Array.from(map.entries())
        .filter(([segment]) => segment !== ":")
        .map(([segment, entry]) => {
          return {
            match: segment,
            then: ejectMatcherMap(entry, depth + 1),
          };
        }),
      defaultCase: defaultCase
        ? ejectMatcherMap(defaultCase, depth + 1)
        : {
            type: BranchTypes.NOT_FOUND,
          },
    };
  } else return ejectRoute(map);
};
