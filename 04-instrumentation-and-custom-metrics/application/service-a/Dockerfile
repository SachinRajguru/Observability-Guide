# Node.js 24 is an LTS release line.
# We use an Alpine-based image to keep the runtime image relatively small.
FROM node:24-alpine

# All application files will live under /app.
WORKDIR /app

# Copy package manifests first.
# Docker can reuse this layer when application source code changes
# but dependencies remain unchanged.
COPY package*.json ./

# Install the exact dependency versions from package-lock.json.
# This is preferred for reproducible container builds.
RUN npm ci --omit=dev

# Copy application source code.
COPY index.js ./
COPY tracing.js ./

# Service A listens on port 3001.
EXPOSE 3001

# Start the Node.js application.
CMD ["node", "index.js"]