# Testing the CI/CD Pipeline

This document outlines how to test the Docker CI/CD pipeline.

## Automatic Testing
The pipeline will automatically trigger when:
1. Code is pushed to the `main` branch
2. A pull request is merged into `main`

## Manual Testing
You can manually trigger the workflow by:
1. Going to the GitHub repository
2. Navigate to Actions tab
3. Select "Build and Push Docker Images" workflow
4. Click "Run workflow" button
5. Select the branch (usually `main`)
6. Click "Run workflow"

## Expected Behavior

### During the workflow:
1. **Checkout repository** - Downloads the code
2. **Set up Docker Buildx** - Prepares Docker build environment
3. **Log in to Container Registry** - Authenticates with GitHub Container Registry
4. **Extract metadata** - Generates appropriate tags and labels
5. **Build and push Docker image** - Builds and pushes each of the 3 images:
   - `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-backend:latest`
   - `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-frontend:latest`
   - `ghcr.io/syp-ahif-2024-25-26/tadeottools/tadeot-dashboard:latest`

### After successful completion:
1. Images will be available in GitHub Container Registry
2. You can pull and run them using the updated `docker-compose.yml`
3. Images will be tagged with both `latest` and the commit SHA

## Verification Steps

### 1. Check GitHub Packages
- Go to the repository main page
- Click on "Packages" in the right sidebar
- You should see 3 packages: tadeot-backend, tadeot-frontend, tadeot-dashboard

### 2. Test with Docker Compose
```bash
# Pull the latest images and run
docker compose pull
docker compose up -d
```

### 3. Verify Images
```bash
# List the pulled images
docker images | grep ghcr.io/syp-ahif-2024-25-26

# Check running containers
docker compose ps
```

## Troubleshooting

### Common Issues:
1. **Permission denied**: Ensure the repository has write access to packages
2. **Build failures**: Check Dockerfile syntax and build context
3. **Registry authentication**: Verify GITHUB_TOKEN permissions

### Debug Steps:
1. Check the Actions tab for detailed logs
2. Verify Dockerfiles can build locally
3. Check .dockerignore files aren't excluding necessary files
4. Ensure all required files exist in their respective directories