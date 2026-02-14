# ArroseMoi - Plant Management Application

A modern web application for managing plant watering schedules and plant care reminders.

**Features:**
- Complete plant catalog with search and filters
- Smart watering reminders and scheduling
- User authentication with JWT
- Real-time statistics and insights
- Data persistence with SQLite
- Responsive design (desktop, tablet, mobile)
- Fully containerized with Docker (single image)

## Quick Start

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

### Docker (Production)

```bash
docker run -d \
  --name arrosemoi \
  -p 3001:3001 \
  -v /path/to/data:/data \
  -e JWT_SECRET=your-secret-key-here \
  -e ENCRYPTION_KEY=your-encryption-key-here \
  ghcr.io/mistergio5/arrosemoi:latest
```

Or with Docker Compose:

```bash
docker compose pull
docker compose up -d
# Access the app at http://localhost:3001
```

## Prerequisites

- **Development:** Node.js 20+, npm
- **Deployment:** Docker

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Flowbite |
| Backend | Node.js 20, Express, SQLite |
| DevOps | Docker, GitHub Actions, GHCR |

## Project Structure

```
arrosemoi/
├── src/                      # React frontend (Vite)
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── ...
├── server/                   # Node.js backend (Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.js          # Entry point - serves API + static React files
│   └── package.json
├── Dockerfile                # Multi-stage build (frontend + backend in one image)
├── docker-compose.yml        # Production deployment
└── unraid/                   # Unraid template and icon
```

## Architecture

The application runs as a **single Docker container**:
- The backend Express server serves both the API routes and the built React frontend as static files
- SQLite database is stored in `/data` (mounted as a Docker volume)
- A single port is exposed (default: `3001`)

> **Important for development:** The backend entry point (`server/src/index.js`) must serve the React static files. Example:
> ```js
> const path = require('path');
>
> // API routes
> app.use('/api', apiRouter);
>
> // Serve React static files
> app.use(express.static(path.join(__dirname, '..', 'public')));
>
> // SPA fallback - all non-API routes serve index.html
> app.get('*', (req, res) => {
>   res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
> });
> ```

## CI/CD with GitHub Actions

The `.github/workflows/docker-build.yml` workflow automatically:
1. Builds the Docker image on every push to `main`
2. Pushes the image to GitHub Container Registry (ghcr.io)
3. Tags with `latest` and the commit SHA for versioning

**Image available at:**
```
ghcr.io/mistergio5/arrosemoi:latest
```

---

## Deployment on Unraid

### Method 1: Add Container (UI)

1. **Open Unraid** > **Docker** > **Add Container**

2. **Repository:**
   ```
   ghcr.io/mistergio5/arrosemoi:latest
   ```

3. **Icon URL** *(Show more settings...)*:
   ```
   https://raw.githubusercontent.com/MisterGio5/ArroseMoi/main/unraid/icon.svg
   ```

4. **Network Type:** Bridge

5. **Port Mapping** *(Add another Path, Port, Variable)* :
   - Type: **Port**
   - Name: `Web UI Port`
   - Container Port: `3001`
   - Host Port: `3001` *(ou le port de votre choix)*
   - Connection Type: TCP

   > **Changer le port :** Si vous choisissez un port different (ex: `8080`), vous devez aussi ajouter la variable `PORT=8080` (voir etape 6) pour que le serveur interne ecoute sur le meme port.

6. **Variables d'environnement** *(Add another Path, Port, Variable)* :

   | Type | Name | Key | Value |
   |------|------|-----|-------|
   | Variable | Port | `PORT` | `3001` *(doit correspondre au Container Port)* |
   | Variable | JWT Secret | `JWT_SECRET` | *(generez une chaine aleatoire de 32+ caracteres)* |
   | Variable | Encryption Key | `ENCRYPTION_KEY` | *(generez une chaine aleatoire de 32+ caracteres)* |
   | Variable | Database Path | `DATABASE_PATH` | `/data/app.sqlite` |
   | Variable | Timezone | `TZ` | `Europe/Paris` |

   > **Pour generer les cles secretes**, connectez-vous en SSH a Unraid et executez :
   > ```bash
   > openssl rand -hex 32
   > ```
   > Utilisez un resultat different pour `JWT_SECRET` et `ENCRYPTION_KEY`.
   >
   > **Important :** ne changez jamais `ENCRYPTION_KEY` apres le premier demarrage, sinon les cles API deja enregistrees ne pourront plus etre dechiffrees.

7. **Volume Mapping** *(Add another Path, Port, Variable)* :
   - Type: **Path**
   - Name: `App Data`
   - Container Path: `/data`
   - Host Path: `/mnt/user/appdata/arrosemoi/data`

8. Click **Apply** and access the app at:
   ```
   http://YOUR_UNRAID_IP:3001
   ```

### Method 2: Unraid Template (XML)

1. Copiez le fichier `unraid/arrosemoi.xml` dans `/boot/config/plugins/dockerMan/templates-user/` sur votre serveur Unraid
2. Dans Docker > Add Container, selectionnez le template **ArroseMoi**
3. Configurez le JWT Secret et le port souhaite
4. Cliquez Apply

### Method 3: Docker Compose (SSH)

```bash
# SSH into Unraid
ssh root@YOUR_UNRAID_IP

# Create app directory
mkdir -p /mnt/user/appdata/arrosemoi/data
cd /mnt/user/appdata/arrosemoi

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  arrosemoi:
    image: ghcr.io/mistergio5/arrosemoi:latest
    container_name: arrosemoi
    restart: unless-stopped
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - JWT_SECRET=CHANGE_ME_TO_A_RANDOM_STRING
      - ENCRYPTION_KEY=CHANGE_ME_TO_ANOTHER_RANDOM_STRING
      - DATABASE_PATH=/data/app.sqlite
      - TZ=Europe/Paris
    volumes:
      - /mnt/user/appdata/arrosemoi/data:/data
EOF

# Start
docker compose pull
docker compose up -d
```

> **Pour changer le port** (ex: `8080`), modifiez les DEUX valeurs :
> ```yaml
> ports:
>   - "8080:8080"     # Host:Container
> environment:
>   - PORT=8080        # Le serveur ecoute sur ce port
> ```

---

## Configuration

### Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `3001` | Non | Port d'ecoute du serveur (doit correspondre au port mapping Docker) |
| `JWT_SECRET` | - | **Oui** | Cle secrete pour les tokens JWT (32+ caracteres) |
| `ENCRYPTION_KEY` | - | **Oui** | Cle de chiffrement des cles API utilisateurs (32+ caracteres). **Ne jamais changer apres le premier demarrage.** |
| `JWT_EXPIRES_IN` | `7d` | Non | Duree de validite des tokens JWT |
| `DATABASE_PATH` | `/data/app.sqlite` | Non | Chemin de la base de donnees SQLite |
| `CORS_ORIGIN` | `http://localhost:3001` | Non | Origine autorisee pour CORS |
| `TZ` | `Europe/Paris` | Non | Fuseau horaire du conteneur |
| `NODE_ENV` | `production` | Non | Environnement Node.js |

### Volumes

| Container Path | Description |
|---|---|
| `/data` | Base de donnees SQLite et fichiers persistants |

### Changer le port

Le port est configurable via la variable d'environnement `PORT`. Il faut que :
1. La variable `PORT` corresponde au port interne du conteneur
2. Le port mapping Docker mappe le host vers ce meme port

Exemple pour utiliser le port `8080` :
```bash
docker run -d \
  --name arrosemoi \
  -p 8080:8080 \
  -e PORT=8080 \
  -v /mnt/user/appdata/arrosemoi/data:/data \
  -e JWT_SECRET=your-secret-key \
  -e ENCRYPTION_KEY=your-encryption-key \
  ghcr.io/mistergio5/arrosemoi:latest
```

## Development Scripts

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
npm test             # Run tests

# Docker
docker compose build     # Force rebuild image
docker compose logs -f   # View live logs
docker compose restart   # Restart service
docker compose down      # Stop and remove
```

## Security Notes

- Change `JWT_SECRET` and `ENCRYPTION_KEY` to strong, random values in production
- Use HTTPS with a reverse proxy (e.g., Nginx Proxy Manager on Unraid)
- Keep Docker and images updated regularly
- Never commit `.env` files to Git

## Troubleshooting

### Docker image won't pull on Unraid
- Ensure you have internet access
- Check GitHub Container Registry credentials (if private repo)
- Try: `docker pull ghcr.io/mistergio5/arrosemoi:latest`

### App won't start
- Check logs: `docker logs arrosemoi`
- Verify the port isn't in use: `netstat -an | grep 3001`
- Check file permissions on `/mnt/user/appdata/arrosemoi/data`

### Database issues
- Ensure the `/data` volume is correctly mounted
- Check write permissions on the data directory
- SQLite WAL files (`*.sqlite-shm`, `*.sqlite-wal`) are normal

### Port issues
- Ensure `PORT` env variable matches the container port in port mapping
- If you change the port, update both the mapping AND the `PORT` variable

---

**Built with React, Node.js, and Docker**
