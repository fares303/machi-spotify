#!/bin/bash
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${CYAN}🎵  Machi Spotify 🇩🇿${NC}"
echo ""

command -v node &>/dev/null || { echo "❌ Node.js required — https://nodejs.org"; exit 1; }
echo -e "${GREEN}✓ Node $(node -v)${NC}"

# Setup backend .env
[ -f "backend/.env" ] || { cp backend/.env.example backend/.env; echo -e "${YELLOW}📝 Created backend/.env${NC}"; }

# Install frontend deps
[ -d "node_modules" ] || { echo -e "${CYAN}Installing frontend deps...${NC}"; npm install; }

# Install backend deps
[ -d "backend/node_modules" ] || { echo -e "${CYAN}Installing backend deps...${NC}"; (cd backend && npm install); }

echo ""
echo -e "${GREEN}Starting Machi Spotify...${NC}"
echo -e "  Frontend → ${CYAN}http://localhost:5173${NC}"
echo -e "  Backend  → ${CYAN}http://localhost:3001${NC}"
echo -e "\nPress ${YELLOW}Ctrl+C${NC} to stop"
echo ""

# Start backend in background
(cd backend && node server.js) &
BACK=$!

# Start frontend
npm run dev &
FRONT=$!

# Kill both on exit
trap "kill $BACK $FRONT 2>/dev/null; exit" INT TERM
wait
