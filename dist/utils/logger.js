"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LOG_LEVELS = {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug'
};
class Logger {
    formatMessage(level, message, meta) {
        const timestamp = new Date().toISOString();
        const metaString = meta ? ` ${JSON.stringify(meta)}` : '';
        return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaString}`;
    }
    error(message, meta) {
        console.error(this.formatMessage(LOG_LEVELS.ERROR, message, meta));
    }
    warn(message, meta) {
        console.warn(this.formatMessage(LOG_LEVELS.WARN, message, meta));
    }
    info(message, meta) {
        console.info(this.formatMessage(LOG_LEVELS.INFO, message, meta));
    }
    debug(message, meta) {
        if (process.env.NODE_ENV === 'development') {
            console.debug(this.formatMessage(LOG_LEVELS.DEBUG, message, meta));
        }
    }
}
const logger = new Logger();
exports.default = logger;
//# sourceMappingURL=logger.js.map