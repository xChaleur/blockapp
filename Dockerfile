# Multi-stage build for React app + Node backend
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Production stage with Node.js backend + Nginx
FROM node:18-alpine

WORKDIR /app

# Install nginx
RUN apk add --no-cache nginx

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built React app from build stage
COPY --from=build /app/dist ./dist

# Copy server.js and nginx config
COPY server.js .
COPY nginx.conf /etc/nginx/nginx.conf

# Expose ports
EXPOSE 80 5000

# Start both nginx and Node.js server
CMD ["sh", "-c", "nginx -g 'daemon off;' & node server.js"]
