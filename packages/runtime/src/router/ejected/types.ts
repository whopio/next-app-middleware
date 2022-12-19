export enum BranchTypes {
  MIDDLEWARE,
  REWRITE,
  SWITCH,
  NEXT,
  NOT_FOUND,
  DYNAMIC,
}

export type EjectedMiddleware = {
  type: BranchTypes.MIDDLEWARE;
  internalPath: string;
  location: string;
  then: Branch;
};

export type EjectedRewrite = {
  type: BranchTypes.REWRITE;
  internalPath: string;
  location: string;
  name: string;
  then?: Branch;
  rewrite?: Branch;
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
  rewrite?: string;
};

export type DynamicSegment = {
  type: BranchTypes.DYNAMIC;
  name: string;
  index: number;
  then: Branch;
};

export type Branch =
  | EjectedMiddleware
  | EjectedRewrite
  | PathSegmentSwitch
  | EjectedNextResponse
  | EjectedNotFoundResponse
  | DynamicSegment;

export type RouterHooksConfig = {
  notFound: boolean;
  redirect: boolean;
  rewrite: boolean;
  json: boolean;
  params: boolean;
  response: boolean;
};

export type EjectedRouter = {
  segmentAmount: number;
  publicFiles: string[];
  hooks: RouterHooksConfig;
  branches: Branch[];
  imports: Array<[location: string, type: "middleware" | "rewrite"]>;
};
