import type {
  ChainLayout,
  ForwarderSegment,
  MiddlewareChainSegment,
  MiddlewareHandlerSegment,
  ResolvedChainLayout,
  ResolvedForwarderSegment,
  ResolvedMiddlewareChainSegment,
  ResolvedMiddlewareHandlerSegment,
} from "../util/types";
import type { MiddlewareRequestInternals } from "./internals";

export const isForwarder = (
  input: MiddlewareChainSegment
): input is ForwarderSegment => {
  return "forward" in input;
};

export const isMiddleware = (
  input: MiddlewareChainSegment
): input is MiddlewareHandlerSegment => {
  return "middleware" in input;
};

export const isResolvedForwarder = (
  input: ResolvedMiddlewareChainSegment
): input is ResolvedForwarderSegment => {
  return "forward" in input;
};

export const isResolvedMiddleware = (
  input: ResolvedMiddlewareChainSegment
): input is ResolvedMiddlewareHandlerSegment => {
  return "middleware" in input;
};

const resolveSegment = (
  segment: MiddlewareChainSegment
): ResolvedMiddlewareChainSegment => {
  if (isForwarder(segment)) {
    return {
      ...segment,
      forward: segment.forward(),
    };
  } else if (isMiddleware(segment)) {
    return {
      ...segment,
      middleware: segment.middleware(),
    };
  }
  throw new Error("");
};

export const resolveLayout = ([
  handler,
  then,
  rewrite,
]: ChainLayout): ResolvedChainLayout => {
  return [
    resolveSegment(handler),
    typeof then === "number" ? then : then && resolveLayout(then),
    rewrite && resolveLayout(rewrite),
  ];
};
