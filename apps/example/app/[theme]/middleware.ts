import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ theme: string }> = (req, res) => {
  console.log("middleware", req.params.theme);
};

export default middleware;
