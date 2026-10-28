#!/bin/bash
# Double-click on macOS (or run in Terminal) to install and start the site.
cd "$(dirname "$0")" || exit 1
command -v node >/dev/null || { echo "Install Node.js LTS first: https://nodejs.org/"; read -r; exit 1; }
[ -f .env ] || cp .env.example .env
npm install && npm run db:generate && npx prisma migrate deploy && npm run db:seed || { echo "Setup failed. Copy the error above."; read -r; exit 1; }
(sleep 4; open http://localhost:3000) &
npm run dev
