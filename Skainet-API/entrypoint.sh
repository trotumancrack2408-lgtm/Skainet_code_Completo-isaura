#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is up - running migrations"

# Install production dependencies (if not already installed)
npm install --production

# Generate Prisma client
npx prisma generate

# Apply schema to database
npx prisma db push

# Run the passed command (start the app)
exec "$@"
