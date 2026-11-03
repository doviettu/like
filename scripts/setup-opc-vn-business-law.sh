#!/usr/bin/env bash
# Cài/cập nhật skill opc-vn-business-law (github.com/diginno-net/opc-vn-business-law).
#
# Hai cách dùng:
#   1) Phạm vi user (mọi repo, mọi phiên cloud): dán file này vào "Setup script" của môi trường
#      cloud, hoặc chạy: bash scripts/setup-opc-vn-business-law.sh
#      -> cài vào ~/.claude/skills/opc-vn-business-law
#   2) Đồng bộ bản vendored trong repo này với upstream:
#      bash scripts/setup-opc-vn-business-law.sh --vendor [REF]
#      -> ghi đè .claude/skills/opc-vn-business-law bằng gói runtime của REF (mặc định: main)
#
# Chỉ chép gói runtime (giống gói .skill upstream): SKILL.md, tài liệu, references/, assets/,
# scripts/so_sanh_thue.py. Không chép evals/tests. Chạy lại nhiều lần vẫn an toàn.
set -u
REPO_URL="https://github.com/diginno-net/opc-vn-business-law.git"
NAME="opc-vn-business-law"
MODE="user"
REF="main"
if [ "${1:-}" = "--vendor" ]; then
  MODE="vendor"
  REF="${2:-main}"
fi

if [ "$MODE" = "vendor" ]; then
  ROOT="$(cd "$(dirname "$0")/.." && pwd)"
  DEST="$ROOT/.claude/skills/$NAME"
else
  DEST="$HOME/.claude/skills/$NAME"
fi

command -v git >/dev/null 2>&1 || { echo "$NAME: không có git, bỏ qua"; exit 0; }
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

if ! git clone --quiet --depth 1 --branch "$REF" "$REPO_URL" "$TMP/src" 2>/dev/null; then
  echo "$NAME: không clone được $REPO_URL ($REF), giữ nguyên bản hiện có"
  exit 0
fi
SRC="$TMP/src"
[ -f "$SRC/SKILL.md" ] || { echo "$NAME: upstream thiếu SKILL.md, bỏ qua"; exit 0; }

STAGE="$TMP/stage"
mkdir -p "$STAGE/references" "$STAGE/assets" "$STAGE/scripts"
for f in SKILL.md README.md DISCLAIMER.md LICENSE CHANGELOG.md MAINTAINING.md PROMO.md; do
  [ -f "$SRC/$f" ] && cp "$SRC/$f" "$STAGE/"
done
cp "$SRC"/references/*.md "$STAGE/references/" 2>/dev/null || true
cp "$SRC"/assets/*.md "$STAGE/assets/" 2>/dev/null || true
[ -f "$SRC/scripts/so_sanh_thue.py" ] && cp "$SRC/scripts/so_sanh_thue.py" "$STAGE/scripts/"

COMMIT="$(git -C "$SRC" rev-parse HEAD)"
VERSION="$(sed -n 's/^  version: *//p' "$SRC/SKILL.md" | head -1)"
printf 'repo: %s\nref: %s\ncommit: %s\nversion: %s\n' \
  "$REPO_URL" "$REF" "$COMMIT" "${VERSION:-unknown}" > "$STAGE/UPSTREAM"

mkdir -p "$(dirname "$DEST")"
rm -rf "$DEST"
mv "$STAGE" "$DEST"
echo "$NAME: đã cài v${VERSION:-?} (${COMMIT:0:7}) vào $DEST"
exit 0
