import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.resolve(__dirname, "../../logs");

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const LEVEL_COLORS = {
  error: "\x1b[31m", // Red
  warn: "\x1b[33m",  // Yellow
  info: "\x1b[36m",  // Cyan
  debug: "\x1b[90m", // Gray
};

const RESET_COLOR = "\x1b[0m";

let appLogStream = null;
let errorLogStream = null;

function initLogStreams() {
  if (appLogStream && errorLogStream) return;

  try {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
    appLogStream = fs.createWriteStream(path.join(LOGS_DIR, "app.log"), {
      flags: "a",
    });
    errorLogStream = fs.createWriteStream(path.join(LOGS_DIR, "error.log"), {
      flags: "a",
    });

    appLogStream.on("error", (err) => {
      console.error("Failed to write to app.log:", err.message);
    });
    errorLogStream.on("error", (err) => {
      console.error("Failed to write to error.log:", err.message);
    });
  } catch (err) {
    console.error("Failed to initialize log directory:", err.message);
  }
}

function getActiveLogLevel() {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && envLevel in LOG_LEVELS) {
    return LOG_LEVELS[envLevel];
  }
  return process.env.NODE_ENV === "production"
    ? LOG_LEVELS.info
    : LOG_LEVELS.debug;
}

function shouldLog(level) {
  return LOG_LEVELS[level] <= getActiveLogLevel();
}

function formatMeta(meta) {
  if (!meta || (typeof meta === "object" && Object.keys(meta).length === 0)) {
    return "";
  }
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return " [Unserializable metadata]";
  }
}

function writeLog(level, message, meta) {
  if (!shouldLog(level)) return;

  initLogStreams();

  const timestamp = new Date().toISOString();
  const isProd = process.env.NODE_ENV === "production";
  const plainLine = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;

  if (isProd) {
    const jsonEntry = JSON.stringify({
      timestamp,
      level,
      message,
      ...(meta ? { meta } : {}),
    });
    if (level === "error") {
      console.error(jsonEntry);
    } else if (level === "warn") {
      console.warn(jsonEntry);
    } else {
      console.log(jsonEntry);
    }
  } else {
    const color = LEVEL_COLORS[level] || "";
    const coloredLine = `${color}[${timestamp}] [${level.toUpperCase()}]${RESET_COLOR} ${message}${formatMeta(meta)}`;
    if (level === "error") {
      console.error(coloredLine);
    } else if (level === "warn") {
      console.warn(coloredLine);
    } else {
      console.log(coloredLine);
    }
  }

  if (appLogStream) {
    appLogStream.write(`${plainLine}\n`);
  }
  if (level === "error" && errorLogStream) {
    errorLogStream.write(`${plainLine}\n`);
  }
}

const logger = {
  error: (message, meta) => writeLog("error", message, meta),
  warn: (message, meta) => writeLog("warn", message, meta),
  info: (message, meta) => writeLog("info", message, meta),
  debug: (message, meta) => writeLog("debug", message, meta),
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
};

export default logger;
