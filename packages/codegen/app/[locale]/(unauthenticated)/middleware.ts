import { MiddlewareHandler } from "@middleware-next/runtime";

const middleware: MiddlewareHandler = (req, res) => {
  console.log("middleware");
};

export default middleware;
