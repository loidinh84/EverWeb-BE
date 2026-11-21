/**
 * Custom operational error class for standardized API error handling.
 */
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {Array|Object|null} [errors=null] - Optional validation or detailed error info
   */
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errors = errors;

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
