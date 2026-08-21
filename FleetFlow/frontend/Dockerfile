# ================================
# Stage 1: Build React application
# ================================

FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend/ ./

RUN npm run build


# ================================
# Stage 2: Serve with Nginx
# ================================

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]