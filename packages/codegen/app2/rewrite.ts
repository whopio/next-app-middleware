import { Forwarder } from "@middleware-next/runtime";

export const locale: Forwarder = (req, res) => {
  return "en";
};
