/**
 * @type {import("next-app-middleware/runtime").MiddlewareHandler<{ locale: string }>}
 */
export default (req, res) => {
  console.log("middleware", req.params.locale);
  return;
};
