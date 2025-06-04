# Use Node.js 18 on Debian Bullseye (force x86_64 platform for Puppeteer compatibility)
FROM --platform=linux/amd64 node:18-bullseye-slim

# Install dependencies for Chrome and Puppeteer
RUN apt-get update && apt-get install -y \
    # Dependencies for native packages
    python3 \
    make \
    g++ \
    # Chrome dependencies and tools
    wget \
    gnupg \
    ca-certificates \
    apt-transport-https \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    # Additional fonts for better PDF rendering
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

# Change ownership of node_modules and switch to pptruser for Chrome installation
RUN chown -R pptruser:pptruser /app
USER pptruser

# Install Chrome through Puppeteer as the correct user
RUN npx puppeteer browsers install chrome

# Switch back to root for final setup
USER root

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

USER pptruser

EXPOSE 3000

# Run the development server using tsx directly
CMD ["npm", "run", "dev:server"] 