# blop-mcp-wizard

Set up `blop-use` in Cursor (and optionally Claude Code) with a guided command-line wizard.

This project is designed to make onboarding fast and repeatable, especially for users who are not deeply technical.

## What this does

`blop-mcp-wizard` will:

- Detect supported clients (`Cursor`, optional `Claude Code`).
- Set up the local runtime needed by `blop-use`.
- Create or update `blop-use/.env`.
- Add or update MCP config entries using the server name `blop`.
- Run health checks (`doctor`) so you know setup is working.

## Fastest way to onboard someone

Use this flow when helping a new user get started.

1. Open terminal in this folder.
2. Run install and build once.
3. Run the guided setup command.
4. Run `doctor` to confirm everything is healthy.

```bash
cd blop-mcp-wizard
pnpm install
pnpm build
blop-wizard --blop-path /absolute/path/to/blop-use
blop-wizard doctor --blop-path /absolute/path/to/blop-use --verbose
```

If `blop-wizard` is not available globally yet, use:

```bash
node dist/bin.js --blop-path /absolute/path/to/blop-use
```

## Step-by-step onboarding for non-technical users

Use this exact script with new clients.

### Step 1: Confirm basics

- They are using `Cursor` (or you know they need `Claude Code` too).
- They have the `blop-use` folder on their machine.
- You can share one copy/paste command at a time.

### Step 2: Run guided setup

Ask them to run:

```bash
blop-wizard --blop-path /absolute/path/to/blop-use
```

The wizard handles setup automatically and writes required config files.

### Step 3: Add required key(s)

If prompted, help them paste required credentials (for example `GOOGLE_API_KEY`) into the guided flow.

### Step 4: Validate health

Run:

```bash
blop-wizard doctor --blop-path /absolute/path/to/blop-use --verbose
```

If checks pass, onboarding is complete.

### Step 5: Do one real test in client

Open the client and run one simple action to confirm the server responds.

## Common commands

```bash
# Guided setup (recommended)
blop-wizard --blop-path /absolute/path/to/blop-use

# Non-interactive setup (CI or scripted environments)
GOOGLE_API_KEY=your_key_here blop-wizard --ci --blop-path /absolute/path/to/blop-use

# MCP add/remove only
blop-wizard mcp add --blop-path /absolute/path/to/blop-use
blop-wizard mcp remove --blop-path /absolute/path/to/blop-use

# Validate setup
blop-wizard doctor --blop-path /absolute/path/to/blop-use --verbose
```

## Where configuration is written

- Cursor project config (default): `<blop-use>/.cursor/mcp.json`
- Cursor global config: use `--global-cursor` with `mcp add/remove`
- Claude Code: configured through `claude mcp add blop <blop-use>/.venv/bin/blop-mcp ...`

## Troubleshooting checklist

If onboarding fails:

1. Run `blop-wizard doctor --blop-path /absolute/path/to/blop-use --verbose`.
2. Confirm the path passed to `--blop-path` is correct.
3. Re-run guided setup to repair config:
   `blop-wizard --blop-path /absolute/path/to/blop-use`
4. Retry in the client after setup completes.

## Development

```bash
pnpm typecheck
pnpm test
pnpm test:integration
pnpm build
```

`test:integration` uses temporary files for the full MCP add/remove flow, so real user MCP configs are never touched.

