# Deployment on Unraid

Detailed guide for deploying ArroseMoi on your Unraid server.

## Prerequisites

- Unraid 6.12+ with Docker enabled
- SSH access to Unraid (or use the terminal in Unraid Web UI)
- Internet access (to pull images from ghcr.io)

## Docker Image

```
ghcr.io/mistergio5/arrosemoi:latest
```

Single image containing the React frontend + Node.js backend. No additional containers needed.

---

## Method 1: Add Container (Unraid UI)

### Step 1 - Open Add Container

Unraid Web UI > **Docker** > **Add Container**

### Step 2 - Basic Settings

| Field | Value |
|-------|-------|
| Name | `ArroseMoi` |
| Repository | `ghcr.io/mistergio5/arrosemoi:latest` |
| Network Type | `bridge` |

### Step 3 - Icon (optional)

Click **Show more settings...** and set:

| Field | Value |
|-------|-------|
| Icon URL | `https://raw.githubusercontent.com/MisterGio5/ArroseMoi/main/unraid/icon.svg` |

### Step 4 - Port Mapping

Click **Add another Path, Port, Variable, Label or Device** :

| Field | Value |
|-------|-------|
| Config Type | Port |
| Name | `Web UI Port` |
| Container Port | `3001` |
| Host Port | `3001` *(modifiable, voir note ci-dessous)* |
| Connection Type | TCP |

> **Changer le port :** Vous pouvez utiliser n'importe quel port host (ex: `8080`). Si vous changez le **Container Port**, vous devez aussi mettre a jour la variable `PORT` a l'etape 5 pour correspondre.

### Step 5 - Environment Variables

Ajoutez chaque variable via **Add another Path, Port, Variable, Label or Device** > Type: **Variable** :

| Name | Key | Value | Notes |
|------|-----|-------|-------|
| Port | `PORT` | `3001` | Doit correspondre au Container Port de l'etape 4 |
| JWT Secret | `JWT_SECRET` | *(votre cle secrete)* | Generez avec `openssl rand -hex 32` |
| Database Path | `DATABASE_PATH` | `/data/app.sqlite` | Ne pas modifier sauf besoin specifique |
| Timezone | `TZ` | `Europe/Paris` | Adaptez a votre fuseau horaire |

### Step 6 - Volume Mapping

Click **Add another Path, Port, Variable, Label or Device** :

| Field | Value |
|-------|-------|
| Config Type | Path |
| Name | `App Data` |
| Container Path | `/data` |
| Host Path | `/mnt/user/appdata/arrosemoi/data` |
| Access Mode | Read/Write |

### Step 7 - Apply

1. Click **Apply**
2. Wait for the image to download and the container to start
3. Access the app at: `http://YOUR_UNRAID_IP:3001`

---

## Method 2: XML Template

### Installation du template

```bash
# SSH to Unraid
ssh root@YOUR_UNRAID_IP

# Download the template
mkdir -p /boot/config/plugins/dockerMan/templates-user
wget -O /boot/config/plugins/dockerMan/templates-user/arrosemoi.xml \
  https://raw.githubusercontent.com/MisterGio5/ArroseMoi/main/unraid/arrosemoi.xml
```

### Utilisation

1. Unraid Web UI > **Docker** > **Add Container**
2. Dans le menu deroulant **Template**, selectionnez **ArroseMoi**
3. Configurez :
   - **JWT Secret** : generez une cle secrete
   - **Port** : modifiez si souhaite (par defaut 3001)
4. Click **Apply**

---

## Method 3: Docker Compose

### Setup

```bash
# SSH to Unraid
ssh root@YOUR_UNRAID_IP

# Create directories
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
      - JWT_SECRET=CHANGE_ME_GENERATE_WITH_openssl_rand_hex_32
      - DATABASE_PATH=/data/app.sqlite
      - TZ=Europe/Paris
    volumes:
      - /mnt/user/appdata/arrosemoi/data:/data
EOF

# Generate a real JWT secret and update
JWT=$(openssl rand -hex 32)
sed -i "s/CHANGE_ME_GENERATE_WITH_openssl_rand_hex_32/$JWT/" docker-compose.yml

# Start
docker compose pull
docker compose up -d

# Verify
docker compose ps
docker logs arrosemoi
```

### Changer le port (Docker Compose)

Pour utiliser le port `8080` au lieu de `3001` :

```yaml
ports:
  - "8080:8080"        # Les deux doivent correspondre
environment:
  - PORT=8080           # Le serveur ecoute sur ce port
```

---

## Configuration Reference

### Environment Variables

| Variable | Default | Required | Description |
|---|---|---|---|
| `PORT` | `3001` | Non | Port d'ecoute du serveur |
| `JWT_SECRET` | - | **Oui** | Cle secrete JWT (32+ caracteres) |
| `JWT_EXPIRES_IN` | `7d` | Non | Duree de validite des tokens |
| `DATABASE_PATH` | `/data/app.sqlite` | Non | Chemin de la BDD SQLite |
| `CORS_ORIGIN` | `http://localhost:3001` | Non | Origine CORS autorisee |
| `TZ` | `Europe/Paris` | Non | Fuseau horaire |
| `NODE_ENV` | `production` | Non | Environnement Node.js |

### Volumes

| Container Path | Host Path (Unraid) | Description |
|---|---|---|
| `/data` | `/mnt/user/appdata/arrosemoi/data` | BDD SQLite + fichiers persistants |

### Port

| Default | Configurable | Protocol |
|---|---|---|
| `3001` | Oui, via variable `PORT` | TCP |

---

## Mise a jour

### Via Unraid UI

1. **Docker** tab > click sur l'icone ArroseMoi > **Force Update**
2. Unraid telecharge la derniere image et redemarre le conteneur
3. Vos donnees sont preservees (volume `/data`)

### Via Docker Compose

```bash
cd /mnt/user/appdata/arrosemoi
docker compose pull
docker compose up -d
```

### Mise a jour automatique (Watchtower)

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  arrosemoi \
  --interval 300
```

---

## Sauvegarde

### Base de donnees

```bash
# Backup
cp /mnt/user/appdata/arrosemoi/data/app.sqlite \
   /mnt/user/appdata/arrosemoi/data/app.sqlite.backup.$(date +%Y%m%d)

# Restore
docker stop arrosemoi
cp /mnt/user/appdata/arrosemoi/data/app.sqlite.backup \
   /mnt/user/appdata/arrosemoi/data/app.sqlite
docker start arrosemoi
```

### Backup automatique (cron)

Ajoutez dans Unraid > Settings > User Scripts :

```bash
#!/bin/bash
cp /mnt/user/appdata/arrosemoi/data/app.sqlite \
   /mnt/user/appdata/arrosemoi/backups/app.sqlite.$(date +%Y%m%d_%H%M)

# Keep only last 7 backups
ls -t /mnt/user/appdata/arrosemoi/backups/app.sqlite.* | tail -n +8 | xargs rm -f
```

---

## HTTPS avec Reverse Proxy

### Nginx Proxy Manager (recommande)

1. Installez **Nginx Proxy Manager** depuis Community Applications
2. Accedez a `http://YOUR_UNRAID_IP:81`
3. **Proxy Hosts** > **Add Proxy Host** :
   - Domain: `arrosemoi.votre-domaine.com`
   - Scheme: `http`
   - Forward Hostname: `YOUR_UNRAID_IP`
   - Forward Port: `3001` (ou votre port personnalise)
4. Onglet **SSL** > Request a new SSL certificate (Let's Encrypt)

---

## Troubleshooting

### L'image ne se telecharge pas

```bash
# Test manual pull
docker pull ghcr.io/mistergio5/arrosemoi:latest

# Si repo prive, authentifiez-vous:
docker login ghcr.io -u MisterGio5
# Entrez un Personal Access Token avec scope read:packages
```

### Le conteneur ne demarre pas

```bash
# Voir les logs
docker logs arrosemoi

# Verifier que le port n'est pas utilise
netstat -an | grep 3001

# Verifier les permissions du dossier data
ls -la /mnt/user/appdata/arrosemoi/data/
chmod 755 /mnt/user/appdata/arrosemoi/data/
```

### Problemes de base de donnees

```bash
# Verifier que le volume est monte
docker inspect arrosemoi | grep -A5 Mounts

# Verifier le fichier SQLite
ls -la /mnt/user/appdata/arrosemoi/data/app.sqlite
# Les fichiers .sqlite-shm et .sqlite-wal sont normaux (WAL mode)
```

### Le port ne fonctionne pas

- Verifiez que la variable `PORT` correspond au Container Port
- Verifiez qu'aucun autre conteneur n'utilise ce port
- Redemarrez le conteneur apres modification du port

---

## Security

- Utilisez un `JWT_SECRET` fort et unique (generez avec `openssl rand -hex 32`)
- Activez HTTPS via un reverse proxy
- Gardez l'image Docker a jour
- Ne commitez jamais les fichiers `.env` dans Git
- Limitez l'acces reseau au serveur Unraid
