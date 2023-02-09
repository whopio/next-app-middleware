export type LayoutType<T> = [
  T,
  LayoutType<T> | 1 | undefined,
  LayoutType<T> | 1 | undefined
];

export type Forwards = {
  dynamic: string[];
  static: string[];
};

export type SegmentLayout = {
  forward: Forwards;
  rewrite: boolean;
  redirect: boolean;
  page: boolean;
  external?: string;
  middleware: boolean;
  location: string;
  segment: string;
  group: boolean;
  staticForward: boolean;
  internalPath: string;
  externalPath: string;
  hash: string;
  dynamic?: string;
  catchAll: boolean;
  children: Record<string, SegmentLayout>;
  parent?: () => SegmentLayout;
};

export type ExternalLayout = Record<string, SegmentLayout[]>;

export enum RouteTypes {
  MIDDLEWARE,
  DYNAMIC_FORWARD,
  STATIC_FORWARD,
  NEXT,
}

export type ForwarderConfig = {
  type: RouteTypes.DYNAMIC_FORWARD | RouteTypes.STATIC_FORWARD;
  name: string;
};

export type RouteConfig =
  | ForwarderConfig
  | {
      type: RouteTypes.MIDDLEWARE | RouteTypes.NEXT;
    };

export type MergedRoute = [
  current: SegmentLayout,
  next?: MergedRoute | SegmentLayout,
  forward?: readonly [ForwarderConfig, MergedRoute]
];

export type FlattenedRoute = [
  currentSegment: SegmentLayout,
  type: RouteConfig,
  next?: FlattenedRoute | SegmentLayout,
  forward?: FlattenedRoute | SegmentLayout
];
