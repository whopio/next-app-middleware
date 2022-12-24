/**
 * @type {import("next-app-middleware/runtime").ResponseHook>}
 */
export const response = (res) => {
  console.log(res.status);
};
