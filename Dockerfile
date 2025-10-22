# Base image
FROM oven/bun:1.2.13 AS base
WORKDIR /app

# Production dependencies
FROM base AS deps
COPY package.json .npmrc ./
RUN bun install --production

# Development dependencies for build
FROM deps AS build-deps
RUN bun install

# Image optimization
FROM dpokidov/imagemagick:latest AS image-optimizer
WORKDIR /app
COPY scripts/convert-images.sh ./scripts/
COPY public/images ./public/images
RUN chmod +x ./scripts/convert-images.sh && \
  bash ./scripts/convert-images.sh public/images

# Build the application
FROM build-deps AS builder
# Copy all source files
COPY . .
# Remove existing images directory
RUN rm -rf ./public/images
# Copy optimized images
COPY --from=image-optimizer /app/public/images ./public/images
# Build the application
RUN bun run build

# Final production image
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST="::"
ENV PORT=4321

# Copy runtime necessities
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
# Copy migrations source (Bun can run TypeScript directly)
COPY --from=builder /app/src/migrations ./src/migrations
# Copy entrypoint script
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

# Expose the port
EXPOSE 4321

# Start the application with migrations
ENTRYPOINT ["./scripts/entrypoint.sh"]