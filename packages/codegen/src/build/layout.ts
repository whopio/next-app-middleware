import {
  ExternalLayout,
  Forwards,
  MergedRoute,
  RouteTypes,
  SegmentLayout,
} from "../types";
import { getRoute } from "./route";

export const validateLayout = (externalLayout: ExternalLayout) => {
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

export const resolveLayouts = (pages: SegmentLayout[]) => {
  const resolved = pages
    .sort(({ location: locationA }, { location: locationB }) => {
      const diff = locationA.split("/").length - locationB.split("/").length;
      if (diff === 0) return locationA.length - locationB.length;
      else return diff;
    })
    .map((layout) => getRoute(layout));
  return resolved;
};

const getNextFullSegment = ([page, ...rest]: SegmentLayout[]) => {
  let current: SegmentLayout | undefined = page;
  while (current && current.group) current = rest.shift();
  return current;
};

const filterDynamicForwardedRoutes =
  (forward: Forwards) => (layout: SegmentLayout[]) => {
    const segment = getNextFullSegment(layout);
    if (!segment) return false;
    return segment.dynamic && forward.dynamic.includes(segment.dynamic);
  };

const filterStaticForwardedRoutes =
  (forward: Forwards) => (layout: SegmentLayout[]) => {
    const segment = getNextFullSegment(layout);
    if (!segment) return false;
    return segment.staticForward && forward.static.includes(segment.segment);
  };

const filterNextRoutes = (forward: Forwards) => (layout: SegmentLayout[]) => {
  const segment = getNextFullSegment(layout);
  if (!segment) return true;
  return (
    (!segment.dynamic || !forward.dynamic.includes(segment.dynamic)) &&
    (!segment.staticForward || !forward.static.includes(segment.segment))
  );
};

const getDynamicForwardParam = (layout: SegmentLayout[]) => {
  const segment = getNextFullSegment(layout);
  if (!segment) throw new Error("Error while collecting dynamic forward param");
  if (!segment.dynamic)
    throw new Error("Expected dynamic forward param in " + segment.location);
  return segment.dynamic;
};

const getStaticForwardParam = (layout: SegmentLayout[]) => {
  const segment = getNextFullSegment(layout);
  if (!segment) throw new Error("Error while collecting static forward param");
  if (!segment.staticForward)
    throw new Error("Expected static forward in " + segment.location);
  return segment.segment;
};

// this assumes that the first page in each collection is the same
export const mergeLayouts = (pages: SegmentLayout[][]): MergedRoute => {
  const [[currentPage]] = pages;
  const nextPages = pages.map(([, ...pages]) => pages);
  const hasLast = !!nextPages.find((pages) => pages.length === 0);
  const nexts = nextPages.filter(filterNextRoutes(currentPage.forward));
  const dynamicForwards = nextPages.filter(
    filterDynamicForwardedRoutes(currentPage.forward)
  );
  const staticForwards = nextPages.filter(
    filterStaticForwardedRoutes(currentPage.forward)
  );
  if (hasLast && nexts.length > 1) {
    throw new Error("1");
  }
  if (dynamicForwards.length && staticForwards.length)
    throw new Error(
      "Found both static and dynamic forwards in the same layout segment"
    );
  const next = hasLast
    ? currentPage
    : nexts.length
    ? mergeLayouts(nexts)
    : undefined;
  if (staticForwards.length)
    console.log("static forward", getStaticForwardParam(staticForwards[0]));
  const forward = dynamicForwards.length
    ? ([
        {
          type: RouteTypes.DYNAMIC_FORWARD,
          name: getDynamicForwardParam(dynamicForwards[0]),
        },
        mergeLayouts(dynamicForwards),
      ] as const)
    : staticForwards.length
    ? ([
        {
          type: RouteTypes.STATIC_FORWARD,
          name: getStaticForwardParam(staticForwards[0]),
        },
        mergeLayouts(staticForwards),
      ] as const)
    : undefined;
  return [currentPage, next, forward];
};
