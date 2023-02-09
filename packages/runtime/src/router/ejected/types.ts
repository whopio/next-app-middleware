export enum BranchTypes {
  MIDDLEWARE,
  DYNAMIC_FORWARD,
  STATIC_FORWARD,
  SWITCH,
  NEXT,
  EXTERNAL,
  NOT_FOUND,
  DYNAMIC,
  REWRITE,
  REDIRECT,
  CATCH_ALL,
}

export type EjectedMiddleware = {
  type: BranchTypes.MIDDLEWARE;
  internalPath: string;
  location: string;
  then: Branch;
};

export type EjectedDynamicForward = {
  type: BranchTypes.DYNAMIC_FORWARD;
  internalPath: string;
  location: string;
  name: string;
  then?: Branch;
  forward?: Branch;
};

export type EjectedStaticForward = {
  type: BranchTypes.STATIC_FORWARD;
  internalPath: string;
  location: string;
  name: string;
  then?: Branch;
  forward?: Branch;
};

export type EjectedExternal = {
  type: BranchTypes.EXTERNAL;
};

export type PathSegmentSwitchCase = {
  match: string | string[];
  then: Branch;
};

export type PathSegmentSwitch = {
  type: BranchTypes.SWITCH;
  cases: PathSegmentSwitchCase[];
  defaultCase: Branch;
  catchAll?: Branch;
  index: number;
};

export type EjectedNotFoundResponse = {
  type: BranchTypes.NOT_FOUND;
};

export type EjectedNextResponse = {
  type: BranchTypes.NEXT;
  internalPath: string;
  externalPath: string;
};

export type EjectedRewrite = {
  type: BranchTypes.REWRITE;
  location: string;
  internalPath: string;
  fallback?: Branch;
};

export type EjectedRedirect = {
  type: BranchTypes.REDIRECT;
  location: string;
  internalPath: string;
  fallback?: Branch;
};

export type DynamicSegment = {
  type: BranchTypes.DYNAMIC;
  name: string;
  index: number;
  then: Branch;
};

export type CatchAllSegment = {
  type: BranchTypes.CATCH_ALL;
  name: string;
  index: number;
  then: Branch;
};

export type Branch =
  | EjectedMiddleware
  | EjectedDynamicForward
  | EjectedStaticForward
  | PathSegmentSwitch
  | EjectedNextResponse
  | EjectedNotFoundResponse
  | EjectedRedirect
  | EjectedRewrite
  | EjectedExternal
  | DynamicSegment
  | CatchAllSegment;

export type RouterHooksConfig = {
  notFound: boolean;
  redirect: boolean;
  rewrite: boolean;
  json: boolean;
  params: boolean;
  response: boolean;
  error: boolean;
  external: boolean;
};

export type Imports = {
  middleware: Set<string>;
  rewrite: Set<string>;
  "forward.dynamic": Set<string>;
  "forward.static": Set<string>;
  redirect: Set<string>;
};

export type EjectedRouter = {
  publicFiles: string[];
  hooks: RouterHooksConfig;
  branches: Branch;
  imports: Imports;
};
