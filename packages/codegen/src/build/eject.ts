import {
  Branch,
  BranchTypes,
  PathSegmentSwitch,
} from "@next-app-middleware/runtime/dist/router/ejected";
import { FlattenedRoute, SegmentLayout } from "../types";

type MatcherMap = Map<string, FlattenedRoute | MatcherMap>;

export const toMatcherMap = (
  endpoints: (readonly [string, FlattenedRoute])[]
) => {
  const map: MatcherMap = new Map();
  for (const [pathHash, route] of endpoints) {
    let currentMap = map;
    const segments = pathHash.slice(1).split("/");
    let isCatchAll = false;
    for (const segment of segments.slice(0, -1)) {
      if (segment === "*") {
        isCatchAll = true;
        break;
      }
      if (!currentMap.has(segment)) currentMap.set(segment, new Map());
      currentMap = currentMap.get(segment) as MatcherMap;
    }
    currentMap.set(isCatchAll ? "*" : "", route);
  }
  return map;
};

const ejectPage = (
  page: SegmentLayout,
  appliedParams: Set<string>,
  catchAllApplied: boolean
): Branch => {
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
      then: ejectPage(page, appliedParams, catchAllApplied),
    };
  }

  const lastSegment = segments[segments.length - 2];
  if (lastSegment.startsWith("*") && !catchAllApplied) {
    const name = lastSegment.slice(1);
    const index = segments.indexOf(lastSegment) - 1;
    return {
      type: BranchTypes.CATCH_ALL,
      name,
      index,
      then: ejectPage(page, appliedParams, true),
    };
  }

  if (page.rewrite)
    return {
      type: BranchTypes.REWRITE,
      location: page.location,
      internalPath: page.internalPath,
      fallback:
        page.redirect || page.page
          ? ejectPage(
              { ...page, rewrite: false },
              appliedParams,
              catchAllApplied
            )
          : undefined,
    };
  if (page.redirect)
    return {
      type: BranchTypes.REDIRECT,
      location: page.location,
      internalPath: page.internalPath,
      fallback: page.page
        ? ejectPage(
            { ...page, redirect: false },
            appliedParams,
            catchAllApplied
          )
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
  appliedParams = new Set<string>(),
  catchAllApplied = false
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
      then: ejectRoute(
        [currentSegment, type, next, forward],
        appliedParams,
        catchAllApplied
      ),
    };
  }
  const lastSegment = segments[segments.length - 2];
  if (lastSegment.startsWith("*") && !catchAllApplied) {
    const name = lastSegment.slice(1);
    const index = segments.indexOf(lastSegment) - 1;
    return {
      type: BranchTypes.CATCH_ALL,
      name,
      index,
      then: ejectRoute(
        [currentSegment, type, next, forward],
        appliedParams,
        true
      ),
    };
  }

  if (typeof type === "number") {
    return {
      type: BranchTypes.MIDDLEWARE,
      internalPath: currentSegment.internalPath,
      location: currentSegment.location,
      then:
        next instanceof Array
          ? ejectRoute(next, appliedParams, catchAllApplied)
          : next
          ? ejectPage(next, appliedParams, catchAllApplied)
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
          ? ejectRoute(next, appliedParams, catchAllApplied)
          : next
          ? ejectPage(next, appliedParams, catchAllApplied)
          : {
              type: BranchTypes.NOT_FOUND,
            },
      forward:
        forward instanceof Array
          ? ejectRoute(forward, appliedParams, catchAllApplied)
          : forward
          ? ejectPage(forward, appliedParams, catchAllApplied)
          : {
              type: BranchTypes.NOT_FOUND,
            },
    };
  }
};

const specialCases = ["", ":", "*"];

const getMatcherMapImfo = (map: MatcherMap) => ({
  endpoint: map.get("") as FlattenedRoute | undefined,
  dynamic: map.get(":"),
  catchAll: map.get("*") as FlattenedRoute | undefined,
  static: Array.from(map.entries()).filter(
    ([segment]) => !specialCases.includes(segment)
  ),
});

export const ejectMatcherMap = (
  mapOrRoute: FlattenedRoute | MatcherMap,
  depth = 0
): Branch => {
  if (mapOrRoute instanceof Map) {
    const map = getMatcherMapImfo(mapOrRoute);
    const cases: PathSegmentSwitch["cases"] = [
      {
        match: "",
        then: map.endpoint
          ? ejectRoute(map.endpoint)
          : {
              type: BranchTypes.NOT_FOUND,
            },
      },
      ...map.static.map(([segment, entry]) => {
        return {
          match: segment,
          then: ejectMatcherMap(entry, depth + 1),
        };
      }),
    ];
    if (map.dynamic) {
      if (map.catchAll)
        return {
          type: BranchTypes.SWITCH,
          index: depth,
          cases,
          defaultCase: ejectMatcherMap(map.dynamic, depth + 1),
          catchAll: ejectRoute(map.catchAll),
        };
      else
        return {
          type: BranchTypes.SWITCH,
          index: depth,
          cases,
          defaultCase: ejectMatcherMap(map.dynamic, depth + 1),
        };
    } else if (map.catchAll)
      return {
        type: BranchTypes.SWITCH,
        index: depth,
        cases,
        defaultCase: ejectRoute(map.catchAll),
      };
    else
      return {
        type: BranchTypes.SWITCH,
        index: depth,
        cases,
        defaultCase: { type: BranchTypes.NOT_FOUND },
      };
  } else {
    return ejectRoute(mapOrRoute);
  }
};
