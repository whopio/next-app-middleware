import {
  Forwarder,
  MiddlewareHandler,
  MiddleWareHandlerResult,
  NextMiddlewareInternals,
  NextMiddlewareRequest,
  NextMiddlewareResponse,
} from "@next-app-middleware/runtime";
import { ResponseCookies } from "next/dist/server/web/spec-extension/cookies/response-cookies";
import { NextMiddleware, NextResponse } from "next/server";

const publicFiles = new Set<string>([]);

const handlers: Array<MiddlewareHandler> = [];
const rewrites: Array<Forwarder> = [];

type GenericHook = () => Promise<NextResponse | undefined>;
type ParamType = Record<string, string>;

type RouterHooks = {
  notFound?: GenericHook;
  public?: GenericHook;
  redirect?: GenericHook;
  rewrite?: GenericHook;
  json?: GenericHook;
  params?: () => Promise<ParamType | undefined> | ParamType | undefined;
  response?: (res: NextResponse) => Promise<void> | void;
};

declare const hooks: RouterHooks;

export const middleware: NextMiddleware = async (nextRequest, ev) => {
  if (nextRequest.method !== "GET") return NextResponse.next();
  const incomingPathname = nextRequest.nextUrl.pathname;
  if (incomingPathname.indexOf("_next/", 1) === 0) return NextResponse.next();
  if (incomingPathname === "/api" || incomingPathname.indexOf("api/", 1) === 0)
    return NextResponse.next();
  if (publicFiles.has(incomingPathname))
    return hooks.public && typeof hooks.public === "function"
      ? await hooks.public()
      : NextResponse.next();
  const pathname =
    incomingPathname.length < 2
      ? "/"
      : incomingPathname.charCodeAt(incomingPathname.length - 1) === 47
      ? incomingPathname
      : incomingPathname + "/";
  const [, ...segments] = pathname.split("/");
  const params: ParamType = {};
  const internals = {} as NextMiddlewareInternals;
  const req = {} as NextMiddlewareRequest;
  Object.defineProperty(req, "url", {
    get: () =>
      internals.nextUrl || (internals.nextUrl = nextRequest.nextUrl.clone()),
  });
  Object.defineProperty(req, "headers", {
    get: () =>
      internals.requestHeaders || (internals.requestHeaders = new Headers()),
  });
  Object.defineProperty(req, "params", {
    get: () => ({
      ...params,
    }),
  });
  Object.defineProperty(req, "search", {
    get: () =>
      internals.searchParams ||
      (internals.searchParams = new URLSearchParams(
        nextRequest.nextUrl.search
      )),
  });
  Object.defineProperty(req, "waitUntil", {
    get: () => (promise: Promise<any>) => ev.waitUntil(promise),
  });
  const res = {} as NextMiddlewareResponse;
  Object.defineProperty(res, "headers", {
    get: () =>
      internals.responseHeaders || (internals.responseHeaders = new Headers()),
  });
  Object.defineProperty(res, "cookies", {
    get: () =>
      internals.cookies ||
      (internals.cookies = new ResponseCookies(res.headers)),
  });
  let middleware_response: MiddleWareHandlerResult | undefined = undefined;
  let response: NextResponse | undefined = undefined;
  let next: ((params: ParamType) => string) | true | undefined = undefined;
  let notFound: boolean = false;
  switch (segments.length - 1) {
    case 1: {
      switch (segments[0]) {
        case "test": {
          middleware_response = await handlers[0]({} as any, {} as any);
          switch (middleware_response) {
            case void 0: {
              const rewrite_response = await rewrites[0]({} as any, {} as any);
              switch (rewrite_response) {
                case void 0: {
                  next = true;
                  break;
                }
                default: {
                  params.locale = rewrite_response!;
                  middleware_response = await handlers[0]({} as any, {} as any);
                  switch (middleware_response) {
                    case void 0: {
                      const rewrite_response = await rewrites[0](
                        {} as any,
                        {} as any
                      );
                      switch (rewrite_response) {
                        case void 0: {
                          middleware_response = await handlers[0](
                            {} as any,
                            {} as any
                          );
                          switch (middleware_response) {
                            case void 0: {
                              next = (final_params) =>
                                `/test/${final_params.locale}/`;
                              break;
                            }
                            default: {
                              break;
                            }
                          }
                        }
                        default: {
                          params.user = rewrite_response!;
                          middleware_response = await handlers[0](
                            {} as any,
                            {} as any
                          );
                          switch (middleware_response) {
                            case void 0: {
                              next = (final_params) =>
                                `/test/${final_params.locale}/${final_params.user}/`;
                              break;
                            }
                            default: {
                              break;
                            }
                          }
                        }
                      }
                    }
                    default: {
                      break;
                    }
                  }
                }
              }
            }
            default: {
              break;
            }
          }
        }
        default: {
          notFound = true;
          break;
        }
      }
    }
    case 2: {
      switch (segments[0]) {
        case "test": {
          switch (segments[1]) {
            case "404": {
              middleware_response = await handlers[0]({} as any, {} as any);
              switch (middleware_response) {
                case void 0: {
                  middleware_response = await handlers[0]({} as any, {} as any);
                  switch (middleware_response) {
                    case void 0: {
                      next = true;
                      break;
                    }
                    default: {
                      break;
                    }
                  }
                }
                default: {
                  break;
                }
              }
            }
            case "login": {
              middleware_response = await handlers[0]({} as any, {} as any);
              switch (middleware_response) {
                case void 0: {
                  const rewrite_response = await rewrites[0](
                    {} as any,
                    {} as any
                  );
                  switch (rewrite_response) {
                    case void 0: {
                      notFound = true;
                      break;
                    }
                    default: {
                      params.locale = rewrite_response!;
                      middleware_response = await handlers[0](
                        {} as any,
                        {} as any
                      );
                      switch (middleware_response) {
                        case void 0: {
                          middleware_response = await handlers[0](
                            {} as any,
                            {} as any
                          );
                          switch (middleware_response) {
                            case void 0: {
                              next = (final_params) =>
                                `/test/${final_params.locale}/login/`;
                              break;
                            }
                            default: {
                              break;
                            }
                          }
                        }
                        default: {
                          break;
                        }
                      }
                    }
                  }
                }
                default: {
                  break;
                }
              }
            }
            default: {
              notFound = true;
              break;
            }
          }
        }
        default: {
          notFound = true;
          break;
        }
      }
    }
    case 3: {
      switch (segments[0]) {
        case "test": {
          switch (segments[1]) {
            case "friends": {
              switch (segments[2]) {
                default: {
                  middleware_response = await handlers[0]({} as any, {} as any);
                  switch (middleware_response) {
                    case void 0: {
                      const rewrite_response = await rewrites[0](
                        {} as any,
                        {} as any
                      );
                      switch (rewrite_response) {
                        case void 0: {
                          notFound = true;
                          break;
                        }
                        default: {
                          params.locale = rewrite_response!;
                          middleware_response = await handlers[0](
                            {} as any,
                            {} as any
                          );
                          switch (middleware_response) {
                            case void 0: {
                              const rewrite_response = await rewrites[0](
                                {} as any,
                                {} as any
                              );
                              switch (rewrite_response) {
                                case void 0: {
                                  params.friend = segments[2];
                                  next = (final_params) =>
                                    `/test/${final_params.locale}/friends/${final_params.friend}/`;
                                  break;
                                }
                                default: {
                                  params.user = rewrite_response!;
                                  middleware_response = await handlers[0](
                                    {} as any,
                                    {} as any
                                  );
                                  switch (middleware_response) {
                                    case void 0: {
                                      middleware_response = await handlers[0](
                                        {} as any,
                                        {} as any
                                      );
                                      switch (middleware_response) {
                                        case void 0: {
                                          next = (final_params) =>
                                            `/test/${final_params.locale}/${final_params.user}/friends/${final_params.friend}/`;
                                          break;
                                        }
                                        default: {
                                          break;
                                        }
                                      }
                                    }
                                    default: {
                                      break;
                                    }
                                  }
                                }
                              }
                            }
                            default: {
                              break;
                            }
                          }
                        }
                      }
                    }
                    default: {
                      break;
                    }
                  }
                }
              }
            }
            default: {
              notFound = true;
              break;
            }
          }
        }
        default: {
          notFound = true;
          break;
        }
      }
    }
    case 4: {
      switch (segments[0]) {
        case "test": {
          switch (segments[1]) {
            case "friends": {
              switch (segments[2]) {
                case "best": {
                  switch (segments[3]) {
                    case "test": {
                      middleware_response = await handlers[0](
                        {} as any,
                        {} as any
                      );
                      switch (middleware_response) {
                        case void 0: {
                          const rewrite_response = await rewrites[0](
                            {} as any,
                            {} as any
                          );
                          switch (rewrite_response) {
                            case void 0: {
                              notFound = true;
                              break;
                            }
                            default: {
                              params.locale = rewrite_response!;
                              middleware_response = await handlers[0](
                                {} as any,
                                {} as any
                              );
                              switch (middleware_response) {
                                case void 0: {
                                  middleware_response = await handlers[0](
                                    {} as any,
                                    {} as any
                                  );
                                  switch (middleware_response) {
                                    case void 0: {
                                      next = (final_params) =>
                                        `/test/${final_params.locale}/friends/best/test/`;
                                      break;
                                    }
                                    default: {
                                      break;
                                    }
                                  }
                                }
                                default: {
                                  break;
                                }
                              }
                            }
                          }
                        }
                        default: {
                          break;
                        }
                      }
                    }
                    default: {
                      notFound = true;
                      break;
                    }
                  }
                }
                default: {
                  switch (segments[3]) {
                    case "test2": {
                      middleware_response = await handlers[0](
                        {} as any,
                        {} as any
                      );
                      switch (middleware_response) {
                        case void 0: {
                          const rewrite_response = await rewrites[0](
                            {} as any,
                            {} as any
                          );
                          switch (rewrite_response) {
                            case void 0: {
                              notFound = true;
                              break;
                            }
                            default: {
                              params.locale = rewrite_response!;
                              middleware_response = await handlers[0](
                                {} as any,
                                {} as any
                              );
                              switch (middleware_response) {
                                case void 0: {
                                  params.friend = segments[2];
                                  middleware_response = await handlers[0](
                                    {} as any,
                                    {} as any
                                  );
                                  switch (middleware_response) {
                                    case void 0: {
                                      next = (final_params) =>
                                        `/test/${final_params.locale}/friends/${final_params.friend}/test2/`;
                                      break;
                                    }
                                    default: {
                                      break;
                                    }
                                  }
                                }
                                default: {
                                  break;
                                }
                              }
                            }
                          }
                        }
                        default: {
                          break;
                        }
                      }
                    }
                    case "test": {
                      middleware_response = await handlers[0](
                        {} as any,
                        {} as any
                      );
                      switch (middleware_response) {
                        case void 0: {
                          const rewrite_response = await rewrites[0](
                            {} as any,
                            {} as any
                          );
                          switch (rewrite_response) {
                            case void 0: {
                              notFound = true;
                              break;
                            }
                            default: {
                              params.locale = rewrite_response!;
                              middleware_response = await handlers[0](
                                {} as any,
                                {} as any
                              );
                              switch (middleware_response) {
                                case void 0: {
                                  params.enemy = segments[2];
                                  middleware_response = await handlers[0](
                                    {} as any,
                                    {} as any
                                  );
                                  switch (middleware_response) {
                                    case void 0: {
                                      next = (final_params) =>
                                        `/test/${final_params.locale}/friends/${final_params.enemy}/test/`;
                                      break;
                                    }
                                    default: {
                                      break;
                                    }
                                  }
                                }
                                default: {
                                  break;
                                }
                              }
                            }
                          }
                        }
                        default: {
                          break;
                        }
                      }
                    }
                    default: {
                      notFound = true;
                      break;
                    }
                  }
                }
              }
            }
            default: {
              notFound = true;
              break;
            }
          }
        }
        default: {
          notFound = true;
          break;
        }
      }
    }
    default: {
      notFound = true;
    }
  }
  if (!response) {
    if (notFound) {
      response = NextResponse.rewrite(new URL("/404", nextRequest.nextUrl));
    } else if (next) {
      let final_pathname = incomingPathname;
      if (typeof next === "function") {
        const final_params =
          (hooks.params &&
            typeof hooks.params === "function" &&
            (await hooks.params())) ||
          params;
        final_pathname = next(final_params);
      }
      const search = internals.searchParams
        ? internals.searchParams
        : nextRequest.nextUrl.searchParams;
      final_pathname = `${final_pathname}?${search}`;
      response =
        final_pathname !== `${pathname}?${nextRequest.nextUrl.searchParams}`
          ? NextResponse.rewrite(new URL(final_pathname, nextRequest.nextUrl))
          : NextResponse.next();
    } else {
      if (!middleware_response) throw new Error("Expected middleware response");
      const middleware_result = middleware_response!;
      let hook: GenericHook | undefined;
      let defaultResponse: (() => NextResponse) | undefined;
      if ("redirect" in middleware_result) {
        hook = hooks.redirect;
        defaultResponse = () =>
          NextResponse.redirect(
            new URL(middleware_result.redirect, nextRequest.nextUrl),
            middleware_result.status
          );
      } else if ("rewrite" in middleware_result!) {
        hook = hooks.rewrite;
        defaultResponse = () =>
          NextResponse.rewrite(
            new URL(middleware_result.rewrite, nextRequest.nextUrl)
          );
      } else if ("json" in middleware_result!) {
        hook = hooks.json;
        defaultResponse = () => NextResponse.json(middleware_result.json);
      } else throw new Error("invalid middleware response");
      response =
        (hook && typeof hook === "function" && (await hook())) ||
        defaultResponse();
    }
  }

  internals.responseHeaders !== undefined &&
    internals.responseHeaders.forEach((value, key) =>
      response!.headers.append(key, value)
    );

  internals.cookies !== undefined &&
    internals.cookies
      .getAll()
      .forEach((cookie) => response!.cookies.set(cookie));

  hooks.response &&
    typeof hooks.response === "function" &&
    ev.waitUntil(Promise.resolve(hooks.response(response)));

  return response;
};

export const config = {
  matcher:
    "/((?!_next(?:$|/)|api(?:$|/))[^/]+/?|$)([^/]+/?|$)([^/]+/?|$)([^/]+/?|$)([^/]+/?|$)([^/]+/?|$)",
};
