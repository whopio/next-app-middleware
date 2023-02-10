import renderBody from "./body";
import footer from "./footer";
import renderHead from "./head";
import {
  Branch,
  BranchTypes,
  DynamicSegment,
  EjectedDynamicForward,
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
  EjectedDynamicForward,
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

${footer}
`;
