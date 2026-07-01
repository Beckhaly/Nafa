#!/bin/bash

# ═════════════════════════════════════════════════════════════════════════════
# NAFA — VPS Initial Setup Script
# Installe tous les prérequis: PHP, MySQL, Nginx, Node.js, etc.
# Exécuter une seule fois sur un VPS neuf
# Usage: sudo bash setup-vps.sh
# ═════════════════════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️ $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; exit 1; }

# ─────────────────────────────────────────────────────────────────────────────
# Check if running as root
# ─────────────────────────────────────────────────────────────────────────────

if [ "$EUID" -ne 0 ]; then
    log_error "Ce script doit être exécuté avec sudo"
fi

log_info "Démarrage du setup initial du VPS..."

# ─────────────────────────────────────────────────────────────────────────────
# Update system
# ─────────────────────────────────────────────────────────────────────────────

log_info "Mise à jour du système..."
apt-get update
apt-get upgrade -y

# ─────────────────────────────────────────────────────────────────────────────
# Install essential tools
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation des outils essentiels..."
apt-get install -y \
    curl \
    wget \
    git \
    unzip \
    zip \
    htop \
    net-tools \
    vim \
    nano \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

log_success "Outils essentiels installés"

# ─────────────────────────────────────────────────────────────────────────────
# Install PHP 8.2 with extensions
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de PHP 8.2..."

add-apt-repository -y ppa:ondrej/php
apt-get update

apt-get install -y \
    php8.2 \
    php8.2-cli \
    php8.2-fpm \
    php8.2-mysql \
    php8.2-pgsql \
    php8.2-sqlite3 \
    php8.2-gd \
    php8.2-curl \
    php8.2-zip \
    php8.2-xml \
    php8.2-mbstring \
    php8.2-json \
    php8.2-intl \
    php8.2-redis \
    php8.2-bcmath

# Enable PHP extensions
phpenmod -v 8.2 \
    curl \
    gd \
    mbstring \
    xml \
    bcmath \
    intl \
    redis

# Optimize PHP
sed -i 's/max_execution_time = 30/max_execution_time = 300/' /etc/php/8.2/fpm/php.ini
sed -i 's/upload_max_filesize = 2M/upload_max_filesize = 100M/' /etc/php/8.2/fpm/php.ini
sed -i 's/post_max_size = 8M/post_max_size = 100M/' /etc/php/8.2/fpm/php.ini

systemctl restart php8.2-fpm

log_success "PHP 8.2 installé et configuré"

# ─────────────────────────────────────────────────────────────────────────────
# Install Composer
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de Composer..."

php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');"
php composer-setup.php --install-dir=/usr/local/bin --filename=composer
rm composer-setup.php

log_success "Composer installé"

# ─────────────────────────────────────────────────────────────────────────────
# Install MySQL 8.0
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de MySQL 8.0..."

apt-get install -y mysql-server

# Start MySQL
systemctl start mysql
systemctl enable mysql

log_success "MySQL installé et démarré"

# ─────────────────────────────────────────────────────────────────────────────
# Install Node.js 18 & npm
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de Node.js et npm..."

curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Global npm packages
npm install -g npm@latest

log_success "Node.js et npm installés"

# ─────────────────────────────────────────────────────────────────────────────
# Install Nginx
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de Nginx..."

apt-get install -y nginx

# Remove default config
rm -f /etc/nginx/sites-enabled/default

systemctl start nginx
systemctl enable nginx

log_success "Nginx installé et démarré"

# ─────────────────────────────────────────────────────────────────────────────
# Install SSL/TLS (Let's Encrypt)
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de Certbot (Let's Encrypt)..."

apt-get install -y certbot python3-certbot-nginx

log_success "Certbot installé"

# ─────────────────────────────────────────────────────────────────────────────
# Install Redis (optional, for caching)
# ─────────────────────────────────────────────────────────────────────────────

log_info "Installation de Redis..."

apt-get install -y redis-server

systemctl start redis-server
systemctl enable redis-server

log_success "Redis installé et démarré"

# ─────────────────────────────────────────────────────────────────────────────
# Create application user and directories
# ─────────────────────────────────────────────────────────────────────────────

log_info "Création de la structure des répertoires..."

mkdir -p /var/www/nafa
chown -R www-data:www-data /var/www/nafa
chmod -R 755 /var/www/nafa

# Create log directory
mkdir -p /var/log/nafa
chown -R www-data:www-data /var/log/nafa

log_success "Répertoires créés"

# ─────────────────────────────────────────────────────────────────────────────
# Firewall configuration (UFW)
# ─────────────────────────────────────────────────────────────────────────────

log_info "Configuration du pare-feu..."

ufw --force enable
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP
ufw allow 443/tcp     # HTTPS
ufw allow 3306/tcp    # MySQL (for development only, restrict in production)

log_success "Pare-feu configuré"

# ─────────────────────────────────────────────────────────────────────────────
# Create swap (if no swap exists)
# ─────────────────────────────────────────────────────────────────────────────

if [ $(free | grep Swap | awk '{print $2}') -eq 0 ]; then
    log_info "Création d'un fichier swap..."

    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab

    log_success "Swap créé (2GB)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Final summary
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ ✅ SETUP INITIAL TERMINÉ!                                      ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Composants installés:"
echo "  ✅ PHP 8.2 + FPM"
echo "  ✅ MySQL 8.0"
echo "  ✅ Nginx"
echo "  ✅ Node.js 18 + npm"
echo "  ✅ Redis"
echo "  ✅ Composer"
echo "  ✅ Certbot (Let's Encrypt)"
echo ""
echo "Prochaines étapes:"
echo "  1. Exécutez le script de déploiement:"
echo "     bash /var/www/nafa/deploy/deploy.sh nafa.exemple.com main"
echo ""
echo "  2. Configurez MySQL:"
echo "     mysql -u root"
echo "     CREATE USER 'nafa_user'@'localhost' IDENTIFIED BY 'password';"
echo "     CREATE DATABASE nafa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
echo "     GRANT ALL PRIVILEGES ON nafa.* TO 'nafa_user'@'localhost';"
echo "     FLUSH PRIVILEGES;"
echo ""
echo "  3. Configurez le DNS:"
echo "     Pointez votre domaine vers: $(hostname -I | awk '{print $1}')"
echo ""
echo "📖 Documentation:"
echo "     Laravel: https://laravel.com/docs/deployment"
echo "     Nginx: https://nginx.org/en/docs/"
echo "     Let's Encrypt: https://certbot.eff.org/"
echo ""
