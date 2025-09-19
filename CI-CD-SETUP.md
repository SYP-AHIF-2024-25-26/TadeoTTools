# CI/CD Pipeline Setup for TadeoTTools

This document provides an overview of the CI/CD pipeline implementation for automatic Docker image generation and deployment.

## Overview
A GitHub Actions workflow has been implemented to automatically build and push Docker images to GitHub Container Registry (ghcr.io) when code is pushed to the main branch.

## Architecture

### 3 Docker Images Built:
1. **Backend** (.NET 9.0 API)
   - Location: `backend/Dockerfile`
   - Registry: `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-backend`
   - Port: 5000

2. **Frontend** (Angular + Nginx)
   - Location: `frontend/Dockerfile`
   - Registry: `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-frontend`
   - Port: 80

3. **Dashboard** (Angular + Nginx)
   - Location: `dashboard/Dockerfile`
   - Registry: `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-dashboard`
   - Port: 80

## Files Created/Modified

### New Files:
- `.github/workflows/docker-build-push.yml` - Main CI/CD workflow
- `.github/workflows/README.md` - Workflow documentation
- `.github/TESTING.md` - Testing guide
- `backend/.dockerignore` - Excludes build artifacts
- `CI-CD-SETUP.md` - This overview document

### Modified Files:
- `docker-compose.yml` - Updated to use GitHub Container Registry images
- `backend/Dockerfile` - Fixed directory casing and port alignment

## Workflow Features

### Triggers:
- Push to `main` branch
- Manual workflow dispatch via GitHub UI

### Build Strategy:
- Matrix build for parallel image creation
- Docker Buildx for advanced features
- GitHub Actions cache for faster builds

### Tagging Strategy:
- `latest` tag for main branch builds
- `{branch}-{sha}` for commit traceability
- Branch-specific tags for feature branches

### Security:
- Uses GitHub's built-in `GITHUB_TOKEN`
- Minimal required permissions (contents: read, packages: write)
- Secure authentication with GitHub Container Registry

## Usage

### Automatic Deployment:
1. Push code to `main` branch
2. Workflow automatically triggers
3. All 3 images are built and pushed
4. Images are available at `ghcr.io/syp-ahif-2024-25-26/tadeottools/*`

### Manual Deployment:
1. Go to repository → Actions tab
2. Select "Build and Push Docker Images"
3. Click "Run workflow"
4. Select branch and run

### Local Development:
```bash
# Use the new images from GitHub Container Registry
docker compose pull
docker compose up -d

# Access services:
# - Frontend: http://localhost:4300
# - Dashboard: http://localhost:4200  
# - Backend: http://localhost:5001
# - MySQL: localhost:3306
```

## Benefits

1. **Automated Deployment**: No manual image building/pushing required
2. **Version Control**: Every commit gets a tagged image
3. **Consistency**: Same build environment for all developers
4. **Security**: Uses GitHub's secure authentication
5. **Parallel Builds**: All 3 images build simultaneously
6. **Caching**: Faster subsequent builds with GitHub Actions cache

## Next Steps

The CI/CD pipeline is now fully configured and ready to use. On the next push to `main`, all three Docker images will be automatically built and made available in the GitHub Container Registry.

For testing and validation, refer to `.github/TESTING.md`.