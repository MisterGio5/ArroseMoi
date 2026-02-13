# Getting Started - Push to GitHub & Deploy

This guide helps you set up your GitHub repository and deploy ArroseMoi on Unraid.

## Step 1: Initialize Git and Push

```bash
cd /Users/giovanni/Documents/Application/ArroseMoi

# Check current state
git status

# Add all files
git add .
git commit -m "Initial commit: ArroseMoi application"
```

## Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `ArroseMoi`
   - **Description:** "Plant management and watering reminders application"
   - **Visibility:** Public (required for ghcr.io public access)
   - **Initialize:** Leave unchecked
3. Click **Create repository**

## Step 3: Connect and Push

```bash
git remote add origin https://github.com/MisterGio5/ArroseMoi.git
git branch -M main
git push -u origin main
```

If you get a permissions error, use a Personal Access Token:
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Create a token with `repo` and `write:packages` scopes
3. Use it as password when prompted

## Step 4: Verify GitHub Actions

1. Go to `https://github.com/MisterGio5/ArroseMoi/actions`
2. Wait for the workflow to complete (triggered automatically on push to `main`)
3. Once done, your Docker image is available at:
   ```
   ghcr.io/mistergio5/arrosemoi:latest
   ```

Check your packages at: `https://github.com/MisterGio5?tab=packages`

> **Note:** If the repository is private, go to the package settings and change visibility to public, or configure Unraid to authenticate with ghcr.io.

## Step 5: Deploy on Unraid

See the [README.md](./README.md#deployment-on-unraid) section "Deployment on Unraid" for 3 methods:
- **Method 1:** Add Container via Unraid UI
- **Method 2:** Unraid XML Template
- **Method 3:** Docker Compose via SSH

Or see the detailed guide: [UNRAID_DEPLOYMENT.md](./UNRAID_DEPLOYMENT.md)

## Development Workflow

### Make Changes

```bash
cd /Users/giovanni/Documents/Application/ArroseMoi

# Edit files, then:
git add .
git commit -m "Feature: description of change"
git push origin main

# GitHub Actions automatically:
# 1. Builds new Docker image
# 2. Pushes to ghcr.io/mistergio5/arrosemoi:latest
```

### Update on Unraid

```bash
# SSH to Unraid
ssh root@YOUR_UNRAID_IP

# If using Docker Compose:
cd /mnt/user/appdata/arrosemoi
docker compose pull
docker compose up -d

# If using Unraid UI:
# Docker tab > ArroseMoi > Force Update
```

## Project Structure

```
ArroseMoi/
├── .github/workflows/
│   └── docker-build.yml        # CI/CD: build & push to ghcr.io
├── src/                        # React frontend
├── server/                     # Node.js backend
├── unraid/
│   ├── arrosemoi.xml          # Unraid template
│   └── icon.svg               # Unraid icon
├── Dockerfile                  # Multi-stage build (single image)
├── docker-compose.yml          # Production deployment
├── .dockerignore
├── .gitignore
├── README.md                   # Main documentation
├── GETTING_STARTED.md          # This file
└── UNRAID_DEPLOYMENT.md        # Detailed Unraid guide
```

## Common Commands

```bash
# Git
git status
git log --oneline
git push origin main

# Docker on Unraid
docker logs arrosemoi
docker restart arrosemoi
docker compose pull && docker compose up -d

# Database backup
cp /mnt/user/appdata/arrosemoi/data/app.sqlite \
   /mnt/user/appdata/arrosemoi/data/app.sqlite.backup
```
