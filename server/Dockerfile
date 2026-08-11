FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm install --no-audit --no-fund

COPY prisma ./prisma
COPY src ./src

RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
RUN mkdir -p /tmp/uploads

EXPOSE 3001

CMD ["node", "src/server.js"]
