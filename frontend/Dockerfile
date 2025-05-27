# Stage 1: Build Angular App
FROM node:20 AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

COPY . .

# Build with specified base href
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy built files
COPY --from=build /app/dist/tadeo-t/browser /usr/share/nginx/html/app

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf