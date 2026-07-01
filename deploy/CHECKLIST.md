# ✅ NAFA — Checklist de Déploiement

## 🔧 Avant le déploiement

- [ ] Vérifier que tout le code est committé et pushé sur GitHub
- [ ] Tester localement sur `localhost:5173` et `localhost:8000`
- [ ] Vérifier les variables d'environnement sensibles ne sont pas en `.env` committé
- [ ] Générer une clé APP_KEY: `php artisan key:generate`
- [ ] Tester la connexion à MySQL localement
- [ ] Vérifier que le `.env` n'est PAS pushé (vérifié dans `.gitignore`)
- [ ] Préparer les identifiants MySQL pour le VPS
- [ ] Préparer la configuration des services (Email, SMS, WhatsApp)
- [ ] Préparer le nom de domaine

## 🚀 Déploiement sur VPS

### Phase 1: Préparation du VPS (First Time Only)
- [ ] Accès SSH au VPS confirmé
- [ ] Os confirmé: Ubuntu 22.04 LTS
- [ ] Télécharger `setup-vps.sh`
- [ ] Exécuter `sudo bash setup-vps.sh` (attendre ~20 min)
- [ ] Vérifier que tous les services sont installés:
  ```bash
  php -v          # PHP 8.2
  composer -v     # Composer
  node -v         # Node.js 18+
  npm -v          # npm
  mysql --version # MySQL 8.0
  nginx -v        # Nginx
  redis-cli -v    # Redis
  ```
- [ ] Vérifier le pare-feu: `sudo ufw status`
- [ ] Créer l'utilisateur et la DB MySQL
  ```sql
  CREATE USER 'nafa_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD';
  CREATE DATABASE nafa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  GRANT ALL PRIVILEGES ON nafa.* TO 'nafa_user'@'localhost';
  FLUSH PRIVILEGES;
  ```
- [ ] Configurer le DNS (A record pointant vers VPS IP)
- [ ] Attendre la propagation DNS (~5-30 min)

### Phase 2: Déploiement du code
- [ ] Télécharger `deploy.sh`
- [ ] Rendre exécutable: `chmod +x deploy.sh`
- [ ] Exécuter: `sudo bash deploy.sh your-domain.com main`
- [ ] Attendre ~10 minutes
- [ ] Vérifier que le déploiement s'est terminé sans erreurs

### Phase 3: Configuration post-déploiement
- [ ] Éditer `.env` du backend:
  ```bash
  sudo nano /var/www/nafa/backend-laravel/.env
  ```
  - [ ] Vérifier APP_URL=https://your-domain.com
  - [ ] Vérifier DB_PASSWORD est correct
  - [ ] Configurer MAIL_* (optionnel)
  - [ ] Configurer SMS_* (optionnel)
  - [ ] Configurer WHATSAPP_* (optionnel)

- [ ] Générer la clé d'application:
  ```bash
  cd /var/www/nafa/backend-laravel
  php artisan key:generate
  ```

- [ ] Mettez en cache la configuration:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```

- [ ] Créer un utilisateur administrateur:
  ```bash
  php artisan tinker
  # DB::table('users')->insert([...]);
  ```

- [ ] Redémarrer les services:
  ```bash
  sudo systemctl restart php8.2-fpm nginx
  ```

### Phase 4: Vérification et tests
- [ ] Vérifier que le certificat SSL est créé:
  ```bash
  ls -la /etc/letsencrypt/live/your-domain.com/
  ```

- [ ] Accès HTTP redirige vers HTTPS:
  ```bash
  curl -i http://your-domain.com
  # Doit voir "301 Moved Permanently"
  ```

- [ ] Accès HTTPS fonctionne:
  ```bash
  curl -i https://your-domain.com
  # Doit voir "200 OK" ou redirect vers /index.html
  ```

- [ ] Page de connexion affichée: https://your-domain.com
- [ ] Connexion avec l'admin créé fonctionne
- [ ] Dashboard charge correctement
- [ ] Les données de référence sont accessibles
- [ ] Upload de fichier fonctionne
- [ ] Les logs ne montrent pas d'erreurs:
  ```bash
  tail -f /var/www/nafa/backend-laravel/storage/logs/laravel.log
  tail -f /var/log/nginx/your-domain.com-error.log
  ```

## 🔒 Sécurité post-déploiement

- [ ] Changez les permissions de base:
  ```bash
  cd /var/www/nafa
  sudo chown -R www-data:www-data .
  sudo chmod -R 755 .
  sudo chmod -R 775 backend-laravel/storage
  sudo chmod -R 775 backend-laravel/bootstrap/cache
  ```

- [ ] Vérifiez que .env ne contient pas de secrets:
  ```bash
  cat /var/www/nafa/backend-laravel/.env | grep -i "password\|token\|key" | wc -l
  # Ne pas montrer en clair sur écran, juste vérifier qu'il existe
  ```

- [ ] Vérifiez les permissions du .env:
  ```bash
  ls -la /var/www/nafa/backend-laravel/.env
  # Doit être: -rw-r--r-- (644) ou -rw------- (600)
  ```

- [ ] Configurez UFW pour n'accepter que les connexions essentielles:
  ```bash
  sudo ufw status
  # Doit montrer: 22/tcp, 80/tcp, 443/tcp ALLOW
  ```

- [ ] Vérifiez que SSH n'utilise pas le port par défaut (optionnel mais recommandé)

- [ ] Activez les mises à jour de sécurité automatiques:
  ```bash
  sudo apt-get install -y unattended-upgrades
  ```

- [ ] Vérifiez le SSL/TLS:
  ```bash
  curl -I https://your-domain.com | grep -i "strict\|frame\|xss\|type"
  # Doit voir les headers de sécurité
  ```

## 📊 Monitoring initial

- [ ] Vérifiez l'espace disque:
  ```bash
  df -h
  ```

- [ ] Vérifiez la mémoire:
  ```bash
  free -h
  ```

- [ ] Vérifiez les processus actifs:
  ```bash
  ps aux | grep -E "nginx|php|mysql" | wc -l
  # Doit montrer au moins 5-10 processus
  ```

- [ ] Vérifiez que les cronjobs sont configurés (backups, maintenance)

## 🎯 Go-Live checklist

- [ ] L'application est accessible et fonctionnelle
- [ ] Les utilisateurs peuvent se connecter
- [ ] Les données de référence sont complètes
- [ ] Les certificats SSL sont valides (voir le cadenas vert)
- [ ] Les logs n'affichent pas d'erreurs critiques
- [ ] Performance acceptable (<2s pour les pages)
- [ ] Prise de sauvegarde de la base de données
- [ ] Notification envoyée aux utilisateurs du lancement
- [ ] Support utilisateur contactable

## 🔄 Maintenance préventive mensuelle

- [ ] [ ] Vérification des logs d'erreur
- [ ] [ ] Vérification de l'espace disque
- [ ] [ ] Sauvegarde de la base de données
- [ ] [ ] Mises à jour de sécurité PHP/MySQL/Nginx
- [ ] [ ] Renouvellement du certificat SSL (automatique, juste vérifier)
- [ ] [ ] Performance de l'application (requêtes lentes, mémoire)
- [ ] [ ] Vérification des backups

## 📝 Notes d'après-déploiement

```
Domain: ___________________________
IP Address: _______________________
MySQL User: _______________________
MySQL Password: ____________________
Admin Email: _______________________
Admin Password: _____________________
Support Contact: _____________________
```

---

**État du déploiement**: [ ] En cours  [ ] Réussi  [ ] En attente

**Date**: _______________
**Déployé par**: _______________
**Validé par**: _______________
