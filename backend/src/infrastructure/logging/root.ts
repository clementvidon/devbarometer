import { loadLoggingConfig } from '../config/loaders';
import { ConsoleLoggerAdapter } from './ConsoleLoggerAdapter';

export function makeLogger() {
  const { level, pretty } = loadLoggingConfig();
  return new ConsoleLoggerAdapter({ level, pretty });
}
