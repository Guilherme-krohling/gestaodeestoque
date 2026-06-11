let lastError: Error | null = null;

if (typeof window === "undefined") {
  process.on("unhandledRejection", (reason) => {
    lastError = reason instanceof Error ? reason : new Error(String(reason));
  });
  process.on("uncaughtException", (error) => {
    lastError = error;
  });
}

export function consumeLastCapturedError(): Error | null {
  const err = lastError;
  lastError = null;
  return err;
}
