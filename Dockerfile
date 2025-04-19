# Use Puppeteer’s official image with Chromium pre-installed
FROM ghcr.io/puppeteer/puppeteer:latest

# Set working directory
WORKDIR /app

# Copy package files with ownership fix
COPY --chown=pptruser:pptruser package*.json ./
COPY --chown=pptruser:pptruser .env ./


# Install dependencies
RUN npm install

# Copy the rest of the app with correct ownership
COPY --chown=pptruser:pptruser . .

# Expose the port Express is running on
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
