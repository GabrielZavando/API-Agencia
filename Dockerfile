# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Actualizar npm a la versión más reciente
RUN npm install -g npm@11.5.2

# Instalar dependencias (instala devDeps para build)
COPY package.json package-lock.json ./
RUN npm ci --force

# Copiar el código y compilar
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Actualizar npm en producción también
RUN npm install -g npm@11.5.2

# Instalar solo dependencias de producción
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --force && npm cache clean --force

# Copiar código compilado
COPY --from=builder /app/dist ./dist

# Copiar solo assets necesarios en runtime (templates y public)
COPY --from=builder /app/src/templates ./dist/templates
COPY --from=builder /app/public ./public

# Copiar archivos de configuración
COPY --from=builder /app/config ./config

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001
USER nestjs

EXPOSE 8080
CMD ["node", "dist/main.js"]
