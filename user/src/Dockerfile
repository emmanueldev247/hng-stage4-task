# This file lives at: user/src/Dockerfile

# --- STAGE 1: The "Builder" ---
# This stage builds your app
FROM node:20-alpine AS builder

# Set the working directory *inside* the container
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# --- Monorepo trick ---
# We copy the *root* files needed to install dependencies
# We go "up" two levels (../../) to find them
COPY ../../pnpm-lock.yaml .
COPY ../../pnpm-workspace.yaml .
COPY ../../package.json .

# Install ALL dependencies for the *entire* monorepo
RUN pnpm install --frozen-lockfile

# --- This is the NEW part ---
# Now, copy the *source code* for *this* service
# The 'Dockerfile' is in 'src', so we go up one level
# and copy the *whole* 'user' folder
COPY .. ./user/

# Change the work directory to our service
WORKDIR /app/user

# Build this service (it will read tsconfig.json and build)
RUN pnpm build

# --- STAGE 2: The "Runner" ---
# This stage runs your app in production
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# Copy only the files needed for a *production* install
COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/pnpm-workspace.yaml .

# Copy this service's package.json
COPY --from=builder /app/user/package.json ./user/

# Install *only* production dependencies
RUN pnpm install --prod --filter user

# Copy your built code from the builder stage
# The built code is at /app/user/dist
COPY --from=builder /app/user/dist ./user/dist

# Change the work directory to our service
WORKDIR /app/user

# Expose the port your app runs on
EXPOSE 3000

# The command to run your app
CMD ["node", "dist/main.js"]