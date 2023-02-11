const bodyHead = `
if (nextRequest.method !== "GET") return NextResponse.next();
const incomingPathname = nextRequest.nextUrl.pathname;
if (incomingPathname.indexOf("_next/", 1) === 1) return NextResponse.next();
if (incomingPathname === "/api" || incomingPathname.indexOf("api/", 1) === 0)
  return NextResponse.next();
if (publicFiles.has(incomingPathname))
  return NextResponse.next();
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
  get: () => nextRequest.headers
});
Object.defineProperty(req, "cookies", {
  get: () => nextRequest.cookies
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
  get: () => (promise: Promise<unknown>) => ev.waitUntil(promise)
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
let next: RuntimeNext = undefined;
let notFound = false;
let external = false;
`.trim();

export default bodyHead;
