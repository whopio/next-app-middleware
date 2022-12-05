import {
  ChainLayout,
  ForwarderSegment,
  MiddlewareChainSegment,
  MiddlewareHandlerSegment,
  MiddlewareTypes,
  ResolvedChainLayout,
  ResolvedForwarderSegment,
  ResolvedMiddlewareChainSegment,
  ResolvedMiddlewareHandlerSegment,
} from "../util/types";
import type { MiddlewareRequestInternals } from "./internals";

export function isForwarder(
  input: MiddlewareChainSegment
): input is ForwarderSegment;
export function isForwarder(
  input: ResolvedMiddlewareChainSegment
): input is ResolvedForwarderSegment;
export function isForwarder(
  input: MiddlewareChainSegment | ResolvedMiddlewareChainSegment
): boolean {
  return input[0] === MiddlewareTypes.FORWARDER;
}

export function isMiddleware(
  input: ResolvedMiddlewareChainSegment
): input is ResolvedMiddlewareHandlerSegment;
export function isMiddleware(
  input: MiddlewareChainSegment
): input is MiddlewareHandlerSegment;
export function isMiddleware(
  input: MiddlewareChainSegment | ResolvedMiddlewareChainSegment
): boolean {
  return input[0] === MiddlewareTypes.MIDDLEWARE;
}

const resolveSegment = ([
  type,
  handler,
  ...rest
]: MiddlewareChainSegment): ResolvedMiddlewareChainSegment => {
  return [type, handler(), ...rest] as ResolvedMiddlewareChainSegment;
};

export const resolveLayout = ([
  handler,
  then,
  rewrite,
]: ChainLayout): ResolvedChainLayout => {
  return [
    resolveSegment(handler),
    typeof then === "number" ? then : then && resolveLayout(then),
    typeof rewrite === "number" ? rewrite : rewrite && resolveLayout(rewrite),
  ];
};
