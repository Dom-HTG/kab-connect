# ------------ BUILD STAGE ------------ #

FROM node:22-alpine AS builder

WORKDIR /app

# Install all dependencies (including dev for build)
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Transpile TypeScript to JavaScript
RUN npm run build

# ------------ PRODUCTION STAGE ------------ #

FROM node:22-alpine AS production

WORKDIR /app

# Only copy production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy only the build output from builder
COPY --from=builder /app/dist ./dist

# Set production environment
ENV NODE_ENV=production

EXPOSE 8080

# Run the compiled app
CMD ["node", "dist/index.js"]
