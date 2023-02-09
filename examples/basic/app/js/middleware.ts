import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler = (req, res) => {
  console.log("middleware", req.url);
};

export default middleware;
