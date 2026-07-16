FROM node:24-alpine AS builder
ARG _ENV
WORKDIR /app

COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .
RUN if [ $_ENV != "production" ] ; then cp .env.$_ENV .env.production ; fi
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]