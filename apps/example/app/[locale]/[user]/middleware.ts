import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ locale: string; user: string }> = (
  req,
  res
) => {
  console.log("middleware", req.params.locale, req.params.user);
};

export default middleware;
