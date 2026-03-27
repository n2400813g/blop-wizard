# Triage Convention

This repository uses a small, explicit label convention so issues and pull requests stay easy to route as outside contributions increase.

## Core labels

Apply these labels consistently:

| Label              | Purpose                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `triage`           | New item that still needs maintainer review or routing                                      |
| `needs-info`       | Blocked on more details from the reporter or author                                         |
| `kind:bug`         | Defect or regression                                                                        |
| `kind:feature`     | New capability or meaningful enhancement                                                    |
| `kind:docs`        | Documentation-only change or request                                                        |
| `kind:maintenance` | Chore, refactor, dependency, CI, or repo-health work                                        |
| `area:cli`         | CLI UX, prompts, commands, or bootstrap flow                                                |
| `area:runtime`     | Runtime env generation, doctor/repair/upgrade flow, or cross-repo alignment with `blop-mcp` |
| `area:mcp-clients` | MCP client config writing and supported editor/client targets                               |
| `area:packaging`   | npm packaging, tarball contents, publish gate, or release hygiene                           |
| `area:docs`        | README, contributor docs, security docs, or maintainer guidance                             |

## Issue triage

For each new issue:

1. Start with `triage`.
2. Add exactly one `kind:*` label.
3. Add at least one `area:*` label.
4. If the report is incomplete, add `needs-info`.
5. Remove `triage` once the owner and next action are clear.

Additional routing rules:

- If the issue is security-sensitive or exposes secrets, direct the reporter to `SECURITY.md` and avoid public debugging.
- If the real root cause belongs in `blop-mcp`, note that explicitly and mirror, move, or recreate the issue in the correct repo.
- If a request is documentation-only, prefer `kind:docs` plus the relevant `area:*` label instead of treating it as a feature.

## Pull request triage

For each new PR:

1. Leave `triage` on the PR until the first maintainer review happens.
2. Add exactly one `kind:*` label.
3. Add at least one `area:*` label.
4. If the PR changes runtime defaults, supported clients, or the canonical workflow, confirm `blop-mcp` alignment before removing `triage`.

`CODEOWNERS` handles the default reviewer route. Labels are for visibility and queue management, not a replacement for code review ownership.
