FROM node:18-alpine

# Install netcat for Kafka health check
RUN apk add --no-cache netcat-openbsd

WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . .

EXPOSE 5000

# Health check for the application
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD nc -z localhost 5000 || exit 1

CMD ["npm", "start"] 