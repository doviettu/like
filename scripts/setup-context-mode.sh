#!/usr/bin/env bash
# Cài plugin context-mode (github.com/mksglu/context-mode) cho Claude Code ở phạm vi user.
# Dán nội dung này vào "Setup script" của môi trường cloud để mọi phiên mới đều có plugin,
# bất kể đang làm việc trên repo nào. Chạy lại nhiều lần vẫn an toàn.
set -u
command -v claude >/dev/null 2>&1 || { echo "context-mode: không tìm thấy claude CLI, bỏ qua"; exit 0; }
claude plugin marketplace add mksglu/context-mode >/dev/null 2>&1 || true
claude plugin install context-mode@context-mode --scope user || echo "context-mode: cài plugin thất bại"
exit 0
