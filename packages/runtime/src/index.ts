import type { NextMiddleware } from "next/server";
import { MiddlewareRouter } from "./router";
import type {
  Forwarder,
  ForwarderSegment,
  MiddlewareChainSegment,
  MiddlewareHandler,
  MiddlewareHandlerSegment,
  MiddlewareLayout,
  Params,
} from "./util/types";

const makeMiddleware = (layout: MiddlewareLayout): NextMiddleware => {
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

export const importMiddleware = <
  Path extends string,
  Param extends Params<Path> = Params<Path>
>(
  location: Path,
  importer: () => Promise<ImportedMiddleware<Param>>
): MiddlewareHandlerSegment<Param> => ({
  location,
  middleware: () =>
    importer().then(
      ({ default: middleware }) => middleware as MiddlewareHandler<Param>
    ),
});

export const importForwarder = <K extends string>(
  location: string,
  key: K,
  importer: () => Promise<Record<K, Forwarder>>
): ForwarderSegment => ({
  location,
  forward: () => importer().then(({ [key]: forward }) => forward),
});
