import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ theme: string }> = (req) => {
  console.log("middleware", req.params.theme);
};

export default middleware;
