import { Forwarder } from "next-app-middleware/runtime";

export const locale: Forwarder = (req, res) => {
  return "en";
};
