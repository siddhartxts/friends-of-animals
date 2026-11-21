# Platform research: Claude Code for an unattended agent fleet (as of 2026-11-19)

Scope: facts the execution spec relies on. Source of truth is the docs at `https://code.claude.com/docs/en/<page>` (fetched 2026-11-19 as `<page>.md`) plus probes run in this container. Version installed here (and reported as `container_cc_version` by the Orchestrator's own cloud session): **Claude Code 2.1.328**. Tags: **[DOC]** stated in docs, **[PROBE]** observed by running it here, **UNCONFIRMED** = not verified; the spec must run the named runtime check before relying on it.

## 1. Headless mode: `claude -p` (docs: headless, cli-reference)
| Flag | Exact behaviour [DOC] |
| :- | :- |
| `-p, --print` | Non-interactive; skips workspace-trust dialog; settings files that fail validation are **silently ignored**. Rejects `--bg`. Exit 0 on success, non-zero on failure; in-run failures are printed as the result on stdout. |
| `--output-format text\|json\|stream-json` | `stream-json` **requires `--verbose`** with `-p`, else `Error: When using --print, --output-format=stream-json requires --verbose` [PROBE]. Add `--include-partial-messages` for token deltas, `--include-hook-events` for hook lifecycle, `--forward-subagent-text` for subagent text. |
| `--input-format stream-json` | NDJSON user messages on stdin (multi-turn, one process); `--replay-user-messages` echoes them. |
| `--max-turns N` | Caps agentic turns (print only). Hitting it ends with result `subtype:"error_max_turns"`, `terminal_reason:"max_turns"`. No limit by default. |
| `--max-budget-usd X` | Stops when the client-side cost estimate reaches X (subagent spend counts); result `subtype:"error_max_budget_usd"`. On a subscription the figure is an estimate, not billing, but still a usable runaway cap. |
| `--resume <id\|name\|path.jsonl>` / `-c, --continue` | Resume a specific session (searched across all projects on the machine) / most recent in cwd (`-p --continue` includes `-p` sessions). `--fork-session` gives a new ID. Capture ID: `claude -p ... --output-format json \| jq -r .session_id`. `--session-id <uuid>` presets the ID. |
| `--permission-mode` | `default` (alias `manual`), `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`. `-p` with no mode starts in `default` (v2.1.302+), where any call needing approval is **denied**. |
| `--dangerously-skip-permissions` | = `--permission-mode bypassPermissions`. `--allow-dangerously-skip-permissions` only adds it to the cycle. |
| `--permission-prompts none` | (v2.1.259+) deny anything that would prompt, tell Claude not to retry, remove `AskUserQuestion`. Persistent form: `permissions.denyInsteadOfPrompting: true` (user/managed settings). |
| `--model <alias\|id>` | Aliases `opus`/`sonnet`/`haiku`/`fable`/`best` float to newest; pin **`--model claude-opus-5-5`**. `--fallback-model a,b` (setting `fallbackModel`) — leave unset for Opus-only. `--effort low\|medium\|high\|xhigh\|max\|ultracode` (`ultracode` = xhigh + workflow orchestration). |
| `--append-system-prompt[-file]` | Appends to default prompt (keeps tool guidance). `--system-prompt[-file]` replaces it (drops safety/tool guidance and git snapshot). Recorded on first request and reused on `--resume` until compaction (`--system-prompt-snapshot off` to rebuild). `--append-subagent-system-prompt[-file]` (-p only) appends to every subagent. |
| `--allowedTools` / `--disallowedTools` | Permission-rule syntax, e.g. `"Bash(git push *)"`; space before `*` matters. Bare name in disallowed removes the tool; `"mcp__*"` removes all MCP tools. Allow rules have **no effect** in `bypassPermissions`; deny rules apply in every mode. `--tools "Bash,Edit,Read"` restricts the built-in set (`""` = none). |
| `--json-schema '<schema>'` | Validated object in result field `structured_output` (absent if the run declined/failed: check presence). |
| `-w, --worktree [name]`, `--add-dir`, `--settings <file\|json>`, `--setting-sources user,project,local`, `--mcp-config`, `--strict-mcp-config`, `--agents <json\|file>`, `--agent <name>`, `--no-session-persistence`, `-n/--name` | See sections 5-6. |
| `--bare` | Skips hooks, skills, CLAUDE.md, MCP, plugins **and OAuth** (needs `ANTHROPIC_API_KEY`). **Never use for factory runs**: it disables the guardrail hooks and the Max subscription login. |

Stream events seen in a real `-p --output-format stream-json --verbose` run [PROBE]: `system/init` (fields incl. `model`, `permissionMode`, `cwd`, `tools`, `claude_code_version`, `mcp_servers`, `skills`), `system/status`, `stream_event`, `assistant`, `rate_limit_event`, `active_goal`, `autocompact_state`, `system/post_turn_summary`, final `result`. Also documented: `system/api_retry` (`attempt`, `max_retries`, `retry_delay_ms`, `error_status`, `error` in {`rate_limit`,`overloaded`,`server_error`,`authentication_failed`,`billing_error`,...}), `permission_denied`.
Final line (success, [PROBE]): `{"type":"result","subtype":"success","is_error":false,"num_turns":1,"result":"OK","stop_reason":"end_turn","terminal_reason":"completed","total_cost_usd":0.0195,"session_id":"<uuid>","api_error_status":null,...}`. Error arm [DOC]: `subtype` in `error_max_turns|error_during_execution|error_max_budget_usd|error_max_structured_output_retries`, plus `errors: string[]`; `api_error_status` = HTTP status that ended the turn; `permission_denials[]`.
Process control [DOC]: SIGTERM -> exit 143, in-progress turn left unfinished, `SessionEnd` hooks run; send **SIGINT** first to end the turn cleanly. After the final turn a `-p` run waits up to 10 min (`CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`, `0` = forever) for background subagents/workflows: set `0` for runners that launch Workflow runs. Foreground Bash default timeout 2 min (max 10); raise with `BASH_DEFAULT_TIMEOUT_MS` / `BASH_MAX_TIMEOUT_MS`.
Supervisor pattern (T2, all flags [DOC]):
```bash
claude -p "/implement 57" --model claude-opus-5-5 --permission-mode bypassPermissions --permission-prompts none \
  --output-format stream-json --verbose --max-turns 400 --append-system-prompt-file runner-prompt.md > logs/57.jsonl 2> logs/57.err
rc=$?; res=$(tail -n 1 logs/57.jsonl)
sid=$(jq -r .session_id <<<"$res")      # keep for --resume
jq -e '.type=="result" and .subtype=="success" and .is_error==false' <<<"$res" >/dev/null || echo "FAIL rc=$rc $(jq -c '{subtype,terminal_reason,api_error_status,errors}' <<<"$res")"
```

## 2. Skills and slash commands in `-p` (docs: headless, skills)
- Put `/skill-name args` in the prompt string: `claude -p "/tdd Implement #57 per its acceptance criteria" ...`. User-invoked skills and custom commands are expanded before running [DOC]; terminal-only built-ins (`/login`) are not available; `/model x`, `/effort x`, `/config key=value` take arguments.
- `$ARGUMENTS`, `$0..$N` substitute args; unmatched args are appended as `ARGUMENTS: <value>`. `disable-model-invocation: true` blocks auto-invocation but still allows `/name`. `context: fork` runs the skill in a forked subagent; its stream messages carry `parent_tool_use_id` starting `forked-command-` and arrive after it finishes (v2.1.287+).
- Locations: project `.claude/skills/<name>/SKILL.md` (committed; loads in cloud sessions), personal `~/.claude/skills` (NOT loaded in cloud sessions), claude.ai-account skills (loaded in cloud sessions). Repo skills are present in every runner clone.

## 3. Hooks (docs: hooks; 4359-line page)
- Config shape (settings.json): `{"hooks":{"<Event>":[{"matcher":"Bash","hooks":[{"type":"command","command":"${CLAUDE_PROJECT_DIR}/.claude/hooks/guard.sh","timeout":30}]}]}}`. Handler types: `command`, `http`, `mcp_tool`, `prompt`, `agent`. Fields: `if` (one permission rule, e.g. `"Bash(git push *)"`, tool events only, best-effort), `timeout` s (default 600 command), `async`, `asyncRewake`, `onFailure: "block"|"continue"` (v2.1.295+), exec form via `args`.
- Matcher: only `[A-Za-z0-9_- ,|]` = exact name list (`Edit|Write`); any other char = unanchored JS regex (`^mcp__github__.*`). `Bash` matcher also covers Monitor commands.
- Input on stdin: `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, `tool_name`, `tool_input` (Bash: `{command, description, timeout, run_in_background}`), `tool_use_id`, plus `agent_id`/`agent_type` inside subagents (hooks fire inside subagents too).
- Exit codes: 0 = success (stdout JSON applied if it is one object and nothing else); **2 = blocking error, stderr is the reason** (PreToolUse: call blocked even if JSON says allow); other = non-blocking error (action proceeds unless `onFailure:"block"`). A blocking PreToolUse hook takes precedence over allow rules; deny/ask rules are still evaluated whatever the hook returns.
- PreToolUse JSON: `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|deny|ask|defer","permissionDecisionReason":"...","updatedInput":{...},"additionalContext":"..."}}` (`defer` only in `-p` with a single tool call; old top-level `decision: approve|block` deprecated for this event).
- PostToolUse: cannot block (tool ran); `{"decision":"block","reason":"..."}` or exit 2 feeds text to Claude; `updatedToolOutput` replaces output.
- Stop / SubagentStop: input adds `stop_hook_active`, `last_assistant_message`, `background_tasks[]`, `session_crons[]`. Keep working with `{"decision":"block","reason":"<why>"}` or exit 2, or non-error `hookSpecificOutput.additionalContext`. Cap: 8 consecutive continuations (`CLAUDE_CODE_STOP_HOOK_BLOCK_CAP`); always check `stop_hook_active` to avoid loops. `continue:false` overrides and ends the turn.
- `StopFailure` fires instead of Stop on API errors (`error`: `rate_limit`, `authentication_failed`, `billing_error`, `server_error`, ...; `last_assistant_message` = e.g. `"API Error: Rate limit reached"`); output ignored, use for logging/alerting the usage-limit state.
- `SessionStart` (matchers `startup|resume|clear|compact|fork`) stdout becomes context; good place for `pnpm install`/Postgres start in runners. `WorktreeCreate`/`WorktreeRemove` replace git worktree creation.
- `-p` runs execute project `.claude/settings.json` hooks even in an untrusted folder [DOC]. Hooks merge across settings levels; `disableAllHooks` exists.
- Runtime check (do not assume): after installing the guard, a runner runs `git push origin HEAD:main --dry-run` and must see the hook's block message, in each permission mode used (`auto`, `bypassPermissions`).
- Mechanics sketch of a guard (shape per [DOC]; the patterns are illustrative, the spec owns the final list):
```bash
#!/usr/bin/env bash
# .claude/hooks/factory-guard.sh  -- registered under PreToolUse, matcher "Bash|Read|Edit|Write"
in=$(cat); tool=$(jq -r '.tool_name' <<<"$in")
block() { echo "factory-guard: $1" >&2; exit 2; }          # exit 2 + stderr = blocked, reason shown to Claude
case "$tool" in
  Bash) c=$(jq -r '.tool_input.command' <<<"$in")
    grep -Eq 'git .*push.*[ :]main( |$)|git .*push.*refs/heads/main' <<<"$c" && block "pushing to main is forbidden"
    grep -Eq 'git .*push.*(--force|-f( |$)|\+)' <<<"$c" && ! grep -Eq 'factory/[0-9]+-|proto/[0-9]+-' <<<"$c" && block "force-push only to factory/<issue>-* or proto/*"
    grep -Eq 'gh repo delete' <<<"$c" && block "repo deletion" ;;
  Read|Edit|Write) p=$(jq -r '.tool_input.file_path // empty' <<<"$in")
    [[ "$p" =~ (^|/)\.env[^/]*$ && ! "$p" =~ \.env\.example$ ]] && block ".env files are off-limits" ;;
esac
exit 0
```
- Prefer hooks over `permissions.deny` for the `.env` rule: deny wins over allow, so `Read(./.env.*)` would also block `.env.example` with no carve-out [DOC permissions].

## 4. Settings precedence (docs: settings, settings-reference)
Highest first: managed (server-managed / `managed-settings.json` / MDM) > command line `--settings` > `.claude/settings.local.json` > `.claude/settings.json` > `~/.claude/settings.json`. List keys (`permissions.allow/deny`, hooks) **merge** across levels; scalars override. Env vars are not a level (`ANTHROPIC_MODEL` beats `model` key). Useful keys: `permissions.{allow,deny,ask,defaultMode,denyInsteadOfPrompting,additionalDirectories}`, `env`, `hooks`, `worktree.baseRef`, `autoContinueAtUsageLimit`, `ultracode`, `attribution`, `cleanupPeriodDays`, `skipDangerousModePermissionPrompt`. `defaultMode: "auto"` or `"bypassPermissions"` in project/local settings does NOT take effect. Running as root/sudo refuses bypass: `--dangerously-skip-permissions cannot be used with root/sudo privileges for security reasons` (skipped inside a recognized sandbox).
Cloud sessions: read the repo's `.claude/settings.json` (hooks, permission rules, `env`) only in single-repo sessions; do not read `~/.claude/settings.json` or `settings.local.json`; ignore `defaultMode` `bypassPermissions`/`dontAsk`; do not install plugins from `enabledPlugins`. The repo currently has no `.claude/settings.json` (only `.claude/skills/`) [PROBE], so the guard file is new work.
Committed shape that reaches every runner (cloud and VPS):
```json
{
  "worktree": { "baseRef": "head" },
  "permissions": { "deny": ["Bash(gh repo delete *)", "Bash(docker volume rm *)"] },
  "hooks": {
    "PreToolUse": [{ "matcher": "Bash|Read|Edit|Write",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/factory-guard.sh", "timeout": 10, "onFailure": "block" }] }],
    "StopFailure": [{ "matcher": "rate_limit",
      "hooks": [{ "type": "command", "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/log-limit.sh", "async": true }] }]
  }
}
```
`onFailure:"block"` makes a crashed guard fail closed (v2.1.295+; installed 2.1.328). Whether `env` keys such as `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS` take effect from settings `env` is UNCONFIRMED: set them as cloud-environment variables / systemd `Environment=` instead.

## 5. Git worktrees (docs: worktrees)
- `claude -p -w <name> "..."` creates `<repo>/.claude/worktrees/<name>/` on branch `worktree-<name>`, branched from the remote default branch (`main`) by default; `-p` skips the trust check. `worktree.baseRef`: `"fresh"` (default, origin default branch) or `"head"` (current HEAD); **cannot be a branch name**.
- Factory consequence: for ticket work off `factory/trunk`, create worktrees manually: `git fetch origin && git worktree add -b factory/57-harness ../wt/57 origin/factory/trunk && cd ../wt/57 && claude -p ...`. Set `{"worktree":{"baseRef":"head"}}` so subagent (`isolation: worktree`) and Workflow `isolation:'worktree'` agents branch from the ticket branch, not `main` (subagents: [DOC]; Workflow agents follow the same setting: UNCONFIRMED, check `git -C <agent worktree> merge-base --is-ancestor origin/factory/trunk HEAD`).
- `-p` runs never clean up their worktrees and leave the lock: `git worktree unlock <p> && git worktree remove --force <p>`; `git worktree prune`. All worktrees share `.git` (and permission approvals saved to the main checkout's `settings.local.json`). `.worktreeinclude` copies gitignored files into new worktrees: never list `.env*` in it.
- `--tmux` (requires `--worktree`) opens the session in a tmux pane; interactive use only.

## 6. Subagent definitions (docs: sub-agents)
- File `.claude/agents/<name>.md` (scanned recursively; also `~/.claude/agents`, `--agents` JSON, plugins, managed): YAML frontmatter + body as system prompt. Required `name`, `description`. Optional: `tools`, `disallowedTools`, `model` (`opus`, `claude-opus-5-5`, `inherit`), `permissionMode`, `maxTurns`, `skills` (preloaded full text), `mcpServers`, `hooks`, `memory`, `background`, `omitClaudeMd`, `effort`, `isolation: worktree`, `color`, `initialPrompt`. Unknown fields are silently ignored.
- Example judge: `---\nname: rubric-judge\ndescription: Scores a diff cold against docs/factory/rubric.md\ntools: Read, Grep, Glob, Bash\nmodel: claude-opus-5-5\neffort: xhigh\ndisallowedTools: Edit, Write, Agent\n---\n<prompt>`.
- Limits: nesting depth 3 (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`), 20 concurrent (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`; not enforced when ultracode is on). Subagents get only their own prompt + env details, not the Claude Code system prompt; CLAUDE.md loads unless `omitClaudeMd: true`.

## 7. Workflow runtime facts that refine the charter (docs: workflows, env-vars)
- Concurrency: "up to 16 concurrent agents by default, fewer when Claude Code has fewer CPUs" (exact formula UNCONFIRMED; charter's `min(16, CPUs-2)` is not in docs). **Override: `CLAUDE_CODE_WORKFLOW_MAX_CONCURRENT_AGENTS=1..256` (v2.1.269+)**, set it as a cloud-environment variable (runner sessions) or systemd `Environment=` (T2). Memory grows per running agent; on a 16 GB VM start at 6 and raise if RSS allows (runtime check: `free -m`).
- 1,000 agents/run, 4,096 items per `parallel()`/`pipeline()`. Stalled agents restart up to 5 times (`stallMs` per agent, `CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS`); then `null` inside parallel/pipeline.
- Usage limit: a run **pauses** (instead of failing agents) only in an interactive terminal or Desktop Code-tab session with `autoContinueAtUsageLimit` on, reset < 24 h, at most twice. It does NOT pause in `claude -p`, Agent SDK, background or Remote Control sessions: agents fail and the run must be relaunched (`resumeFromRunId`). Cloud runner sessions: UNCONFIRMED which branch applies; treat as "agents fail" and re-run.

## 8. Cloud sessions (docs: claude-code-on-the-web, cloud-environments)
- Available on Pro/Max/Ultra/Team; usage counts toward the same plan limits (no VM charge); parallel sessions drain limits proportionally. Each session: fresh Anthropic-managed VM, Ubuntu 24.04 x86_64, ~4 vCPU / 16 GB RAM / 30 GB disk [DOC; `nproc`=4, 15 GiB PROBE]. Repo cloned at the requested branch; push only branches (the GitHub proxy rejects branch deletions and tag pushes; scope = repos attached to the session; **GraphQL is blocked**, so `gh pr`/`gh issue` fail: use `gh api repos/{o}/{r}/...` REST or GitHub MCP tools). `GH_TOKEN` reads `proxy-injected` unless you set one.
- Permission modes offered: Accept edits (= default, file edits pre-approved), Plan, Auto. **Bypass is not available**; CLI flags do not change a cloud session's mode. Children made with `create_session` cannot exceed the parent's mode. Observed: the Orchestrator session runs `permission_mode: auto`, effort `xhigh`, ultracode active, `lineage {depth:0, limit:8}` (session spawn depth limit 8) [PROBE via get_session].
- Environment = network level + env vars + setup script, personal or org-shared. Network: **None**, **Limited** (default allowlist: package registries, GitHub, cloud SDKs, plus listed domains, `*.` wildcards allowed in the UI), **Full**. GitHub proxy, MCP connectors, network-secret hosts and the Anthropic API bypass the allowlist. Current env `Xts` (env_01R75BDUDR1dKKxUisL7vvrr): network `unrestricted`, no setup script, no variables; other envs: `Default`, `Friends Of Animals`, `One` [PROBE via get_environment].
- Env vars: `.env` format, read at session start and on VM restore; visible to anyone using the env: no secrets (use network secrets, which the proxy injects per host). Setup script: bash, runs as root before Claude starts, must exit 0, keep < ~5 min so the filesystem snapshot caches (re-run on script/host change or ~7-day expiry); env vars are NOT set while it runs; background processes (Postgres) are not cached: start them in a `SessionStart` hook. Postgres and Redis are preinstalled, not running (`service postgresql start`); Docker available.
- Time: Bash foreground 2 min default / 10 max, then moved to background up to 30 more min; SessionStart hook 600 s; idle VM pauses after a few minutes and can be reclaimed ("Environment expired"): conversation restored, running shells/subagents/session-scoped scheduled tasks are not, so runners must commit+push at every phase boundary.
- CLI: `claude --cloud "task"` creates a session from the current repo/branch (must be pushed); `claude -p "msg" --cloud <session_id> --output-format json` queues a follow-up and prints `{ok, session_id, url}`; `claude --teleport` pulls a session local. Auto-fix PR (`/autofix-pr`) needs the Claude GitHub App and cannot react to base-branch merge conflicts (no webhook).

## 9. Usage limits on Max and how a headless run sees them
- Plans [support.claude.com]: Max = 5x Pro per five-hour window and per week; one weekly limit across all models plus a separate weekly Fable limit; weekly reset at a fixed time per account (Settings > Usage). Ultra (formerly Max 20x) = 10x Pro weekly, no five-hour limit for verified accounts. Limits are shared by claude.ai, Claude Code and all cloud sessions of the account. The owner's account currently reports a `five_hour` window [PROBE], so it is Max (5x) or a not-yet-verified Ultra. A large workflow fan-out can exhaust the weekly allowance before the 5-hour window resets [DOC errors].
- Messages [DOC]: `You've hit your session limit · resets 3:45pm`, `You've hit your weekly limit · resets Mon 12:00am`, `You've hit your Opus limit · resets 3:45pm`; warning `You've used 85% of your session limit · resets 3:45pm`. Not quota: `API Error: Server is temporarily limiting requests (not your usage limit)` (auto-retried) and 529 overloaded.
- Live telemetry [PROBE, v2.1.328]: every run emits `{"type":"rate_limit_event","rate_limit_info":{"status":"allowed","resetsAt":1795111800,"rateLimitType":"five_hour","isUsingOverage":false,"overageStatus":"rejected","unifiedWindows":{"five_hour":{"utilization":0.34,"resetsAt":1795111800,"status":"allowed"},"seven_day":{"utilization":0.3,"resetsAt":1795417200,"status":"allowed"}}}}` (`resetsAt` = epoch seconds: 2026-11-19 18:10Z and 2026-11-23 07:00Z). Statuses: `allowed|allowed_warning|rejected`. `get_session(...).external_metadata.rate_limit_info` exposes the same for a cloud session. A cheap probe: `claude -p --output-format stream-json --verbose --tools "" --max-turns 1 --no-session-persistence --model claude-opus-5-5 "OK" | jq -c 'select(.type=="rate_limit_event")'` (~$0.02 estimated).
- At exhaustion (UNCONFIRMED exact shape; derived from DOC): `rate_limit_event.status:"rejected"`, assistant message `error:"rate_limit"`, `StopFailure` hook `error:"rate_limit"`, result `is_error:true`, `api_error_status:429`, result text = the `You've hit your ... limit · resets <time>` line, non-zero exit. Interactive auto-continue (`autoContinueAtUsageLimit`) does not apply to `-p`.
- Supervisor-side wait (bash; fields per [PROBE]):
```bash
wait_for_quota() {   # $1 = a run's stream-json log; returns after the rejected window resets
  local info st at now
  info=$(jq -c 'select(.type=="rate_limit_event") | .rate_limit_info' "$1" | tail -n 1)
  st=$(jq -r '.status // "unknown"' <<<"$info"); at=$(jq -r '.resetsAt // empty' <<<"$info"); now=$(date +%s)
  if [ "$st" = rejected ] && [ -n "$at" ] && [ "$at" -gt "$now" ]; then sleep $(( at - now + 120 )); return; fi
  [ "$st" = rejected ] && sleep 900     # no reset time: re-probe in 15 min
}
```
- Back-off options: (a) `CLAUDE_CODE_RETRY_WATCHDOG=1` makes the process itself back off up to 5 min per attempt "or until the limit resets when the response carries a reset time"; bound it with `CLAUDE_CODE_RETRY_WATCHDOG_MAX_USAGE_LIMIT_WAIT_MS=21600000` (6 h: rides out a five-hour window, fails fast on a weekly one) and poll with `CLAUDE_CODE_RETRY_WATCHDOG_USAGE_LIMIT_RECHECK_MS=600000` (v2.1.305+). (b) Supervisor loop: on a limit result, sleep until `resetsAt + 120 s`, then `claude -p --resume <session_id> "Usage limit reset. Continue the task from where you stopped."`; if `resetsAt` is missing, re-probe every 15 min. (c) Throttle before the wall: stop dispatching new tickets at `five_hour.utilization >= 0.85` or `seven_day.utilization >= 0.90`; pause all runners at `>= 0.97`.

## 10. Running under systemd / tmux (VPS topology T2)
Not covered by the Claude Code docs: the unit below is standard systemd, UNCONFIRMED against Claude docs, built from documented behaviour (non-root for bypass, SIGINT ends a turn cleanly, OAuth token via env).
```ini
# /etc/systemd/system/factory-runner@.service   (instance = issue number)
[Service]
User=factory
WorkingDirectory=/srv/factory/wt/%i
# secrets.env: mode 0600, owner factory, lines CLAUDE_CODE_OAUTH_TOKEN=... and GH_TOKEN=... (systemd has no trailing comments)
EnvironmentFile=/srv/factory/secrets.env
Environment=CLAUDE_CODE_RETRY_WATCHDOG=1 DISABLE_AUTOUPDATER=1 GH_PROMPT_DISABLED=1 GH_NO_UPDATE_NOTIFIER=1
ExecStart=/usr/bin/claude -p --model claude-opus-5-5 --permission-mode bypassPermissions --permission-prompts none --output-format stream-json --verbose --max-turns 400 --append-system-prompt-file /srv/factory/runner-prompt.md "/implement %i"
StandardOutput=append:/srv/factory/logs/%i.jsonl
KillSignal=SIGINT
TimeoutStopSec=120
Restart=no
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/srv/factory /home/factory/.claude
```
- Auth on a headless box: `claude setup-token` (interactive, once, on any machine) prints a one-year OAuth token; set `CLAUDE_CODE_OAUTH_TOKEN` (rank 5 in auth precedence, below `ANTHROPIC_API_KEY`: make sure no API key is set, or usage bills to the API). `claude auth status` exits 0/1 with JSON `authMethod`. Isolation from prod Postgres: run as a user with no DB credentials, no docker group, firewall `5432/6432` for that uid (UNCONFIRMED setup; spec must verify with `psql` connection attempt expected to fail).
- tmux alternative: `tmux new-session -d -s fr-57 -c /srv/factory/wt/57 'claude -p ... > /srv/factory/logs/57.jsonl 2>&1'`; `tmux ls`, `tmux capture-pane -pt fr-57`. `claude --bg` background sessions + `claude agents --json` / `claude logs <id>` exist but `--bg` cannot combine with `-p` and needs `skipDangerousModePermissionPrompt` in `~/.claude/settings.json` for bypass; prefer systemd + `-p`.

## 11. `gh` CLI with a fine-grained PAT
- Create at `https://github.com/settings/personal-access-tokens/new?name=foa-factory&target_name=siddhartxts&expires_in=30&contents=write&pull_requests=write&issues=write&actions=read&statuses=read&workflows=write` (repository access: only `friends-of-animals`; `metadata=read` is implicit; drop `workflows` unless runners edit `.github/workflows/`). Fine-grained PATs **cannot call the Checks API**: read CI via Actions (`gh api repos/{o}/{r}/actions/runs?head_sha=<sha>`, `.../runs/<id>/jobs`) and commit statuses (`gh api repos/{o}/{r}/commits/<sha>/status`, where `e2e.yml` reports). Expiry 1-366 days or none; unused tokens deleted after a year.
- Use: `export GH_TOKEN=...` (gh docs: "Favour setting `GH_TOKEN` for fine-grained personal access token usage"; it overrides stored credentials). `gh auth login --with-token` documents classic minimum scopes `repo, read:org, gist`. Git over HTTPS: `gh auth setup-git` or a credential helper; SSH remotes do not use PATs. Set `GH_PROMPT_DISABLED=1`.
- Branch protection on `main` (require PR, disallow force-push and deletion) is the hard backstop that a PAT with `contents=write` otherwise lacks.

## 12. UNCONFIRMED items and the runtime check the spec must perform
1. Exact `-p` result on usage exhaustion: force-detect by matching `rate_limit_event.status=="rejected"` OR `api_error_status==429` OR `/You've hit your .* limit/` in `result`.
2. Workflow-agent worktree base follows `worktree.baseRef`: check ancestry as in section 5.
3. Workflow pause-vs-fail at usage limit inside cloud runner sessions: assume fail, rely on `resumeFromRunId`.
4. Max number of concurrent child cloud sessions per account: unknown; start with 4, add one per 30 min while `five_hour.utilization < 0.6`, back off on any `create_session` error.
5. Whether `child` sessions' `get_session` carries `rate_limit_info`: read it; fall back to the probe.
6. Whether the GitHub proxy also rejects REST ref deletion (`gh api -X DELETE repos/{o}/{r}/git/refs/heads/proto/57-a`): try once; if 403, delete `proto/*` from a VPS/MCP context or leave for the owner.
7. PreToolUse hooks enforced in `auto` and `bypassPermissions`: smoke test in section 3.
8. Default Workflow concurrency formula on a 4-vCPU VM: read the `/workflows` header or count running agents; set the env var explicitly.

## Sources
- https://code.claude.com/docs/en/headless · cli-reference · permission-modes · permissions · hooks · settings · settings-reference · env-vars · worktrees · sub-agents · skills · workflows · errors · interactive-mode · authentication · model-config · agent-view
- https://code.claude.com/docs/en/claude-code-on-the-web · https://code.claude.com/docs/en/cloud-environments · https://code.claude.com/docs/en/agent-sdk/typescript (SDKResultMessage, SDKRateLimitEvent)
- https://support.claude.com/en/articles/11049741-what-is-the-max-plan · https://support.claude.com/en/articles/17728952-what-is-the-ultra-plan · https://claude.com/pricing
- https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens · https://cli.github.com/manual/gh_help_environment · https://cli.github.com/manual/gh_auth_login
