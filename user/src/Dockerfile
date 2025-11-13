
# --- STAGE 1: The "Builder" ---
# This stage builds your app
FROM node:20-alpine AS builder

# Set the working directory *inside* the container
WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# --- This is the key monorepo trick ---
# We copy the *root* files needed to install dependencies
# We go "up" one level (../) to find them
COPY ../pnpm-lock.yaml .
COPY ../pnpm-workspace.yaml .
COPY ../package.json .

# This command installs ALL dependencies for the *entire* monorepo
RUN pnpm install --frozen-lockfile

# Now, copy the *source code* for *this* service
# (We copy it into a folder named 'user-service' inside the container)
COPY . ./user-service/

# Change the work directory to our service
WORKDIR /app/user-service

# Build this service
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
COPY --from=builder /app/user-service/package.json ./user-service/

# Install *only* production dependencies (no dev tools)
RUN pnpm install --prod --filter user-service

# Copy your built code from the builder stage
COPY --from=builder /app/user-service/dist ./user-service/dist

# Change the work directory to our service
WORKDIR /app/user-service

# Expose the port
EXPOSE 3000

# The command to run your app
CMD ["node", "dist/main.js"]