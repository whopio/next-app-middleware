import makeMiddleware, {
  importForwarder,
  importMiddleware,
  type MiddlewareLayout,
} from "@middleware-next/runtime";

const segment_0aed9213 = importForwarder(
  "/",
  "locale",
  () => import("./app/rewrite")
);
const segment_3423feea = importMiddleware(
  "/:locale/",
  () => import("./app/[locale]/middleware")
);
const segment_9875abed = importMiddleware(
  "/404/",
  () => import("./app/404/middleware")
);

const layout: MiddlewareLayout = [
  ["/404", [segment_9875abed]],
  ["/", [segment_0aed9213, , [segment_3423feea, 1]]],
];

export default makeMiddleware(layout);

export const config = {
  matcher: ["/", "/:locale/"],
};
