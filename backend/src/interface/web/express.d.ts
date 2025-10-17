import type { LoggerPort } from '../../application/ports/output/LoggerPort';

declare module 'express-serve-static-core' {
  interface Request {
    logger?: LoggerPort;
  }
}
