import {
  FlattenedRoute,
  LayoutType,
  MergedRoute,
  SegmentLayout,
} from "../types";

export const getRoute = (page: SegmentLayout): SegmentLayout[] => {
  const result: SegmentLayout[] = [page];
  let getParent = page.parent;
  while (getParent) {
    const parent = getParent();
    result.push(parent);
    getParent = parent.parent;
  }
  return result.reverse();
};

const getNextDynamicParam = ([current, , forward]: MergedRoute): string => {
  if (current.dynamic) return current.dynamic;
  else if (!forward) throw new Error("getNextDynamicParam");
  else return getNextDynamicParam(forward);
};

export const flattenMergedRoute = ([current, next, forward]: MergedRoute):
  | FlattenedRoute
  | SegmentLayout
  | undefined => {
  if (current.middleware) {
    if (forward) {
      const flattenedRoute: FlattenedRoute = [
        current,
        0,
        flattenMergedRoute([{ ...current, middleware: false }, next, forward]),
      ];
      return flattenedRoute;
    } else {
      const flattenedRoute: FlattenedRoute = [
        current,
        0,
        next instanceof Array ? flattenMergedRoute(next) : next && next,
        forward && flattenMergedRoute(forward),
      ];
      return flattenedRoute;
    }
  } else if (forward) {
    const param = getNextDynamicParam(forward);
    const flattenedRoute: FlattenedRoute = [
      current,
      param,
      next instanceof Array ? flattenMergedRoute(next) : next,
      forward && flattenMergedRoute(forward),
    ];
    return flattenedRoute;
  } else {
    if (next instanceof Array) return flattenMergedRoute(next);
    return next;
  }
};

export const traverseRoute = <T>(
  [current, type, next, forward]: FlattenedRoute,
  onSegment: (segment: SegmentLayout, type: 0 | 1 | string) => T
): LayoutType<T> => {
  return [
    onSegment(current, type),
    next instanceof Array
      ? traverseRoute(next, onSegment)
      : next
      ? [onSegment(next, 1), , ,]
      : undefined,
    forward instanceof Array
      ? traverseRoute(forward, onSegment)
      : forward
      ? [onSegment(forward, 1), , ,]
      : undefined,
  ];
};
