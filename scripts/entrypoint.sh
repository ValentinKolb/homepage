#!/bin/bash

echo "Starting homepage setup..."

# Run migrations
echo "Running database migrations..."
bun run ./src/migrations/index.ts

if [ $? -ne 0 ]; then
    echo "Migration failed! Exiting..."
    exit 1
fi

echo "Migrations completed successfully"

# Start the server
echo "Starting Astro server..."
exec bun run ./dist/server/entry.mjs