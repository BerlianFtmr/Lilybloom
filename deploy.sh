#!/bin/bash

# ========================================
# LilyBloom - Deployment Script untuk VPS
# ========================================

set -e  # Exit jika error

# Configuration
REPO_URL="https://github.com/YOUR_USERNAME/period-tracker.git"  # Ganti dengan repo URL Anda
VPS_USER="root"  # Ganti dengan VPS user Anda
VPS_HOST="your-vps-ip"  # Ganti dengan VPS IP Anda
VPS_PATH="/var/www/lilybloom"  # Path di VPS
IMAGE_NAME="lilybloom"
CONTAINER_NAME="lilybloom-period-tracker"

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}LilyBloom Deployment Script${NC}"
echo -e "${GREEN}==================================${NC}"

# Function untuk print step
print_step() {
    echo -e "\n${YELLOW}[$(date +'%H:%M:%S')]${NC} $1"
}

# Step 1: Build Docker Image
print_step "Step 1: Building Docker image..."
docker build -t $IMAGE_NAME:latest .
echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Step 2: Test locally (opsional)
print_step "Step 2: Testing container locally..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true
docker run -d --name $CONTAINER_NAME -p 8081:80 $IMAGE_NAME:latest
echo -e "${GREEN}✓ Container running on http://localhost:8081${NC}"
print_step "Test di browser: http://localhost:8081"
read -p "Press Enter untuk lanjut ke deployment VPS..."

# Step 3: Save image to tar
print_step "Step 3: Saving Docker image..."
docker save $IMAGE_NAME:latest -o lilybloom.tar
echo -e "${GREEN}✓ Image saved to lilybloom.tar${NC}"

# Step 4: Copy files to VPS
print_step "Step 4: Copying files to VPS ($VPS_HOST)..."
scp lilybloom.tar docker-compose.yml $VPS_USER@$VPS_HOST:$VPS_PATH/
echo -e "${GREEN}✓ Files copied to VPS${NC}"

# Step 5: Deploy on VPS
print_step "Step 5: Deploying on VPS..."
ssh $VPS_USER@$VPS_HOST << EOF
    set -e
    cd $VPS_PATH

    # Load Docker image
    docker load -i lilybloom.tar

    # Stop existing container
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true

    # Start new container
    docker-compose up -d

    # Cleanup
    rm lilybloom.tar

    echo "Deployment completed!"
    docker ps
EOF

echo -e "${GREEN}✓ Deployment completed successfully!${NC}"

# Step 6: Cleanup local tar
print_step "Step 6: Cleaning up..."
rm lilybloom.tar
echo -e "${GREEN}✓ Cleanup completed${NC}"

echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}Deployment Summary${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "App URL: http://$VPS_HOST:8081"
echo -e "Container: $CONTAINER_NAME"
echo -e "Image: $IMAGE_NAME:latest"
echo -e "\nSetup Cloudflare Zero Trust:"
echo -e "- URL: https://period.yourdomain.com"
echo -e "- Destination: http://$VPS_HOST:8081"
echo -e "${GREEN}==================================${NC}"
