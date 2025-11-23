#!/usr/bin/env node
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const patchFile = path.resolve(__dirname, './patch-electron-rebuild.cjs');
const forwardedArgs = process.argv.slice(2);
const builderArgs = forwardedArgs.length > 0 ? forwardedArgs : ['build', '--config', 'electron-builder.mjs'];

const env = {...process.env};
const existingNodeOptions = env.NODE_OPTIONS ? `${env.NODE_OPTIONS} ` : '';
env.NODE_OPTIONS = `${existingNodeOptions}--require ${patchFile}`.trim();

const child = spawn('electron-builder', builderArgs, {
  stdio: 'inherit',
  env,
});

child.on('exit', code => {
  process.exit(code ?? 1);
});

child.on('error', error => {
  console.error(error);
  process.exit(1);
});
