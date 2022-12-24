import { Forwarder } from "next-app-middleware/runtime";

export const theme: Forwarder = (req, res) => {
  const themeCookie = req.cookies.get("__theme");
  if (!themeCookie) {
    res.cookies.set("__theme", "dark");
    return "dark";
  }
  return themeCookie.value;
};
