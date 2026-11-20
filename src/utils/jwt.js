import jwt from "jsonwebtoken";

const DEFAULT_JWT_EXPIRES_IN = "7d";
const DEFAULT_RESET_EXPIRES_IN = "15m";

function isPlainObject(value) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function getRequiredSecret(envKey) {
  const secret = process.env[envKey];
  if (typeof secret !== "string" || secret.trim() === "") {
    throw new Error(`${envKey} is not configured in environment variables`);
  }
  return secret;
}

function validatePayload(payload) {
  if (!isPlainObject(payload)) {
    throw new TypeError("JWT payload must be a plain object");
  }
  if (Object.keys(payload).length === 0) {
    throw new Error("JWT payload must not be empty");
  }
}

function validateOptions(options) {
  if (options !== undefined && !isPlainObject(options)) {
    throw new TypeError("JWT options must be a plain object");
  }
}

function signJwt(payload, secretEnvKey, defaultExpiresIn, options = {}) {
  validatePayload(payload);
  validateOptions(options);

  const secret = getRequiredSecret(secretEnvKey);
  const signOptions = { ...options };

  if (signOptions.expiresIn === undefined && !("exp" in payload)) {
    signOptions.expiresIn = defaultExpiresIn;
  }

  return jwt.sign(payload, secret, signOptions);
}

/**
 * Generates a signed JWT access token.
 * @param {Record<string, unknown>} payload - Non-empty plain object containing token claims
 * @param {import("jsonwebtoken").SignOptions} [options={}] - Optional jsonwebtoken sign options
 * @returns {string} Signed JWT string
 */
export const generateToken = (payload, options = {}) => {
  const defaultExpiresIn =
    process.env.JWT_EXPIRES_IN?.trim() || DEFAULT_JWT_EXPIRES_IN;
  return signJwt(payload, "JWT_SECRET", defaultExpiresIn, options);
};

/**
 * Verifies a JWT access token and returns its decoded payload.
 * @param {string} token - JWT string to verify
 * @returns {import("jsonwebtoken").JwtPayload | string} Decoded token payload
 */
export const verifyToken = (token) => {
  return jwt.verify(token, getRequiredSecret("JWT_SECRET"));
};

/**
 * Generates a short-lived JWT token for password reset.
 * @param {Record<string, unknown>} payload - Non-empty plain object containing token claims
 * @param {import("jsonwebtoken").SignOptions} [options={}] - Optional jsonwebtoken sign options
 * @returns {string} Signed reset JWT string
 */
export const generateResetToken = (payload, options = {}) => {
  return signJwt(
    payload,
    "JWT_RESET_SECRET",
    DEFAULT_RESET_EXPIRES_IN,
    options
  );
};

/**
 * Verifies a password-reset JWT token and returns its decoded payload.
 * @param {string} token - Reset JWT string to verify
 * @returns {import("jsonwebtoken").JwtPayload | string} Decoded token payload
 */
export const verifyResetToken = (token) => {
  return jwt.verify(token, getRequiredSecret("JWT_RESET_SECRET"));
};
