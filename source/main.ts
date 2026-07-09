import { startHttpServer, stopHttpServer } from './http-server';
import { logger } from './logger';

export function load(): void {
  startHttpServer();
}

export function unload(): void {
  stopHttpServer();
}

export const methods = {
  open(): void {
    logger.info('Cocos AI Bridge is running');
  }
};
