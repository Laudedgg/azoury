FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npx prisma generate

RUN mkdir -p uploads

EXPOSE 3001

CMD npx prisma db push --accept-data-loss && node src/server.js
