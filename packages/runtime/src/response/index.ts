import type { NextURL } from "next/dist/server/web/next-url";
import { NextResponse } from "next/server";
import { defineReadOnly, defineReadOnlyPrivate } from "../util/readonly";
import type { MiddlewareResponseInternals } from "./internals";

const INTERNALS: unique symbol = Symbol("INTERNALS");

const reservedHeaders = [
  "Location",
  "x-middleware-rewrite",
  "x-middleware-next",
];

export class MiddlewareResponse {
  /**
   * Response Cookies -
   * Used to modify the cookies the client receives
   */
  public readonly cookies!: InstanceType<typeof NextResponse>["cookies"];
  /**
   * Response Headers -
   * Used to modify the response headers sent to the client
   */
  public readonly headers!: Headers;

  private readonly [INTERNALS]!: MiddlewareResponseInternals;

  constructor() {
    const internals: Partial<MiddlewareResponseInternals> = {};
    defineReadOnly(internals, "res", new NextResponse());

    defineReadOnlyPrivate(this, INTERNALS, internals);

    defineReadOnly(this, "cookies", this[INTERNALS].res.cookies);
    defineReadOnly(this, "headers", new Headers());
  }

  public __json(body: unknown) {
    const res = NextResponse.json(body);
    this.__apply(res);
    return res;
  }

  public __redirect(destination: string | URL | NextURL, status?: number) {
    if (status && typeof status !== "number")
      throw new RangeError(
        'Failed to execute "redirect" on "response": Invalid status code'
      );
    const res = NextResponse.redirect(destination, status);
    this.__apply(res);
    return res;
  }

  public __rewrite(destination: string | URL | NextURL) {
    const res = NextResponse.rewrite(destination);
    this.__apply(res);
    return res;
  }

  public __next() {
    const res = NextResponse.next();
    this.__apply(res);
    return res;
  }

  private __apply(res: NextResponse) {
    this.cleanHeaders();
    Array.from(this.headers.entries()).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    this.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie);
    });
  }

  private cleanHeaders() {
    reservedHeaders.forEach((header) => this.headers.delete(header));
  }
}
