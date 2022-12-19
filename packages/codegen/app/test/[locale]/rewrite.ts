import { Forwarder } from "@next-app-middleware/runtime";

export const user: Forwarder = (req, res) => {
  return "en";
};
