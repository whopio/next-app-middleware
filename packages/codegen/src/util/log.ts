const makeLogger =
  (logger: (...args: any[]) => void, colorPrefix: string) =>
  (...args: any[]) => {
    logger.bind(console)(colorPrefix, "middleware", "-", ...args);
  };

export const event = makeLogger(console.info, "\x1b[35m%s\x1b[0m");
export const warn = makeLogger(console.warn, "\x1b[33m%s\x1b[0m");
export const error = makeLogger(console.error, "\x1b[31m%s\x1b[0m");
export const success = makeLogger(console.info, "\x1b[32m%s\x1b[0m");
export const info = makeLogger(console.info, "\x1b[36m%s\x1b[0m");

const logger = {
  event,
  warn,
  error,
  success,
  info,
};

export default logger;
