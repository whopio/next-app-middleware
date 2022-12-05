import type { MiddlewareRequest } from "../request";
import type { MiddlewareResponse } from "../response";

export type SegmentInfo = {
  location: string;
};

export type MiddleWareHandlerResult =
  | { redirect: string | URL | NextURL; status?: number }
  | { rewrite: string | URL | NextURL }
  | { json: unknown }
  | void;

export type MiddlewareHandler<
  Param extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >
> = (
  req: MiddlewareRequest<Param>,
  res: MiddlewareResponse
) => MiddleWareHandlerResult | Promise<MiddleWareHandlerResult>;

export type MiddlewareHandlerSegment<
  Param extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >
> = {
  middleware: () => Promise<MiddlewareHandler<Param>>;
} & SegmentInfo;

export type ResolvedMiddlewareHandlerSegment<
  Param extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >
> = {
  middleware: Promise<MiddlewareHandler<Param>>;
} & SegmentInfo;

export type Forwarder<
  Params extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >
> = (
  req: MiddlewareRequest<Params>,
  res: MiddlewareResponse
) => Promise<string> | string | void | Promise<void>;

export type ForwarderSegment = {
  forward: () => Promise<Forwarder>;
} & SegmentInfo;

export type ResolvedForwarderSegment = {
  forward: Promise<Forwarder>;
} & SegmentInfo;

export type MiddlewareChainSegment =
  | ForwarderSegment
  | MiddlewareHandlerSegment;

export type ResolvedMiddlewareChainSegment =
  | ResolvedForwarderSegment
  | ResolvedMiddlewareHandlerSegment;

export type ChainLayout = [
  handler: MiddlewareChainSegment,
  then: ChainLayout | 0 | 1,
  rewrite?: ChainLayout | undefined
];

export type ResolvedChainLayout = [
  handler: ResolvedMiddlewareChainSegment,
  then: ResolvedChainLayout | 0 | 1,
  rewrite?: ResolvedChainLayout | undefined
];

export type MiddlewareLayout = Array<[string, ChainLayout]>;

/**
 * @credit https://github.com/honojs/hono/blob/main/src/types.ts
 */

type ParamKey<Component> = Component extends `:${infer Name}` ? Name : never;

export type ParamKeys<Path> = Path extends `${infer Component}/${infer Rest}`
  ? ParamKey<Component> | ParamKeys<Rest>
  : ParamKey<Path>;

export type Params<Path> = Record<ParamKeys<Path>, string>;
