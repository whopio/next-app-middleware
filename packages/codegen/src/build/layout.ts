import { ExternalLayout, MergedRoute, SegmentLayout } from "../types";
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

const filterDynamicRoutes =
  (forward: string[]) =>
  ([page, ...rest]: SegmentLayout[]) => {
    let current: SegmentLayout | undefined = page;
    while (current && current.group) current = rest.shift();
    if (!current) return false;
    return current.dynamic && forward.includes(current.dynamic);
  };

const filterNextRoutes =
  (forward: string[]) =>
  ([page, ...rest]: SegmentLayout[]) => {
    let current: SegmentLayout | undefined = page;
    while (current && current.group) current = rest.shift();
    if (!current) return true;
    return !current.dynamic || !forward.includes(current.dynamic);
  };

// this assumes that the first page in each collection is the same
export const mergeLayouts = (pages: SegmentLayout[][]): MergedRoute => {
  const [[currentPage]] = pages;
  const nextPages = pages.map(([, ...pages]) => pages);
  const hasLast = !!nextPages.find((pages) => pages.length === 0);
  const nexts = nextPages.filter(filterNextRoutes(currentPage.forward));
  const forwards = nextPages.filter(filterDynamicRoutes(currentPage.forward));
  if (hasLast && nexts.length > 1) {
    throw new Error("1");
  }
  const next = hasLast
    ? currentPage
    : nexts.length
    ? mergeLayouts(nexts)
    : undefined;
  const forward = forwards.length ? mergeLayouts(forwards) : undefined;
  return [currentPage, next, forward];
};
