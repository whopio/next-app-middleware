import type { NextFetchEvent, NextRequest } from "next/server";
import type { MiddlewareResponse } from "../response";

export type MiddlewareRequestInternals = {
  readonly res: MiddlewareResponse;
  readonly hacky: {};
  readonly req: NextRequest;
  readonly ev: NextFetchEvent;
  readonly matchedPattern: string;
  readonly path: string[];
  readonly currentPath: string[];
  params: {
    readonly [key: string]: string | undefined;
  };
  currentMatch: string;
};
