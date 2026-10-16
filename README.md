# ShopSphere — DevOps E-commerce Practice Platform

A production-style learning project built with React, Node.js/Express, MySQL, Docker Compose and Nginx. It is intentionally organized so you can add CI/CD, cloud deployment, monitoring, Kubernetes and Terraform in stages.

## Features in this starter
- Product catalogue with category, price, stock and product image URL
- Search and category filtering
- Cart with quantity updates
- Checkout creates an order (demo checkout; no real payment processing)
- REST API with health endpoint
- MySQL schema and seed products
- Dockerfiles for frontend and backend
- Docker Compose for app + database + reverse proxy
- Nginx reverse proxy serving frontend and forwarding `/api/` to backend
- Environment-based configuration and persistent MySQL volume

## Architecture
Browser -> Nginx (port 8080) -> React static frontend
                              -> `/api/*` -> Express API -> MySQL

## Requirements
- Docker Engine + Docker Compose plugin
- Git (recommended)

## Run locally with Docker
1. Copy `.env.example` to `.env`.
2. Change `MYSQL_ROOT_PASSWORD` and `DB_PASSWORD` to your own local development values.
3. Start:
   ```bash
   docker compose up --build -d
   ```
4. Open http://localhost:8080
5. API health: http://localhost:8080/api/health
6. Logs:
   ```bash
   docker compose logs -f
   ```
7. Stop:
   ```bash
   docker compose down
   ```
   Keep database data:
   ```bash
   docker compose down
   ```
   Remove database data too (destructive):
   ```bash
   docker compose down -v
   ```

## Run without Docker (optional)
### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```
### Frontend
```bash
cd frontend
npm install
npm run dev
```
For Vite development, set `VITE_API_BASE_URL=http://localhost:5000/api` in `frontend/.env`.

## API endpoints
- `GET /api/health`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders` — demo checkout, validates items and calculates totals server-side
- `GET /api/orders/:id`

## DevOps learning roadmap
1. **Git**: branch strategy, commits, pull requests, tags.
2. **Docker**: build images, run containers, volumes, networks, health checks.
3. **CI**: GitHub Actions to lint/test/build on every push.
4. **CD**: deploy to an Ubuntu VM / AWS EC2 with SSH or a self-hosted runner.
5. **Reverse proxy + TLS**: Nginx and HTTPS using a domain + Let's Encrypt.
6. **Observability**: structured logs, Prometheus + Grafana, alerting.
7. **Security**: non-root containers, secrets management, dependency scanning, rate limits.
8. **Infrastructure as Code**: Terraform for network, security groups, VM and managed DB.
9. **Kubernetes**: Deployments, Services, ConfigMaps, Secrets, Ingress, probes, HPA.
10. **Backups & recovery**: MySQL dump automation and restore drills.

## Important scope notes
This is a learning starter, not yet a production-ready commerce system. Before real users or payments, add proper authentication/authorization, payment-provider integration, inventory reservation/transactions, migrations, audit logging, tests, rate limiting, HTTPS, backups and privacy/security review. Never commit `.env` or real secrets.
