FROM node:24-alpine AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* bun.lock* ./
RUN npm install

FROM base AS builder
RUN apk add --no-cache libc6-compat
ARG JWT_SECRET=build-time-jwt-secret-32-chars-min!!
ARG ENCRYPTION_KEY=build-time-encryption-key-32ch!!
ENV NODE_ENV=production
ENV NEXT_FONT_GOOGLE_DISABLE=1
ENV JWT_SECRET=$JWT_SECRET
ENV ENCRYPTION_KEY=$ENCRYPTION_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npm", "start"]
