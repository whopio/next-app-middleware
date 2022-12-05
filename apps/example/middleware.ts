import makeMiddleware, {
  importForwarder,
  importMiddleware,
  MiddlewareChainSegment,
  MiddlewareHandler,
  MiddlewareLayout,
} from "@middleware-next/runtime";

const exportMiddleware = ({ default: middleware }: { default: unknown }) =>
  middleware as MiddlewareHandler;

const segments = [
  importForwarder("/", "locale", () => import("./app/rewrite")),
  importMiddleware("/:locale/", () => import("./app/[locale]/middleware")),
  importMiddleware("/404/", () => import("./app/404/middleware")),
  {
    middleware: () =>
      import("@middleware-next/runtime").then(
        ({ notFoundMiddleware }) => notFoundMiddleware
      ),
    location: "/",
  },
] as const;

const layout: MiddlewareLayout = [
  ["/404", [segments[2], 1]],
  ["/", [segments[0], 0, [segments[1] as MiddlewareChainSegment, 1]]],
  ["/:locale", [segments[3], 1]],
];

export default makeMiddleware(layout);

export const config = {
  matcher: ["/", "/:locale/"],
};
