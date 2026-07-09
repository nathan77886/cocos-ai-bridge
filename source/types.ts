export type BridgeAction =
  | 'health'
  | 'refresh-assets'
  | 'refresh-path'
  | 'reimport-path'
  | 'save-scene'
  | 'reload-preview'
  | 'restart-preview'
  | 'sync-after-ai-change';

export interface BridgeResponse<TDetails = Record<string, unknown>> {
  ok: boolean;
  action: BridgeAction;
  message: string;
  details: TDetails;
  timestamp: string;
}

export interface SyncAfterAIChangeOptions {
  paths?: string[];
  reimport?: boolean;
  saveScene?: boolean;
  reloadPreview?: boolean;
  restartPreview?: boolean;
  delayMs?: number;
}

export interface PathBody {
  path?: string;
}

export interface ActionResult {
  action: string;
  ok: boolean;
  message: string;
  details?: Record<string, unknown>;
}
