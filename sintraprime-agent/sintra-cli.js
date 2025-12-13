#!/usr/bin/env node
/**
 * SintraPrime CLI
 * PHASE 5: EARS - Command Line Interface
 * 
 * This is how you talk to SintraPrime from the command line.
 * 
 * Usage:
 *   sintra status
 *   sintra mode sentinel
 *   sintra speak "Hello world"
 *   sintra daemon
 */

const { SintraPrimeCore, MODES } = require('./core-agent');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║        SintraPrime Command Line              ║');
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    console.log('Commands:');
    console.log('  status              Show current status');
    console.log('  mode [MODE]         Change or show mode');
    console.log('  speak "text"        Make SintraPrime speak');
    console.log('  remember [N]        Recall last N events (default: 10)');
    console.log('  daemon              Run as persistent daemon');
    console.log('  help                Show this help');
    console.log('');
    console.log('Modes:');
    Object.keys(MODES).forEach(mode => {
      console.log(`  ${mode.padEnd(15)} - ${getModeDescription(mode)}`);
    });
    console.log('');
    console.log('Examples:');
    console.log('  sintra status');
    console.log('  sintra mode sentinel');
    console.log('  sintra speak "All systems operational"');
    console.log('  sintra remember 20');
    console.log('  sintra daemon');
    console.log('');
    return;
  }

  // For daemon mode, start the full agent and visibility server
  if (command === 'daemon') {
    console.log('Starting SintraPrime in daemon mode...');
    console.log('This will run the visibility server on port 7777');
    console.log('Press Ctrl+C to stop');
    console.log('');
    
    require('./visibility-server');
    return;
  }

  // For quick commands, create core and execute
  const core = new SintraPrimeCore();
  core.isAlive = true;
  
  let result;

  switch (command) {
    case 'status':
      result = core.getStatus();
      console.log('');
      console.log('SintraPrime Status');
      console.log('═════════════════════════════════════');
      console.log(`Alive:     ${result.alive ? '✅ YES' : '❌ NO'}`);
      console.log(`Mode:      ${result.mode}`);
      console.log(`Time:      ${result.time}`);
      console.log(`Uptime:    ${result.uptime}`);
      console.log(`Session:   ${result.session}`);
      console.log(`Timezone:  ${result.timezone}`);
      console.log('');
      console.log(`Heartbeat: ${result.heartbeat}`);
      console.log(`Memory:    ${result.memory}`);
      console.log('');
      break;

    case 'mode':
      if (args[1]) {
        result = await core.handleCommand('mode', { newMode: args[1] });
        if (result.error) {
          console.error('Error:', result.error);
          process.exit(1);
        }
        console.log(`Mode changed: ${result.previousMode} → ${result.currentMode}`);
      } else {
        result = await core.handleCommand('mode');
        console.log(`Current mode: ${result.mode}`);
      }
      break;

    case 'speak':
      const text = args.slice(1).join(' ');
      if (!text) {
        console.error('Error: No text provided');
        console.log('Usage: sintra speak "your message here"');
        process.exit(1);
      }
      result = await core.handleCommand('speak', { text });
      if (result.error) {
        console.error('Error:', result.error);
        process.exit(1);
      }
      console.log(`Speaking: "${result.spoken}"`);
      break;

    case 'remember':
      const limit = parseInt(args[1]) || 10;
      result = await core.handleCommand('remember', { limit });
      
      if (result.length === 0) {
        console.log('No events recorded yet');
      } else {
        console.log('');
        console.log(`Recent Events (last ${result.length})`);
        console.log('═════════════════════════════════════');
        result.reverse().forEach((event, i) => {
          console.log(`${i + 1}. [${event.timestamp}] ${event.event}`);
          if (event.command) console.log(`   Command: ${event.command}`);
          if (event.from && event.to) console.log(`   Mode: ${event.from} → ${event.to}`);
        });
        console.log('');
      }
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log('Run "sintra help" for usage information');
      process.exit(1);
  }

  process.exit(0);
}

function getModeDescription(mode) {
  const descriptions = {
    SENTINEL: 'Monitoring, watching, logging',
    DISPATCH: 'Sending notices, emails, automations',
    FOCUS: 'No chatter, only critical alerts',
    QUIET: 'Logs only, no voice',
    DEBUG: 'Verbose, explains itself'
  };
  return descriptions[mode] || 'Unknown mode';
}

// Run CLI
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error.message);
    process.exit(1);
  });
}
