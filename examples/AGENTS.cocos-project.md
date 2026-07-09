# AGENTS.md for a Cocos Creator Project

## Cocos AI Bridge Workflow

- Before modifying this Cocos project, inspect relevant files first.
- After changing `assets/scripts`, `assets/resources`, `assets/prefabs`, or `assets/scenes`, call Cocos AI Bridge.
- After runtime code changes, run:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync
```

- For specific assets, run:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/foo.ts
```

- After editing a prefab or scene, prefer reimport:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/prefabs/Hero.prefab --reimport
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scenes/Main.scene --reimport --restart-preview
```

- If the bridge is unavailable, do not claim the Cocos editor refreshed.
- If refresh fails, report the failure reason and whether manual editor action is needed.
- Do not delete `.meta` files unless the user explicitly requests it.
- Do not bulk rewrite scene, prefab, animation, or material files unless the user explicitly requests it.
- Before modifying prefab or scene JSON/YAML, keep the diff minimal. Back up first if the change is risky.
- Do not kill the Cocos Creator process as a resource refresh strategy.
- Non-destructive checks are allowed.

## Completion Report

When done, report:

- Files changed.
- Sync commands executed.
- Whether sync succeeded.
- Whether the user still needs to click, reload, or restart anything in Cocos Creator.

## Bridge Unavailable Report

```text
Cocos AI Bridge sync failed.
Command: node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/foo.ts
Reason: connect ECONNREFUSED 127.0.0.1:7456
Editor refreshed: no
Manual action needed: open Cocos Creator and enable the cocos-ai-bridge extension, then refresh assets or reload preview manually.
```

## Sync Success Report

```text
Cocos AI Bridge sync succeeded.
Command: node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js sync --path assets/scripts/foo.ts
Editor refreshed: yes
Preview action: reload requested
Manual action needed: none, unless the game is running in simulator/native preview and still shows old code.
```
