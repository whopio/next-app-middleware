import { RouterHooksConfig } from "../types";

const renderHooksImport = (hooks: RouterHooksConfig) => {
  const usedHooks = Object.entries(hooks)
    .filter(([, value]) => value)
    .map(([key]) => key);
  if (usedHooks.length)
    return `
  import {
    ${usedHooks
      .map((hook) =>
        `
    ${hook} as ${hook}Hook
    `.trim()
      )
      .join(",\n")}
  } from "./middleware.hooks";
  `.trim();
  else return "";
};

export default renderHooksImport;
