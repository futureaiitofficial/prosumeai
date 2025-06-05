# Use Node.js 18 on Debian Bullseye (force x86_64 platform for Puppeteer compatibility)
FROM --platform=linux/amd64 node:18-bullseye-slim AS base

# We don't need the standalone Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Install Google Chrome Stable and fonts
# Note: this installs the necessary libs to make the browser work with Puppeteer.
RUN apt-get update && apt-get install curl gnupg -y \
  && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install google-chrome-stable -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies for native packages and additional fonts
RUN apt-get update && apt-get install -y \
    # Dependencies for native packages
    python3 \
    make \
    g++ \
    # Additional fonts for better PDF rendering
    fonts-liberation \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    # Clean up
    && rm -rf /var/lib/apt/lists/*

# Create user first
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads \
    && chown -R pptruser:pptruser /home/pptruser

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY theme.json ./

# Install dependencies first (as root to access npm global installs)
RUN npm ci --include=dev

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/
COPY public/ ./public/

# Copy configuration files
COPY drizzle.config.ts ./

# Create logs directory
RUN mkdir -p logs

# Set proper permissions
RUN chown -R pptruser:pptruser /app

# Development stage
FROM base AS development
USER pptruser
EXPOSE 3000
# Run the development server using tsx directly
CMD ["npm", "run", "dev:server"]

# Production stage  
FROM base AS production

# Build the application as root first (needed for write permissions)
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm ci --only=production && npm cache clean --force

# Set proper permissions and switch to pptruser for running the app
RUN chown -R pptruser:pptruser /app
USER pptruser

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start production server
CMD ["npm", "run", "start:prod"] 