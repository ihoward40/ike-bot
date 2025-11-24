import morgan from "morgan";
import { Request } from "express";

// Custom token for user ID
morgan.token("user-id", (req: Request) => {
  const authReq = req as any;
  return authReq.user ? authReq.user.id : "anonymous";
});

// Custom format including user ID
export const requestLogger = morgan(
  ":method :url :status :res[content-length] - :response-time ms - user: :user-id",
  {
    skip: (req) => req.url === "/health",
  }
);

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || "");
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta || "");
  },
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta || "");
    }
  },
};
