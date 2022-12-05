import type { NextURL } from "next/dist/server/web/next-url";
import type { MiddlewareRequest } from "../request";
import type { MiddlewareResponse } from "../response";

export type SegmentInfo = readonly [location: string];

type DefaultParam = Record<string, string | undefined>;

export type MiddleWareHandlerResult =
  | { redirect: string | URL | NextURL; status?: number }
  | { rewrite: string | URL | NextURL }
  | { json: unknown }
  | void;

export type MiddlewareHandler<Param extends DefaultParam = DefaultParam> = (
  req: MiddlewareRequest<Param>,
  res: MiddlewareResponse
) => MiddleWareHandlerResult | Promise<MiddleWareHandlerResult>;

export enum MiddlewareTypes {
  MIDDLEWARE,
  FORWARDER,
}

export type MiddlewareHandlerSegment<
  Param extends DefaultParam = DefaultParam
> = readonly [
  type: MiddlewareTypes.MIDDLEWARE,
  middleware: () => Promise<MiddlewareHandler<Param>>,
  info: SegmentInfo
];

export type ResolvedMiddlewareHandlerSegment<
  Param extends DefaultParam = DefaultParam
> = readonly [
  type: MiddlewareTypes.MIDDLEWARE,
  middleware: Promise<MiddlewareHandler<Param>>,
  info: SegmentInfo
];

export type Forwarder<Param extends DefaultParam = DefaultParam> = (
  req: MiddlewareRequest<Param>,
  res: MiddlewareResponse
) => Promise<string> | string | void | Promise<void>;

export type ForwarderSegment<Param extends DefaultParam = DefaultParam> =
  readonly [
    type: MiddlewareTypes.FORWARDER,
    forwarder: () => Promise<Forwarder<Param>>,
    info: SegmentInfo
  ];

export type ResolvedForwarderSegment<
  Param extends DefaultParam = DefaultParam
> = readonly [
  type: MiddlewareTypes.FORWARDER,
  forwarder: Promise<Forwarder<Param>>,
  info: SegmentInfo
];

export type MiddlewareChainSegment<Param extends DefaultParam = DefaultParam> =
  | ForwarderSegment<Param>
  | MiddlewareHandlerSegment<Param>;

export type ResolvedMiddlewareChainSegment =
  | ResolvedForwarderSegment
  | ResolvedMiddlewareHandlerSegment;

export type ChainLayout = readonly [
  handler: MiddlewareChainSegment,
  then?: ChainLayout | 1,
  rewrite?: ChainLayout | 1
];

export type ResolvedChainLayout = [
  handler: ResolvedMiddlewareChainSegment,
  then?: ResolvedChainLayout | 1,
  rewrite?: ResolvedChainLayout | 1
];

export type MiddlewareLayout = Array<readonly [string, ChainLayout]>;

/**
 * @credit https://github.com/honojs/hono/blob/main/src/types.ts
 */

type ParamKey<Component> = Component extends `:${infer Name}` ? Name : never;

export type ParamKeys<Path> = Path extends `${infer Component}/${infer Rest}`
  ? ParamKey<Component> | ParamKeys<Rest>
  : ParamKey<Path>;

export type Params<Path> = Record<ParamKeys<Path>, string>;
