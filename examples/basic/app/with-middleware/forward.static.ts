import { StaticForwarder } from "next-app-middleware/runtime";

export const hosted: StaticForwarder = () => {
  return true;
};
