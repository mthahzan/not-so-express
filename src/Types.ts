import type { RouteHandler } from './route';

export type ServerConfig = {
  host?: string;
  port?: number;
  logger?: ILogger;
  notFoundHandler?: RouteHandler;
};

export interface ILogger {
  debug: (...args: unknown[]) => void;
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export * from './request';
export * from './response';
export * from './route';
