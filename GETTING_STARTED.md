# 🚀 Getting Started - Push to GitHub

This guide helps you set up your GitHub repository and deploy on Unraid.

## Step 1: Prepare Your Code

### Update docker-compose.yml

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username:

```bash
# Replace in docker-compose.yml
sed -i '' 's/YOUR_GITHUB_USERNAME/your-actual-username/g' docker-compose.yml

# Or manually edit and replace these placeholders:
# - ghcr.io/YOUR_GITHUB_USERNAME/arrosemoi/backend:latest
# - ghcr.io/YOUR_GITHUB_USERNAME/arrosemoi/frontend:latest
# - https://raw.githubusercontent.com/YOUR_GITHUB_USERNAME/arrosemoi/...
```

### Update unraid/arrosemoi.xml

Replace `YOUR_GITHUB_USERNAME` in the template:

```bash
sed -i '' 's/YOUR_GITHUB_USERNAME/your-actual-username/g' unraid/arrosemoi.xml
```

## Step 2: Initialize Git (if not already)

```bash
cd /Users/giovanni/Documents/Vscode/Test\ application/Application\ JS/arrosemoi-app

# Check if Git is initialized
git status

# If not initialized, do this:
git init
git add .
git commit -m "Initial commit: ArroseMoi application"
```

## Step 3: Create GitHub Repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name:** `arrosemoi`
   - **Description:** "🌱 Plant management and watering reminders application"
   - **Visibility:** Public (required for GitHub Container Registry)
   - **Initialize:** Leave unchecked
3. Click **Create repository**

## Step 4: Connect and Push

Copy the commands from GitHub (they'll look like):

```bash
git remote add origin https://github.com/YOUR_USERNAME/arrosemoi.git
git branch -M main
git push -u origin main
```

If you get a permissions error, use a Personal Access Token:

1. Go to GitHub > Settings > Developer settings > Personal access tokens
2. Create a new token with `repo` and `write:packages` scopes
3. Use it as password when GitBash prompts

## Step 5: Enable GitHub Container Registry

By default, your images will be pushed to `ghcr.io`.

**First push:**
```bash
# GitHub Actions will automatically build and push images
# Just wait for the workflow to complete
```

Check at: `https://github.com/YOUR_USERNAME/arrosemoi/actions`

Once images are pushed, verify at:
```
https://ghcr.io/v2/YOUR_USERNAME/arrosemoi/tags/list
```

## Step 6: Deploy on Unraid

Follow the [UNRAID_DEPLOYMENT.md](./UNRAID_DEPLOYMENT.md) guide:

```bash
# SSH to Unraid
ssh root@YOUR_UNRAID_IP

# Create app directory
mkdir -p /mnt/user/appdata/arrosemoi/data
cd /mnt/user/appdata/arrosemoi

# Download docker-compose.yml
wget https://raw.githubusercontent.com/YOUR_USERNAME/arrosemoi/main/docker-compose.yml

# Create .env file (see UNRAID_DEPLOYMENT.md for details)
cat > .env << EOF
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=http://YOUR_UNRAID_IP
VITE_API_URL=http://YOUR_UNRAID_IP:3001/api
DATA_PATH=/mnt/user/appdata/arrosemoi/data
ICON_URL=https://raw.githubusercontent.com/YOUR_USERNAME/arrosemoi/main/public/logo.png
EOF

# Start
docker compose pull
docker compose up -d

# Access at http://YOUR_UNRAID_IP
```

## What's Deployed

✅ **GitHub Repository:** Your code with Git history  
✅ **GitHub Actions:** Automatic Docker image builds  
✅ **GitHub Container Registry:** Public Docker images  
✅ **Docker Compose:** Services orchestration  
✅ **Unraid:** Single entry with frontend + backend services  

## Directory Structure After Setup

```
Your Unraid Server:
/mnt/user/appdata/arrosemoi/
├── docker-compose.yml    ← Downloaded from GitHub
├── .env                  ← Configuration (never commit to Git)
└── data/
    └── app.sqlite       ← Database (persistent)
```

## Development Workflow

### Make Changes

```bash
cd /Users/giovanni/Documents/Vscode/Test\ application/Application\ JS/arrosemoi-app

# Edit files
nano src/pages/Dashboard.jsx  # or use VS Code

# Test locally
npm run dev

# Commit and push
git add .
git commit -m "Feature: Add watering statistics"
git push origin main

# GitHub Actions will automatically:
# 1. Build new Docker images
# 2. Push to ghcr.io
```

### Update on Unraid

On your Unraid server:
```bash
cd /mnt/user/appdata/arrosemoi

# Get new images
docker compose pull

# Restart services
docker compose up -d

# View logs
docker compose logs -f
```

## Structure of Your Project

```
arrosemoi/
├── .github/workflows/
│   └── build-ghcr.yml           ← Auto build and push to ghcr.io
├── src/                         ← React frontend
├── server/                      ← Node.js backend
├── unraid/
│   └── arrosemoi.xml           ← Template for Unraid catalog
├── docker-compose.yml          ← Production deployment
├── Dockerfile.frontend         ← Frontend image
├── Dockerfile.backend          ← Backend image
├── .dockerignore               ← Docker build exclusions
├── .gitignore                  ← Git exclusions
├── .env.example                ← Example frontend env
├── server/.env.example         ← Example backend env
├── nginx.conf                  ← Nginx config
├── README.md                   ← Main documentation
└── UNRAID_DEPLOYMENT.md        ← Unraid setup guide
```

## Common Commands

```bash
# GitHub - view actions
git log --oneline
git status
git push origin main

# Docker - manage on Unraid
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
docker image ls

# Database - backup
cp /mnt/user/appdata/arrosemoi/data/app.sqlite \
   /mnt/user/appdata/arrosemoi/data/app.sqlite.backup
```

## Troubleshooting

### GitHub Actions fail to build
- Check: `GitHub > Actions` tab
- Ensure repo is Public
- Verify Dockerfiles exist in root

### Images don't appear on ghcr.io
- Wait 2-3 minutes after GitHub Actions completes
- Check: `GitHub > Packages` or visit directly
- Try: `docker pull ghcr.io/YOUR_USERNAME/arrosemoi/frontend:latest`

### Can't pull images on Unraid
- Ensure Unraid has internet access
- Try: `docker logout ghcr.io && docker login ghcr.io`
- Use your GitHub username and Personal Access Token

### Containers won't start
- Check `.env` file value
- View logs: `docker compose logs -f`
- Check disk space: `df -h /mnt/user`

## Next Steps

1. ✅ GitHub repository created
2. ✅ Code pushed (`git push origin main`)
3. ✅ GitHub Actions building images
4. ✅ Images on ghcr.io
5. ✅ Deployed on Unraid
6. 🎉 Development workflow established!

For updates to your app, just:
```bash
# Make changes locally
git push origin main
# → GitHub Actions builds
# → Push to ghcr.io
# → Pull and restart on Unraid
```

---

## Detailed Guides

- **Development:** See `README.md`
- **Unraid Details:** See `UNRAID_DEPLOYMENT.md`
- **Troubleshooting:** See `README.md` troubleshooting section

**Happy coding and deploying! 🌱**
