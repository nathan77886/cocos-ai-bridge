export interface BridgeConfig {
  host: '127.0.0.1';
  port: number;
  maxBodyBytes: number;
}

export const config: BridgeConfig = {
  host: '127.0.0.1',
  port: 7456,
  maxBodyBytes: 1024 * 1024
};
