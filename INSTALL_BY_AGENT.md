# Install Cocos AI Bridge By Agent

This repository is a Cocos Creator editor extension. Install it into an existing Cocos Creator project under `extensions/cocos-ai-bridge`.

## Recommended Agent Install

From any temporary working directory:

```bash
git clone https://github.com/nathan77886/cocos-ai-bridge /tmp/cocos-ai-bridge
node /tmp/cocos-ai-bridge/scripts/install-into-cocos-project.js <cocos-project-root>
```

Use `.` for `<cocos-project-root>` when current directory is the Cocos project root.

The installer:

- Verifies the target looks like a Cocos Creator project.
- Copies the bridge extension into `extensions/cocos-ai-bridge`.
- Runs `npm install` and `npm run build` inside the extension directory.
- Merges `examples/AGENTS.cocos-project.md` into project root `AGENTS.md`.

## Agent Safety Rules

- Do not claim the bridge is running unless health check succeeds.
- If Cocos Creator is not open, health check failure is normal. Report that user must open or restart Cocos Creator.
- Do not kill the Cocos Creator main process as an install or refresh strategy.
- Do not delete `.meta`, `library`, `temp`, or `assets`.
- Do not modify project assets during installation.

Health check after Cocos Creator loads the extension:

```bash
node extensions/cocos-ai-bridge/tools/cocos-ai-bridge-client.js health
```

## Final Report Format

```text
Cocos AI Bridge install report
Bridge path: extensions/cocos-ai-bridge
npm install: ok|failed
npm run build: ok|failed|skipped
AGENTS.md: created|merged|replaced
Health check: ok|failed|not run
Bridge running: yes|no|unknown
Manual action needed: open or restart Cocos Creator, then run health check
```
