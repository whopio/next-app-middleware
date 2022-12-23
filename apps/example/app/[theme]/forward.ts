import { Forwarder } from "next-app-middleware/runtime";

export const user: Forwarder = (req, res) => {
  if (Math.random() > 0.5) return "test";
};
