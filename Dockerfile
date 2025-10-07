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

# Copiar solo lo necesario: node_modules de prod y dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/main.js"]
