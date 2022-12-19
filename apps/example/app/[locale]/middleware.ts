import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ locale: string }> = (req, res) => {
  console.log("middleware", req.params.locale);
};

export default middleware;
