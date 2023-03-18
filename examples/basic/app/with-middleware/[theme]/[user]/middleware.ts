import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ theme: string; user: string }> = (
  req
) => {
  console.log("middleware", req.params.theme, req.params.user);
};

export default middleware;
