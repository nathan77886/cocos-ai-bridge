import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import { config, type BridgeConfig } from './config';
import {
  refreshAssets,
  refreshPath,
  reimportPath,
  reloadPreview,
  restartPreview,
  saveScene,
  syncAfterAIChange
} from './cocos-actions';
import { logger } from './logger';
import type { BridgeAction, BridgeResponse, PathBody, SyncAfterAIChangeOptions } from './types';

let server: http.Server | undefined;

function json<TDetails>(action: BridgeAction, ok: boolean, message: string, details: TDetails): BridgeResponse<TDetails> {
  return {
    ok,
    action,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

function send<TDetails>(res: ServerResponse, statusCode: number, response: BridgeResponse<TDetails>): void {
  const body = JSON.stringify(response);
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body)
  });
  res.end(body);
}

function readBody(req: IncomingMessage, maxBodyBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0;
    let rejected = false;
    const chunks: Buffer[] = [];

    req.on('data', (chunk: Buffer) => {
      if (rejected) {
        return;
      }

      size += chunk.length;
      if (size > maxBodyBytes) {
        rejected = true;
        reject(new Error('request body exceeds 1MB limit'));
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      if (rejected) {
        return;
      }

      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('request body must be valid JSON'));
      }
    });

    req.on('error', reject);
  });
}

function requirePost(req: IncomingMessage, res: ServerResponse, action: BridgeAction): boolean {
  if (req.method === 'POST') {
    return true;
  }

  send(res, 405, json(action, false, 'method not allowed', { expected: 'POST' }));
  return false;
}

async function handle(req: IncomingMessage, res: ServerResponse, bridgeConfig: BridgeConfig): Promise<void> {
  const url = new URL(req.url ?? '/', `http://${bridgeConfig.host}:${bridgeConfig.port}`);
  const path = url.pathname;

  try {
    if (path === '/health') {
      if (req.method !== 'GET') {
        send(res, 405, json('health', false, 'method not allowed', { expected: 'GET' }));
        return;
      }
      send(res, 200, json('health', true, 'ok', { host: bridgeConfig.host, port: bridgeConfig.port }));
      return;
    }

    if (path === '/refresh-assets') {
      if (!requirePost(req, res, 'refresh-assets')) return;
      await readBody(req, bridgeConfig.maxBodyBytes);
      const result = await refreshAssets();
      send(res, result.ok ? 200 : 501, json('refresh-assets', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/refresh-path') {
      if (!requirePost(req, res, 'refresh-path')) return;
      const body = (await readBody(req, bridgeConfig.maxBodyBytes)) as PathBody;
      const result = await refreshPath(String(body.path ?? ''));
      send(res, result.ok ? 200 : 501, json('refresh-path', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/reimport-path') {
      if (!requirePost(req, res, 'reimport-path')) return;
      const body = (await readBody(req, bridgeConfig.maxBodyBytes)) as PathBody;
      const result = await reimportPath(String(body.path ?? ''));
      send(res, result.ok ? 200 : 501, json('reimport-path', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/save-scene') {
      if (!requirePost(req, res, 'save-scene')) return;
      await readBody(req, bridgeConfig.maxBodyBytes);
      const result = await saveScene();
      send(res, result.ok ? 200 : 501, json('save-scene', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/reload-preview') {
      if (!requirePost(req, res, 'reload-preview')) return;
      await readBody(req, bridgeConfig.maxBodyBytes);
      const result = await reloadPreview();
      send(res, result.ok ? 200 : 501, json('reload-preview', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/restart-preview') {
      if (!requirePost(req, res, 'restart-preview')) return;
      await readBody(req, bridgeConfig.maxBodyBytes);
      const result = await restartPreview();
      send(res, result.ok ? 200 : 501, json('restart-preview', result.ok, result.message, result.details ?? {}));
      return;
    }

    if (path === '/sync-after-ai-change') {
      if (!requirePost(req, res, 'sync-after-ai-change')) return;
      const body = (await readBody(req, bridgeConfig.maxBodyBytes)) as SyncAfterAIChangeOptions;
      const result = await syncAfterAIChange(body);
      send(res, result.ok ? 200 : 501, json('sync-after-ai-change', result.ok, result.message, result.details ?? {}));
      return;
    }

    send(res, 404, json('health', false, 'not found', { path }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const action = path.replace(/^\//, '') as BridgeAction;
    send(res, 500, json(action || 'health', false, message, {}));
  }
}

export function startHttpServer(bridgeConfig: BridgeConfig = config): void {
  if (bridgeConfig.host !== '127.0.0.1') {
    throw new Error('Refusing to start: host must be 127.0.0.1');
  }

  if (server) {
    return;
  }

  server = http.createServer((req, res) => {
    void handle(req, res, bridgeConfig);
  });

  server.listen(bridgeConfig.port, bridgeConfig.host, () => {
    logger.info(`HTTP server listening on http://${bridgeConfig.host}:${bridgeConfig.port}`);
  });
}

export function stopHttpServer(): void {
  if (!server) {
    return;
  }

  server.close();
  server = undefined;
  logger.info('HTTP server stopped');
}
