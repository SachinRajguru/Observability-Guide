# Node.js 24 LTS runtime.
FROM node:24-alpine

# Application working directory.
WORKDIR /app

# Copy dependency manifests first.
COPY package*.json ./

# Install dependencies from package-lock.json.
RUN npm ci --omit=dev

# Copy application source.
COPY index.js ./
COPY tracing.js ./

# Service B listens on port 3002.
EXPOSE 3002

# Start the application.
CMD ["node", "index.js"]