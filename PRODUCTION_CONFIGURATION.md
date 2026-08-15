# PRODUCTION CONFIGURATION GUIDE

This document outlines the standard production infrastructure requirements and deployment strategies for FleetFlow.

## 1. Environment Configuration

### Frontend
The frontend requires two environment variables built into its static bundle. You should populate `frontend/.env.production` before running the build step or passing arguments to Docker.

- `VITE_API_URL`: The public-facing HTTPS URL for the backend API (e.g., `https://api.fleetflow.com`).
- `VITE_WS_URL`: The public-facing secure WebSocket URL (e.g., `wss://api.fleetflow.com`).

### Backend
The backend utilizes `.env.production` heavily for secrets and infrastructure binding.

#### Security & Secrets
- `SECRET_KEY`: Must be a long, randomly generated cryptographic string (e.g., via `openssl rand -hex 32`). **NEVER** use the default development key.
- `ALGORITHM`: Set to `HS256` by default.
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Typically 60 or tailored to your security requirements.

#### CORS Settings
- `ALLOWED_ORIGINS`: A strict, comma-separated list of origins that can access the API. In production, do NOT use `*` or include `localhost`. 
  - **Example**: `ALLOWED_ORIGINS=https://fleetflow.example.com,https://admin.fleetflow.example.com`

#### Database & Infrastructure
- `DATABASE_URL`: Connection string to a production-grade managed PostgreSQL instance.
- `REDIS_HOST` & `REDIS_PORT`: The internal host/port of your Redis cluster used for Celery.
- `CELERY_BROKER_URL` & `CELERY_RESULT_BACKEND`: Full Redis URIs.

## 2. Infrastructure Best Practices

### Reverse Proxy & SSL/TLS
- Never expose the `uvicorn` (FastAPI) or `nginx` (React) containers directly to the open internet without an SSL termination layer.
- Use a reverse proxy such as **Nginx**, **Traefik**, or a Cloud Load Balancer (AWS ALB, GCP HTTPS Load Balancer) to terminate SSL/TLS.

### Database Security
- The PostgreSQL database should be completely isolated in a private subnet.
- Only the Backend and Celery Worker containers should have network access to the database.

### Background Tasks (Celery & Redis)
- Deploy a dedicated container running the Celery worker.
- Ensure the Redis instance is also in a private subnet, inaccessible from the public internet, and secured with a password (`requirepass`).

## 3. Recommended Deployment Architecture (Cloud)

1. **VPC Setup**: Create a VPC with public and private subnets.
2. **Frontend Storage**: Consider hosting the built frontend static assets on a CDN (like AWS CloudFront + S3, Vercel, or Cloudflare Pages) instead of a container for better global latency.
3. **Backend Container**: Deploy the `fleet-management-backend` image to a managed container service (AWS ECS/Fargate, GCP Cloud Run, or Kubernetes).
4. **Database**: Use a managed relational database service (AWS RDS, GCP Cloud SQL) for automated backups, high availability, and easy scaling.
5. **Caching/Queue**: Use a managed Redis service (AWS ElastiCache, GCP Memorystore) for Celery.
