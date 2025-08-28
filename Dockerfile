# Multi-stage Docker build for MCP Hello World server

# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Set working directory
WORKDIR /app

# Copy package.json for version info
COPY --from=builder /app/package.json ./

# Copy built application
COPY --from=builder /app/dist ./dist/
COPY --from=builder /app/node_modules ./node_modules/

# Set ownership to non-root user
RUN chown -R mcp:nodejs /app
USER mcp

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:8080/healthz').then(r => r.ok ? process.exit(0) : process.exit(1))" || exit 1

# Start the application
CMD ["node", "dist/index.js"]

# Labels for metadata
LABEL \
  org.opencontainers.image.title="MCP Hello World" \
  org.opencontainers.image.description="A minimal MCP server that responds with Hello, World via Streamable HTTP" \
  org.opencontainers.image.version="0.1.0" \
  org.opencontainers.image.vendor="MCP Protocol" \
  org.opencontainers.image.licenses="Apache-2.0" \
  org.opencontainers.image.source="https://github.com/mcp-protocol/hello-world"