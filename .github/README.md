# GitHub Actions Workflows

This directory contains the CI/CD workflows for the TadeoTTools project.

## Workflows

### Component-Specific CI Workflows

- **`backend-ci.yml`**: Builds and tests the .NET backend, including unit tests with MySQL database
- **`dashboard-ci.yml`**: Builds and tests the Angular admin dashboard
- **`frontend-ci.yml`**: Builds, tests, and lints the Angular user frontend (PWA)

### Integration & Deployment

- **`deployment-test.yml`**: Tests the full Docker Compose deployment stack
- **`main-ci.yml`**: Orchestrates all workflows based on changed paths

## Triggers

- **Path-based**: Each workflow only runs when relevant files are changed
- **PR and Push**: All workflows run on pull requests and pushes to main branches
- **Manual**: Workflows can be manually triggered from the Actions tab

## Features

- ✅ Multi-component build system
- ✅ Database integration testing (MySQL)
- ✅ Docker containerization testing
- ✅ Angular build optimization (font inlining disabled for CI)
- ✅ Flexible package manager support (npm ci fallback to npm install)
- ✅ Path-based change detection for efficient CI runs

## Status

![Backend CI](https://github.com/SYP-AHIF-2024-25-26/TadeoTTools/workflows/Backend%20CI/badge.svg)
![Dashboard CI](https://github.com/SYP-AHIF-2024-25-26/TadeoTTools/workflows/Dashboard%20CI/badge.svg)
![Frontend CI](https://github.com/SYP-AHIF-2024-25-26/TadeoTTools/workflows/Frontend%20CI/badge.svg)
![Deployment Test](https://github.com/SYP-AHIF-2024-25-26/TadeoTTools/workflows/Deployment%20Test/badge.svg)