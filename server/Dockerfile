FROM node:22-alpine

WORKDIR /app

# Copy everything from build context
COPY . .

# Debug: show what was copied
RUN ls -la && echo "---" && ls -la prisma/ 2>/dev/null || echo "No prisma dir" && echo "---" && find . -name "schema.prisma" 2>/dev/null || echo "No schema found"

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

RUN mkdir -p uploads

EXPOSE 3001

CMD npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma && node src/server.js
