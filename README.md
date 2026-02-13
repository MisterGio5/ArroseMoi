# 🌱 ArroseMoi - Plant Management Application

A modern web application for managing plant watering schedules and plant care reminders.

**Features:**
- ✅ Complete plant catalog with search and filters
- 🚰 Smart watering reminders and scheduling
- 🔐 User authentication with JWT
- 📊 Real-time statistics and insights
- 💾 Data persistence with SQLite
- 📱 Responsive design (desktop, tablet, mobile)
- 🐳 Fully containerized with Docker

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install
cd server && npm install && cd ..

# Frontend development server
npm run dev

# Backend development server (in another terminal)
cd server && npm run dev
```

Access the app at `http://localhost:5173`

### Docker Compose (Production)

```bash
# Update docker-compose.yml with your GitHub username
sed -i '' 's/YOUR_GITHUB_USERNAME/your-github-username/g' docker-compose.yml

# Pull images and start
docker compose pull
docker compose up -d

# Access the app at http://localhost
```

## 📋 Prerequisites

- **Development:** Node.js 20+, npm
- **Deployment:** Docker & Docker Compose

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Flowbite |
| Backend | Node.js 20, Express, SQLite |
| DevOps | Docker, Docker Compose, GitHub Actions |

## 📚 Project Structure

```
arrosemoi-app/
├── src/                      # React frontend
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── server/                   # Node.js backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── ...
│   └── package.json
├── Dockerfile.frontend       # Frontend image
├── Dockerfile.backend        # Backend image
├── docker-compose.yml        # Production stack
└── nginx.conf               # Nginx configuration
```

## 🚢 Deployment on Unraid

### Using Docker Compose

**On your Unraid server:**

```bash
# SSH into Unraid
ssh root@YOUR_UNRAID_IP

# Create app directory
mkdir -p /mnt/user/appdata/arrosemoi

# Clone or download docker-compose.yml
cd /mnt/user/appdata/arrosemoi

# Update with your GitHub username first!
sed -i 's/YOUR_GITHUB_USERNAME/your-username/g' docker-compose.yml

# Create .env file with your configuration
cat > .env << EOF
JWT_SECRET=$(openssl rand -hex 32)
CORS_ORIGIN=http://YOUR_UNRAID_IP
VITE_API_URL=http://YOUR_UNRAID_IP:3001/api
DATA_PATH=/mnt/user/appdata/arrosemoi/data
ICON_URL=https://raw.githubusercontent.com/your-username/arrosemoi/main/public/logo.png
EOF

# Create data directory
mkdir -p data

# Start the stack
docker compose pull
docker compose up -d

# Verify
docker compose ps
```

**Access the app:**
```
http://YOUR_UNRAID_IP
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env):**
```env
VITE_API_URL=http://your-api-domain:3001/api
```

**Backend (server/.env):**
```env
PORT=3001
JWT_SECRET=your-secret-key-min-32-chars
DATABASE_PATH=/app/data/app.sqlite
CORS_ORIGIN=http://your-frontend-domain
```

### Docker Compose Variables

```env
JWT_SECRET=generated-secret-key
CORS_ORIGIN=http://unraid-ip-or-domain
VITE_API_URL=http://unraid-ip-or-domain:3001/api
DATA_PATH=/mnt/user/appdata/arrosemoi/data
ICON_URL=https://path-to-your-logo-icon
```

## 🔄 CI/CD with GitHub Actions

The `.github/workflows/build-ghcr.yml` workflow automatically:
1. Builds Docker images on every push to `main` or `develop`
2. Pushes images to GitHub Container Registry (ghcr.io)
3. Creates tags for branches, versions, and commits

**Images are available at:**
```
ghcr.io/YOUR_USERNAME/arrosemoi/frontend:latest
ghcr.io/YOUR_USERNAME/arrosemoi/backend:latest
```

## 📦 Image Management

### Pulling Latest Images

```bash
cd /mnt/user/appdata/arrosemoi
docker compose pull
docker compose up -d
```

### Rolling Back to Previous Version

```bash
# Set specific image tags in docker-compose.yml
# Then restart
docker compose up -d
```

## 🔐 Security Notes

- Change the `JWT_SECRET` to a strong, random value in production
- Use HTTPS with a reverse proxy (e.g., Nginx Proxy Manager)
- Keep Docker and images updated regularly
- Never commit `.env` files to Git

## 📖 Development Scripts

```bash
# Frontend
npm run dev          # Dev server (HMR enabled)
npm run build        # Production build
npm run preview      # Preview build locally
npm run lint         # Lint code

# Backend
cd server
npm run dev          # Dev server (nodemon)
npm start            # Production
npm test             # Run tests (if configured)

# Docker
docker compose build     # Force rebuild images
docker compose logs -f   # View live logs
docker compose restart   # Restart services
docker compose down      # Stop and remove
```

## 🆘 Troubleshooting

### Docker images won't pull on Unraid
- Ensure you have internet access
- Check GitHub Container Registry credentials (if private)
- Try: `docker compose pull --force-rm-local-images`

### App won't start
- Check logs: `docker compose logs -f backend`
- Verify ports aren't in use: `netstat -an | grep 3001`
- Check file permissions on data volume

### Frontend can't connect to API
- Verify `CORS_ORIGIN` matches frontend domain
- Check `VITE_API_URL` in environment
- Verify network connectivity: `docker compose ps`

## 📝 License

[Add your license here]

## 💬 Support

For issues, questions, or contributions:
- GitHub Issues: [your-repo]/issues
- Email: [your-email]

---

**Built with ❤️ using Docker, React, and Node.js**
