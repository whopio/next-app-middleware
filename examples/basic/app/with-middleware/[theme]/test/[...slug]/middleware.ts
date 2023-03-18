import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ slug: string[] }> = (req) => {
  console.log("middleware", req.params.slug);
};

export default middleware;
