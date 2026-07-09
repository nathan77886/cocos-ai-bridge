#!/usr/bin/env node

const http = require('node:http');

const base = {
  host: '127.0.0.1',
  port: 7456
};

function usage() {
  console.error(`Usage:
  node tools/cocos-ai-bridge-client.js health
  node tools/cocos-ai-bridge-client.js refresh-assets
  node tools/cocos-ai-bridge-client.js refresh-path assets/scripts/foo.ts
  node tools/cocos-ai-bridge-client.js reimport-path assets/scripts/foo.ts
  node tools/cocos-ai-bridge-client.js save-scene
  node tools/cocos-ai-bridge-client.js reload-preview
  node tools/cocos-ai-bridge-client.js restart-preview
  node tools/cocos-ai-bridge-client.js sync [--path assets/foo.ts] [--reimport] [--restart-preview] [--delay-ms 1000]`);
}

function request(method, path, body) {
  const payload = body ? JSON.stringify(body) : '';
  const options = {
    ...base,
    path,
    method,
    headers: {
      'content-type': 'application/json',
      'content-length': Buffer.byteLength(payload)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed = raw ? JSON.parse(raw) : {};
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (error) {
          reject(new Error(`invalid JSON response: ${error.message}`));
        }
      });
    });

    req.on('error', reject);
    req.end(payload);
  });
}

function parseSyncArgs(args) {
  const body = { paths: [] };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--path') {
      const value = args[index + 1];
      if (!value) throw new Error('--path requires a value');
      body.paths.push(value);
      index += 1;
    } else if (arg === '--reimport') {
      body.reimport = true;
    } else if (arg === '--no-save-scene') {
      body.saveScene = false;
    } else if (arg === '--no-reload-preview') {
      body.reloadPreview = false;
    } else if (arg === '--restart-preview') {
      body.restartPreview = true;
    } else if (arg === '--delay-ms') {
      const value = Number(args[index + 1]);
      if (!Number.isFinite(value) || value < 0) throw new Error('--delay-ms requires a non-negative number');
      body.delayMs = value;
      index += 1;
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (body.paths.length === 0) {
    delete body.paths;
  }

  return body;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  let response;

  if (command === 'health') {
    response = await request('GET', '/health');
  } else if (command === 'refresh-assets') {
    response = await request('POST', '/refresh-assets', {});
  } else if (command === 'refresh-path') {
    if (!args[0]) throw new Error('refresh-path requires a path');
    response = await request('POST', '/refresh-path', { path: args[0] });
  } else if (command === 'reimport-path') {
    if (!args[0]) throw new Error('reimport-path requires a path');
    response = await request('POST', '/reimport-path', { path: args[0] });
  } else if (command === 'save-scene') {
    response = await request('POST', '/save-scene', {});
  } else if (command === 'reload-preview') {
    response = await request('POST', '/reload-preview', {});
  } else if (command === 'restart-preview') {
    response = await request('POST', '/restart-preview', {});
  } else if (command === 'sync') {
    response = await request('POST', '/sync-after-ai-change', parseSyncArgs(args));
  } else {
    usage();
    process.exitCode = 2;
    return;
  }

  console.log(JSON.stringify(response.body, null, 2));
  if (!response.body.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
