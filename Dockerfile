# ============================================
# Stage 1: Build the React frontend
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy frontend source
COPY src/ ./src/
COPY public/ ./public/
COPY index.html vite.config.js tailwind.config.js postcss.config.js eslint.config.js ./
COPY .env.production ./.env.production

# Build React app (uses .env.production for VITE_API_URL=/api)
RUN npm run build

# ============================================
# Stage 2: Production image (backend + static)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -S arrosemoi && adduser -S arrosemoi -G arrosemoi

# Install backend dependencies only
COPY server/package.json server/package-lock.json* ./
RUN npm ci --omit=dev 2>/dev/null || npm install --omit=dev
RUN npm cache clean --force

# Copy backend source
COPY server/src/ ./src/

# Copy built React frontend from builder stage
COPY --from=builder /app/dist ./public

# Create data directory for SQLite
RUN mkdir -p /data && chown -R arrosemoi:arrosemoi /data /app

# Environment defaults
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_PATH=/data/app.sqlite

# Expose port (configurable at runtime via PORT env variable)
EXPOSE ${PORT}

# Volume for persistent SQLite data
VOLUME ["/data"]

# Switch to non-root user
USER arrosemoi

# Start with dumb-init for proper PID 1 behavior
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/index.js"]
