#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const BEGIN = '<!-- BEGIN COCOS AI BRIDGE -->';
const END = '<!-- END COCOS AI BRIDGE -->';
const COPY_ITEMS = ['package.json', 'tsconfig.json', 'source', 'tools', 'examples', 'scripts', 'README.md', 'AGENTS.md'];

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function exists(target) {
  return fs.existsSync(target);
}

function isDirectory(target) {
  return exists(target) && fs.statSync(target).isDirectory();
}

function copyRecursive(source, target) {
  const stat = fs.statSync(source);

  if (stat.isDirectory()) {
    fs.mkdirSync(target, { recursive: true });
    for (const entry of fs.readdirSync(source)) {
      if (entry === '.git' || entry === 'node_modules' || entry === 'dist') continue;
      if (entry.endsWith('.tmp') || entry.endsWith('.temp') || entry.endsWith('~')) continue;
      copyRecursive(path.join(source, entry), path.join(target, entry));
    }
    return;
  }

  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) console.error(`${command} ${args.join(' ')} failed: ${result.error.message}`);
  return { ok: result.status === 0, status: result.status };
}

function assertCocosProject(projectRoot) {
  if (!isDirectory(projectRoot)) fail(`target directory does not exist: ${projectRoot}`);
  if (!isDirectory(path.join(projectRoot, 'assets'))) fail('target does not look like a Cocos Creator project: missing assets/');

  const hasProjectMarker =
    exists(path.join(projectRoot, 'project.json')) ||
    isDirectory(path.join(projectRoot, 'settings')) ||
    exists(path.join(projectRoot, 'package.json'));

  if (!hasProjectMarker) {
    fail('target does not look like a Cocos Creator project: expected project.json, settings/, or package.json');
  }
}

function mergeAgents(projectRoot, sourceRoot) {
  const sourcePath = path.join(sourceRoot, 'examples', 'AGENTS.cocos-project.md');
  const targetPath = path.join(projectRoot, 'AGENTS.md');
  const source = fs.readFileSync(sourcePath, 'utf8').trim();
  const block = `${BEGIN}\n${source}\n${END}`;

  if (!exists(targetPath)) {
    fs.writeFileSync(targetPath, `${block}\n`, 'utf8');
    return 'created';
  }

  const current = fs.readFileSync(targetPath, 'utf8');
  const pattern = new RegExp(`${BEGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
  const next = pattern.test(current)
    ? current.replace(pattern, block)
    : `${current.replace(/\s*$/, '')}\n\n${block}\n`;

  fs.writeFileSync(targetPath, next, 'utf8');
  return pattern.test(current) ? 'replaced' : 'merged';
}

function main() {
  const targetArg = process.argv[2];
  if (!targetArg) fail('usage: node scripts/install-into-cocos-project.js <cocos-project-root>');

  const sourceRoot = path.resolve(__dirname, '..');
  const projectRoot = path.resolve(process.cwd(), targetArg);
  assertCocosProject(projectRoot);

  const bridgeRoot = path.join(projectRoot, 'extensions', 'cocos-ai-bridge');
  fs.mkdirSync(bridgeRoot, { recursive: true });

  for (const item of COPY_ITEMS) {
    const source = path.join(sourceRoot, item);
    if (!exists(source)) fail(`source item missing: ${item}`);
    copyRecursive(source, path.join(bridgeRoot, item));
  }

  const npmInstall = run('npm', ['install'], bridgeRoot);
  const npmBuild = npmInstall.ok ? run('npm', ['run', 'build'], bridgeRoot) : { ok: false, status: null };
  const agentsStatus = mergeAgents(projectRoot, sourceRoot);

  console.log('\nCocos AI Bridge install result');
  console.log(`Bridge path: ${bridgeRoot}`);
  console.log(`npm install: ${npmInstall.ok ? 'ok' : `failed (${npmInstall.status})`}`);
  console.log(`npm run build: ${npmBuild.ok ? 'ok' : npmInstall.ok ? `failed (${npmBuild.status})` : 'skipped'}`);
  console.log(`AGENTS.md: ${agentsStatus}`);
  console.log('Next step: open or restart Cocos Creator so it loads the extension.');
  console.log(`Health check: node ${path.join(bridgeRoot, 'tools', 'cocos-ai-bridge-client.js')} health`);

  if (!npmInstall.ok || !npmBuild.ok) {
    process.exit(1);
  }
}

main();
