import { URLPattern, type NextFetchEvent, type NextRequest } from "next/server";
import { MiddlewareRequest } from "../request";
import type { MiddlewareLayout } from "../util/types";

export class MiddlewareRouter {
  constructor(private readonly layout: MiddlewareLayout) {}

  public async apply(req: NextRequest, ev: NextFetchEvent) {
    for (const [pattern, chain] of this.layout) {
      console.time("test URLPattern");
      if (new URLPattern(pattern, req.nextUrl.origin).test(req.nextUrl)) {
        console.timeEnd("test URLPattern");
        const hacky = {};
        const middlewareRequest = new MiddlewareRequest(
          req,
          ev,
          pattern,
          hacky
        );
        return middlewareRequest.__execute(chain, hacky);
      } else console.timeEnd("test URLPattern");
    }
  }
}
