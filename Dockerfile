FROM node:24-alpine AS builder
ARG _ENV

WORKDIR /app

COPY package.json .
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD [ "node", "dist/main" ]