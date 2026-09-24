#!/bin/sh
set -e

# Wait for PostgreSQL to be ready
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "PostgreSQL is up - running migrations"

# Generate Prisma client
./node_modules/.bin/prisma generate

# Apply schema to database
./node_modules/.bin/prisma db push

# Run the passed command (start the app)
exec "$@"
