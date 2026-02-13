# 🏠 Deployment on Unraid

Guide for deploying ArroseMoi on your Unraid server using Docker Compose with GitHub Container Registry.

## Prerequisites

- Unraid 6.12+ (Docker Compose support required)
- SSH access enabled on Unraid
- GitHub account with access to your arrosemoi repository
- Docker images published on GitHub Container Registry (ghcr.io)

## 1. Prepare Your GitHub Repository

First, ensure:
1. Your repository is **public** (required for ghcr.io public access)
2. Update `docker-compose.yml` to replace `YOUR_GITHUB_USERNAME` with your actual GitHub username
3. GitHub Actions workflow (`build-ghcr.yml`) is working and pushing images to ghcr.io

Check images are available at:
```
https://ghcr.io/YOUR_USERNAME/arrosemoi/backend:latest
https://ghcr.io/YOUR_USERNAME/arrosemoi/frontend:latest
```

## 2. Setup on Unraid

### Step 1: SSH into Unraid

```bash
ssh root@YOUR_UNRAID_IP
# or
ssh root@YOUR_UNRAID_HOSTNAME
```

### Step 2: Create Application Directory

```bash
mkdir -p /mnt/user/appdata/arrosemoi
cd /mnt/user/appdata/arrosemoi
```

### Step 3: Download docker-compose.yml

Option A: Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/arrosemoi.git
cd arrosemoi
```

Option B: Download just the docker-compose.yml
```bash
wget https://raw.githubusercontent.com/YOUR_USERNAME/arrosemoi/main/docker-compose.yml
```

### Step 4: Update Configuration

Replace your GitHub username in the file:
```bash
sed -i 's/YOUR_GITHUB_USERNAME/your-actual-username/g' docker-compose.yml
```

### Step 5: Create .env File

```bash
cat > .env << 'EOF'
# JWT Secret - Generate a strong random key
JWT_SECRET=your-super-secret-key-change-this-in-production-at-least-32-chars

# Your Unraid IP or domain
CORS_ORIGIN=http://192.168.1.100
VITE_API_URL=http://192.168.1.100:3001/api

# Data path on Unraid
DATA_PATH=/mnt/user/appdata/arrosemoi/data

# Your logo URL (optional)
ICON_URL=https://raw.githubusercontent.com/YOUR_USERNAME/arrosemoi/main/public/logo.png
EOF
```

### Step 6: Create Data Directory

```bash
mkdir -p data
chmod 755 data
```

### Step 7: Start the Stack

```bash
docker compose pull      # Download latest images
docker compose up -d     # Start in background

# Verify everything is running
docker compose ps
```

You should see:
- `arrosemoi-backend` ✅ running on port 3001
- `arrosemoi-frontend` ✅ running on port 80

### Step 8: Access Your App

Open in your browser:
```
http://YOUR_UNRAID_IP
```

## 3. Unraid Web UI Integration

### View Containers

In Unraid Web UI:
1. Navigate to **Docker** tab
2. You should see both containers listed:
   - `arrosemoi-backend`
   - `arrosemoi-frontend`

Each has its own management interface (logs, stats, restart, stop).

## 4. Updating Your Application

### When You Push Updates to GitHub

1. GitHub Actions automatically builds new images
2. New images are pushed to `ghcr.io/YOUR_USERNAME/arrosemoi/backend:latest`
3. On Unraid, simply run:

```bash
cd /mnt/user/appdata/arrosemoi

docker compose pull          # Get latest images
docker compose up -d         # Restart with new versions
docker compose logs -f       # Watch logs
```

### Alternative: Automatic Updates with Watchtower

To automatically update containers when new images are pushed:

```bash
# SSH to Unraid and add Watchtower via Docker
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  arrosemoi-backend arrosemoi-frontend \
  --interval 300  # Check every 5 minutes
```

## 5. Persistent Data

### Database Location

SQLite database is stored at:
```
/mnt/user/appdata/arrosemoi/data/app.sqlite
```

This path persists across container restarts and updates.

### Backup

Backup your database:
```bash
cp /mnt/user/appdata/arrosemoi/data/app.sqlite \
   /mnt/user/appdata/arrosemoi/data/app.sqlite.backup
```

## 6. Custom Icon in Unraid UI

To show a custom icon in Unraid:

1. Options A: Existing PNG URL (current setup)
   - Already configured in `docker-compose.yml`
   - Points to GitHub repository

2. Options B: Local icon file
   ```bash
   # Create icons directory
   mkdir -p /mnt/user/appdata/docker-icons
   
   # Place your PNG there (512x512 recommended)
   cp my-icon.png /mnt/user/appdata/docker-icons/arrosemoi.png
   
   # Update docker-compose.yml labels
   labels:
     net.unraid.docker.icon: "/mnt/user/appdata/docker-icons/arrosemoi.png"
   ```

## 7. Reverse Proxy with HTTPS

To add HTTPS and custom domain, use **Nginx Proxy Manager**:

### Install Nginx Proxy Manager

1. Unraid Web UI > **Apps** > **Community Applications**
2. Search for **"Nginx Proxy Manager"**
3. Install the jc21 version
4. Access at `http://YOUR_UNRAID_IP:81`
   - Default: admin@example.com / changeme

### Create Proxy Host

1. Click **Proxy Hosts** > **Add Proxy Host**
2. Configure:
   - **Domain Names:** `arrosemoi.yourdomain.com`
   - **Scheme:** `http`
   - **Forward Hostname/IP:** `arrosemoi-frontend` or `192.168.1.100`
   - **Forward Port:** `80`
3. Go to **SSL** tab
4. Click **Request a new SSL Certificate**
   - Check "Use Let's Encrypt free certificate"
   - Check "I Agree to the Let's Encrypt Terms"
   - Check "Force SSL"
5. Save

### Update CORS Configuration

1. SSH to Unraid
2. Update .env:
   ```bash
   cd /mnt/user/appdata/arrosemoi
   nano .env
   
   # Change to:
   CORS_ORIGIN=https://arrosemoi.yourdomain.com
   ```

3. Restart backend:
   ```bash
   docker compose restart backend
   ```

## 8. Useful Commands

```bash
# View logs
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend

# Stop and remove (keeps data)
docker compose down

# Stop, remove, and clean volumes (CAREFUL!)
docker compose down -v

# Restart services
docker compose restart
docker compose restart backend

# Check status
docker compose ps
docker compose stats

# Execute commands in running container
docker compose exec backend npm list

# Remove old images
docker image prune -a
```

## 9. Troubleshooting

### Images won't pull
```bash
# Force re-login to ghcr.io
docker logout ghcr.io
docker login ghcr.io
# Enter your GitHub username and Personal Access Token

# Try again
docker compose pull --no-parallel
```

### Container won't start
```bash
# Check logs
docker compose logs -f

# Verify port isn't in use
netstat -an | grep 3001
netstat -an | grep ":80"

# Check disk space
df -h /mnt/user/
```

###  Frontend can't connect to backend
```bash
# Verify containers are on same network
docker network ls
docker inspect arrosemoi_arrosemoi

# Test connectivity
docker compose exec frontend curl http://backend:3001/health
```

### Database errors
```bash
# Check database file permissions
ls -la /mnt/user/appdata/arrosemoi/data/

# Ensure directory is writable
chmod 755 /mnt/user/appdata/arrosemoi/data/
```

## 10. Security Considerations

✅ **DO:**
- Use strong, unique `JWT_SECRET`
- Keep Docker and images updated
- Use HTTPS via reverse proxy
- Regularly backup database
- Limit exposed ports (only HTTP/HTTPS)

❌ **DON'T:**
- Commit `.env` file to Git
- Use default or weak passwords
- Expose API directly to internet without HTTPS
- Run containers with `--privileged` flag

## 11. Monitoring

### Using Portainer (Optional)

Install Portainer for visual container management:

```bash
# SSH to Unraid
docker volume create portainer_data

docker run -d \
  -p 8000:8000 \
  -p 9000:9000 \
  --name=portainer \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce
```

Access at `http://YOUR_UNRAID_IP:9000`

## 12. Performance Optimization

Monitor resource usage:
```bash
# Real-time stats
docker stats

# Specific container
docker stats arrosemoi-backend
```

Adjust in `/mnt/user/appdata/arrosemoi/docker-compose.yml` if needed:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
```

## Support

For issues:
1. Check logs: `docker compose logs -f`
2. Verify configuration: `cat .env`
3. Test connectivity: `curl http://localhost:3001/health`
4. Check GitHub Issues: github.com/YOUR_USERNAME/arrosemoi/issues

---

**Happy hosting! 🌱**
