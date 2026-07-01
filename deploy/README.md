# 🚀 NAFA — Deployment Kit pour VPS Linux

Ce dossier contient tous les outils et documentation nécessaires pour déployer l'application Nafa sur un serveur VPS Linux.

---

## 📂 Structure des fichiers

```
deploy/
├── README.md                    # Ce fichier
├── DEPLOYMENT.md               # Guide complet de déploiement (📖 À lire en premier)
├── CHECKLIST.md                # Checklist de déploiement
├── setup-vps.sh                # Script d'installation initiale du VPS
├── deploy.sh                   # Script de déploiement de l'application
├── verify-deployment.sh        # Script de vérification post-déploiement
├── .env.production             # Template de configuration production
└── nginx.conf                  # Configuration Nginx (serveur web)
```

---

## 🎯 Déploiement rapide (TL;DR)

### Sur votre machine locale:

```bash
# 1. Préparez votre domaine
# - Pointez le DNS vers votre VPS IP
# - Attendez la propagation DNS

# 2. Poussez votre code sur GitHub
git push origin main
```

### Sur le VPS (SSH):

```bash
# 1. Installation initiale (une seule fois, ~20 min)
sudo bash /tmp/setup-vps.sh

# 2. Créez la base de données MySQL
mysql -u root
> CREATE USER 'nafa_user'@'localhost' IDENTIFIED BY 'PASSWORD';
> CREATE DATABASE nafa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
> GRANT ALL PRIVILEGES ON nafa.* TO 'nafa_user'@'localhost';
> FLUSH PRIVILEGES;

# 3. Déployez l'application (~10 min)
sudo bash /tmp/deploy.sh your-domain.com main

# 4. Vérifiez le déploiement
sudo bash /var/www/nafa/deploy/verify-deployment.sh your-domain.com
```

---

## 📖 Documentation complète

### Pour un déploiement complet et détaillé:
👉 **Voir [DEPLOYMENT.md](DEPLOYMENT.md)**

Contient:
- Prérequis matériels et logiciels
- Instructions pas-à-pas
- Configuration des services
- Maintenance et mises à jour
- Dépannage
- Guides de sécurité

### Pour un checklist avant/pendant/après:
👉 **Voir [CHECKLIST.md](CHECKLIST.md)**

Contient:
- Vérifications avant déploiement
- Phases de déploiement
- Vérifications post-déploiement
- Checklist de sécurité
- Maintenance préventive

---

## 🔧 Fichiers de configuration

### `.env.production`
Template de variables d'environnement pour la production. À adapter avec:
- Votre domaine
- Identifiants MySQL
- Clés API (SMS, WhatsApp, Email)
- Paramètres de sécurité

**⚠️ IMPORTANT**: Jamais committer le `.env` réel en Git!

### `nginx.conf`
Configuration serveur web pour Nginx. Automatiquement adaptée lors du déploiement avec:
- Votre domaine
- Chemin d'application
- Certificat SSL/TLS
- En-têtes de sécurité
- Compression gzip
- Cache des assets

---

## 🚀 Scripts de déploiement

### `setup-vps.sh` — Installation initiale
**Exécuté une seule fois sur un VPS neuf**

Installe:
- PHP 8.2 + FPM
- MySQL 8.0
- Nginx
- Node.js 18
- Redis
- Composer
- Certbot (Let's Encrypt)
- Firewall (UFW)

```bash
sudo bash setup-vps.sh
# Durée: ~20 minutes
```

### `deploy.sh` — Déploiement de l'application
**Exécuté à chaque déploiement**

Fait:
- Clone/mise à jour du code depuis GitHub
- Installation des dépendances (Composer, npm)
- Compilation du frontend React
- Migrations de base de données
- Configuration Nginx
- Certificat SSL/TLS

```bash
sudo bash deploy.sh your-domain.com main
# Durée: ~10 minutes
```

### `verify-deployment.sh` — Vérification post-déploiement
**Exécuté après le déploiement pour valider**

Vérifie:
- ✅ État des services (PHP, Nginx, MySQL)
- ✅ Ports réseau ouverts
- ✅ Fichiers d'application présents
- ✅ Connexion à la base de données
- ✅ Certificat SSL/TLS
- ✅ Réponses HTTP/HTTPS
- ✅ En-têtes de sécurité
- ✅ Permissions des fichiers
- ✅ Espace disque et mémoire

```bash
sudo bash /var/www/nafa/deploy/verify-deployment.sh your-domain.com
```

---

## 🔒 Sécurité

Tous les scripts inclent:
- ✅ Validation des droits root
- ✅ Gestion des permissions
- ✅ Configuration du pare-feu
- ✅ Certificats SSL/TLS automatiques
- ✅ En-têtes de sécurité HTTP
- ✅ HTTPS obligatoire avec redirect HTTP
- ✅ Logs d'audit et monitoring
- ✅ Mises à jour de sécurité automatiques

**À faire après déploiement:**
1. Changez le port SSH (optionnel mais recommandé)
2. Configurez les sauvegardes automatiques
3. Configurez le monitoring/alertes
4. Revue de sécurité supplémentaire si production critique

---

## 📊 Monitoring et maintenance

### Vérifier l'état des services

```bash
# État des services
systemctl status nginx php8.2-fpm mysql redis-server

# Logs
tail -f /var/www/nafa/backend-laravel/storage/logs/laravel.log
tail -f /var/log/nginx/your-domain.com-error.log

# Espace disque
df -h
du -sh /var/www/nafa

# Mémoire et CPU
top
htop
```

### Mises à jour

```bash
# Mises à jour système
sudo apt-get update && apt-get upgrade

# Renouvellement SSL
sudo certbot renew

# Mise à jour code
cd /var/www/nafa
git pull origin main
cd backend-laravel && composer install --no-dev && php artisan migrate --force
cd ../frontend && npm ci --production && npm run build
sudo systemctl restart php8.2-fpm nginx
```

### Sauvegarde

```bash
# Sauvegarde manuelle
mysqldump -u nafa_user -p nafa > backup-$(date +%Y%m%d).sql
tar -czf nafa-backup-$(date +%Y%m%d).tar.gz /var/www/nafa

# Configuration crontab (quotidien à 2h du matin)
0 2 * * * mysqldump -u nafa_user -p'PASSWORD' nafa > /backups/nafa-$(date +\%Y\%m\%d).sql
```

---

## 🐛 Dépannage rapide

| Problème | Solution |
|----------|----------|
| 504 Bad Gateway | `sudo systemctl restart php8.2-fpm nginx` |
| Connection refused (MySQL) | `sudo systemctl restart mysql` |
| Certificate not found | `sudo certbot renew -v && sudo systemctl reload nginx` |
| Permission denied | `sudo chown -R www-data:www-data /var/www/nafa` |
| Disque plein | `df -h` et nettoyer `/var/log` ou backups |

Pour plus de solutions, voir [DEPLOYMENT.md#dépannage](DEPLOYMENT.md#dépannage)

---

## 📞 Support

- **Documentation officielle**:
  - Laravel: https://laravel.com/docs
  - Nginx: https://nginx.org/en/docs/
  - Let's Encrypt: https://certbot.eff.org/

- **Ressources de sécurité**:
  - OWASP Top 10: https://owasp.org/Top10/
  - NIST Cybersecurity: https://www.nist.gov/
  - Mozilla Security Guidelines: https://infosec.mozilla.org/

- **Communauté**:
  - Laravel Discord: https://discord.gg/laravel
  - Stack Overflow: https://stackoverflow.com/questions/tagged/laravel

---

## 🔄 Workflow de déploiement recommandé

```
┌─────────────────────────────────────────┐
│ 1. Développement local                  │
│    localhost:5173 (frontend)            │
│    localhost:8000 (backend)             │
│                                         │
│ Tests et validations ✅                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 2. Git & GitHub                         │
│                                         │
│ git commit && git push origin main      │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 3. SSH vers VPS                         │
│                                         │
│ sudo bash deploy.sh your-domain.com main│
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 4. Vérification                         │
│                                         │
│ verify-deployment.sh your-domain.com    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│ 5. Go-live!                             │
│                                         │
│ https://your-domain.com                 │
└─────────────────────────────────────────┘
```

---

## 📝 Variables d'environnement essentielles

À configurer dans `.env` après déploiement:

```env
# Domaine
APP_URL=https://your-domain.com

# Base de données
DB_HOST=localhost
DB_DATABASE=nafa
DB_USERNAME=nafa_user
DB_PASSWORD=YOUR_STRONG_PASSWORD

# Clé d'application
APP_KEY=base64:XXXXXXXXXXXXX  # Généré automatiquement

# Email (optionnel)
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_FROM_ADDRESS=noreply@your-domain.com

# SMS/WhatsApp (optionnel)
SMS_PROVIDER=smspro
SMSPRO_API_KEY=your_api_key
WHATSAPP_PROVIDER=twilio
TWILIO_SID=your_sid
```

---

## ✅ Avant de déployer

- [ ] Code committé et pushé sur GitHub
- [ ] Tests passés localement
- [ ] Domaine configuré et DNS propagé
- [ ] Identifiants MySQL prêts
- [ ] Clés API (SMS, WhatsApp) si nécessaire
- [ ] Plan de sauvegarde en place
- [ ] Support utilisateur notifié

---

## 🎯 Après déploiement

- [ ] Application accessible sur https://your-domain.com
- [ ] Utilisateurs peuvent se connecter
- [ ] Tests des fonctionnalités principales
- [ ] Monitoring et logs configurés
- [ ] Sauvegarde de la base de données
- [ ] Notifications utilisateurs du lancement

---

**Dernière mise à jour**: 2026-07-01  
**Version**: 1.0
