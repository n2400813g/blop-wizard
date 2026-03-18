#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runWizard } from './run.js';
import { runMCPAdd, runMCPRemove } from './mcp.js';
import { runDoctor } from './doctor.js';

const isInteractive = Boolean(process.stdin.isTTY);

function printCliError(error: unknown): void {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
    return;
  }
  console.error('Error:', error);
}

yargs(hideBin(process.argv))
  .scriptName('blop-wizard')
  .usage('$0 [options]')
  .usage('$0 mcp add [options]')
  .usage('$0 mcp remove [options]')
  .usage('$0 doctor [options]')
  .command(
    '$0',
    'Install and configure blop-use MCP',
    (cmd) =>
      cmd
        .option('blop-path', {
          type: 'string',
          description: 'Path to blop-use repository',
        })
        .option('cursor-only', {
          type: 'boolean',
          default: false,
          description: 'Configure only Cursor',
        })
        .option('include-claude', {
          type: 'boolean',
          default: true,
          description: 'Configure Claude Code when available',
        })
        .option('ci', {
          type: 'boolean',
          default: false,
          description: 'Non-interactive mode',
        }),
    async (argv) => {
      try {
        const ci = argv.ci || !isInteractive;
        await runWizard({
          blopPath: argv['blop-path'],
          ci,
          cursorOnly: argv['cursor-only'],
          includeClaude: argv['include-claude'],
        });
      } catch (error) {
        printCliError(error);
        process.exit(1);
      }
    },
  )
  .command(
    'mcp <command>',
    'Manage MCP client configuration',
    (cmd) =>
      cmd
        .command(
          'add',
          'Add blop to MCP clients',
          (sub) =>
            sub
              .option('blop-path', { type: 'string', description: 'Path to blop-use repository' })
              .option('cursor-only', { type: 'boolean', default: false })
              .option('include-claude', { type: 'boolean', default: true })
              .option('ci', { type: 'boolean', default: false })
              .option('global-cursor', {
                type: 'boolean',
                default: false,
                description: 'Write Cursor config to global user config',
              }),
          async (argv) => {
            try {
              await runMCPAdd({
                blopPath: argv['blop-path'],
                ci: argv.ci || !isInteractive,
                cursorOnly: argv['cursor-only'],
                includeClaude: argv['include-claude'],
                projectCursorConfig: !argv['global-cursor'],
              });
            } catch (error) {
              printCliError(error);
              process.exit(1);
            }
          },
        )
        .command(
          'remove',
          'Remove blop from MCP clients',
          (sub) =>
            sub
              .option('blop-path', { type: 'string', description: 'Path to blop-use repository' })
              .option('cursor-only', { type: 'boolean', default: false })
              .option('include-claude', { type: 'boolean', default: true })
              .option('ci', { type: 'boolean', default: false })
              .option('global-cursor', {
                type: 'boolean',
                default: false,
                description: 'Remove from global Cursor config instead of project config',
              }),
          async (argv) => {
            try {
              await runMCPRemove({
                blopPath: argv['blop-path'],
                projectCursorConfig: !argv['global-cursor'],
                ci: argv.ci || !isInteractive,
                cursorOnly: argv['cursor-only'],
                includeClaude: argv['include-claude'],
              });
            } catch (error) {
              printCliError(error);
              process.exit(1);
            }
          },
        )
        .demandCommand(1, 'Specify add or remove'),
    () => {},
  )
  .command(
    'doctor',
    'Validate dependencies and setup',
    (cmd) =>
      cmd
        .option('blop-path', { type: 'string', description: 'Path to blop-use repository' })
        .option('verbose', { type: 'boolean', default: false }),
    async (argv) => {
      const code = await runDoctor({ blopPath: argv['blop-path'], verbose: argv.verbose });
      process.exit(code);
    },
  )
  .help()
  .version()
  .strict()
  .parse();

