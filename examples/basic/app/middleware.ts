import { MiddlewareHandler } from "next-app-middleware/runtime";

const middleware: MiddlewareHandler = (req, res) => {
  console.log("middleware");
};

export default middleware;
