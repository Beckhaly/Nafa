# 🔧 Prérequis avant déploiement

Ce document explique comment préparer votre VPS et configurer les outils nécessaires pour déployer Nafa.

---

## 1️⃣ VPS ou serveur Linux

### Recommandations matérielles

| Métrique | Minimum | Recommandé | Production |
|----------|---------|-----------|------------|
| **CPU** | 1 core | 2 cores | 4+ cores |
| **RAM** | 1 GB | 2 GB | 4+ GB |
| **Disque** | 10 GB | 20 GB | 50+ GB |
| **OS** | Ubuntu 20.04 | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

### Fournisseurs recommandés

- **Hertzner Cloud** (fiable, bon rapport qualité/prix)
- **DigitalOcean** (droplets, support excellent)
- **Linode** (fiable, bonne documentation)
- **Vultr** (global, bons performances)
- **AWS/Azure/GCP** (si vous avez déjà une infrastructure)

### Configuration initiale

```bash
# 1. SSH sur votre VPS
ssh root@your-vps-ip

# 2. Changez le mot de passe root
passwd

# 3. Créez un utilisateur non-root (optionnel mais recommandé)
adduser deploy
usermod -aG sudo deploy

# 4. Configurez SSH (optionnel)
# Changez le port de 22 à autre chose (ex: 2222)
sudo nano /etc/ssh/sshd_config
# Trouvez: #Port 22
# Remplacez par: Port 2222
sudo systemctl restart sshd

# 5. Configurez le pare-feu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

## 2️⃣ Configuration du domaine

### Acheter un domaine

Utilisez n'importe quel registraire:
- **Namecheap** (bon prix)
- **GoDaddy** (populaire)
- **OVH** (bon support français)
- **Gandi** (transparent)

### Configurer le DNS

Une fois votre VPS lancé, pointez votre domaine vers l'IP du VPS:

**Configuration DNS (A record)**:
```
Domaine: nafa.exemple.com
Type: A (ou AAAA pour IPv6)
Valeur: 123.45.67.89  (remplacez par votre VPS IP)
TTL: 3600 (ou auto)
```

**Vérifier la propagation**:
```bash
# Depuis votre machine locale
nslookup nafa.exemple.com
# ou
dig nafa.exemple.com
```

**Attendez**: La propagation DNS peut prendre 5 minutes à 24 heures (généralement <30 min)

---

## 3️⃣ Git et GitHub

### Créer un repository GitHub

1. **Créez un compte GitHub**: https://github.com/join
2. **Créez un nouveau repository**:
   - Nom: `nafa`
   - Visibilité: Privé (recommandé) ou Public
   - Cochez: "Initialize this repository with a README"

3. **Clonez localement**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/nafa.git
   cd nafa
   ```

4. **Copiez le code Nafa**:
   ```bash
   # Copiez tout du projet original
   cp -r ../nafa-original/* .
   ```

5. **Pushez sur GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit: Nafa application"
   git push origin main
   ```

### Configuration SSH de GitHub

Sur votre machine locale:

```bash
# Générez une clé SSH (si vous n'en avez pas)
ssh-keygen -t ed25519 -C "your-email@example.com"

# Copiez la clé publique
cat ~/.ssh/id_ed25519.pub

# Ajoutez à GitHub:
# 1. Allez à https://github.com/settings/keys
# 2. Cliquez "New SSH key"
# 3. Collez la clé publique
```

---

## 4️⃣ Accès SSH au VPS

### Générer des clés SSH pour le VPS

Sur votre machine locale (Windows, Mac, Linux):

```bash
# Générez une nouvelle clé SSH pour le VPS
ssh-keygen -t ed25519 -C "vps-deploy" -f ~/.ssh/vps_key

# Gardez la passphrase vide pour un accès sans mot de passe
# (optionnel, plus sûr si vous la mettez)
```

### Configurer l'accès SSH sur le VPS

Sur le VPS (via root ou sudo):

```bash
# 1. Créez le répertoire .ssh
mkdir -p ~/.ssh

# 2. Copiez votre clé publique depuis la machine locale vers le VPS
# (exécutez cette commande depuis votre machine locale)
ssh-copy-id -i ~/.ssh/vps_key.pub root@your-vps-ip

# OU manuellement:
# 1. Affichez votre clé publique
cat ~/.ssh/vps_key.pub

# 2. Sur le VPS, collez-la dans ~/.ssh/authorized_keys
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys

# 3. Définissez les permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Testez la connexion SSH

```bash
# Devrait fonctionner sans mot de passe
ssh -i ~/.ssh/vps_key root@your-vps-ip
```

---

## 5️⃣ Secrets GitHub (pour CI/CD optionnel)

Si vous voulez utiliser GitHub Actions pour le déploiement automatique:

### Créer les secrets GitHub

1. Allez sur: `https://github.com/YOUR_USERNAME/nafa/settings/secrets/actions`

2. Cliquez "New repository secret" et ajoutez:

**VPS_HOST**:
```
your-vps-ip-or-domain.com
```

**VPS_USER**:
```
root
# ou votre utilisateur non-root
```

**VPS_KEY**:
```
# Copiez le contenu complet de ~/.ssh/vps_key (clé privée)
# Commencez par: -----BEGIN OPENSSH PRIVATE KEY-----
# Finissez par: -----END OPENSSH PRIVATE KEY-----
```

**VPS_DOMAIN**:
```
nafa.exemple.com
```

**SLACK_WEBHOOK** (optionnel, pour les notifications):
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 6️⃣ Configuration locale de déploiement

### Téléchargez les scripts de déploiement

```bash
# Sur votre machine locale
cd /tmp

# Téléchargez les scripts depuis GitHub
wget https://github.com/YOUR_USERNAME/nafa/raw/main/deploy/setup-vps.sh
wget https://github.com/YOUR_USERNAME/nafa/raw/main/deploy/deploy.sh
wget https://github.com/YOUR_USERNAME/nafa/raw/main/deploy/verify-deployment.sh

# Rendez-les exécutables
chmod +x *.sh
```

### Préparez votre machine locale

**Pré-requis**:
- Git installé
- SSH configuré (clés)
- Accès à votre VPS

**Vérifiez l'accès**:
```bash
# Devrait fonctionner sans demander de mot de passe
ssh -i ~/.ssh/vps_key root@your-vps-ip "hostname"
```

---

## 7️⃣ Checklist avant déploiement

- [ ] Domaine acheté
- [ ] VPS loué et accessible
- [ ] DNS pointé vers VPS IP
- [ ] GitHub repository créé
- [ ] Code pushé sur GitHub (main branch)
- [ ] Clés SSH générées pour accès VPS
- [ ] `.env.production` prêt avec vos paramètres
- [ ] Scripts de déploiement téléchargés
- [ ] SSH fonctionne sans mot de passe
- [ ] Identifiants MySQL prêts (user/password)
- [ ] Clés API SMS/WhatsApp (si utilisées)
- [ ] Support/équipe notifiée du déploiement prévu

---

## 🔐 Sécurité - Points clés

✅ **À FAIRE**:
- ✅ Utilisez des clés SSH au lieu de mots de passe
- ✅ Gardez les clés privées locales, jamais en GitHub
- ✅ Utilisez des mots de passe forts pour MySQL
- ✅ Configurez UFW/firewall
- ✅ Utilisez HTTPS (Let's Encrypt)
- ✅ Gardez les secrets en GitHub Secrets
- ✅ Changez le port SSH par défaut (optionnel)

❌ **À ÉVITER**:
- ❌ Pousser le `.env` réel en GitHub
- ❌ Utiliser des mots de passe par défaut
- ❌ Laisser les ports inutiles ouverts
- ❌ Exécuter des services en tant que root (si possible)
- ❌ Partager les clés privées
- ❌ Stocker les secrets en clair

---

## 📊 Ressources supplémentaires

### Tutoriels
- [SSH Setup Guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [DNS Configuration](https://www.cloudflare.com/dns/)
- [Linux Security](https://www.digitalocean.com/community/tutorials/initial-server-setup-with-ubuntu-22-04)

### Outils
- **SSH Client**: 
  - Windows: PuTTY ou PowerShell intégré
  - Mac/Linux: Terminal intégré
- **DNS Checker**: https://mxtoolbox.com/
- **SSL Checker**: https://www.ssllabs.com/ssltest/

### Support
- **GitHub Help**: https://help.github.com/
- **Ubuntu Docs**: https://help.ubuntu.com/
- **SSH Man Pages**: `man ssh` (Linux/Mac)

---

## ❓ Questions fréquentes

**Q: Puis-je utiliser un domaine différent?**  
✅ Oui, n'importe quel domaine fonctionne. Juste pointez le DNS vers votre VPS.

**Q: Dois-je absolument utiliser GitHub?**  
✅ Non, vous pouvez cloner directement sur le VPS via Git sans GitHub.

**Q: Quelle est la différence SSH ED25519 vs RSA?**  
✅ ED25519 est plus moderne, plus sûr, et plus rapide. RSA fonctionne aussi.

**Q: Puis-je changer le port SSH?**  
✅ Oui, mais écrivez-le quelque part! Exemple: `ssh -p 2222 root@vps`

**Q: Comment reset le mot de passe du root?**  
⚠️ Contactez votre fournisseur VPS pour une réinitialisation d'urgence.

**Q: Puis-je déployer sans SSH?**  
❌ Non, vous avez besoin d'accès SSH pour exécuter les scripts.

---

**Prêt? Allez à [DEPLOYMENT.md](DEPLOYMENT.md) pour commencer le déploiement!**
