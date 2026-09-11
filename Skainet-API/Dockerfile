FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY .env .env
# Install PostgreSQL client for health check
RUN apk add --no-cache postgresql-client
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x ./entrypoint.sh
EXPOSE 8080
ENV NODE_ENV=production
ENV PORT=8080
CMD ["./entrypoint.sh", "node", "dist/main.js"]

