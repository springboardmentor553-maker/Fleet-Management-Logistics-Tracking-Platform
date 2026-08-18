# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Accept build argument for backend API URL
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# Copy source code and build production assets
COPY . .
RUN npm run build

# Stage 2: Serve Production Assets with Nginx
FROM nginx:alpine

# Remove default Nginx site configuration
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
