#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting ProsumeAI server for public testing...${NC}"

# Start the server in background
echo -e "${YELLOW}Starting local server...${NC}"
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo -e "${YELLOW}Waiting for server to start...${NC}"
sleep 5

# Start ngrok
echo -e "${GREEN}Starting ngrok tunnel to expose server...${NC}"
echo -e "${YELLOW}This will create a temporary public URL for your app${NC}"
ngrok http 3000

# When ngrok is closed, kill the server
echo -e "${YELLOW}Shutting down server...${NC}"
kill $SERVER_PID

echo -e "${GREEN}Done!${NC}" 