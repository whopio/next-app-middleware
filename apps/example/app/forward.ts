import { Forwarder } from "next-app-middleware/runtime";

export const theme: Forwarder = (req, res) => {
  const themeCookie = "dark";
  return themeCookie;
};
