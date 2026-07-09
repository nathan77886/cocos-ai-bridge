const prefix = '[Cocos AI Bridge]';

export const logger = {
  info(message: string, details?: unknown): void {
    details === undefined ? console.log(prefix, message) : console.log(prefix, message, details);
  },
  warn(message: string, details?: unknown): void {
    details === undefined ? console.warn(prefix, message) : console.warn(prefix, message, details);
  },
  error(message: string, details?: unknown): void {
    details === undefined ? console.error(prefix, message) : console.error(prefix, message, details);
  }
};
