#!/usr/bin/env bash
# Restore drill: proves that the pgBackRest backups of pg-prod restore. It
# restores repo1 into a throwaway container and a fresh volume, checks the
# result, records it and removes both. It only reads the repository (mounted
# read-only); it never connects to pg-prod or pg-nonprod and writes to
# neither, and it mounts neither data volume.
#
#  1. Start a container from pg-prod's image with --network none, capped CPU
#     and memory, the repo volume read-only and a new, labelled volume.
#  2. `pgbackrest info`: newest backup, newest archived WAL segment, size.
#     Refuse to start without room for the restore, 1 GiB of WAL and 10 % of
#     the disk left over (pg-prod lives on the same disk).
#  3. `pgbackrest verify`: read and checksum every backup file and WAL
#     segment in the repository.
#  4. `pgbackrest restore --archive-mode=off`: to the end of the archived WAL
#     (latest, the default) or to --target <time>.
#  5. Start Postgres (no TCP, archive_mode=off) and wait for the promotion.
#  6. Sanity checks: database foa exists and has every table and extension
#     its applied migrations created (expected_objects). latest: the newest
#     backup was restored and replay reached the newest archived segment.
#     --target: no transaction committed after the target was replayed.
#  7. Remove the container and the volume, append one JSON line to
#     /var/log/foa/restore-drills.jsonl. Full log:
#     /var/log/foa/restore-drill-<stamp>.log.
#
# Usage: sudo restore-drill.sh [--target latest|<time with zone>]
# The functions above main() are tested by restore-drill.test.ts, which
# sources this file.
set -euo pipefail

PROD=foa-pg-prod
STANZA=foa
PGDATA=/var/lib/postgresql/18/docker
CIPHER_CONF=/etc/foa/secrets/pgbackrest_cipher.conf
LOG_DIR=/var/log/foa
RECORDS="$LOG_DIR/restore-drills.jsonl"
LOCK=/run/lock/foa-restore-drill.lock
DRILL_CPUS=2
DRILL_MEMORY=2g
WAL_HEADROOM=$((1024 * 1024 * 1024))

usage() {
  cat <<'EOF'
Usage: sudo restore-drill.sh [--target latest|<time with zone>]

Restores the pgBackRest backups of pg-prod into a throwaway container,
checks the restored database, records the result in
/var/log/foa/restore-drills.jsonl and removes the container and its volume.

  --target latest   replay to the end of the archived WAL (default)
  --target <time>   point-in-time restore, e.g. '2026-11-18 11:34:51+05:30'
                    or 2026-11-18T06:04:51Z; the zone is required
  -h, --help        show this help
EOF
}

usage_error() {
  echo "restore-drill: $*" >&2
  usage >&2
  exit 2
}

# 'latest', or a timestamp with an explicit zone, printed in UTC with
# microseconds as pgBackRest and Postgres take it.
normalise_target() {
  local t=$1 epoch
  local iso='^[0-9]{4}-[0-9]{2}-[0-9]{2}[ T][0-9]{2}:[0-9]{2}(:[0-9]{2}(\.[0-9]{1,6})?)? ?(Z|UTC|[+-][0-9]{2}(:?[0-9]{2})?)$'
  if [ "$t" = latest ]; then echo latest; return; fi
  [[ $t =~ $iso ]] ||
    usage_error "--target must be 'latest' or a time with a zone, e.g. '2026-11-18 11:34:51+05:30' (got '$t')"
  epoch="$(date -u -d "$t" +%s 2>/dev/null)" || usage_error "--target is not a valid time: '$t'"
  [ "$epoch" -le "$(date +%s)" ] || usage_error "--target is in the future: '$t'"
  date -u -d "$t" '+%Y-%m-%d %H:%M:%S.%6N+00'
}

parse_args() {
  TARGET=latest
  while [ $# -gt 0 ]; do
    case $1 in
      -h | --help) usage; exit 0 ;;
      --target)
        [ $# -ge 2 ] || usage_error "--target needs a value"
        TARGET="$(normalise_target "$2")" || exit 2
        shift 2
        ;;
      --target=*)
        TARGET="$(normalise_target "${1#--target=}")" || exit 2
        shift
        ;;
      *) usage_error "unknown argument: $1" ;;
    esac
  done
}

# One JSON object on one line, fields in the order given: name=text is a
# string, name:=number a number; an empty value is null.
drill_record() {
  local field name value jq_args=()
  for field in "$@"; do
    name="${field%%=*}"
    value="${field#*=}"
    if [ -z "$value" ]; then
      jq_args+=(--argjson "${name%:}" null)
    elif [ "${name%:}" = "$name" ]; then
      jq_args+=(--arg "$name" "$value")
    elif [[ $value =~ ^-?[0-9]+(\.[0-9]+)?$ ]]; then
      jq_args+=(--argjson "${name%:}" "$value")
    else
      echo "drill_record: ${name%:} is not a number: '$value'" >&2
      return 1
    fi
  done
  jq -nc "${jq_args[@]}" '$ARGS.named'
}

# The newest WAL segment (24 hex digits, not a .history or .partial file)
# that the Postgres log on stdin says was restored from the archive.
last_restored_wal() {
  { grep -oE 'restored log file "[0-9A-F]{24}" from archive' || true; } |
    cut -d'"' -f2 | LC_ALL=C sort | tail -n 1
}

# Whether replay got to WAL segment $1 at or past $2 (the newest archived
# one). Segment names sort in WAL order byte by byte, whatever the locale.
wal_reached() {
  [ -n "$1" ] && [ "$(printf '%s\n' "$1" "$2" | LC_ALL=C sort | tail -n 1)" = "$1" ]
}

# What the restored database must contain, from a drizzle folder and the
# created_at of each row of the restored drizzle.__drizzle_migrations (the
# journal's `when`): "table <schema>.<name>" for every table in the snapshot
# of the newest applied migration, "extension <name>" for every CREATE
# EXTENSION in the applied migrations. Sorted, one per line.
# Usage: expected_objects <drizzle dir> <applied when>...
expected_objects() {
  local dir=$1 journal="$1/meta/_journal.json" applied known unknown idx tag
  shift
  applied="$(printf '%s\n' "$@" | jq -sc 'map(tonumber)')"
  known="$(jq -c --argjson applied "$applied" \
    '[.entries[] | select(.when as $w | any($applied[]; . == $w))] | sort_by(.idx)' "$journal")"
  unknown=$(($# - $(jq length <<<"$known")))
  if [ "$unknown" -gt 0 ]; then
    echo "restore-drill: WARNING: $unknown applied migration(s) not in $journal" \
      "(pull this checkout); checking what the known ones created" >&2
  fi
  {
    idx="$(jq -r 'last | .idx // empty' <<<"$known")"
    if [ -n "$idx" ]; then
      jq -r '.tables | keys[] | "table " + .' "$(printf '%s/meta/%04d_snapshot.json' "$dir" "$idx")"
    fi
    for tag in $(jq -r '.[].tag' <<<"$known"); do
      sed 's/--.*//' "$dir/$tag.sql" |
        { grep -oiE 'create[[:space:]]+extension([[:space:]]+if[[:space:]]+not[[:space:]]+exists)?[[:space:]]+("[^"]+"|[a-z0-9_]+)' || true; } |
        awk '{ gsub(/"/, "", $NF); print "extension " $NF }'
    done
  } | LC_ALL=C sort -u
}

now() { date +%s.%N; }
secs() { awk -v a="$1" -v b="$2" 'BEGIN { printf "%.1f", b - a }'; }

die() {
  REASON="$*"
  echo "restore-drill: FAIL: $*" >&2
  exit 1
}

on_err() {
  local cmd="$3"
  REASON="${REASON:-exit status $1 at line $2: ${cmd:0:200}}"
}

# Run in the drill container as postgres; SQL comes from -c or stdin.
in_drill() { docker exec -u postgres "$DRILL" "$@"; }
drill_sql() {
  docker exec -i -u postgres "$DRILL" \
    psql -X -q -At -v ON_ERROR_STOP=1 -h /var/run/postgresql "$@"
}

postgres_failed() {
  local log
  log="$(docker exec "$DRILL" cat /tmp/postgres.log 2>/dev/null || true)"
  tail -n 30 <<<"$log"
  die "restored cluster $1: $(grep -m 1 -E 'FATAL|PANIC' <<<"$log" | sed 's/^.*\(FATAL\|PANIC\): *//' || true)"
}

# Removes what this run created, appends the record and prints the summary.
finish() {
  local rc=$? outcome=fail t_end duration left=""
  set +e
  trap - ERR
  [ "${CONTAINER_MADE:-0}" = 1 ] && docker rm -f "$DRILL" >/dev/null
  [ "${VOLUME_MADE:-0}" = 1 ] && docker volume rm "$VOL" >/dev/null
  if [ "${CONTAINER_MADE:-0}" = 1 ] && docker container inspect "$DRILL" >/dev/null 2>&1; then left="container $DRILL"; fi
  if [ "${VOLUME_MADE:-0}" = 1 ] && docker volume inspect "$VOL" >/dev/null 2>&1; then left="${left:+$left, }volume $VOL"; fi
  if [ -n "$left" ]; then
    echo "restore-drill: could not remove $left: docker rm -f $DRILL; docker volume rm $VOL" >&2
    REASON="${REASON:+$REASON; }left over: $left"
  fi
  if [ "$rc" -eq 0 ] && [ "${PASSED:-0}" = 1 ] && [ -z "$left" ]; then outcome=pass; fi
  if [ "$outcome" = fail ]; then
    REASON="${REASON:-exit status $rc}"
    [ "$rc" -ne 0 ] || rc=1
  fi
  t_end="$(now)"
  duration="$(secs "$T_START" "$t_end")"
  drill_record at="$AT" target="$TARGET" outcome="$outcome" \
    duration_s:="$duration" recovery_s:="${RECOVERY_S:-}" \
    backup="${BACKUP:-}" wal="${WAL:-}" last_xact="${LAST_XACT:-}" \
    reason="${REASON:-}" log="$LOG" >>"$RECORDS" ||
    echo "restore-drill: WARNING: could not append the record to $RECORDS" >&2
  echo
  echo "restore-drill: ${outcome^^} ($STAMP, target $TARGET)"
  [ -z "${REASON:-}" ] || echo "  reason                      : $REASON"
  echo "  backup restored             : ${BACKUP:--}"
  echo "  WAL replayed to             : ${WAL:--} (last transaction ${LAST_XACT:-none})"
  echo "  pgbackrest verify           : ${VERIFY_S:--} s"
  echo "  restore + replay + promote  : ${RECOVERY_S:--} s"
  echo "  whole drill                 : $duration s"
  echo "  record                      : $RECORDS"
  echo "  log                         : $LOG"
  exit "$rc"
}

main() {
  parse_args "$@"
  local here pgbr_conf drizzle_dir image repo_vol data_vol info newest_backup
  local archive_max restore_size docker_root fs_size fs_avail need verify_out
  local restore_opts=() restore_out t0 t_restore0 t_promoted promoted state
  local pg_log applied expected tables extensions missing user_tables replayed_after

  here="$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")"
  pgbr_conf="$(readlink -f "$here/../postgres/pgbackrest.conf")"
  drizzle_dir="$(readlink -f "$here/../../drizzle")"
  STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
  AT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  DRILL="foa-restore-drill-$STAMP"
  VOL="$DRILL"
  LOG="$LOG_DIR/restore-drill-$STAMP.log"

  install -d -m 0750 "$LOG_DIR"
  exec 9>"$LOCK"
  flock -n 9 || { echo "restore-drill: another drill is running" >&2; exit 1; }
  # tee ignores INT/TERM (systemd and timeout signal the whole group) and
  # ends when this script does, so the summary still reaches the log.
  exec > >(trap '' INT TERM; exec tee -a "$LOG") 2>&1
  T_START="$(now)"
  set -E
  trap finish EXIT
  trap 'on_err $? $LINENO "$BASH_COMMAND"' ERR
  trap 'REASON="${REASON:-interrupted}"; exit 130' INT TERM

  # Preconditions. pg-prod is only inspected (image, volume names), never
  # entered: it may even be stopped.
  for cmd in docker jq flock df; do command -v "$cmd" >/dev/null || die "needs $cmd"; done
  docker container inspect "$PROD" >/dev/null 2>&1 || die "no container $PROD to take the image and the repo volume from"
  image="$(docker inspect -f '{{.Config.Image}}' "$PROD")"
  mount_of() { docker inspect -f "{{range .Mounts}}{{if eq .Destination \"$1\"}}{{.Name}}{{end}}{{end}}" "$PROD"; }
  repo_vol="$(mount_of /var/lib/pgbackrest)"
  data_vol="$(mount_of /var/lib/postgresql)"
  [ -n "$repo_vol" ] || die "cannot find the pgBackRest repo volume of $PROD"
  [ -r "$pgbr_conf" ] || die "missing $pgbr_conf"
  [ -r "$CIPHER_CONF" ] || die "missing $CIPHER_CONF"
  [ -r "$drizzle_dir/meta/_journal.json" ] || die "missing $drizzle_dir/meta/_journal.json"
  ! docker container inspect "$DRILL" >/dev/null 2>&1 || die "container $DRILL already exists"
  ! docker volume inspect "$VOL" >/dev/null 2>&1 || die "volume $VOL already exists"
  echo "restore-drill: $STAMP target=$TARGET image=$image repo=$repo_vol (read-only);" \
    "not mounted: ${data_vol:-?} and pg-nonprod's volume"

  # 1. Throwaway container and volume.
  VOLUME_MADE=1
  docker volume create --label "foa.restore-drill=$STAMP" "$VOL" >/dev/null
  CONTAINER_MADE=1
  docker run -d --name "$DRILL" --label "foa.restore-drill=$STAMP" \
    --network none --cpus "$DRILL_CPUS" --memory "$DRILL_MEMORY" \
    --entrypoint sleep \
    -v "$VOL:/var/lib/postgresql" \
    -v "$repo_vol:/var/lib/pgbackrest:ro" \
    -v "$pgbr_conf:/etc/pgbackrest/pgbackrest.conf:ro" \
    -v "$CIPHER_CONF:/etc/pgbackrest/conf.d/cipher.conf:ro" \
    "$image" infinity >/dev/null
  docker exec "$DRILL" install -d -o postgres -g postgres -m 0700 "$PGDATA"

  # 2. What the repository holds, and room for it.
  info="$(in_drill pgbackrest --stanza="$STANZA" --log-level-console=warn --output=json info)"
  [ "$(jq -r '.[0].status.code' <<<"$info")" = 0 ] ||
    die "pgbackrest info: $(jq -r '.[0].status.message' <<<"$info")"
  newest_backup="$(jq -r '.[0].backup | last | .label // empty' <<<"$info")"
  archive_max="$(jq -r '.[0].archive | last | .max // empty' <<<"$info")"
  restore_size="$(jq -r '.[0].backup | last | .info.size // 0' <<<"$info")"
  [ -n "$newest_backup" ] || die "the repository holds no backup"
  [ -n "$archive_max" ] || die "the repository holds no archived WAL"
  echo "restore-drill: newest backup $newest_backup ($restore_size bytes), newest archived WAL $archive_max"
  docker_root="$(docker info -f '{{.DockerRootDir}}')"
  read -r fs_size fs_avail < <(df --output=size,avail -B1 "$docker_root" | tail -n 1)
  need=$((restore_size + WAL_HEADROOM + fs_size / 10))
  [ "$fs_avail" -ge "$need" ] ||
    die "not enough free disk under $docker_root: need $need bytes (restore + 1 GiB WAL + 10 % of the disk), have $fs_avail"

  # 3. Verify the repository.
  t0="$(now)"
  if ! verify_out="$(in_drill pgbackrest --stanza="$STANZA" \
    --log-level-console=warn --output=text --verbose verify 2>&1)"; then
    echo "$verify_out"
    die "pgbackrest verify failed"
  fi
  echo "$verify_out"
  grep -qx 'status: ok' <<<"$verify_out" || die "pgbackrest verify did not report status: ok"
  VERIFY_S="$(secs "$t0" "$(now)")"

  # 4. Restore into the fresh volume.
  if [ "$TARGET" = latest ]; then
    restore_opts=(--type=default)
  else
    restore_opts=(--type=time "--target=$TARGET" --target-action=promote)
  fi
  t_restore0="$(now)"
  if ! restore_out="$(in_drill pgbackrest --stanza="$STANZA" "${restore_opts[@]}" \
    --archive-mode=off --log-level-console=info restore 2>&1)"; then
    echo "$restore_out"
    die "pgbackrest restore failed: $(grep -m 1 'ERROR' <<<"$restore_out" || true)"
  fi
  echo "$restore_out"
  BACKUP="$(sed -n 's/.*restore backup set \([^ ,]*\).*/\1/p' <<<"$restore_out" | tail -n 1)"

  # 5. Recover and promote.
  in_drill pg_ctl -D "$PGDATA" -l /tmp/postgres.log -w -t 900 \
    -o "-c listen_addresses='' -c archive_mode=off -c unix_socket_directories=/var/run/postgresql" \
    start || postgres_failed "did not start"
  promoted=0
  for _ in $(seq 1 900); do
    state="$(drill_sql -d postgres -c 'SELECT pg_is_in_recovery()' </dev/null 2>/dev/null || true)"
    if [ "$state" = f ]; then promoted=1; break; fi
    in_drill pg_ctl -D "$PGDATA" status >/dev/null 2>&1 || break
    sleep 1
  done
  [ "$promoted" = 1 ] || postgres_failed "did not finish recovery"
  t_promoted="$(now)"
  RECOVERY_S="$(secs "$t_restore0" "$t_promoted")"

  # 6. Sanity checks.
  pg_log="$(docker exec "$DRILL" cat /tmp/postgres.log)"
  grep -E 'starting (point-in-time|archive) recovery|recovery stopping|redo done|last completed transaction|selected new timeline|archive recovery complete' <<<"$pg_log" || true
  WAL="$(last_restored_wal <<<"$pg_log")"
  LAST_XACT="$(drill_sql -d postgres </dev/null -c \
    "SELECT coalesce(to_char(pg_last_xact_replay_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD HH24:MI:SS.US') || '+00', '')")"
  [ "$(drill_sql -d postgres </dev/null -c "SELECT count(*) FROM pg_database WHERE datname = 'foa'")" = 1 ] ||
    die "the restored cluster has no database foa"
  # The latest state must have migrations; an older --target may predate them.
  applied=""
  if [ "$(drill_sql -d foa </dev/null -c "SELECT to_regclass('drizzle.__drizzle_migrations') IS NOT NULL")" = t ]; then
    applied="$(drill_sql -d foa </dev/null -c 'SELECT created_at FROM drizzle.__drizzle_migrations ORDER BY created_at')"
  fi
  if [ -z "$applied" ]; then
    [ "$TARGET" != latest ] || die "foa has no applied migrations (drizzle.__drizzle_migrations missing or empty)"
    echo "restore-drill: foa had no migrations applied at $TARGET"
  fi
  # shellcheck disable=SC2086 # one created_at per word
  expected="$(expected_objects "$drizzle_dir" $applied)"
  tables="$(awk '$1 == "table" { print $2 }' <<<"$expected" | paste -sd, -)"
  extensions="$(awk '$1 == "extension" { print $2 }' <<<"$expected" | paste -sd, -)"
  missing="$(drill_sql -d foa -v tables="$tables" -v extensions="$extensions" <<'SQL'
SELECT 'table ' || t
FROM unnest(string_to_array(nullif(:'tables', ''), ',')) AS t
WHERE to_regclass(format('%I.%I', split_part(t, '.', 1), split_part(t, '.', 2))) IS NULL
UNION ALL
SELECT 'extension ' || e
FROM unnest(string_to_array(nullif(:'extensions', ''), ',')) AS e
WHERE NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = e)
SQL
)"
  user_tables="$(drill_sql -d foa </dev/null -c \
    "SELECT count(*) FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema')")"
  echo "restore-drill: foa: $(grep -c . <<<"$applied" || true) applied migration(s)," \
    "$user_tables table(s); expected: $(paste -sd, - <<<"${expected:-none}")"
  [ -z "$missing" ] || die "missing from the restored foa: $(paste -sd, - <<<"$missing")"

  if [ "$TARGET" = latest ]; then
    [ "$BACKUP" = "$newest_backup" ] ||
      die "restored backup set ${BACKUP:-?}, not the newest one ($newest_backup)"
    wal_reached "$WAL" "$archive_max" ||
      die "WAL replay stopped at ${WAL:-the backup}; the archive goes on to $archive_max"
  else
    replayed_after="$(drill_sql -d postgres -v target="$TARGET" <<'SQL'
SELECT coalesce(pg_last_xact_replay_timestamp() > :'target'::timestamptz, false)
SQL
)"
    [ "$replayed_after" = f ] ||
      die "replayed a transaction committed at $LAST_XACT, after the target $TARGET"
  fi
  PASSED=1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then main "$@"; fi
