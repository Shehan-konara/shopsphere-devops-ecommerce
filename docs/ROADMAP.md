# ShopSphere DevOps roadmap

## Phase 1 — Application
- [x] Product catalogue, search/category filters
- [x] Shopping cart
- [x] Demo order creation and stock decrement in a DB transaction
- [x] Health endpoint
- [ ] Authentication, roles and admin product management
- [ ] Unit and integration tests
- [ ] Payment provider sandbox integration

## Phase 2 — Containerization
- [x] Frontend Dockerfile (multi-stage)
- [x] Backend Dockerfile (non-root runtime)
- [x] Compose network, persistent DB volume, health checks
- [x] Nginx reverse proxy
- [ ] Image tags and vulnerability scanning
- [ ] Run as read-only where practical; drop Linux capabilities

## Phase 3 — CI/CD
- [x] Basic GitHub Actions build workflow
- [ ] Add automated tests and coverage
- [ ] Build and push images to GHCR
- [ ] Deploy to EC2 on successful main branch build
- [ ] Rollback strategy and release tags

## Phase 4 — Cloud
- [ ] AWS VPC and security groups
- [ ] EC2 or ECS deployment
- [ ] Managed database, private subnet, secret storage
- [ ] Domain, HTTPS and backups
- [ ] Terraform modules and remote state

## Phase 5 — Operations
- [ ] Structured JSON logs
- [ ] Prometheus + Grafana metrics
- [ ] Alerts and uptime checks
- [ ] Load testing and capacity planning
- [ ] Restore a backup and document recovery time

## Phase 6 — Kubernetes
- [ ] Deployments and Services for web/API
- [ ] ConfigMaps and Secrets
- [ ] Readiness/liveness probes
- [ ] Ingress + TLS
- [ ] Resource requests/limits and HPA
