type LogContext = Record<string, unknown>;

const write = (
  level: "info" | "warn" | "error",
  event: string,
  context: LogContext = {},
) => {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...context,
  };

  if (level === "error") console.error(entry);
  else if (level === "warn") console.warn(entry);
  else if (import.meta.env.DEV) console.info(entry);
};

export const logger = {
  info: (event: string, context?: LogContext) =>
    write("info", event, context),
  warn: (event: string, context?: LogContext) =>
    write("warn", event, context),
  error: (event: string, context?: LogContext) =>
    write("error", event, context),
};
