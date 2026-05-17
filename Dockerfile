# syntax=docker/dockerfile:1

# ---- Build stage ----
FROM node:20-slim AS builder

# Install pnpm globally
RUN npm i -g pnpm

# Set working directory
WORKDIR /app

# Install dependencies (including devDependencies for Playwright)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the rest of the project files
COPY . .

# Install Playwright browsers and their system dependencies
RUN apt-get update && apt-get install -y wget ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libgbm1 libgtk-3-0 libnspr4 libnss3 libx11-6 libxcomposite1 libxdamage1 libxrandr2 && npx playwright install --with-deps

# ---- Runtime stage ----
# Use a lightweight image for running the tests
FROM node:20-slim AS runtime

# Install pnpm (required for pnpm commands)
RUN npm i -g pnpm

WORKDIR /app

# Copy only the built files from the builder stage
COPY --from=builder /app .

# Reinstall Playwright browsers for the runtime image (the cache is not copied automatically)
RUN npx playwright install --with-deps

# Set entrypoint to pnpm so any script can be run via Docker command
ENTRYPOINT ["pnpm"]
# Default command runs the test suite
CMD ["test"]
