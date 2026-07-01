#!/bin/bash

# ═════════════════════════════════════════════════════════════════════════════
# NAFA — Post-Deployment Verification Script
# Vérifie que tout fonctionne correctement après le déploiement
# ═════════════════════════════════════════════════════════════════════════════

set -e

DOMAIN="${1:-nafa.example.com}"
APP_PATH="/var/www/nafa"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Helper functions
log_check() { echo -e "${BLUE}ℹ️  $1...${NC}"; }
log_pass() { echo -e "${GREEN}✅ $1${NC}"; PASSED=$((PASSED+1)); }
log_fail() { echo -e "${RED}❌ $1${NC}"; FAILED=$((FAILED+1)); }
log_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; WARNINGS=$((WARNINGS+1)); }

# ─────────────────────────────────────────────────────────────────────────────
# 1. Service checks
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}1️⃣  Vérification des services${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "PHP-FPM"
if systemctl is-active --quiet php8.2-fpm; then
    log_pass "PHP-FPM est actif"
else
    log_fail "PHP-FPM n'est pas actif"
fi

log_check "Nginx"
if systemctl is-active --quiet nginx; then
    log_pass "Nginx est actif"
else
    log_fail "Nginx n'est pas actif"
fi

log_check "MySQL"
if systemctl is-active --quiet mysql; then
    log_pass "MySQL est actif"
else
    log_fail "MySQL n'est pas actif"
fi

log_check "Redis"
if systemctl is-active --quiet redis-server; then
    log_pass "Redis est actif"
else
    log_warn "Redis n'est pas actif (optionnel)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 2. Network checks
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}2️⃣  Vérification des ports réseau${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Port 80 (HTTP)"
if netstat -tuln 2>/dev/null | grep -q ":80 "; then
    log_pass "Port 80 ouvert"
else
    log_fail "Port 80 fermé"
fi

log_check "Port 443 (HTTPS)"
if netstat -tuln 2>/dev/null | grep -q ":443 "; then
    log_pass "Port 443 ouvert"
else
    log_fail "Port 443 fermé"
fi

log_check "Port 3306 (MySQL)"
if netstat -tuln 2>/dev/null | grep -q ":3306 "; then
    log_pass "Port 3306 ouvert"
else
    log_fail "Port 3306 fermé"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 3. Application files
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}3️⃣  Vérification des fichiers d'application${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Répertoire d'application"
if [ -d "$APP_PATH" ]; then
    log_pass "Répertoire $APP_PATH existe"
else
    log_fail "Répertoire $APP_PATH manquant"
fi

log_check "Backend (Laravel)"
if [ -f "$APP_PATH/backend-laravel/artisan" ]; then
    log_pass "Laravel installé"
else
    log_fail "Laravel manquant"
fi

log_check "Frontend (React build)"
if [ -f "$APP_PATH/frontend/dist/index.html" ]; then
    log_pass "Build React existe"
else
    log_fail "Build React manquant"
fi

log_check "Fichier .env"
if [ -f "$APP_PATH/backend-laravel/.env" ]; then
    log_pass "Fichier .env existe"
else
    log_fail "Fichier .env manquant"
fi

log_check "Nginx config"
if [ -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    log_pass "Configuration Nginx trouvée"
else
    log_fail "Configuration Nginx manquante"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 4. Database checks
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}4️⃣  Vérification de la base de données${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Connexion MySQL"
if mysql -u nafa_user -p$(grep DB_PASSWORD "$APP_PATH/backend-laravel/.env" | cut -d '=' -f 2) -e "SELECT 1;" &>/dev/null; then
    log_pass "Connexion MySQL fonctionne"
else
    log_fail "Impossible de se connecter à MySQL"
fi

log_check "Base de données Nafa"
if mysql -u nafa_user -p$(grep DB_PASSWORD "$APP_PATH/backend-laravel/.env" | cut -d '=' -f 2) -e "USE nafa; SELECT 1;" &>/dev/null; then
    log_pass "Base de données Nafa existe"
else
    log_fail "Base de données Nafa manquante"
fi

log_check "Tables Laravel"
TABLE_COUNT=$(mysql -u nafa_user -p$(grep DB_PASSWORD "$APP_PATH/backend-laravel/.env" | cut -d '=' -f 2) -N -e "USE nafa; SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='nafa';" 2>/dev/null || echo 0)
if [ "$TABLE_COUNT" -gt 10 ]; then
    log_pass "Tables Laravel présentes ($TABLE_COUNT tables)"
else
    log_fail "Pas assez de tables ($TABLE_COUNT found)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 5. SSL Certificate
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}5️⃣  Vérification du certificat SSL/TLS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Certificat SSL pour $DOMAIN"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    CERT_DATE=$(openssl x509 -enddate -noout -in "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" | cut -d= -f 2)
    log_pass "Certificat SSL trouvé (expire: $CERT_DATE)"
else
    log_fail "Certificat SSL manquant"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 6. HTTP/HTTPS checks
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}6️⃣  Vérification HTTP/HTTPS${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "HTTP → HTTPS redirect"
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_pass "HTTP redirige vers HTTPS"
else
    log_warn "HTTP response: $HTTP_RESPONSE (attendu: 301 ou 302)"
fi

log_check "HTTPS frontend"
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null || echo "000")
if [ "$HTTPS_RESPONSE" = "200" ] || [ "$HTTPS_RESPONSE" = "301" ] || [ "$HTTPS_RESPONSE" = "302" ]; then
    log_pass "HTTPS frontend répond ($HTTPS_RESPONSE)"
else
    log_fail "HTTPS frontend ne répond pas ($HTTPS_RESPONSE)"
fi

log_check "HTTPS API health"
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN/api/health 2>/dev/null || echo "000")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    log_pass "API backend répond"
else
    log_warn "API response: $API_RESPONSE"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 7. Security headers
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}7️⃣  Vérification des en-têtes de sécurité${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Strict-Transport-Security"
if curl -s -I https://$DOMAIN 2>/dev/null | grep -q "Strict-Transport-Security"; then
    log_pass "Header HSTS présent"
else
    log_warn "Header HSTS manquant"
fi

log_check "X-Content-Type-Options"
if curl -s -I https://$DOMAIN 2>/dev/null | grep -q "X-Content-Type-Options"; then
    log_pass "Header X-Content-Type-Options présent"
else
    log_warn "Header X-Content-Type-Options manquant"
fi

log_check "X-Frame-Options"
if curl -s -I https://$DOMAIN 2>/dev/null | grep -q "X-Frame-Options"; then
    log_pass "Header X-Frame-Options présent"
else
    log_warn "Header X-Frame-Options manquant"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 8. File permissions
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}8️⃣  Vérification des permissions${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

log_check "Storage writable"
if [ -w "$APP_PATH/backend-laravel/storage" ]; then
    log_pass "Répertoire storage est accessible"
else
    log_fail "Répertoire storage n'est pas accessible"
fi

log_check "Bootstrap cache writable"
if [ -w "$APP_PATH/backend-laravel/bootstrap/cache" ]; then
    log_pass "Répertoire bootstrap/cache est accessible"
else
    log_fail "Répertoire bootstrap/cache n'est pas accessible"
fi

# ─────────────────────────────────────────────────────────────────────────────
# 9. Disk space
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}9️⃣  Vérification des ressources${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
log_check "Espace disque"
if [ "$DISK_USAGE" -lt 80 ]; then
    log_pass "Espace disque suffisant ($DISK_USAGE%)"
else
    log_warn "Espace disque faible ($DISK_USAGE%)"
fi

MEM_USAGE=$(free | awk 'NR==2 {print int($3/$2 * 100)}')
log_check "Mémoire disponible"
if [ "$MEM_USAGE" -lt 80 ]; then
    log_pass "Mémoire suffisante ($MEM_USAGE%)"
else
    log_warn "Mémoire faible ($MEM_USAGE%)"
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📊 Résumé${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

TOTAL=$((PASSED + FAILED + WARNINGS))

echo -e "${GREEN}✅ Réussi: $PASSED${NC}"
echo -e "${RED}❌ Échoué: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Avertissements: $WARNINGS${NC}"

if [ "$FAILED" -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 DÉPLOIEMENT RÉUSSI! L'application est prête.${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}⚠️  Des vérifications ont échoué. Vérifiez les logs.${NC}"
    exit 1
fi
