# ============================================================
# BUILD STAGE
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY . .

# Build React application
RUN npm run build


# ============================================================
# PRODUCTION STAGE
# ============================================================

FROM nginx:alpine

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy React build
COPY --from=build /app/dist /usr/share/nginx/html

# Expose nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]