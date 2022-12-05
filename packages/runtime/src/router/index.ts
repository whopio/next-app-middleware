import { URLPattern, type NextFetchEvent, type NextRequest } from "next/server";
import { MiddlewareRequest } from "../request";
import type { MiddlewareLayout } from "../util/types";

export class MiddlewareRouter {
  constructor(private readonly layout: MiddlewareLayout) {}

  public async apply(req: NextRequest, ev: NextFetchEvent) {
    for (const [pattern, chain] of this.layout) {
      if (new URLPattern(pattern, req.nextUrl.origin).test(req.nextUrl)) {
        const hacky = {};
        const middlewareRequest = new MiddlewareRequest(
          req,
          ev,
          pattern,
          hacky
        );
        return middlewareRequest.__execute(chain, hacky);
      }
    }
  }
}
