# Security Policy

`blop-wizard` installs and configures the `blop-mcp` runtime and writes MCP client configuration on developer machines. Security issues here can affect local credential handling, runtime posture, generated config, and install/upgrade flows.

If you believe you have found a vulnerability, please report it privately. Do not open a public GitHub issue for security-sensitive reports.

## Supported versions

Security fixes are applied on a best-effort basis to:

| Version                  | Supported   |
| ------------------------ | ----------- |
| Latest published release | Yes         |
| Current default branch   | Best effort |
| Older releases           | No          |

If a report only reproduces on an older release, maintainers may ask you to confirm it against the latest release or the current branch before triage continues.

## How to report

Preferred path:

1. Use GitHub private vulnerability reporting for this repository if it is enabled.
2. If private reporting is not available, contact the maintainers privately through the repository owner on GitHub before any public disclosure.

Please include:

- the affected `blop-wizard` version
- whether you installed from npm or are running from source
- the `blop-mcp` version or local source revision involved, if known
- the command or workflow involved, such as `blop-wizard`, `doctor`, `repair`, `upgrade`, or `mcp add`
- which MCP clients were targeted
- clear reproduction steps
- impact assessment, especially if secrets, local files, or unsafe MCP configuration are exposed
- logs or screenshots with secrets fully redacted

## Scope and routing

Some issues discovered while using `blop-wizard` may actually belong in a sibling layer of the stack:

- `blop-wizard`: npm CLI behavior, install/bootstrap flow, runtime `.env` defaults, client config writing, release-packaging hygiene
- `blop-mcp`: Python runtime behavior, MCP tool surface, release-check execution, browser/runtime security controls
- `blop`: hosted product or control-plane issues

If a report lands in the wrong repo, maintainers may move, mirror, or coordinate it with the appropriate project.

## Disclosure expectations

- Please give maintainers a reasonable opportunity to investigate and ship a fix before public disclosure.
- Avoid sharing proof-of-concept details publicly until a fix or mitigation is available.
- Once a fix exists, maintainers may publish a changelog entry, release note, or advisory with appropriate credit.
