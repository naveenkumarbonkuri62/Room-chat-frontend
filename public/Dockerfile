# Stage 1: Build the Vite React app
FROM node:20-alpine AS build

WORKDIR /app

# Copy package.json and package-lock.json (if exists) for dependency install caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all source files
COPY . .

# Build production assets into /app/dist
RUN npm run build

# Stage 2: Serve the built assets with Nginx
FROM nginx:alpine

# Copy built files from Stage 1
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80 for HTTP traffic
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
