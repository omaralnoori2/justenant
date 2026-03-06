FROM node:20-alpine AS builder
WORKDIR /app

# Force dev deps regardless of NODE_ENV injected by CI/CD
ENV NODE_ENV=development

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

# ─── Production image ────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma/

EXPOSE 3001

# Apply schema then start; on crash keep container alive for log inspection
CMD ["sh", "-c", "echo '=== DB PUSH ===' && npx prisma db push --skip-generate --accept-data-loss 2>&1 && echo '=== STARTING NODE ===' && node dist/main 2>&1; echo '=== NODE EXITED WITH '$?' ==='; tail -f /dev/null"]
