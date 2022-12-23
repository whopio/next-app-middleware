# next-app-middleware

This next.js extension allows for middleware to live in the app directory. The extension will bundle all special middleware files in the app directory into a single middleware.ts file in your project root.

## setup

### install

### clean up current middleware and git working tree

- delete your current middleware (or change the name if you want to keep it)
- commit your repository
- add `/middleware.ts` to your .gitignore (include the `/` to not exclude any `middleware.ts` files in your `app` directory)

### next.config.js

```js
const { withMiddleware } = require("next-app-middleware");

const nextConfig = {};

module.exports = withMiddleware(nextConfig);
```

## file conventions

### app/\*\*/middleware.{ts,js}

### app/\*\*/forward.{ts,js}

Define internal path rewrites in this file. Export named functions that indicate what parameter will be rewritten.

```
/app/
  - [locale]
    - page.tsx
  - forward.ts

// app/forward.ts
export const locale = () => {
  return "en";
}
```

In this example the forward.ts file declares a locale rewrite. This setup will result in the final middleware to consider any external request to `/` a request to `/[locale]` and will block all direct external requests to `/[locale]`

### middleware.hooks.{ts,js}

A collection of hooks that can be used to extend the middleware lifecylce

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

## soon

### app/\*\*/rewrite.{ts,js}

A rewrite.ts file indicates to the framework that the directory is an external path. The rewrite handler will receive the same arguments as a middleware handler would but is expected to return the final location the request will be routed to. Can not be used to rewrite the host.

### app/\*\*/redirect.{ts,js}

Similar to rewrite.ts but results in a redirect instead of a rewrite

### catch all segments

These are a pain to compile static mathers for.

## after

### new file convention: external.{ts,js}

Once this is placed in a directory all requests starting with that path will be sent to the return value of the default export if it is a function, if its a string that value will be used. This will make it so the final middleware will have to match anything that starts with that path. As a convenience feature middleware will also match the origin of requests to public files and rewrite them as well if the origin matches the external app.
