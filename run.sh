#!/bin/bash
set -e
GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${CYAN}"
echo "  ███╗   ███╗ █████╗  ██████╗██╗  ██╗██╗"
echo "  ████╗ ████║██╔══██╗██╔════╝██║  ██║██║"
echo "  ██╔████╔██║███████║██║     ███████║██║"
echo "  ██║╚██╔╝██║██╔══██║██║     ██╔══██║██║"
echo "  ██║ ╚═╝ ██║██║  ██║╚██████╗██║  ██║██║"
echo "  ╚═╝     ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝"
echo "         Spotify  🇩🇿  Algeria"
echo -e "${NC}"

command -v node &>/dev/null || { echo "❌ Node.js required — https://nodejs.org"; exit 1; }
echo -e "${GREEN}✓ Node $(node -v)${NC}"

# Copy .env if not exists
[ -f ".env" ] || { cp .env.example .env; echo -e "${YELLOW}📝 Created .env — add API keys for better results${NC}"; }

# Install dependencies
if [ ! -d "node_modules" ]; then
  echo -e "\n${CYAN}Installing dependencies...${NC}"
  npm install
fi

echo -e "\n${GREEN}Choose mode:${NC}"
echo "  1) Production  — build React then serve everything on port 3000"
echo "  2) Development — live React (5173) + API server (3000)"
echo ""
read -p "Enter 1 or 2 [default: 1]: " MODE
MODE=${MODE:-1}

if [ "$MODE" = "2" ]; then
  echo -e "\n${GREEN}Starting DEV mode...${NC}"
  echo -e "  Frontend → ${CYAN}http://localhost:5173${NC}"
  echo -e "  API      → ${CYAN}http://localhost:3000/api${NC}"
  echo -e "\nPress ${YELLOW}Ctrl+C${NC} to stop\n"
  npm run dev
else
  echo -e "\n${CYAN}Building React app...${NC}"
  npm run build
  echo -e "\n${GREEN}Starting production server...${NC}"
  echo -e "  App → ${CYAN}http://localhost:3000${NC}"
  echo -e "\nPress ${YELLOW}Ctrl+C${NC} to stop\n"
  npm start
fi
