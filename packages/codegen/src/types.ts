export type LayoutType<T> = [
  T,
  LayoutType<T> | 1 | undefined,
  LayoutType<T> | 1 | undefined
];

export type SegmentLayout = {
  forward: string[];
  rewrite: boolean;
  redirect: boolean;
  page: boolean;
  external?: string;
  middleware: boolean;
  location: string;
  segment: string;
  group: boolean;
  internalPath: string;
  externalPath: string;
  hash: string;
  dynamic?: string;
  catchAll: boolean;
  children: Record<string, SegmentLayout>;
  parent?: () => SegmentLayout;
};

export type ExternalLayout = Record<string, SegmentLayout[]>;

export type MergedRoute = [
  current: SegmentLayout,
  next?: MergedRoute | SegmentLayout,
  forward?: MergedRoute
];

export type FlattenedRoute = [
  currentSegment: SegmentLayout,
  type: 0 | string,
  next?: FlattenedRoute | SegmentLayout,
  forward?: FlattenedRoute | SegmentLayout
];
