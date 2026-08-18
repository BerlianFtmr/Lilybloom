# 🌸 LilyBloom - Period & Mood Journal

**Offline-First PWA untuk tracking menstruasi dan mood journal**

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![Docker](https://img.shields.io/badge/docker-nginx--alpine-blue)
![PWA](https://img.shields.io/badge/PWA-enabled-green)

## ✨ Fitur

- 📅 **Tracking Menstruasi** - Catat dan monitor siklus haid
- 🌙 **4 Fase Hormonal** - Menstruasi, Folikuler, Ovulasi, Luteal
- 😊 **Mood Journal** - Catat mood harian dengan emoji
- 📊 **Statistik Siklus** - Analisis rata-rata siklus & durasi haid
- 📴 **Offline-First PWA** - Jalan tanpa internet, data tersimpan di browser
- 📄 **Export PDF** - Buat laporan untuk dokter
- 🔔 **Notifikasi Lokal** - Pengingat siklus (optional)

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 16+ (untuk development)
- Docker & Docker Compose (untuk production)

### Cara Run Local

```bash
# Install serve (static file server)
npm install -g serve

# Run aplikasi
npx serve .
```

Buka browser: http://localhost:3000

---

## 🐳 Deployment dengan Docker

### Arsitektur

Project ini menggunakan **Pendekatan 1: Satu Container Per Project** dengan Nginx Alpine:

- ✅ Ultra-light (~5MB base image)
- ✅ Performance tinggi untuk static files
- ✅ Isolasi penuh per project
- ✅ Easy deployment & scaling

### Struktur File Docker

```
.
├── Dockerfile              # Image definition (nginx:alpine)
├── docker-compose.yml      # Orchestration config
├── nginx.conf             # Nginx optimal config (gzip, cache)
├── .dockerignore          # Exclude files dari image
├── deploy.sh              # Deployment script (Linux/Mac)
├── deploy.ps1             # Deployment script (Windows)
└── README.md             # This file
```

### Step 1: Build & Test Local

```bash
# Build Docker image
docker build -t lilybloom:latest .

# Test run container
docker run -d --name lilybloom-test -p 8081:80 lilybloom:latest

# Cek log
docker logs lilybloom-test

# Test di browser
# http://localhost:8081

# Stop & remove test container
docker stop lilybloom-test
docker rm lilybloom-test
```

### Step 2: Deploy dengan Docker Compose

```bash
# Start container
docker-compose up -d

# Cek status
docker-compose ps

# Cek logs
docker-compose logs -f

# Stop container
docker-compose down
```

### Step 3: VPS Deployment

#### Option A: Manual Deployment

```bash
# 1. Push ke GitHub
git add .
git commit -m "YYYY-MM-DD - Pesan commit"
git push origin main

# 2. SSH ke VPS
ssh user@your-vps-ip

# 3. Install Docker (jika belum)
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 4. Clone repository
git clone https://github.com/YOUR_USERNAME/period-tracker.git
cd period-tracker

# 5. Build & run
docker build -t lilybloom:latest .
docker run -d --name lilybloom -p 8081:80 --restart unless-stopped lilybloom:latest

# 6. Setup Cloudflare Zero Trust (lihat bawah)
```

#### Option B: Automated Deployment Script

**Linux/Mac:**
```bash
# Edit script dulu untuk setting VPS
nano deploy.sh

# Jalankan script
chmod +x deploy.sh
./deploy.sh
```

**Windows:**
```powershell
# Edit script dulu untuk setting VPS
notepad deploy.ps1

# Jalankan script (PowerShell 7+)
.\deploy.ps1
```

---

## ☁️ Cloudflare Zero Trust Setup

Karena SSL di-handle Cloudflare, setup di VPS cukup HTTP only.

### 1. Buat Tunnel di Cloudflare Dashboard

1. Login ke [Cloudflare Zero Trust Dashboard](https://dash.cloudflare.com/)
2. Navigate ke **Access → Tunnels**
3. Click **Create Tunnel**
4. Name: `lilybloom-production`
5. Select **Docker** sebagai installation method

### 2. Install Cloudflare Tunnel di VPS

```bash
# SSH ke VPS
ssh user@your-vps-ip

# Download & install cloudflared
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/

# Login & authenticate tunnel
cloudflared tunnel login

# Run tunnel (replace TUNNEL_ID dari dashboard)
cloudflared tunnel --config /path/to/config.yml run
```

### 3. Setup Public Hostname

Di Cloudflare Dashboard:
- **Subdomain**: `period` (atau custom)
- **Domain**: `yourdomain.com`
- **Service**: http://localhost:8081
- **Type**: HTTP

Result: `https://period.yourdomain.com` → `http://localhost:8081`

---

## 🔧 Konfigurasi

### Nginx Config (nginx.conf)

Menggunakan optimal settings untuk PWA:
- ✅ Gzip compression (reduce 70% size)
- ✅ Cache headers untuk assets
- ✅ No-cache untuk HTML & Service Worker
- ✅ Security headers
- ✅ Healthcheck endpoint

### Docker Compose Settings

```yaml
ports:
  - "8081:80"    # Port unik per project

resources:
  limits:
    cpus: '0.5'     # Max 50% CPU
    memory: 128M    # Max 128MB RAM
```

**Sesuaikan dengan VPS spec Anda.**

---

## 📦 Multi-Project Deployment

Dengan Pendekatan 1, setiap project punya container sendiri:

### Contoh docker-compose.yml untuk Multiple Projects

```yaml
# Project A (LilyBloom)
lilybloom-app:
  image: lilybloom:latest
  container_name: lilybloom-period-tracker
  ports:
    - "8081:80"

# Project B (misalnya portfolio)
portfolio-app:
  image: portfolio:latest
  container_name: portfolio-site
  ports:
    - "8082:80"

# Project C (blog)
blog-app:
  image: blog:latest
  container_name: blog-site
  ports:
    - "8083:80"
```

### Cloudflare Routing

```
period.yourdomain.com  → VPS_IP:8081 → lilybloom-container
portfolio.yourdomain.com → VPS_IP:8082 → portfolio-container
blog.yourdomain.com    → VPS_IP:8083 → blog-container
```

---

## 📊 Resource Usage

Nginx Alpine sangat ringan:

| Resource | Usage |
|----------|-------|
| **Base Image** | ~5MB |
| **Running Memory** | ~10-15MB |
| **CPU (idle)** | <1% |
| **CPU (serving)** | 5-10% |

**Perfect untuk VPS kecil (512MB RAM, 1 CPU core).**

---

## 🐛 Troubleshooting

### Container tidak start

```bash
# Cek logs
docker logs lilybloom-period-tracker

# Cek nginx config
docker exec lilybloom-period-tracker nginx -t

# Restart container
docker restart lilybloom-period-tracker
```

### Port 8081 sudah dipakai

```bash
# Cek apa yang jalan di port 8081
netstat -tlnp | grep 8081

# Atau ganti port di docker-compose.yml
ports:
  - "8082:80"  # Gunakan port lain
```

### Healthcheck failing

```bash
# Test health endpoint
curl http://localhost:8081/health

# Cek apakah container running
docker ps | grep lilybloom
```

---

## 📝 Development Workflow

```bash
# 1. Edit code
# 2. Test local
npx serve .

# 3. Build & test Docker
docker build -t lilybloom:test .
docker run -p 8081:80 lilybloom:test

# 4. Commit
git add .
git commit -m "YYYY-MM-DD - Deskripsi perubahan"
git push origin main

# 5. Deploy ke VPS
./deploy.sh  # atau manual
```

---

## 🛡️ Security Notes

- ✅ Tidak ada backend, semua data client-side (IndexedDB)
- ✅ Nginx run sebagai non-root user
- ✅ Security headers sudah di-set
- ✅ No exposed ports selain 8081→80
- ✅ Data tersimpan di browser user, bukan di server

---

## 📄 License

ISC

---

## 🙏 Credits

Dibuat dengan ❤️ untuk tracking kesehatan hormonal wanita.

**Tech Stack:**
- Vanilla JavaScript (ES6+)
- IndexedDB (offline storage)
- Tailwind CSS (via CDN)
- HTML2PDF (via CDN)
- PWA Manifest & Service Worker

---

## 📞 Support

Untuk pertanyaan atau issues:
- Open issue di GitHub repository
- Review code di `/docs` folder

**Happy Tracking! 🌸**
