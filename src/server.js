import "dotenv/config";
import app from "./app.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 5000;

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception. Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info(`Server is running at http://localhost:${PORT}`, {
    env: process.env.NODE_ENV || "development",
  });
});

process.on("unhandledRejection", (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  logger.error("Unhandled Rejection. Shutting down...", {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  server.close(() => {
    process.exit(1);
  });
});
