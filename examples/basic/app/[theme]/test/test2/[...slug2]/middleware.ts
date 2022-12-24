import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler<{ slug2: string[] }> = (req, res) => {
  console.log("...slug2", req.params.slug2);
};

export default middleware;
