# ========================================
# LilyBloom - PowerShell Deployment Script untuk Windows
# ========================================

# Configuration
$REPO_URL = "https://github.com/YOUR_USERNAME/period-tracker.git"  # Ganti dengan repo URL Anda
$VPS_USER = "root"  # Ganti dengan VPS user Anda
$VPS_HOST = "your-vps-ip"  # Ganti dengan VPS IP Anda
$VPS_PATH = "/var/www/lilybloom"  # Path di VPS
$IMAGE_NAME = "lilybloom"
$CONTAINER_NAME = "lilybloom-period-tracker"

# Colors for output (PowerShell 7+)
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "=================================="
Write-ColorOutput Green "LilyBloom Deployment Script"
Write-ColorOutput Green "=================================="

# Function untuk print step
function Print-Step {
    param([string]$Message)
    Write-Output "`n[$(Get-Date -Format 'HH:mm:ss')] $Message"
}

# Step 1: Build Docker Image
Print-Step "Step 1: Building Docker image..."
docker build -t "${IMAGE_NAME}:latest" .
Write-ColorOutput Green "✓ Docker image built successfully"

# Step 2: Test locally (opsional)
Print-Step "Step 2: Testing container locally..."
docker stop $CONTAINER_NAME 2>$null | Out-Null
docker rm $CONTAINER_NAME 2>$null | Out-Null
docker run -d --name $CONTAINER_NAME -p 8081:80 "${IMAGE_NAME}:latest"
Write-ColorOutput Green "✓ Container running on http://localhost:8081"
Print-Step "Test di browser: http://localhost:8081"
Read-Host -Prompt "Press Enter untuk lanjut ke deployment VPS..."

# Step 3: Save image to tar
Print-Step "Step 3: Saving Docker image..."
docker save "${IMAGE_NAME}:latest" -o lilybloom.tar
Write-ColorOutput Green "✓ Image saved to lilybloom.tar"

# Step 4: Copy files to VPS (Butuh OpenSSH atau PuTTY's pscp)
Print-Step "Step 4: Copying files to VPS ($VPS_HOST)..."

# Cek apakah scp tersedia
$scpAvailable = Get-Command scp -ErrorAction SilentlyContinue

if ($scpAvailable) {
    scp lilybloom.tar docker-compose.yml "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"
    Write-ColorOutput Green "✓ Files copied to VPS"
} else {
    Write-ColorOutput Yellow "⚠ SCP not found. Please install OpenSSH or use PuTTY's pscp"
    Write-ColorOutput Yellow "Manual upload required:"
    Write-Output "  - Upload lilybloom.tar dan docker-compose.yml ke $VPS_PATH"
    Read-Host -Prompt "Press Enter after manual upload..."
}

# Step 5: Deploy on VPS
Print-Step "Step 5: Deploying on VPS..."

# Cek apakah ssh tersedia
$sshAvailable = Get-Command ssh -ErrorAction SilentlyContinue

if ($sshAvailable) {
    ssh "${VPS_USER}@${VPS_HOST}" @"
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
"@

    Write-ColorOutput Green "✓ Deployment completed successfully!"
} else {
    Write-ColorOutput Yellow "⚠ SSH not found. Manual SSH required:"
    Write-Output "  ssh ${VPS_USER}@${VPS_HOST}"
    Write-Output "  cd $VPS_PATH"
    Write-Output "  docker load -i lilybloom.tar"
    Write-Output "  docker-compose up -d"
}

# Step 6: Cleanup local tar
Print-Step "Step 6: Cleaning up..."
Remove-Item lilybloom.tar -Force
Write-ColorOutput Green "✓ Cleanup completed"

Write-ColorOutput Green "=================================="
Write-ColorOutput Green "Deployment Summary"
Write-ColorOutput Green "=================================="
Write-Output "App URL: http://${VPS_HOST}:8081"
Write-Output "Container: $CONTAINER_NAME"
Write-Output "Image: ${IMAGE_NAME}:latest"
Write-Output "`nSetup Cloudflare Zero Trust:"
Write-Output "- URL: https://period.yourdomain.com"
Write-Output "- Destination: http://${VPS_HOST}:8081"
Write-ColorOutput Green "=================================="
