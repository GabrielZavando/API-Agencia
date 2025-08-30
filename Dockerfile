# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Instalar dependencias (instala devDeps para build)
COPY package.json package-lock.json ./
RUN npm ci

# Copiar el código y compilar
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Copiar módulos de producción desde builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Copiar assets necesarios en runtime (templates y public)
COPY --from=builder /app/src/templates ./src/templates
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["node", "dist/main.js"]
