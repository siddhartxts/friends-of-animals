#!/usr/bin/env bash
# Link the FOA units in /srv/foa/docker/systemd into /etc/systemd/system and
# enable them. Idempotent. Units keep pointing at the checkout, so a
# `git pull` in /srv/foa updates them (run `systemctl daemon-reload` after).
#
# Usage: sudo install-systemd.sh
set -euo pipefail

UNIT_DIR="$(readlink -f "$(dirname "$(readlink -f "$0")")/../systemd")"

for f in "$UNIT_DIR"/*.service "$UNIT_DIR"/*.timer; do
  ln -sfn "$f" "/etc/systemd/system/$(basename "$f")"
done
systemctl daemon-reload

systemctl enable --now foa-docker-user-fw.service
systemctl enable --now \
  foa-cert-renew.timer \
  foa-pgbackrest-full.timer \
  foa-pgbackrest-diff.timer \
  foa-preview-sweep.timer \
  foa-restore-drill.timer

systemctl list-timers 'foa-*' --no-pager
