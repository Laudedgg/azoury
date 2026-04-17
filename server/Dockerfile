FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

# Copy only server files explicitly
COPY server/package*.json ./
RUN npm install

# Verify prisma installed
RUN ls node_modules/.bin/prisma

COPY server/prisma ./prisma
COPY server/src ./src

RUN ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
RUN mkdir -p uploads

EXPOSE 3001

CMD ./node_modules/.bin/prisma db push --accept-data-loss --schema=./prisma/schema.prisma && node prisma/seed.js && node src/server.js
