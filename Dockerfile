FROM node:alpine AS builder

WORKDIR /usr/src/template

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# Generate Prisma client first
RUN pnpm prisma generate

# Build the application (needs dev dependencies, so build before pruning)
RUN pnpm run build

# Now prune dev dependencies for smaller production image  
RUN pnpm prune --prod


FROM node:alpine AS production

WORKDIR /usr/src/app

# Copy only what's needed to run the application
COPY --from=builder /usr/src/template/node_modules ./node_modules
COPY --from=builder /usr/src/template/dist ./dist
COPY --from=builder /usr/src/template/generated ./generated
COPY --from=builder /usr/src/template/prisma ./prisma
COPY --from=builder /usr/src/template/package.json ./package.json
# Expose port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD 2222222222222222222222222222222 || exit 1

# Start the application
CMD ["node", "-r", "module-alias/register", "dist/index.js"]
