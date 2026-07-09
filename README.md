# Cocos AI Bridge

Cocos AI Bridge is a local Cocos Creator 3.x editor extension for AI coding agents. It exposes a localhost HTTP API so tools like Codex, Claude Code, Cursor Agent, OpenAI Codex CLI, or other local agents can ask the editor to refresh AssetDB, reimport changed assets, save editor scene state, and request preview reloads after files are changed outside Cocos Creator.

Target version: Cocos Creator 3.8.x.

## Problem

AI agents often edit Cocos project files directly on disk. Cocos Creator may not immediately refresh AssetDB, reimport scripts, update component metadata, or reload the Preview page. Clicking the editor, switching focus, saving a scene, or restarting Preview can help, but those manual steps do not fit automated coding workflows.

This extension provides a stable local editor sync control port. It does not try to implement full runtime HMR. Asset refresh, script import, browser preview reload, and native simulator restart are different steps; the bridge lets local agents perform those steps explicitly and report failures honestly.

## Install

Copy this repository into a Cocos Creator project:

```bash
mkdir -p extensions
cp -R /path/to/cocos-ai-bridge extensions/cocos-ai-bridge
cd extensions/cocos-ai-bridge
npm install
npm run build
```

Restart Cocos Creator or reload extensions from Extension Manager.

## Install with an AI Agent

This project is intended to work like a project-level skill for a Cocos Creator game repository. Install it inside the game project, then copy its agent rules into the game project's `AGENTS.md`.

Give another local AI coding agent this prompt:

```text
Install Cocos AI Bridge from https://github.com/nathan77886/cocos-ai-bridge into this Cocos Creator project.

Requirements:
1. Clone or copy the repository to extensions/cocos-ai-bridge.
2. Run npm install and npm run build inside extensions/cocos-ai-bridge.
3. Copy extensions/cocos-ai-bridge/examples/AGENTS.cocos-project.md into the project root AGENTS.md, or merge it into the existing AGENTS.md without deleting existing project rules.
4. Do not expose the bridge outside localhost.
5. Do not delete .meta files or rewrite scene/prefab files during installation.
6. Report whether npm install, npm run build, and bridge health check succeeded.
```

After Cocos Creator loads the extension, verify:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js health
```

## Scripts

```bash
npm run build
npm run typecheck
npm run dev
npm run client:health
npm run client:sync
npm run client:refresh-assets
```

## HTTP API

Default server:

```text
http://127.0.0.1:7456
```

All operation endpoints accept POST only. Health uses GET only. Request bodies are JSON and limited to 1MB.

Success response:

```json
{
  "ok": true,
  "action": "sync-after-ai-change",
  "message": "done",
  "details": {},
  "timestamp": "2026-07-09T00:00:00.000Z"
}
```

Failure response:

```json
{
  "ok": false,
  "action": "reload-preview",
  "message": "unsupported by current Cocos Creator message API",
  "details": {
    "unsupported": true
  },
  "timestamp": "2026-07-09T00:00:00.000Z"
}
```

### GET /health

Checks whether the bridge is running.

### POST /refresh-assets

Requests:

```ts
await Editor.Message.request('asset-db', 'refresh-asset', 'db://assets');
```

### POST /refresh-path

Body:

```json
{
  "path": "assets/scripts/foo.ts"
}
```

Accepted path forms:

- `db://assets/scripts/foo.ts`
- `assets/scripts/foo.ts`
- `scripts/foo.ts`

All forms normalize to `db://assets/...`.

### POST /reimport-path

Body:

```json
{
  "path": "assets/scripts/foo.ts"
}
```

Requests:

```ts
await Editor.Message.request('asset-db', 'reimport-asset', normalizedPath);
```

### POST /save-scene

Attempts known scene save messages. Cocos Creator message names can vary by version. If this endpoint returns `unsupported`, open Cocos Creator Developer -> Message Manager and update `source/cocos-actions.ts` with the actual message.

### POST /reload-preview

Attempts preview reload messages. This is version-dependent and may return `unsupported`.

### POST /restart-preview

Attempts preview restart messages. This is version-dependent and may return `unsupported`.

### POST /sync-after-ai-change

Default flow:

1. Refresh all assets, or refresh/reimport provided paths.
2. Wait `delayMs`, default `1000`.
3. Save scene.
4. Reload preview, or restart preview if requested.

Body:

```json
{
  "paths": ["db://assets/scripts/foo.ts"],
  "reimport": false,
  "saveScene": true,
  "reloadPreview": true,
  "restartPreview": false,
  "delayMs": 1000
}
```

If `paths` exists, the bridge refreshes or reimports those paths. Otherwise it refreshes `db://assets`.

## CLI Client

From the Cocos project root:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js health
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js refresh-assets
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js refresh-path assets/scripts/foo.ts
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/foo.ts --path assets/prefabs/bar.prefab
```

## Recommended AI Workflow

1. Inspect Cocos files first.
2. Make minimal edits.
3. For script/resource/prefab/scene changes, call `sync`.
4. If sync fails, report the bridge error and do not claim editor refresh succeeded.
5. For prefab and scene files, prefer path-specific sync with `--reimport`.
6. For simulator/native preview, use `--restart-preview` when reload is insufficient.

Copy `examples/AGENTS.cocos-project.md` to a game project root as `AGENTS.md` so local agents know how to use the bridge. It includes the project rules, sync commands, and success/failure report formats.

## Preview Notes

AssetDB refresh is not runtime hot replacement. It asks the editor to notice and import changed assets.

Browser Preview can usually be handled by reload. Simulator and native preview are different processes and are better handled by restarting preview rather than chasing true HMR.

Do not ask AI agents to kill the Cocos Creator main process as a sync strategy.

## Security

This is a local development tool. Do not expose it to the public internet.

Security defaults:

- Listens only on `127.0.0.1`.
- Refuses non-localhost host configuration.
- No shell command execution endpoint.
- No arbitrary file deletion endpoint.
- Operation endpoints require POST.
- JSON request body limit is 1MB.

## Version Compatibility

The primary target is Cocos Creator 3.8.x. AssetDB refresh and reimport calls are implemented with known message names:

```ts
Editor.Message.request('asset-db', 'refresh-asset', 'db://assets')
Editor.Message.request('asset-db', 'reimport-asset', normalizedPath)
```

Scene save and preview reload/restart messages can differ across Cocos Creator versions. If an endpoint returns `unsupported`, use Developer -> Message Manager in your current editor version to find the actual message name, then update `source/cocos-actions.ts`.

## Current Limits

- Preview reload/restart message names are TODO placeholders until verified against each Cocos Creator version.
- Scene save message names are attempted defensively and may need version-specific adjustment.
- No authentication, because the server is localhost-only.
- No file watcher. External agents call the API explicitly.
