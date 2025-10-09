# Etapa de build
FROM node:20-slim AS builder

WORKDIR /app

# Copiar package.json, package-lock.json y tsconfig.json primero (caching de dependencias)
COPY package*.json tsconfig.json ./

RUN npm ci

# Copiar el resto del código fuente
COPY src ./src

# Compilar TypeScript
RUN npm run build

# Etapa final (runtime)
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --omit=dev

# Copiar el código compilado desde builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]