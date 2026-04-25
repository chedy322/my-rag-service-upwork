// src/utils/logger.js
// Lightweight structured logger. Swap for Winston/Pino in production.

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ?? LEVELS.info;

function fmt(level, msg, meta) {
  const ts = new Date().toISOString();
  const base = `[${ts}] ${level.toUpperCase().padEnd(5)} ${msg}`;
  return meta ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
  debug: (msg, meta) => LEVELS.debug >= MIN_LEVEL && console.debug(fmt("debug", msg, meta)),
  info:  (msg, meta) => LEVELS.info  >= MIN_LEVEL && console.info (fmt("info",  msg, meta)),
  warn:  (msg, meta) => LEVELS.warn  >= MIN_LEVEL && console.warn (fmt("warn",  msg, meta)),
  error: (msg, meta) => LEVELS.error >= MIN_LEVEL && console.error(fmt("error", msg, meta)),
};

export default logger;
