# Contributing to blop-wizard

`blop-wizard` is the installer and runtime manager for the `blop` release-confidence stack.

- `blop` is the product and release-confidence control plane.
- `blop-mcp` is the Python MCP server that executes the release workflow.
- `blop-wizard` is the TypeScript CLI that installs `blop-mcp`, writes a production-shaped runtime, and configures supported MCP clients.

Changes here should stay aligned with the `blop-mcp` contract. If you change defaults, supported tools, runtime posture, or the recommended MVP flow, verify the matching behavior still exists in `blop-mcp`.

## Local development

Prerequisites:

- Node.js 18+
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

Recommended verification before opening a pull request:

```bash
pnpm test:integration
pnpm publish:check
```

This covers repository hygiene, formatting, linting, type-checking, unit tests, package build, and an npm tarball dry run.

## Repository hygiene

This repository intentionally tracks source, docs, tests, and the pnpm lockfile. Do not commit local or generated artifacts such as:

- `dist/`
- `.cursor/mcp.json`
- `.env` or other secret-bearing env files
- `.blop/`
- temporary fixtures, logs, caches, or `*.tgz` package artifacts
- alternate lockfiles like `package-lock.json`, `yarn.lock`, or `bun.lockb`

The repo includes a hygiene check and CI gate to catch these early, but contributors should keep the working tree clean as part of normal review hygiene.

## Security reports

Do not open public issues for vulnerabilities or secret-exposure bugs.

Follow [SECURITY.md](SECURITY.md) for private reporting guidance. If a report appears to belong in `blop-mcp` rather than `blop-wizard`, maintainers may route it accordingly.

## Release expectations

Before publishing:

```bash
pnpm publish:check
```

That command should pass on a clean working tree and produce an npm dry-run pack output without unexpected files.
