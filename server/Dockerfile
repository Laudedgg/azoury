FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

# Run migrations then start
CMD npx prisma db push --accept-data-loss && node src/server.js
