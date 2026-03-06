FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY prisma ./prisma/

# Install all deps (including devDeps needed for build)
ENV NODE_ENV=development
RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build
RUN echo "=== DIST CONTENTS ===" && ls -la /app/dist/ 2>&1 || echo "=== DIST NOT FOUND ==="
RUN echo "=== APP ROOT ===" && ls -la /app/ 2>&1

ENV NODE_ENV=production
EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --skip-generate --accept-data-loss 2>&1 && npx ts-node --transpile-only prisma/seed.ts 2>&1 && echo '=== STARTING ===' && node dist/main 2>&1; echo '=== EXIT '$?' ==='; tail -f /dev/null"]
