import type { ActionResult, SyncAfterAIChangeOptions } from './types';

declare const Editor:
  | {
      Message?: {
        request(channel: string, message: string, ...args: unknown[]): Promise<unknown>;
      };
    }
  | undefined;

const delay = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function editorMessage() {
  if (!Editor?.Message?.request) {
    throw new Error('Cocos Editor.Message.request is unavailable');
  }
  return Editor.Message;
}

function ok(action: string, message: string, details: Record<string, unknown> = {}): ActionResult {
  return { action, ok: true, message, details };
}

function unsupported(action: string, message: string, details: Record<string, unknown> = {}): ActionResult {
  return { action, ok: false, message, details: { unsupported: true, ...details } };
}

function asErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function normalizeAssetPath(input: string): string {
  const trimmed = input.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  if (!trimmed) {
    throw new Error('path is required');
  }

  if (trimmed === 'db://assets' || trimmed.startsWith('db://assets/')) {
    return trimmed;
  }

  if (trimmed === 'assets') {
    return 'db://assets';
  }

  if (trimmed.startsWith('assets/')) {
    return `db://${trimmed}`;
  }

  return `db://assets/${trimmed}`;
}

export async function refreshAssets(): Promise<ActionResult> {
  await editorMessage().request('asset-db', 'refresh-asset', 'db://assets');
  return ok('refresh-assets', 'done', { path: 'db://assets' });
}

export async function refreshPath(path: string): Promise<ActionResult> {
  const normalizedPath = normalizeAssetPath(path);
  await editorMessage().request('asset-db', 'refresh-asset', normalizedPath);
  return ok('refresh-path', 'done', { path: normalizedPath });
}

export async function reimportPath(path: string): Promise<ActionResult> {
  const normalizedPath = normalizeAssetPath(path);
  await editorMessage().request('asset-db', 'reimport-asset', normalizedPath);
  return ok('reimport-path', 'done', { path: normalizedPath });
}

export async function saveScene(): Promise<ActionResult> {
  const attempts = [
    { channel: 'scene', message: 'save-scene' },
    { channel: 'scene', message: 'save' }
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      await editorMessage().request(attempt.channel, attempt.message);
      return ok('save-scene', 'done', { messageName: `${attempt.channel}:${attempt.message}` });
    } catch (error) {
      errors.push(`${attempt.channel}:${attempt.message}: ${asErrorMessage(error)}`);
    }
  }

  return unsupported('save-scene', 'unsupported by current Cocos Creator message API', {
    tried: attempts,
    errors,
    todo: 'Check Developer -> Message Manager for the scene save message in this Cocos Creator version.'
  });
}

export async function reloadPreview(): Promise<ActionResult> {
  const attempts = [
    // TODO: Verify preview message names per Cocos Creator version in Developer -> Message Manager.
    { channel: 'preview', message: 'reload' },
    { channel: 'preview', message: 'reload-preview' }
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      await editorMessage().request(attempt.channel, attempt.message);
      return ok('reload-preview', 'done', { messageName: `${attempt.channel}:${attempt.message}` });
    } catch (error) {
      errors.push(`${attempt.channel}:${attempt.message}: ${asErrorMessage(error)}`);
    }
  }

  return unsupported('reload-preview', 'unsupported by current Cocos Creator message API', {
    tried: attempts,
    errors,
    todo: 'Check Developer -> Message Manager for the preview reload message in this Cocos Creator version.'
  });
}

export async function restartPreview(): Promise<ActionResult> {
  const attempts = [
    // TODO: Verify preview message names per Cocos Creator version in Developer -> Message Manager.
    { channel: 'preview', message: 'restart' },
    { channel: 'preview', message: 'restart-preview' }
  ];

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      await editorMessage().request(attempt.channel, attempt.message);
      return ok('restart-preview', 'done', { messageName: `${attempt.channel}:${attempt.message}` });
    } catch (error) {
      errors.push(`${attempt.channel}:${attempt.message}: ${asErrorMessage(error)}`);
    }
  }

  return unsupported('restart-preview', 'unsupported by current Cocos Creator message API', {
    tried: attempts,
    errors,
    todo: 'Check Developer -> Message Manager for the preview restart message in this Cocos Creator version.'
  });
}

export async function syncAfterAIChange(options: SyncAfterAIChangeOptions = {}): Promise<ActionResult> {
  const paths = options.paths?.filter((path) => path.trim().length > 0) ?? [];
  const steps: ActionResult[] = [];
  const delayMs = options.delayMs ?? 1000;

  if (paths.length > 0) {
    for (const path of paths) {
      steps.push(options.reimport ? await reimportPath(path) : await refreshPath(path));
    }
  } else {
    steps.push(await refreshAssets());
  }

  if (delayMs > 0) {
    await delay(delayMs);
    steps.push(ok('delay', 'done', { delayMs }));
  }

  if (options.saveScene ?? true) {
    steps.push(await saveScene());
  }

  if (options.restartPreview) {
    steps.push(await restartPreview());
  } else if (options.reloadPreview ?? true) {
    steps.push(await reloadPreview());
  }

  const failed = steps.filter((step) => !step.ok);
  return {
    action: 'sync-after-ai-change',
    ok: failed.length === 0,
    message: failed.length === 0 ? 'done' : 'completed with unsupported or failed steps',
    details: { steps }
  };
}
