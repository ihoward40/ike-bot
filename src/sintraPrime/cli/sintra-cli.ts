#!/usr/bin/env node
// SintraPrime CLI executable

import { SintraCLI } from './commands';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: sintra <command> [args...]');
  console.log('Run "sintra help" for available commands');
  process.exit(0);
}

const command = args[0];
const commandArgs = args.slice(1);

try {
  const result = SintraCLI.handleCommand(command, commandArgs);
  console.log(result);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
