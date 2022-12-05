import { MiddlewareHandler } from "@middleware-next/runtime";

const middleware: MiddlewareHandler<{ locale: string }> = (req, res) => {
  console.log("middleware", req.params.locale);
};

export default middleware;
