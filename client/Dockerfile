FROM node:22-alpine AS build

WORKDIR /app

# Copy root workspace manifests and install all workspace dependencies
COPY package*.json ./
COPY client/package.json ./client/
RUN npm ci

# Copy the client source
COPY client/ ./client/

WORKDIR /app/client

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY --from=build /app/client/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
