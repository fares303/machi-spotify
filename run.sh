#!/bin/bash
set -e
GREEN='\033[0;32m'; CYAN='\033[0;36m'; NC='\033[0m'

echo -e "${CYAN}🎵 Machi Spotify${NC}"

command -v node &>/dev/null || { echo "Node.js required: https://nodejs.org"; exit 1; }

[ -f "backend/.env" ] || cp backend/.env.example backend/.env

[ -d "node_modules" ] || npm install
[ -d "backend/node_modules" ] || (cd backend && npm install)

echo -e "${GREEN}Starting...${NC}"
echo -e "  Frontend → ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend  → ${CYAN}http://localhost:3001${NC}"
echo ""

(cd backend && node server.js) &
BACK=$!
npm run dev &
FRONT=$!
trap "kill $BACK $FRONT 2>/dev/null" INT TERM
wait
