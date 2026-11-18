import morgan from "morgan";
import logger from "../utils/logger.js";

const devFormat = ":method :url :status :res[content-length] - :response-time ms";
const prodFormat =
  ':remote-addr - :method :url :status :res[content-length] ":user-agent" - :response-time ms';

const devLogger = morgan(devFormat, { stream: logger.stream });
const prodLogger = morgan(prodFormat, { stream: logger.stream });

/**
 * HTTP request logger middleware routing morgan logs through the centralized logger.
 */
const requestLogger = (req, res, next) => {
  if (process.env.NODE_ENV === "production") {
    return prodLogger(req, res, next);
  }
  return devLogger(req, res, next);
};

export default requestLogger;
