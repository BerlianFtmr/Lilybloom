# ========================================
# LilyBloom Period & Mood Journal - Dockerfile
# Base: nginx:alpine (Ultra-light static server)
# ========================================

FROM nginx:alpine

# Labels untuk metadata
LABEL maintainer="LilyBloom Team"
LABEL description="LilyBloom Period & Mood Journal - PWA Static Web App"
LABEL version="1.2.0"

# Buat direktori untuk nginx logs (opsional - untuk debugging)
RUN mkdir -p /var/log/nginx

# Copy seluruh project ke /usr/share/nginx/html/
# Ini adalah default directory untuk nginx static files
COPY . /usr/share/nginx/html/

# Set permission yang proper
RUN chmod -R 755 /usr/share/nginx/html/

# Custom nginx config untuk optimal PWA serving
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 (default HTTP port)
EXPOSE 80

# Healthcheck untuk memastikan container running
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Default command nginx (sudah ada di base image)
CMD ["nginx", "-g", "daemon off;"]
