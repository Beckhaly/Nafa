# 📋 NAFA — Guide de Déploiement sur VPS Linux

## 📑 Table des matières
1. [Prérequis](#prérequis)
2. [Installation initiale](#installation-initiale)
3. [Déploiement de l'application](#déploiement-de-lapplication)
4. [Configuration post-déploiement](#configuration-post-déploiement)
5. [Maintenance et mises à jour](#maintenance-et-mises-à-jour)
6. [Dépannage](#dépannage)
7. [Sécurité](#sécurité)

---

## 🔧 Prérequis

### Infrastructure requise
- **OS**: Linux (Ubuntu 22.04 LTS recommandé)
- **RAM**: Minimum 2 GB (4 GB recommandé)
- **Disque**: Minimum 20 GB
- **CPU**: 2+ cores
- **Accès**: SSH avec droits sudo
- **Domaine**: Nom de domaine configuré et pointant vers votre VPS

### Outils locaux
- Git
- SSH client
- Navigateur web

---

## 🚀 Installation initiale

### Étape 1: Préparation du VPS

1. **Connectez-vous à votre VPS**
   ```bash
   ssh root@your-vps-ip
   ```

2. **Téléchargez le script de setup**
   ```bash
   wget https://raw.githubusercontent.com/YOUR_GITHUB_USER/nafa/main/deploy/setup-vps.sh
   chmod +x setup-vps.sh
   ```

3. **Exécutez le script de setup initial** (15-20 minutes)
   ```bash
   sudo bash setup-vps.sh
   ```

   Ce script installe:
   - ✅ PHP 8.2 avec extensions
   - ✅ MySQL 8.0
   - ✅ Nginx
   - ✅ Node.js 18 + npm
   - ✅ Redis
   - ✅ Composer
   - ✅ Certbot (SSL/TLS)
   - ✅ Firewall (UFW)

4. **Créez l'utilisateur et la base de données MySQL**
   ```bash
   mysql -u root
   ```

   Dans MySQL:
   ```sql
   CREATE USER 'nafa_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
   CREATE DATABASE nafa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   GRANT ALL PRIVILEGES ON nafa.* TO 'nafa_user'@'localhost';
   FLUSH PRIVILEGES;
   EXIT;
   ```

### Étape 2: Configuration du DNS

Pointez votre domaine vers l'adresse IP du VPS:
- **Type A**: `your-domain.com` → `VPS_IP_ADDRESS`
- **Type A**: `www.your-domain.com` → `VPS_IP_ADDRESS` (optionnel)

Attendez la propagation DNS (peut prendre 24h max, généralement 5-30 min).

---

## 📦 Déploiement de l'application

### Étape 1: Clonez et déployez

1. **Téléchargez le script de déploiement**
   ```bash
   cd /tmp
   wget https://raw.githubusercontent.com/YOUR_GITHUB_USER/nafa/main/deploy/deploy.sh
   chmod +x deploy.sh
   ```

2. **Exécutez le déploiement** (5-10 minutes)
   ```bash
   sudo bash deploy.sh your-domain.com main
   ```

   Remplacez:
   - `your-domain.com` par votre domaine
   - `main` par la branche Git (optionnel)

3. **Le script va:**
   - ✅ Cloner le code depuis GitHub
   - ✅ Installer les dépendances PHP (Composer)
   - ✅ Installer les dépendances Node.js
   - ✅ Compiler le frontend React
   - ✅ Exécuter les migrations database
   - ✅ Configurer Nginx
   - ✅ Créer un certificat SSL/TLS (Let's Encrypt)

---

## ⚙️ Configuration post-déploiement

### Étape 1: Éditez le fichier .env

```bash
sudo nano /var/www/nafa/backend-laravel/.env
```

Éléments clés à configurer:

```env
# Application
APP_URL=https://your-domain.com
APP_KEY=base64:XXXXXXXXXXXXX  # Généré par le script

# Database
DB_HOST=localhost
DB_DATABASE=nafa
DB_USERNAME=nafa_user
DB_PASSWORD=YOUR_STRONG_PASSWORD  # Le mot de passe MySQL créé

# Email (optionnel)
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2465
MAIL_USERNAME=your_mailtrap_username
MAIL_PASSWORD=your_mailtrap_password

# SMS/WhatsApp (optionnel)
SMS_PROVIDER=smspro
SMSPRO_API_KEY=your_api_key
WHATSAPP_PROVIDER=twilio
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token
```

### Étape 2: Générez la clé d'application Laravel

```bash
cd /var/www/nafa/backend-laravel
php artisan key:generate
```

### Étape 3: Exécutez les commandes finales

```bash
cd /var/www/nafa/backend-laravel

# Mettez en cache la configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Redémarrez les services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

### Étape 4: Créez un utilisateur administrateur

```bash
php artisan tinker

DB::table('users')->insert([
    'name' => 'Administrateur',
    'email' => 'admin@your-domain.com',
    'password' => bcrypt('temporary_password_123'),
    'role_id' => 1,
    'is_active' => 1
]);

exit;
```

Changez le mot de passe lors de la première connexion.

### Étape 5: Testez l'application

Visitez `https://your-domain.com` et connectez-vous avec:
- **Email**: admin@your-domain.com
- **Mot de passe**: temporary_password_123

---

## 🔄 Maintenance et mises à jour

### Mise à jour du code

Pour déployer une nouvelle version:

```bash
cd /var/www/nafa
git pull origin main

# Backend
cd backend-laravel
composer install --optimize-autoloader --no-dev
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Frontend
cd ../frontend
npm ci --production
npm run build

# Redémarrage
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

### Sauvegarde de la base de données

```bash
# Sauvegarde manuelle
mysqldump -u nafa_user -p nafa > /backups/nafa-$(date +%Y%m%d-%H%M%S).sql

# Sauvegarde automatique quotidienne (Crontab)
0 2 * * * mysqldump -u nafa_user -p'PASSWORD' nafa > /backups/nafa-$(date +\%Y\%m\%d).sql
```

### Monitoring des logs

```bash
# Logs Laravel
tail -f /var/www/nafa/backend-laravel/storage/logs/laravel.log

# Logs Nginx
tail -f /var/log/nginx/your-domain.com-error.log
tail -f /var/log/nginx/your-domain.com-access.log

# Logs PHP-FPM
tail -f /var/log/php8.2-fpm.log
```

### Renouvellement SSL automatique

```bash
# Test du renouvellement
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré par défaut
# Vérifiez avec:
sudo systemctl status certbot.timer
```

---

## 🔐 Sécurité

### ✅ Bonnes pratiques

1. **Firewall**
   ```bash
   # N'autoriser que les ports essentiels
   sudo ufw status
   sudo ufw allow 22/tcp  # SSH
   sudo ufw allow 80/tcp  # HTTP
   sudo ufw allow 443/tcp # HTTPS
   ```

2. **SSH Security**
   ```bash
   # Changez le port SSH par défaut
   sudo nano /etc/ssh/sshd_config
   # Port 2222
   
   # Redémarrez SSH
   sudo systemctl restart sshd
   ```

3. **Permissions des fichiers**
   ```bash
   cd /var/www/nafa
   
   # Répertoire de stockage
   sudo chmod -R 775 backend-laravel/storage
   sudo chmod -R 775 backend-laravel/bootstrap/cache
   
   # Propriétaire
   sudo chown -R www-data:www-data .
   ```

4. **Variables d'environnement sensibles**
   ```bash
   # Ne commitez JAMAIS le .env en Git
   # Vérifiez que .env est dans .gitignore
   grep -i ".env" /var/www/nafa/.gitignore
   ```

5. **Mises à jour de sécurité**
   ```bash
   # Mises à jour automatiques
   sudo apt-get install -y unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

### 🚨 En cas d'incident

1. **Vérifiez les logs**
   ```bash
   tail -f /var/log/nginx/your-domain.com-error.log
   tail -f /var/www/nafa/backend-laravel/storage/logs/laravel.log
   ```

2. **Vérifiez les connexions MySQL**
   ```bash
   mysql -u nafa_user -p
   SHOW PROCESSLIST;
   ```

3. **Redémarrez les services**
   ```bash
   sudo systemctl restart nginx php8.2-fpm mysql
   ```

---

## 🐛 Dépannage

### "504 Bad Gateway"
```bash
# Vérifiez PHP-FPM
sudo systemctl status php8.2-fpm
sudo systemctl restart php8.2-fpm

# Vérifiez les logs PHP
tail -f /var/log/php8.2-fpm.log
```

### "Connection refused" (MySQL)
```bash
# Vérifiez MySQL
sudo systemctl status mysql
sudo systemctl restart mysql

# Testez la connexion
mysql -u nafa_user -p -h localhost nafa -e "SELECT 1;"
```

### "Permission denied" (storage)
```bash
cd /var/www/nafa/backend-laravel
sudo chown -R www-data:www-data storage bootstrap
sudo chmod -R 775 storage bootstrap/cache
```

### Les fichiers uploadés ne sont pas accessibles
```bash
# Vérifiez les permissions du stockage
sudo chmod -R 755 /var/www/nafa/backend-laravel/storage/app/public

# Régénérez le lien symbolique
php artisan storage:link
```

### "Certificate not found" après SSL
```bash
# Attendez quelques secondes après le déploiement
# Les certificats Let's Encrypt peuvent prendre du temps

# Renouvelez manuellement
sudo certbot renew -v

# Rechargez Nginx
sudo systemctl reload nginx
```

---

## 📊 Monitoring et Alertes

### Vérifiez l'espace disque
```bash
df -h
```

### Vérifiez la mémoire
```bash
free -h
htop
```

### Vérifiez l'état des services
```bash
systemctl status nginx
systemctl status php8.2-fpm
systemctl status mysql
systemctl status redis-server
```

### Créez une alerte automatique (Cron)
```bash
# Vérifie l'espace disque toutes les heures
0 * * * * df -h | grep -q "9[5-9]%\|100%" && echo "⚠️ Alerte: Disque presque plein!" | mail -s "VPS Alert" admin@your-domain.com
```

---

## 📞 Support et ressources

- **Documentation Laravel**: https://laravel.com/docs
- **Documentation Nginx**: https://nginx.org/en/docs/
- **Documentation Let's Encrypt**: https://certbot.eff.org/
- **Guides de sécurité**: https://owasp.org/Top10/
- **GitHub Nafa**: https://github.com/YOUR_GITHUB_USER/nafa

---

**Dernière mise à jour**: 2026-07-01
