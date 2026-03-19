# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g corepack@latest && corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN rm -f tsconfig.build.tsbuildinfo && pnpm run build && ls -la dist/

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

RUN npm install -g corepack@latest && corepack enable pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist
RUN ls -la dist/

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]