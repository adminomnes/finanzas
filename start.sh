#!/bin/sh

# Push database schema (runs migrations if needed)
echo "Running Prisma DB Push..."
npx prisma db push

# Start the Next.js standalone server
echo "Starting Next.js..."
node server.js
