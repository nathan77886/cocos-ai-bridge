# Codex Development Notes

This repository builds `cocos-ai-bridge`, a Cocos Creator editor extension.

## Rules

- Keep the HTTP bridge localhost-only.
- Do not add shell execution endpoints.
- Do not add file deletion endpoints.
- Keep all Cocos Editor API calls in `source/cocos-actions.ts`.
- Keep HTTP routing free of Cocos-specific logic.
- Return unified JSON responses from every endpoint.
- Mark uncertain Cocos Creator message names with TODO comments and clear unsupported responses.
- Prefer Node stdlib over dependencies.

## Checks

Run:

```bash
npm run typecheck
```

Before commit, inspect diff for secrets, unrelated changes, and accidental generated files.
