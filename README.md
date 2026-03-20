# blop-wizard

Install and configure `blop-mcp` across coding tools with a guided CLI.

`blop-wizard` is the setup front door: it creates a Python runtime, installs `blop` (PyPI by default), writes a release-confidence `.env`, and configures MCP clients around the canonical 4-tool MVP workflow.

## Quickstart (PyPI-first)

```bash
pnpm install
pnpm build
blop-wizard
blop-wizard doctor --verbose
```

If the binary is not installed globally yet:

```bash
node dist/bin.js
```

## What the wizard does

- Checks Python and `uv`.
- Creates a runtime environment (default: `~/.blop-mcp`).
- Installs `blop` from PyPI (or local source in `--install-source local` mode).
- Creates or updates runtime `.env` with the canonical MVP posture:
  `BLOP_CAPABILITIES_PROFILE=production_minimal` and `BLOP_ENABLE_COMPAT_TOOLS=false`.
- Adds/updates MCP config (`blop`) for supported vibecoding tools.
- Runs validation with `doctor`, including a check that the canonical release tools import cleanly.

## Canonical MVP flow after install

Use the installed MCP server with this sequence:

- `validate_release_setup`
- `discover_critical_journeys`
- `run_release_check`
- `triage_release_blocker`

## Common commands

```bash
# Guided setup (recommended)
blop-wizard

# Pin package version from PyPI
blop-wizard --package-version 0.4.0

# Local source mode (editable install)
blop-wizard --install-source local --blop-path /absolute/path/to/blop-mcp

# Non-interactive mode
GOOGLE_API_KEY=your_key_here blop-wizard --ci

# MCP add/remove only
blop-wizard mcp add
blop-wizard mcp remove

# Target specific clients (IDs or names)
blop-wizard mcp add --targets cursor vscode windsurf cline continue
blop-wizard mcp remove --targets cursor vscode windsurf cline continue

# Write Cursor config globally instead of project-local
blop-wizard mcp add --global-cursor
blop-wizard mcp remove --global-cursor

# Validate setup
blop-wizard doctor --verbose
```

## Path model

- Runtime path: where `.venv` and `.env` live (default `~/.blop-mcp`, override with `--runtime-path`).
- Project path: where project Cursor MCP config is written (default current working directory, override with `--project-path`).
- Local source path: used only when `--install-source local` (via `--blop-path`).

## Where config is written

- Cursor project config (default): `<project-path>/.cursor/mcp.json`
- Cursor global config: `--global-cursor`
- Claude Code: `claude mcp add blop <runtime-path>/.venv/bin/blop-mcp ...`
- VS Code: `~/.vscode/mcp.json`
- Windsurf: `~/.codeium/windsurf/mcp_config.json`
- Cline: `~/.cline/mcp_settings.json`
- Continue: `~/.continue/config.json`
- Roo Code: `~/.roo-code/mcp.json`
- Gemini CLI: `~/.gemini/settings.json`
- Kilo Code: `~/.kilocode/mcp.json`
- OpenCode: `~/.opencode/config.json`
- Zed: `~/.config/zed/settings.json`
- JetBrains: `~/.jetbrains/mcp.json`
- Codex CLI/App: via `codex mcp add/remove`

## Supported vibecoding targets

Use these IDs with `--targets`:

- `cursor`, `cursor-project`
- `claude-code`
- `vscode`
- `windsurf`
- `cline`
- `continue`
- `roo-code`
- `codex`
- `gemini-cli`
- `kilo-code`
- `opencode`
- `zed`
- `jetbrains`

## Troubleshooting checklist

1. Run `blop-wizard doctor --verbose`.
2. If using local mode, confirm `--blop-path` points to a valid `blop-mcp` source repo.
3. Re-run setup to repair runtime/config:
   `blop-wizard --runtime-path /path/to/runtime`
4. Restart Cursor/Claude Code after MCP config changes.

## Development

```bash
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

`test:integration` uses temporary fixtures and never touches real user MCP configs.
