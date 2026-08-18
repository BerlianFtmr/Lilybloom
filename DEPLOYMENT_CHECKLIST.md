# ✅ Deployment Checklist - LilyBloom

**Quick checklist untuk deploy LilyBloom ke VPS dengan Docker**

---

## 📋 Pre-Deployment Checklist

### Local Setup
- [ ] Docker Desktop installed & running
- [ ] Git repository initialized
- [ ] Code committed with proper format (YYYY-MM-DD - message)
- [ ] Docker files created (Dockerfile, docker-compose.yml, nginx.conf)
- [ ] Deployment scripts created (deploy.sh/deploy.ps1)

### Repository Check
- [ ] All files committed to git
- [ ] GitHub repository created
- [ ] Remote origin added: `git remote add origin <repo-url>`
- [ ] Pushed to GitHub: `git push -u origin main`

---

## 🚀 Deployment Steps

### Step 1: Push to GitHub
```bash
# Verify semua files committed
git status

# Push ke GitHub
git push origin main
```

- [ ] Code pushed ke GitHub successfully
- [ ] Verify di GitHub repository

### Step 2: VPS Preparation
```bash
# SSH ke VPS
ssh user@your-vps-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Git
sudo apt install -y git
```

- [ ] VPS updated
- [ ] Docker installed & verified: `docker --version`
- [ ] Git installed
- [ ] User added to docker group

### Step 3: Clone & Build on VPS
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/YOUR_USERNAME/period-tracker.git lilybloom
cd lilybloom

# Build Docker image
docker build -t lilybloom:latest .

# Test run
docker run -d --name lilybloom-test -p 8081:80 lilybloom:latest
```

- [ ] Repository cloned successfully
- [ ] Docker image built successfully
- [ ] Test container running on port 8081
- [ ] Test access: http://your-vps-ip:8081

### Step 4: Production Deployment
```bash
# Stop test container
docker stop lilybloom-test
docker rm lilybloom-test

# Deploy dengan docker-compose
docker-compose up -d

# Verify running
docker ps | grep lilybloom
docker-compose logs -f
```

- [ ] Production container running
- [ ] Container auto-start enabled
- [ ] Logs show no errors

### Step 5: Cloudflare Zero Trust Setup

#### Cloudflare Dashboard
- [ ] Login to Cloudflare Dashboard
- [ ] Navigate to Access → Tunnels
- [ ] Create Tunnel: `lilybloom-production`
- [ ] Setup Public Hostname:
  - Subdomain: `period` (or custom)
  - Domain: `yourdomain.com`
  - Service: `http://localhost:8081`

#### VPS Setup
```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Authenticate
cloudflared tunnel login

# Create tunnel config
nano ~/.cloudflared/config.yml
```

- [ ] Cloudflared installed
- [ ] Tunnel authenticated
- [ ] Config file created with proper settings
- [ ] Service installed & started: `sudo systemctl start cloudflared`

### Step 6: Final Verification
```bash
# Test HTTPS access
curl -I https://period.yourdomain.com

# Test health endpoint
curl http://localhost:8081/health

# Check container status
docker ps | grep lilybloom
```

- [ ] HTTPS access works
- [ ] PWA features work (service worker, offline mode)
- [ ] Health endpoint returns "healthy"
- [ ] Container auto-starts after VPS reboot

---

## 🔧 Post-Deployment Setup

### Monitoring
- [ ] Setup uptime monitoring (UptimeRobot, etc.)
- [ ] Configure log rotation (optional)
- [ ] Setup backup routine (optional)

### Security
- [ ] Firewall configured: `sudo ufw enable`
- [ ] SSH key authentication (optional)
- [ ] Fail2ban installed (optional)

### Documentation
- [ ] Document VPS credentials safely
- [ ] Document SSH keys location
- [ ] Document domain & tunnel settings

---

## 📊 Deployment Summary

**Deployment Info:**
- Repository: https://github.com/YOUR_USERNAME/period-tracker.git
- VPS IP: your-vps-ip
- App URL: https://period.yourdomain.com
- Container Port: 8081
- Docker Image: lilybloom:latest

**Commands Reference:**
```bash
# SSH ke VPS
ssh user@your-vps-ip

# Cek container status
docker ps | grep lilybloom

# Cek logs
docker logs -f lilybloom-period-tracker

# Restart container
docker restart lilybloom-period-tracker

# Update deployment
cd /var/www/lilybloom
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## 🆘 Troubleshooting Quick Guide

| Problem | Solution |
|---------|----------|
| Container not starting | `docker logs lilybloom-period-tracker` |
| Port 8081 blocked | `sudo ufw allow 8081/tcp` |
| HTTPS not working | Check Cloudflare tunnel status |
| Out of memory | Increase VPS RAM or reduce container limits |
| Need update | `git pull && docker-compose up -d --build` |

---

## ✨ Success Criteria

Deployment successful jika:
- ✅ HTTPS URL accessible
- ✅ PWA features work (offline mode, service worker)
- ✅ IndexedDB storing data
- ✅ All 4 phase cards render correctly
- ✅ Mood tracking works
- ✅ PDF export works
- ✅ Container auto-starts after reboot
- ✅ Health endpoint returns "healthy"

---

## 🎯 Next Steps

After successful deployment:
1. Test all features thoroughly
2. Monitor for 24-48 hours
3. Gather user feedback
4. Plan for future enhancements
5. Document any customizations made

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Verified By:** _______________

---

🎉 **Happy Deployment!**
