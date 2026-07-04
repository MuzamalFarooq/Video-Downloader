# ── Stage 1: Install dependencies & build ──────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Next.js app
RUN npm run build

# ── Stage 2: Production image ───────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install ffmpeg and yt-dlp system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    curl \
    ca-certificates

# Install yt-dlp as a system binary (Linux x86_64)
RUN curl -L "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp" \
    -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp \
    && yt-dlp --version

WORKDIR /app

# Copy built app from builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/app ./app
COPY --from=builder /app/services ./services
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/models ./models
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/components ./components
COPY --from=builder /app/data ./data

# Create writable directories
RUN mkdir -p /tmp/downloads /app/bin

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
# Tell ytDlpService.js to use the system yt-dlp binary
ENV YTDLP_PATH=/usr/local/bin/yt-dlp
# Store downloads in /tmp (always writable in Docker/Render)
ENV DOWNLOADS_DIR=/tmp/downloads

EXPOSE 3000

CMD ["npm", "start"]
