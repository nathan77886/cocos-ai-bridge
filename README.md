# Cocos AI Bridge

Cocos AI Bridge is a local Cocos Creator editor extension for AI coding agents.

It provides a localhost HTTP bridge that allows tools like Codex, Claude Code, Cursor Agent, and other AI coding assistants to notify Cocos Creator after external file changes.

Main goals:

* Refresh Cocos AssetDB after AI modifies project files.
* Reimport changed assets.
* Save or sync editor scene state.
* Reload browser preview when possible.
* Provide a stable workflow for AI-assisted Cocos development.
* Avoid unreliable workflows such as killing and restarting the Cocos Creator process.

Cocos AI Bridge does not try to implement full runtime HMR. Asset refresh, script import, preview reload, and native simulator restart are different steps. This project provides a clear control surface so AI agents can perform those steps explicitly and report failures honestly.
