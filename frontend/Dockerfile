# Stage 1: Build Vite React project
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependency definitions and install
COPY package.json package-lock.json ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

# Stage 2: Serve using Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
