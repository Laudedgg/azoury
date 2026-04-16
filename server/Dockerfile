FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN ls -la prisma/
RUN npx prisma generate --schema=./prisma/schema.prisma

RUN mkdir -p uploads

EXPOSE 3001

CMD npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && node src/server.js
