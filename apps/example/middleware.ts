// auto-generated file, do not edit manually
import {
  makeMiddleware,
  importForwarder,
  importMiddleware,
  type MiddlewareLayout,
} from "middleware-next/runtime";

const segment_4ed5c4a4f323 = importMiddleware("/404/", () =>
  import("./app/404/middleware")
);
const segment_cabf71a224e8 = importForwarder("/", "locale", () =>
  import("./app/rewrite")
);
const segment_ab2c31666327 = importMiddleware("/:locale/", () =>
  import("./app/[locale]/middleware")
);

const layout: MiddlewareLayout = [
  ["/404/", [segment_4ed5c4a4f323, 1]],
  ["/", [segment_cabf71a224e8, , [segment_ab2c31666327, 1]]],
];

export default makeMiddleware(layout);
