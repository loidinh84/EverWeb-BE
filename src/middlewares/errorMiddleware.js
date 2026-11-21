import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

/**
 * Normalizes known error types (JSON parse errors, validation, JWT, etc.)
 * into a consistent shape for the centralized error handler.
 */
function normalizeError(err) {
  if (err instanceof AppError) {
    return err;
  }

  if (!err || typeof err !== "object") {
    return {
      message: typeof err === "string" && err ? err : "Internal Server Error",
      statusCode: 500,
      status: "error",
      isOperational: false,
      errors: null,
      stack: undefined,
    };
  }

  // Malformed JSON request body from express.json()
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return new AppError("Invalid JSON payload", 400);
  }

  if (err.name === "ValidationError") {
    return new AppError(
      err.message || "Validation failed",
      400,
      err.errors || null
    );
  }

  if (err.name === "CastError") {
    return new AppError(
      `Invalid ${err.path || "parameter"}: ${err.value}`,
      400
    );
  }

  if (err.code === 11000) {
    return new AppError("Duplicate field value entered", 409);
  }

  if (err.name === "JsonWebTokenError") {
    return new AppError("Invalid authentication token", 401);
  }

  if (err.name === "TokenExpiredError") {
    return new AppError("Authentication token expired", 401);
  }

  const rawCode = err.statusCode ?? err.status;
  const statusCode =
    typeof rawCode === "number" && rawCode >= 400 && rawCode < 600
      ? rawCode
      : 500;

  return {
    message: err.message || "Internal Server Error",
    statusCode,
    status: String(statusCode).startsWith("4") ? "fail" : "error",
    isOperational: Boolean(err.isOperational || err.expose),
    errors: err.errors || null,
    stack: err.stack,
  };
}

/**
 * Middleware to handle requests matching no defined route.
 */
export const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/**
 * Centralized Express error-handling middleware.
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const normalized = normalizeError(err);
  const statusCode = normalized.statusCode || 500;
  const isProd = process.env.NODE_ENV === "production";

  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    statusCode,
    ip: req.ip,
  };

  if (statusCode >= 500 || !normalized.isOperational) {
    logger.error(normalized.message, {
      ...logMeta,
      stack: err.stack || normalized.stack,
    });
  } else {
    logger.warn(normalized.message, logMeta);
  }

  const responseBody = {
    status: normalized.status,
    message:
      isProd && !normalized.isOperational
        ? "Internal Server Error"
        : normalized.message,
    ...(normalized.errors ? { errors: normalized.errors } : {}),
    timestamp: new Date().toISOString(),
    ...(!isProd && (err.stack || normalized.stack)
      ? { stack: err.stack || normalized.stack }
      : {}),
  };

  return res.status(statusCode).json(responseBody);
};
