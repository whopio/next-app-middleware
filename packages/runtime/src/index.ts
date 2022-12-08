import type { NextMiddleware } from "next/server";
import { MiddlewareRouter } from "./router";
import {
  Forwarder,
  ForwarderSegment,
  MiddlewareChainSegment,
  MiddlewareHandler,
  MiddlewareHandlerSegment,
  MiddlewareLayout,
  MiddlewareTypes,
  Params,
} from "./util/types";

export const makeMiddleware = (layout: MiddlewareLayout): NextMiddleware => {
  const chain = new MiddlewareRouter(layout);
  return chain.apply.bind(chain);
};

export default makeMiddleware;

export const notFoundMiddleware: MiddlewareHandler = () => {
  return {
    rewrite: "/404",
  };
};

export const nullMiddleware: MiddlewareHandler = () => {};

export type { MiddlewareRequest } from "./request";
export type { MiddlewareResponse } from "./response";
export type {
  Forwarder,
  MiddleWareHandlerResult,
  MiddlewareChainSegment,
} from "./util/types";
export type { MiddlewareHandler, MiddlewareLayout };

type ImportedMiddleware<Param extends Record<string, string | undefined>> = {
  default: MiddlewareHandler<Param>;
};

/**
 * @dev Used in the final middleware.ts output to import middlewares
 * and to provide type safety using the middleware `location`.
 */
export const importMiddleware = <
  Path extends string,
  Param extends Params<Path> = Params<Path>
>(
  location: Path,
  importer: () => Promise<ImportedMiddleware<Param>>
): MiddlewareHandlerSegment =>
  [
    MiddlewareTypes.MIDDLEWARE,
    () =>
      importer().then(
        ({ default: middleware }) => middleware as MiddlewareHandler
      ),
    [location],
  ] as const;

/**
 * @dev Used in the final middleware.ts output to import forwarders
 * and to provide type safety using the middleware `location` and the
 * required export.
 */
export const importForwarder = <
  K extends string,
  Path extends string,
  Param extends Params<Path> = Params<Path>
>(
  location: Path,
  key: K,
  importer: () => Promise<Record<K, Forwarder<Param>>>
): ForwarderSegment =>
  [
    MiddlewareTypes.FORWARDER,
    () => importer().then(({ [key]: forward }) => forward as Forwarder),
    [location],
  ] as const;
