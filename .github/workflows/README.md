# CI/CD Pipeline

This directory contains GitHub Actions workflows for the TadeoTTools project.

## Docker Build and Push Workflow

The `docker-build-push.yml` workflow automatically builds and pushes Docker images to GitHub Container Registry (ghcr.io) when code is pushed to the main branch.

### What it does:
- Builds 3 Docker images: backend, frontend, and dashboard
- Pushes images to `ghcr.io/syp-ahif-2024-25-26/tadeottools/`
- Tags images with:
  - `latest` (for main branch)
  - Git commit SHA (for traceability)
  - Branch name

### Triggered by:
- Push to `main` branch
- Manual workflow dispatch

### Images produced:
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-backend:latest`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-frontend:latest`
- `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-dashboard:latest`

### Prerequisites:
- Repository must have write access to GitHub Packages
- Workflows use `GITHUB_TOKEN` which is automatically provided by GitHub Actions

### Usage:
The updated `docker-compose.yml` file now references these GitHub Container Registry images instead of the previous Docker Hub images.