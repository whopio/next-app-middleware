import { createHash } from "crypto";
import renderBody from "./body";
import renderFooter from "./footer";
import renderHead from "./head";
import {
  Branch,
  BranchTypes,
  DynamicSegment,
  EjectedForward,
  EjectedMiddleware,
  EjectedNextResponse,
  EjectedRedirect,
  EjectedRewrite,
  EjectedRouter,
  Imports,
  PathSegmentSwitch,
  RouterHooksConfig,
} from "./types";

export { BranchTypes };

export type {
  Branch,
  DynamicSegment,
  EjectedForward,
  EjectedMiddleware,
  EjectedNextResponse,
  EjectedRedirect,
  EjectedRewrite,
  EjectedRouter,
  Imports,
  PathSegmentSwitch,
  RouterHooksConfig,
};

export const renderRouter = (router: EjectedRouter) =>
  `
${renderHead(router)}

${renderBody(router)}

${renderFooter(router.segmentAmount)}
`;
