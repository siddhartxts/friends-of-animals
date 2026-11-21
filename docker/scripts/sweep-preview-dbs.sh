#!/usr/bin/env bash
# Drop preview databases on pg-nonprod whose PR is closed or branch is gone.
#
# Preview builds create foa_pr_<n>_<fp> / foa_br_<slug>_<hash>_<fp> from foa_seed and
# label them with a database comment:
#   'foa-preview pr=<n>'         dropped once GitHub reports the PR closed
#   'foa-preview branch=<ref>'   dropped once the branch no longer exists
# The comment alone says which PR or branch a database belongs to; names are
# never parsed or recomputed here, only checked to look like a preview's.
# Anything uncertain (API error, rate limit, unexpected name or comment) is
# kept. foa_seed, foa_staging, postgres and the templates are never touched.
#
# Optional /etc/foa/sweeper.env: GITHUB_TOKEN=... (read-only token; raises the
# API rate limit and is needed if the repository becomes private).
#
# Usage: sudo sweep-preview-dbs.sh [--dry-run]
set -euo pipefail

REPO=SiddharthMuramkar/friends-of-animals
CONTAINER=foa-pg-nonprod
DRY_RUN=0

case "${1:-}" in
  "") ;;
  --dry-run) DRY_RUN=1 ;;
  *) echo "usage: $0 [--dry-run]" >&2; exit 2 ;;
esac

if [ -z "${GITHUB_TOKEN:-}" ] && [ -r /etc/foa/sweeper.env ]; then
  # shellcheck disable=SC1091
  . /etc/foa/sweeper.env
fi

say() { echo "sweep: $*"; }

psql_nonprod() {
  docker exec -i -u postgres "$CONTAINER" \
    psql -X -q -At -v ON_ERROR_STOP=1 -h /var/run/postgresql -d postgres "$@"
}

# pr_state N -> prints open|closed|unknown
pr_state() {
  local body
  if ! body="$(
    {
      if [ -n "${GITHUB_TOKEN:-}" ]; then
        printf 'header = "Authorization: Bearer %s"\n' "$GITHUB_TOKEN"
      fi
    } | curl -fsS --max-time 20 --config - \
      -H 'Accept: application/vnd.github+json' \
      -H 'X-GitHub-Api-Version: 2022-11-28' \
      "https://api.github.com/repos/$REPO/pulls/$1" 2>/dev/null
  )"; then
    echo unknown
    return
  fi
  case "$(jq -r '.state // empty' <<<"$body")" in
    open) echo open ;;
    closed) echo closed ;;
    *) echo unknown ;;
  esac
}

# branch_state REF -> prints present|gone|unknown
branch_state() {
  local rc=0
  (
    # Token via environment (never argv), in a subshell.
    if [ -n "${GITHUB_TOKEN:-}" ]; then
      export GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=http.extraHeader
      GIT_CONFIG_VALUE_0="Authorization: Basic $(printf 'x-access-token:%s' "$GITHUB_TOKEN" | base64 -w0)"
      export GIT_CONFIG_VALUE_0
    fi
    export GIT_TERMINAL_PROMPT=0
    exec timeout 30 git ls-remote --exit-code --heads \
      "https://github.com/$REPO.git" "refs/heads/$1" >/dev/null 2>&1
  ) || rc=$?
  case "$rc" in
    0) echo present ;;
    2) echo gone ;;
    *) echo unknown ;;
  esac
}

drop_db() {
  if [ "$DRY_RUN" -eq 1 ]; then
    say "would drop $1 ($2)"
    return
  fi
  # Name already validated against ^foa_(pr|br)_[a-z0-9_]+$; quoted anyway.
  printf 'DROP DATABASE IF EXISTS "%s" WITH (FORCE);\n' "$1" | psql_nonprod
  say "dropped $1 ($2)"
}

rows="$(psql_nonprod -F $'\t' -c "
  SELECT d.datname, shobj_description(d.oid, 'pg_database')
    FROM pg_database AS d
   WHERE shobj_description(d.oid, 'pg_database') LIKE 'foa-preview %'
   ORDER BY 1")"

checked=0 dropped=0 kept=0
while IFS=$'\t' read -r db comment; do
  [ -n "$db" ] || continue
  checked=$((checked + 1))
  case "$db" in
    foa_seed | foa_staging | postgres | template0 | template1)
      say "skip $db: protected"; kept=$((kept + 1)); continue ;;
  esac
  if ! [[ "$db" =~ ^foa_(pr|br)_[a-z0-9_]{1,56}$ ]]; then
    say "skip $db: not a preview database name"; kept=$((kept + 1)); continue
  fi
  label="${comment#foa-preview }"
  if [[ "$label" =~ ^pr=([0-9]{1,9})$ ]]; then
    n="${BASH_REMATCH[1]}"
    state="$(pr_state "$n")"
    if [ "$state" = closed ]; then
      drop_db "$db" "PR #$n closed"; dropped=$((dropped + 1))
    else
      say "keep $db: PR #$n $state"; kept=$((kept + 1))
    fi
  elif [[ "$label" =~ ^branch=([A-Za-z0-9][A-Za-z0-9._/+@-]{0,200})$ ]]; then
    ref="${BASH_REMATCH[1]}"
    state="$(branch_state "$ref")"
    if [ "$state" = gone ]; then
      drop_db "$db" "branch $ref gone"; dropped=$((dropped + 1))
    else
      say "keep $db: branch $ref $state"; kept=$((kept + 1))
    fi
  else
    say "skip $db: unrecognised comment"; kept=$((kept + 1))
  fi
done <<<"$rows"

mode=""; [ "$DRY_RUN" -eq 1 ] && mode=" (dry run)"
say "checked $checked, $( [ "$DRY_RUN" -eq 1 ] && echo "would drop" || echo dropped ) $dropped, kept $kept$mode"
