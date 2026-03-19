# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar y habilitar pnpm
RUN npm install -g corepack@latest && corepack enable pnpm

# Instalar dependencias
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copiar el código y compilar
COPY . .
RUN pnpm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Instalar y habilitar pnpm en producción también
RUN npm install -g corepack@latest && corepack enable pnpm

# Instalar solo dependencias de producción
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

# Copiar código compilado (incluye assets como templates gracias a nest-cli.json)
COPY --from=builder /app/dist ./dist

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

ENV PORT=8080
EXPOSE 8080
CMD ["node", "dist/main.js"]
