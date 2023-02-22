# next-app-middleware

next.js uses your filesystem structure to route requests to pages, why should you have to manually route middleware?

Skip the task of matching request paths to conditionally run code in your middleware - this extension allows you to locate your middleware code directly inside the app directory and only run it when it matters.

### before

```
/app/
 - /(authenticated)
   - /page1/page.js
   - /page2/page.js
 - /(unauthenticated)
   - /login/page.js
 - /page3/page.js
 - /page4/page.js
 - /layout.js
/middleware.js
```

```ts
// middleware.js
import isAuthenticated from "@/lib/isAuthenticated";
import { NextResponse } from "next/server";

const middleware = (req) => {
  // here every page that should be only accessed by authenticated users needs to be listed
  // and manually kept in sync with the project structure
  if (req.nextUrl.pathname === "/page1" || req.nextUrl.pathname === "/page2") {
    if (!(await isAuthenticated(req))) {
      return NextResponse.redirect("/login");
    }
  } else if (req.nextUrl.pathname === "/login") {
    if (await isAuthenticated(req)) {
      return NextResponse.redirect("/page1");
    }
  }
  return NextResponse.next();
};

export default middleare;
```

### after

```
/app/
 - /(authenticated)
   - /page1/page.js
   - /page2/page.js
   - middleware.js
 - /(unauthenticated)
   - /login/page.js
   - middleware.js
 - /page3/page.js
 - /page4/page.js
 - /layout.js
```

```ts
// app/(authenticated)/middleware.js
// this will only run on requests to pages in the (authenticated) segment
import isAuthenticated from "@/lib/isAuthenticated";

const middleware = async (req) => {
  if (!(await isAuthenticated(req)))
    return {
      redirect: "/login",
    };
};

export default middleware;

// app/(unauthenticated)/middleware.js
// this will only run on requests to pages in the (unauthenticated) segment
import isAuthenticated from "@/lib/isAuthenticated";

const middleware = async (req) => {
  if (await isAuthenticated(req))
    return {
      redirect: "/page1",
    };
};

export default middleware;
```

## examples

- [i18n](../../examples/i18n/) - simple example that shows how to add i18n to a next project using this extension

## setup

### install

pnpm

```
pnpm install next-app-middleware --save-dev
```

yarn

```
yarn add next-app-middleware --dev
```

npm

```
npm install next-app-middleware --save-dev
```

### clean up current middleware and git working tree

- delete your current middleware (or change the name if you want to keep it)
- commit your repository
- add `/middleware.ts` to your .gitignore
  - NOTE: include the `/` to not exclude any `middleware.ts` files in your `app` directory

### next.config.js

```js
const { withMiddleware } = require("next-app-middleware");

const nextConfig = {
  experimental: {
    appDir: true,
  },
};

module.exports = withMiddleware(nextConfig);
```

## file conventions

NOTE: unless stated otherwise can be in any segment of the app directory.

### middleware.{ts,js}

Middlewares will be called first when a request reaches its segment. A `MiddlewareHandlerResult` can be returned to intercept the request and stop the handler chain early. If the middleware returns `void`, execution continues normally.

```ts
const middleware: MiddlewareHandler = (req, res) => {
  let visitor_id = req.cookies.get("visitor_id")?.value;
  if (!visitor_id) {
    visitor_id = crypto.randomUUID();
    res.cookies.set("visitor_id", visitor_id);
  }
  req.waitUntil(trackVisit(visitor_id, req));
};

export default middleware;
```

### forward.dynamic.{ts,js}

(Can not exist in route group segment)

Define internal path forwards in this file. Export named functions that indicate what parameter will be rewritten. Used to forward [dyanmic] segments.

```
/app/
  - [locale]
    - page.tsx
  - forward.dynamic.ts
```

```ts
// app/forward.dynamic.ts
export const locale = () => {
  return "en";
};
```

In this example the forward.dynamic.ts file declares a locale rewrite. This setup will result in the final middleware to consider any external request to `/` a request to `/[locale]` and will block all direct external requests to `/[locale]`

NOTE: If you return void from any of the forward functions, request routing will continue in the current segment.

```
/app/
  - [locale]
    - page.tsx
  - forward.dynamic.ts
  - page.tsx
```

```ts
// app/forward.dynamic.ts
export const locale = () => {
  return;
};
```

Here, the request will be routed to /app/page.tsx.

### forward.static.{ts,js}

(Can not exist in route group segment)

Define internal path forwards in this file. Export named functions that indicate what parameter will be rewritten. Used to forward static segments.

```
/app/
  - hosted
    - page.tsx
  - forward.static.ts
```

```ts
// app/forward.static.ts
export const hosted = () => {
  return true;
};
```

In this example the forward.static.ts file declares a `hosted` rewrite. This setup will result in the final middleware to consider any external request to `/` a request to `/hosted` and will block all direct external requests to `/hosted`

NOTE: If you return false from any of the forward functions, request routing will continue in the current segment. (See above for an example)

### external.{ts,js}

An `external` file allows routing traffic to other applications, default export should be either of type `string` or `() => string | Promise<string>`:

```ts
const origin = "https://example.com";

export default origin;
```

```ts
const getOrigin = async () => {
  return "http://localhost:3004";
};

export default getOrigin;
```

NOTE: Once an `external` file is found route collection is stopped, so any local pages in following segments will never be reached.

### rewrite.{ts,js}

A `rewrite` file indicates to the framework that the directory is an external path. The rewrite handler will receive the same arguments as a middleware handler would but can returns the final rewirite path if the request should be rewritten.

### redirect.{ts,js}

Similar to `rewrite` but results in a redirect instead of a rewrite

```ts
/**
 * both rewrites and redirects can co-exist with pages and can
 * dynamically choose to not perform any action and continue matching.
 * Priority: rewrite > redirect > page
 */

// /app/rewrite.ts
const rewrite: RewriteHandler = (req) => {
  if (req.cookies.get("rewrite")?.value === "true") return "/rewritten";
};

// /app/page.tsx
export default () => {
  return <></>;
};

export default rewrite;

/**
 * since there is both a rewrite and a page in the same directory
 * any request that does not have the `rewrite` cookie set to `true`
 * will fall through to the page file while the ones that do have the
 * cookie set will be rewritten to `/rewritten`
 * Note: if `void` is returned and no futher handler exist a `MatchingError`
 * is thrown.
 */
```

### middleware.hooks.{ts,js}

A collection of hooks that can be used to extend the middleware lifecylce. Unlike others, this file has to be in the root of your project instead of the app directory.

#### notFound

This hook will be invoked if the middleware recieved a request that did not match any external page paths:

```ts
export const notFound: NotFoundHook = () => {
  // most hooks can return a NextResponse to override default behaviour
  return NextResponse(null, { status: 404 });
};
```

#### redirect

This hook will be invoked when a middleware returned a redirect response or a redirect file redirected the response:

```ts
export const redirect: RedirectHook = (_req, _res, destination, status) => {
  console.log(
    `Redirecting to ${destination} with status ${status)`
  );
}
```

#### rewrite

This hook will be invoked when a middleware returned a rewrite response or a rewrite file redirected the response:

```ts
export const rewrite: RewriteHook = (_req, _res, destination) => {
  console.log(`Rewriting to ${destination}`);
};
```

#### json

This hook will be invoked when a middleware resolved with a json response:

```ts
export const json: JsonHook = (_req, _res, data) => {
  return new NextResponse(yaml.stringfy(data), {
    headers: {
      "content-type": "application/x-yaml",
    },
  });
};
```

#### params

This hook can be used to override the path params before the final path is created:

```ts
export const params: ParamsHook = (params) => {
  if (params.test) {
    params.test = "override";
  }
  return params;
};
```

#### response

This hook will receive the final response and does not allow for editing it, it will be executed in the `waitUntil` method of the `NextFetchEvent`:

```ts
export const response: ResponseHook = (response) => {
  // collect metrics in here
};
```

#### error

Invoked when an error happens during matching or handler execution:

```ts
export const error: ErrorHook = (req, res, err) => {
  console.error(err);
  // the error will be re-thrown if this hook does not return a response,
  // causing a 500 response by default, if a response is returned, request
  // processing continues
  return new NextResponse(null, { status: 500 });
};
```
