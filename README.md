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

### middleware.hooks.{ts,js}

#### notFound

#### redirect

#### rewrite

#### json

#### params

#### response

### app/\*\*/middleware.{ts,js}

### app/\*\*/rewrite.{ts,js}

Define internal path rewrites in this file. Export named functions that indicate what parameter will be rewritten.

```
/app/
  - [locale]
    - page.tsx
  - rewrite.ts

// app/rewrite.ts
export const locale = () => {
  return "en";
}
```

In this example the rewirte.ts file declares a locale rewrite. This setup will result in the final middleware to consider any external request to `/` a request to `/[locale]` and will block all direct external requests to `/[locale]`

## future plans

### new file convention: external.{ts,js}

Once this is placed in a directory all requests starting with that path will be sent to the return value of the default export if it is a function, if its a string that value will be used. This will make it so the final middleware will have to match anything that starts with that path. As a convenience feature middleware will also match the origin of requests to public files and rewrite them as well if the origin matches the external app.
