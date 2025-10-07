# Etapa de build
FROM node:20 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY src ./src

RUN npm run build

# Etapa final (runtime)
FROM node:20-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder /app/package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["npm", "start"]




