## Summary

Describe the change in 1-3 bullets.

## Why

Explain why this change is needed and what risk, maintenance burden, or user problem it addresses.

## Alignment

- [ ] If I changed runtime defaults, provider handling, supported clients, or the canonical workflow, I verified the matching `blop-mcp` contract and updated docs as needed.
- [ ] If I changed MCP client configuration behavior, I updated the relevant tests and user-facing docs.
- [ ] I did not commit generated artifacts, secrets, project-local MCP config, `dist/`, or alternate lockfiles.

## Routing

Maintainer labels should follow [`.github/TRIAGE.md`](.github/TRIAGE.md):

- one `kind:*` label
- at least one `area:*` label
- keep `triage` until the first maintainer review and routing pass are complete

## Testing

- [ ] `pnpm test:integration`
- [ ] `pnpm publish:check`
- [ ] Not run, with explanation below

Testing notes:

<!-- Add command output summaries, targeted manual checks, or explain why some checks were skipped. -->

## Risks

Note any rollout concerns, compatibility risks, or follow-up work.
