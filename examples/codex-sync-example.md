# Codex Sync Examples

Run these commands from the Cocos project root after editing files outside Cocos Creator.

## TypeScript Changes

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync
```

## Path-Specific Sync

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/player/PlayerController.ts
```

## Prefab Or Scene Reimport

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/prefabs/Hero.prefab --reimport
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scenes/Main.scene --reimport
```

## Browser Preview

Default `sync` only refreshes AssetDB. To request browser Preview reload:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --reload-preview
```

## Simulator Or Native Preview

Simulator/native preview may need restart instead of browser reload:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --restart-preview
```

## Bridge Unavailable Report

```text
Cocos AI Bridge sync failed.
Command: node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/player/PlayerController.ts
Reason: connect ECONNREFUSED 127.0.0.1:7456
AssetDB refreshed: no
Preview action: not requested
Manual action needed: open or restart Cocos Creator and confirm the cocos-ai-bridge extension is enabled.
```

## Sync Success Report

```text
Cocos AI Bridge sync succeeded.
Command: node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/player/PlayerController.ts
AssetDB refreshed: yes
Preview action: not requested
Manual action needed: none, unless running preview still shows old runtime state.
```

## Partial Failure Report

```text
Cocos AI Bridge sync partially failed.
Command: node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/player/PlayerController.ts --reload-preview
AssetDB refreshed: yes
Preview action: reload requested but unsupported
Manual action needed: reload browser preview manually or restart simulator/native preview.
```
