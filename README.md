# blop-wizard

Install and configure `blop-mcp` across coding tools with a guided CLI.

`blop-wizard` is the setup front door: it creates a managed Python runtime, installs `blop-mcp` from PyPI by default, writes a production-shaped release-confidence `.env` aligned with `blop-mcp`'s managed stdio baseline, and configures MCP clients around the canonical 4-tool MVP workflow.

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
- Installs `blop-mcp` from PyPI (or local source in `--install-source local` mode).
- Creates or updates runtime `.env` with a managed production posture:
  `BLOP_ENV=production`, `BLOP_REQUIRE_ABSOLUTE_PATHS=true`, absolute runtime-local artifact paths,
  `BLOP_CAPABILITIES_PROFILE=production_minimal`, `BLOP_ENABLE_COMPAT_TOOLS=false`,
  `BLOP_ALLOW_INTERNAL_URLS=false`, `BLOP_RUN_TIMEOUT_SECS=1800`, `BLOP_STEP_TIMEOUT_SECS=45`,
  `BLOP_MAX_CONCURRENT_RUNS=10`, and `BLOP_ALLOW_SCREENSHOT_LLM=false`.
- Supports the `blop-mcp` provider contract:
  `BLOP_LLM_PROVIDER=google|anthropic|openai` with the matching API key.
- Adds/updates MCP config (`blop`) for supported vibecoding tools.
- Runs validation with `doctor`, including runtime posture, venv entrypoint, and canonical release-tool checks.

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

# Local source mode with a dedicated managed runtime
blop-wizard --install-source local \
  --blop-path /absolute/path/to/blop-mcp \
  --runtime-path ~/.blop-mcp-dev

# Non-interactive mode (Google)
GOOGLE_API_KEY=your_key_here blop-wizard --ci

# Non-interactive mode (Anthropic)
BLOP_LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=your_key_here blop-wizard --ci

# Non-interactive mode (OpenAI)
BLOP_LLM_PROVIDER=openai OPENAI_API_KEY=your_key_here blop-wizard --ci

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

# Diagnose and repair an existing runtime in place
blop-wizard repair
```

## Path model

- Runtime path: where `.venv` and `.env` live (default `~/.blop-mcp`, override with `--runtime-path`).
- Runtime-local artifacts: the wizard defaults `BLOP_DB_PATH`, `BLOP_RUNS_DIR`, and `BLOP_DEBUG_LOG` under the runtime path.
- Project path: where project Cursor MCP config is written (default current working directory, override with `--project-path`).
- Local source path: used only when `--install-source local` (via `--blop-path`) as the editable install source, separate from the managed runtime.

## Provider contract

- Default provider is `google`.
- To align with `blop-mcp`, the wizard accepts:
  - `BLOP_LLM_PROVIDER=google` with `GOOGLE_API_KEY`
  - `BLOP_LLM_PROVIDER=anthropic` with `ANTHROPIC_API_KEY`
  - `BLOP_LLM_PROVIDER=openai` with `OPENAI_API_KEY`
- `doctor` and `repair` validate the provider-specific key instead of assuming Google-only setup.

## Version pinning

- The wizard installs `blop-mcp` from PyPI by default.
- To pin the MCP runtime version, use `--package-version`:
  `blop-wizard --package-version 0.3.0`
- This resolves to an install like `blop-mcp==0.3.0`.
- If you need a non-default package name for testing or an alternate distribution, use:
  `blop-wizard --package-name blop-mcp --package-version 0.3.0`
- For the safest wizard/MCP pairing, pin both sides from the same release plan:
  - install or run the wizard from the intended release branch/tag
  - pin the Python runtime with `--package-version`
  - run `blop-wizard doctor --verbose` after install to confirm the final runtime matches expectations
- If you are developing both repos together, prefer local mode instead of mixed published versions:
  `blop-wizard --install-source local --blop-path /absolute/path/to/blop-mcp`

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
3. Repair an existing runtime/config in place:
   `blop-wizard repair --runtime-path /path/to/runtime`
4. Restart Cursor/Claude Code after MCP config changes.

## Release Readiness

- `pnpm check:repo-hygiene`
- `pnpm test`
- `pnpm typecheck`
- `pnpm build`
- `pnpm pack --dry-run`
- `blop-wizard doctor --verbose`

## Development

```bash
pnpm check:repo-hygiene
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

`test:integration` uses temporary fixtures and never touches real user MCP configs.

## Repository hygiene

- This repository tracks source and intentional project files only.
- Generated runtime data (`.blop/`), temporary test fixtures (`.tmp-test-fixtures/`), coverage, and logs are intentionally ignored.
- Run `pnpm check:repo-hygiene` before pushing to ensure no generated artifacts were accidentally tracked.
