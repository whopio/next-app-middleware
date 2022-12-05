import type { NextURL } from "next/dist/server/web/next-url";
import {
  URLPattern,
  type NextFetchEvent,
  type NextRequest,
  type NextResponse,
} from "next/server";
import { MiddlewareResponse } from "../response";
import {
  defineReadOnly,
  defineReadOnlyGetter,
  defineReadOnlyPrivate,
} from "../util/readonly";
import type {
  ChainLayout,
  MiddlewareChainSegment,
  MiddlewareLayout,
  ResolvedChainLayout,
  ResolvedMiddlewareChainSegment,
} from "../util/types";
import type { MiddlewareRequestInternals } from "./internals";
import {
  isForwarder,
  isMiddleware,
  isResolvedForwarder,
  isResolvedMiddleware,
  resolveLayout,
} from "./util";

const INTERNALS: unique symbol = Symbol("INTERNALS");

export class MiddlewareRequest<
  Params extends Record<string, string | undefined> = Record<
    string,
    string | undefined
  >
> {
  /**
   * accepts a promise to be safely executed, even after a response
   * has already been returned.
   */
  public readonly waitUntil!: NextFetchEvent["waitUntil"];
  /**
   * Request Cookies
   */
  public readonly cookies!: InstanceType<typeof NextRequest>["cookies"];
  /**
   * Request Headers -
   * Used to change the incoming request headers in upcoming middleware
   * and the final lambda/edge handler
   */
  public readonly headers!: Headers;
  /**
   * Path Parameters
   */
  public readonly params!: Params;
  /**
   * The `readonly` initial request url, before any middleware
   * forwarders ran
   */
  public readonly initialURL!: NextURL;
  public readonly currentPath!: string;
  public readonly search!: URLSearchParams;

  private readonly [INTERNALS]!: MiddlewareRequestInternals;

  constructor(
    __req: NextRequest,
    __ev: NextFetchEvent,
    __pattern: string,
    __hacky: {}
  ) {
    const internals: Partial<MiddlewareRequestInternals> = {
      currentMatch: "",
      path: __req.nextUrl.pathname.split("/").filter(Boolean),
      currentPath: [],
      params: {},
    };
    defineReadOnly(internals, "req", __req);
    defineReadOnly(internals, "ev", __ev);
    defineReadOnly(internals, "matchedPattern", __pattern);
    defineReadOnly(internals, "hacky", __hacky);
    defineReadOnly(internals, "res", new MiddlewareResponse());

    defineReadOnlyPrivate(this, INTERNALS, internals);

    defineReadOnly(
      this,
      "waitUntil",
      this[INTERNALS].ev.waitUntil.bind(this[INTERNALS].ev)
    );
    defineReadOnly(this, "cookies", this[INTERNALS].req.cookies);
    defineReadOnly(this, "headers", this[INTERNALS].req.headers);
    defineReadOnly(this, "search", new URLSearchParams(__req.nextUrl.search));
    defineReadOnlyGetter(this, "initialURL", () =>
      this[INTERNALS].req.nextUrl.clone()
    );
    defineReadOnlyGetter(this, "params", () => {
      return this[INTERNALS].params as Params;
    });
    defineReadOnlyGetter(this, "currentPath", () =>
      this[INTERNALS].currentPath.join("/")
    );
  }

  public async __execute(chain: ChainLayout, verify: {}) {
    if (verify !== this[INTERNALS].hacky)
      throw new Error(
        "MiddlewareRequest.prototype.__execute should not be called manually"
      );
    let currentSegment: ResolvedChainLayout = resolveLayout(chain);
    while (currentSegment) {
      const [handler, then, rewrite] = currentSegment;
      const res = await this.__executeSegment(handler, verify);
      if (typeof res === "boolean") {
        if (res) {
          if (rewrite) currentSegment = rewrite;
          else break;
        } else {
          if (typeof then === "number") {
            // here 0 indicates an error in routing and 1 means
            // that the middleware should resolve and finish processing
            if (then === 0) {
              throw new Error(
                "Routing Error: Expected rewrite to return a param."
              );
            } else break;
          } else if (then) currentSegment = then;
          else break;
        }
      } else return res;
    }
    const cleanInitialUrl = this.initialURL.pathname
      .split("/")
      .filter(Boolean)
      .join("/");
    /**
     * consume the rest of the path to get the final path
     */
    const cleanFinalUrl = [
      ...this[INTERNALS].currentPath,
      ...this[INTERNALS].path,
    ].join("/");
    if (
      cleanFinalUrl === cleanInitialUrl &&
      `${this.search}` === `${this.initialURL.search}`
    )
      return this[INTERNALS].res.__next();
    const finalURL = new URL(
      `/${cleanFinalUrl && `${cleanFinalUrl}/`}?${this.search}`,
      this.initialURL.origin
    );
    return this[INTERNALS].res.__rewrite(finalURL);
  }

  private __executeSegment = async (
    handlerOrForwarder: ResolvedMiddlewareChainSegment,
    verify: {}
  ): Promise<NextResponse | boolean> => {
    if (verify !== this[INTERNALS].hacky)
      throw new Error(
        "MiddlewareRequest.prototype.__executeSegment should not be called manually"
      );
    const { location } = handlerOrForwarder;
    this[INTERNALS].currentMatch = location;
    const matchedSegments = location.split("/").filter(Boolean).length;
    /**
     * make sure there are enough segments to consume.
     */
    if (
      this[INTERNALS].path.length <
      matchedSegments - this[INTERNALS].currentPath.length
    )
      throw new Error("Could not resolve path");
    /**
     * consume path segments until the matched segments amount
     * is reached.
     */
    while (matchedSegments > this[INTERNALS].currentPath.length)
      this[INTERNALS].currentPath.push(this[INTERNALS].path.shift()!);
    /**
     * match the current path against the current match and update
     * the params
     */
    const testURL = new URL(
      `/${
        this[INTERNALS].currentPath.length
          ? `${this[INTERNALS].currentPath.join("/")}/`
          : ""
      }`,
      this[INTERNALS].req.nextUrl.origin
    );
    const match = new URLPattern(
      location,
      this[INTERNALS].req.nextUrl.origin
    ).exec(testURL);
    if (!match) throw new Error("Unexpected Error while getting Path params");
    this[INTERNALS].params = match.pathname.groups;
    if (isResolvedMiddleware(handlerOrForwarder)) {
      const { middleware: handler } = handlerOrForwarder;
      const middlewareResult = await (await handler)(this, this[INTERNALS].res);
      if (!middlewareResult) return false;
      if ("redirect" in middlewareResult) {
        const redirectUri = new URL(
          middlewareResult.redirect,
          this[INTERNALS].req.nextUrl.origin
        );
        return this[INTERNALS].res.__redirect(
          redirectUri,
          middlewareResult.status
        );
      } else if ("rewrite" in middlewareResult) {
        const rewriteUri = new URL(
          middlewareResult.rewrite,
          this[INTERNALS].req.nextUrl.origin
        );
        return this[INTERNALS].res.__rewrite(rewriteUri);
      } else if ("json" in middlewareResult) {
        return this[INTERNALS].res.__json(middlewareResult.json);
      }
    } else if (isResolvedForwarder(handlerOrForwarder)) {
      const { forward: forwarder } = handlerOrForwarder;
      const param = await (await forwarder)(this, this[INTERNALS].res);
      /**
       * if the forwarder returned a forward and
       * param append the param to the current path.
       * return true to tell the executer that the request
       * was forwarded
       */
      if (param) {
        this[INTERNALS].currentPath.push(param);
        return true;
      }
    }
    return false;
  };
}
