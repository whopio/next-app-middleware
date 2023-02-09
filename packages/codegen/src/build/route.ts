import {
  FlattenedRoute,
  LayoutType,
  MergedRoute,
  RouteConfig,
  RouteTypes,
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

export const flattenMergedRoute = ([current, next, forward]: MergedRoute):
  | FlattenedRoute
  | SegmentLayout
  | undefined => {
  if (current.middleware) {
    if (forward) {
      const flattenedRoute: FlattenedRoute = [
        current,
        { type: RouteTypes.MIDDLEWARE },
        flattenMergedRoute([{ ...current, middleware: false }, next, forward]),
      ];
      return flattenedRoute;
    } else {
      const flattenedRoute: FlattenedRoute = [
        current,
        { type: RouteTypes.MIDDLEWARE },
        next instanceof Array ? flattenMergedRoute(next) : next && next,
        forward && flattenMergedRoute(forward),
      ];
      return flattenedRoute;
    }
  } else if (forward) {
    const [type, forwardLayout] = forward;
    const flattenedRoute: FlattenedRoute = [
      current,
      type,
      next instanceof Array ? flattenMergedRoute(next) : next,
      flattenMergedRoute(forwardLayout),
    ];
    return flattenedRoute;
  } else {
    if (next instanceof Array) return flattenMergedRoute(next);
    return next;
  }
};

export const traverseRoute = <T>(
  [current, type, next, forward]: FlattenedRoute,
  onSegment: (segment: SegmentLayout, type: RouteConfig) => T
): LayoutType<T> => {
  return [
    onSegment(current, type),
    next instanceof Array
      ? traverseRoute(next, onSegment)
      : next
      ? [onSegment(next, { type: RouteTypes.NEXT }), , ,]
      : undefined,
    forward instanceof Array
      ? traverseRoute(forward, onSegment)
      : forward
      ? [onSegment(forward, { type: RouteTypes.NEXT }), , ,]
      : undefined,
  ];
};
