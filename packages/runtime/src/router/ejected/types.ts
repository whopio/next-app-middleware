export enum BranchTypes {
  MIDDLEWARE,
  FORWARD,
  SWITCH,
  NEXT,
  NOT_FOUND,
  DYNAMIC,
  REWRITE,
  REDIRECT,
}

export type EjectedMiddleware = {
  type: BranchTypes.MIDDLEWARE;
  internalPath: string;
  location: string;
  then: Branch;
};

export type EjectedForward = {
  type: BranchTypes.FORWARD;
  internalPath: string;
  location: string;
  name: string;
  then?: Branch;
  forward?: Branch;
};

export type PathSegmentSwitchCase = {
  match: string | string[];
  then: Branch;
};

export type PathSegmentSwitch = {
  type: BranchTypes.SWITCH;
  cases: PathSegmentSwitchCase[];
  defaultCase: Branch;
  index: number;
};

export type EjectedNotFoundResponse = {
  type: BranchTypes.NOT_FOUND;
};

export type EjectedNextResponse = {
  type: BranchTypes.NEXT;
  internalPath?: string;
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

export type Branch =
  | EjectedMiddleware
  | EjectedForward
  | PathSegmentSwitch
  | EjectedNextResponse
  | EjectedNotFoundResponse
  | EjectedRedirect
  | EjectedRewrite
  | DynamicSegment;

export type RouterHooksConfig = {
  notFound: boolean;
  redirect: boolean;
  rewrite: boolean;
  json: boolean;
  params: boolean;
  response: boolean;
  error: boolean;
};

export type Imports = {
  middleware: Set<string>;
  rewrite: Set<string>;
  forward: Set<string>;
  redirect: Set<string>;
};

export type EjectedRouter = {
  segmentAmount: number;
  publicFiles: string[];
  hooks: RouterHooksConfig;
  branches: Branch[];
  imports: Imports;
};
