import path from 'path';
import {
  CliCommandMCPClient,
  buildCliEnvArgs,
  quoteShell,
} from './add-mcp-server-to-clients-mcp-client.js';
import { SERVER_NAME } from './defaults.js';
import { canUseClaudeCli } from './dependencies.js';

export class ClaudeCodeMCPClient extends CliCommandMCPClient {
  constructor() {
    super({
      id: 'claude-code',
      name: 'Claude Code',
      aliases: ['claude', 'claudecode'],
      commandName: 'claude',
      listCommand: 'claude mcp list',
      addCommandBuilder: (runtimePath, env) => {
        const binaryPath = path.join(runtimePath, '.venv', 'bin', 'blop-mcp');
        const envArgs = buildCliEnvArgs(env, '-e');
        return `claude mcp add ${SERVER_NAME} ${quoteShell(binaryPath)} ${envArgs}`.trim();
      },
      removeCommandBuilder: () => `claude mcp remove ${SERVER_NAME}`,
      supportedCheck: () => canUseClaudeCli(),
    });
  }
}
