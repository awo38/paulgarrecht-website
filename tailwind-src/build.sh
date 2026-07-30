#!/usr/bin/env bash
# Recompiles vendor/tailwind/tailwind.css from index.html's classes.
# Requires: npx (installs tailwindcss@3.4.19 on first run if not cached).
set -euo pipefail
cd "$(dirname "$0")"
npx tailwindcss@3.4.19 -c ./tailwind.config.js -i ./input.css -o ../vendor/tailwind/tailwind.css --minify
