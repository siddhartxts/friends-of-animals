@AGENTS.md

## Cloud agents

`.cursor/environment.json` is the Cursor cloud-agent setup: `.cursor/cloud-install.sh` installs Node 26, pnpm and the dependencies, and `.cursor/cloud-start.sh` starts a local Postgres (no Docker) with the database and login from `.env.example`.

## Agent skills

### Issue tracker

Issues live in GitHub Issues on siddhartxts/friends-of-animals, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels are used as-is: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` plus `docs/adr/` at the repo root, both created when first needed. See `docs/agents/domain.md`.
