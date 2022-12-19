import type { NextURL } from "next/dist/server/web/next-url";
import type { ResponseCookies } from "next/dist/server/web/spec-extension/cookies/response-cookies";
import type { NextResponse } from "next/server";

/**
 * @credit https://github.com/honojs/hono/blob/main/src/types.ts
 */
type ParamKey<Component> = Component extends `:${infer Name}` ? Name : never;

export type ParamKeys<Path> = Path extends `${infer Component}/${infer Rest}`
  ? ParamKey<Component> | ParamKeys<Rest>
  : ParamKey<Path>;

export type Params<Path> = Record<ParamKeys<Path>, string>;

export type ParamType = Record<string, string>;

type DefaultParam = Record<string, string | undefined>;

export type NextMiddlewareRequest<Param extends DefaultParam = DefaultParam> = {
  readonly url: NextURL;
  readonly headers: Headers;
  readonly params: Param;
  readonly search: URLSearchParams;
  readonly waitUntil: (promise: Promise<any>) => void;
};

export type NextMiddlewareResponse = {
  readonly headers: Headers;
  readonly cookies: ResponseCookies;
};

export type NextMiddlewareInternals = {
  responseHeaders?: Headers;
  requestHeaders?: Headers;
  cookies?: ResponseCookies;
  nextUrl?: NextURL;
  searchParams?: URLSearchParams;
};

type OptionalPromise<T> = Promise<T> | T;

export type GenericHook<ExtraArgs extends any[] = []> = (
  req: NextMiddlewareRequest,
  res: NextMiddlewareResponse,
  ...extra: ExtraArgs
) => OptionalPromise<NextResponse | undefined>;

export type ParamsHook = (
  req: NextMiddlewareRequest,
  res: NextMiddlewareResponse
) => OptionalPromise<ParamType | undefined>;

export type RewriteHook = GenericHook<[destination: string]>;

export type RedirectHook = GenericHook<[destination: string, status?: number]>;

export type JsonHook = GenericHook<[data: unknown]>;

export type ResponseHook = (res: NextResponse) => OptionalPromise<void>;

export type SegmentInfo = readonly [location: string];

export type MiddleWareHandlerResult =
  | { redirect: string | URL | NextURL; status?: number }
  | { rewrite: string | URL | NextURL }
  | { json: unknown }
  | void;

export type MiddlewareHandler<Param extends DefaultParam = DefaultParam> = (
  req: NextMiddlewareRequest<Param>,
  res: NextMiddlewareResponse
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
  req: NextMiddlewareRequest<Param>,
  res: NextMiddlewareResponse
) => OptionalPromise<string | void>;
