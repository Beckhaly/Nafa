#!/bin/bash

# ═════════════════════════════════════════════════════════════════════════════
# NAFA — Deployment Script for Linux VPS
# Usage: ./deploy.sh <domain> <git_branch>
# Example: ./deploy.sh nafa.example.com main
# ═════════════════════════════════════════════════════════════════════════════

set -e  # Exit on error

DOMAIN="${1:-mogoya26.nafa.nantalabs.com}"
BRANCH="${2:-main}"
APP_PATH="/var/www/nafa"
APP_USER="www-data"
APP_GROUP="www-data"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─────────────────────────────────────────────────────────────────────────────
# Helper functions
# ─────────────────────────────────────────────────────────────────────────────

log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# ─────────────────────────────────────────────────────────────────────────────
# Pre-deployment checks
# ─────────────────────────────────────────────────────────────────────────────

log_info "Vérification des prérequis..."

if [ ! -f "/etc/os-release" ]; then
    log_error "Système d'exploitation non supporté"
fi

source /etc/os-release

if [[ ! " $ID_LIKE " =~ " debian " ]]; then
    log_warning "Ce script est optimisé pour Debian/Ubuntu. Certaines commandes peuvent ne pas fonctionner."
fi

# Check if required commands exist
for cmd in git php nginx mysql curl; do
    if ! command -v $cmd &> /dev/null; then
        log_error "$cmd n'est pas installé. Exécutez d'abord setup-vps.sh"
    fi
done

log_success "Tous les prérequis sont présents"

# ─────────────────────────────────────────────────────────────────────────────
# Clone ou mettre à jour le repository
# ─────────────────────────────────────────────────────────────────────────────

log_info "Mise à jour du code depuis Git..."

if [ -d "$APP_PATH" ]; then
    log_info "Le répertoire $APP_PATH existe déjà. Mise à jour..."
    cd "$APP_PATH"
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
else
    log_info "Clone du repository..."
    git clone --branch $BRANCH https://github.com/Beckhaly/Nafa.git "$APP_PATH"
    cd "$APP_PATH"
fi

log_success "Code mis à jour"

# ─────────────────────────────────────────────────────────────────────────────
# Backend deployment (Laravel)
# ─────────────────────────────────────────────────────────────────────────────

log_info "Déploiement du backend (Laravel)..."

cd "$APP_PATH/backend-laravel"

# Copy environment file if it doesn't exist
if [ ! -f ".env" ]; then
    log_info "Copie du fichier .env..."
    cp "$APP_PATH/deploy/.env.production" .env
    log_warning "⚠️  IMPORTANT: Éditez .env avec vos paramètres de production!"
    log_warning "   - APP_KEY (php artisan key:generate)"
    log_warning "   - DB_PASSWORD"
    log_warning "   - MAIL_* credentials"
    log_warning "   - SMS/WhatsApp credentials"
fi

# Install PHP dependencies
log_info "Installation des dépendances PHP..."
composer install --optimize-autoloader --no-dev

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    log_info "Génération de la clé applicative..."
    php artisan key:generate
fi

# Run migrations
log_info "Exécution des migrations..."
php artisan migrate --force

# Run schema seeding if first deployment
if [ ! -f "$APP_PATH/.deployed" ]; then
    log_info "Première installation - Exécution du schéma..."
    php artisan db:seed-schema
fi

# Cache configuration and routes
log_info "Mise en cache de la configuration..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
log_info "Configuration des permissions..."
chown -R $APP_USER:$APP_GROUP "$APP_PATH/backend-laravel"
chmod -R 755 "$APP_PATH/backend-laravel"
chmod -R 775 "$APP_PATH/backend-laravel/storage"
chmod -R 775 "$APP_PATH/backend-laravel/bootstrap/cache"

log_success "Backend déployé avec succès"

# ─────────────────────────────────────────────────────────────────────────────
# Frontend deployment (React)
# ─────────────────────────────────────────────────────────────────────────────

log_info "Déploiement du frontend (React)..."

cd "$APP_PATH/frontend"

# Install dependencies
log_info "Installation des dépendances Node..."
npm ci --production

# Build for production
log_info "Build de la production..."
npm run build

# Set permissions
log_info "Configuration des permissions..."
chown -R $APP_USER:$APP_GROUP "$APP_PATH/frontend/dist"
chmod -R 755 "$APP_PATH/frontend/dist"

log_success "Frontend déployé avec succès"

# ─────────────────────────────────────────────────────────────────────────────
# Web server configuration
# ─────────────────────────────────────────────────────────────────────────────

log_info "Configuration du serveur web (Nginx)..."

# Copy Nginx configuration
if [ ! -f "/etc/nginx/sites-available/$DOMAIN" ]; then
    log_info "Création de la configuration Nginx..."
    sed "s|DOMAIN|$DOMAIN|g; s|APP_PATH|$APP_PATH|g" \
        "$APP_PATH/deploy/nginx.conf" > "/etc/nginx/sites-available/$DOMAIN"

    # Enable site
    ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"
fi

# Test Nginx configuration
log_info "Test de la configuration Nginx..."
nginx -t || log_error "Erreur dans la configuration Nginx"

# Reload Nginx
systemctl reload nginx || log_error "Impossible de recharger Nginx"

log_success "Nginx configuré"

# ─────────────────────────────────────────────────────────────────────────────
# SSL/TLS Certificate (Let's Encrypt)
# ─────────────────────────────────────────────────────────────────────────────

if command -v certbot &> /dev/null; then
    if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        log_info "Création du certificat SSL/TLS..."
        certbot certonly --webroot --webroot-path "$APP_PATH/frontend/dist" \
            -d "$DOMAIN" --agree-tos --email "admin@$DOMAIN" --non-interactive || \
            log_warning "Impossible de créer le certificat SSL automatiquement. À faire manuellement."
    fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# Final steps
# ─────────────────────────────────────────────────────────────────────────────

log_info "Étapes finales..."

# Create deployment marker
touch "$APP_PATH/.deployed"

# Show summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║ 🎉 DÉPLOIEMENT TERMINÉ AVEC SUCCÈS!                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "📍 Application accessible sur: ${BLUE}https://$DOMAIN${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Éditez .env avec vos paramètres:"
echo "      - APP_KEY (exécutez: php artisan key:generate)"
echo "      - Identifiants de la base de données"
echo "      - Clés SMS/WhatsApp"
echo "   2. Testez l'application: https://$DOMAIN"
echo "   3. Vérifiez les logs:"
echo "      - Backend: tail -f $APP_PATH/backend-laravel/storage/logs/laravel.log"
echo "      - Nginx: tail -f /var/log/nginx/access.log"
echo ""
echo "🔗 Ressources utiles:"
echo "   - Déploiement Laravel: https://laravel.com/docs/deployment"
echo "   - Configuration Nginx: $APP_PATH/deploy/nginx.conf"
echo "   - Maintenance: systemctl restart nginx / php-fpm"
echo ""
