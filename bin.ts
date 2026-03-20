#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { runWizard } from './run.js';
import { runMCPAdd, runMCPRemove } from './mcp.js';
import { runDoctor } from './doctor.js';
import { DEFAULT_BLOP_PACKAGE_NAME, DEFAULT_INSTALL_SOURCE } from './defaults.js';

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
    'Install and configure blop-mcp',
    (cmd) =>
      cmd
        .option('blop-path', {
          type: 'string',
          description: 'Path to local blop-mcp source repository (local mode only)',
        })
        .option('install-source', {
          choices: ['pypi', 'local'] as const,
          default: DEFAULT_INSTALL_SOURCE,
          description: 'Where to install blop from',
        })
        .option('runtime-path', {
          type: 'string',
          description: 'Directory to create/use the blop runtime environment',
        })
        .option('project-path', {
          type: 'string',
          description: 'Project directory where .cursor/mcp.json should be written',
        })
        .option('package-name', {
          type: 'string',
          default: DEFAULT_BLOP_PACKAGE_NAME,
          description: 'Python package name to install in PyPI mode',
        })
        .option('package-version', {
          type: 'string',
          description: 'Optional Python package version to pin in PyPI mode',
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
        })
        .option('targets', {
          type: 'array',
          description: 'Specific client IDs/names to target (e.g. cursor vscode cline codex)',
        })
        .option('skip-playwright', {
          type: 'boolean',
          default: false,
          description: 'Skip Playwright Chromium installation',
        }),
    async (argv) => {
      try {
        const ci = argv.ci || !isInteractive;
        await runWizard({
          installSource: argv['install-source'] as 'pypi' | 'local',
          runtimePath: argv['runtime-path'],
          blopPath: argv['blop-path'],
          projectPath: argv['project-path'],
          packageName: argv['package-name'],
          packageVersion: argv['package-version'],
          ci,
          targets: Array.isArray(argv.targets) ? argv.targets.map((value) => String(value)) : [],
          cursorOnly: argv['cursor-only'],
          includeClaude: argv['include-claude'],
          skipPlaywright: argv['skip-playwright'],
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
              .option('blop-path', {
                type: 'string',
                description: 'Path to local blop-mcp source repository (local mode only)',
              })
              .option('install-source', {
                choices: ['pypi', 'local'] as const,
                default: DEFAULT_INSTALL_SOURCE,
              })
              .option('runtime-path', {
                type: 'string',
                description: 'Directory to create/use the blop runtime environment',
              })
              .option('project-path', {
                type: 'string',
                description: 'Project directory where .cursor/mcp.json should be written',
              })
              .option('package-name', {
                type: 'string',
                default: DEFAULT_BLOP_PACKAGE_NAME,
              })
              .option('package-version', {
                type: 'string',
              })
              .option('cursor-only', { type: 'boolean', default: false })
              .option('include-claude', { type: 'boolean', default: true })
              .option('ci', { type: 'boolean', default: false })
              .option('targets', {
                type: 'array',
                description: 'Specific client IDs/names to target (e.g. cursor vscode cline codex)',
              })
              .option('skip-playwright', { type: 'boolean', default: false })
              .option('global-cursor', {
                type: 'boolean',
                default: false,
                description: 'Write Cursor config to global user config',
              }),
          async (argv) => {
            try {
              await runMCPAdd({
                installSource: argv['install-source'] as 'pypi' | 'local',
                runtimePath: argv['runtime-path'],
                blopPath: argv['blop-path'],
                projectPath: argv['project-path'],
                packageName: argv['package-name'],
                packageVersion: argv['package-version'],
                ci: argv.ci || !isInteractive,
                targets: Array.isArray(argv.targets) ? argv.targets.map((value) => String(value)) : [],
                cursorOnly: argv['cursor-only'],
                includeClaude: argv['include-claude'],
                projectCursorConfig: !argv['global-cursor'],
                skipPlaywright: argv['skip-playwright'],
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
              .option('project-path', {
                type: 'string',
                description: 'Project directory where .cursor/mcp.json should be removed',
              })
              .option('cursor-only', { type: 'boolean', default: false })
              .option('include-claude', { type: 'boolean', default: true })
              .option('ci', { type: 'boolean', default: false })
              .option('targets', {
                type: 'array',
                description: 'Specific client IDs/names to target (e.g. cursor vscode cline codex)',
              })
              .option('global-cursor', {
                type: 'boolean',
                default: false,
                description: 'Remove from global Cursor config instead of project config',
              }),
          async (argv) => {
            try {
              await runMCPRemove({
                projectPath: argv['project-path'],
                projectCursorConfig: !argv['global-cursor'],
                ci: argv.ci || !isInteractive,
                targets: Array.isArray(argv.targets) ? argv.targets.map((value) => String(value)) : [],
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
        .option('blop-path', {
          type: 'string',
          description: 'Path to local blop-mcp source repository (local mode only)',
        })
        .option('install-source', {
          choices: ['pypi', 'local'] as const,
          default: DEFAULT_INSTALL_SOURCE,
        })
        .option('runtime-path', {
          type: 'string',
          description: 'Directory where the blop runtime environment lives',
        })
        .option('package-name', { type: 'string', default: DEFAULT_BLOP_PACKAGE_NAME })
        .option('package-version', { type: 'string' })
        .option('verbose', { type: 'boolean', default: false }),
    async (argv) => {
      const code = await runDoctor({
        installSource: argv['install-source'] as 'pypi' | 'local',
        runtimePath: argv['runtime-path'],
        blopPath: argv['blop-path'],
        packageName: argv['package-name'],
        packageVersion: argv['package-version'],
        verbose: argv.verbose,
      });
      process.exit(code);
    },
  )
  .help()
  .version()
  .strict()
  .parse();
