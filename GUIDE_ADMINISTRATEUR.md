# 🔐 NAFA — Guide Administrateur

## Table des matières
1. [Rôles et permissions](#-rôles-et-permissions)
2. [Gestion des utilisateurs](#-gestion-des-utilisateurs)
3. [Gestion des données de référence](#-gestion-des-données-de-référence)
4. [Maintenance](#-maintenance)
5. [Sécurité](#-sécurité)
6. [Monitoring](#-monitoring)
7. [Sauvegardes](#-sauvegardes)
8. [Dépannage avancé](#-dépannage-avancé)

---

## 👥 Rôles et permissions

### Système de rôles

Nafa dispose de 5 rôles avec permissions croissantes:

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **Lecteur** | Consultation uniquement | Voir toutes les données |
| **Secrétaire** | Gestion membres & événements | Crud membres, événements, annonces |
| **Trésorier** | Gestion finances | Enregistrer cotisations, prêts, dépenses |
| **Admin** | Accès complet sauf paramètres système | Accès complet + Utilisateurs |
| **Super Admin** | Accès total | Tout + Paramètres système |

### Hiérarchie des rôles

```
Super Admin (root)
    ↓
Admin (gestion complète)
    ↓
Trésorier (finances) + Secrétaire (opérationnel)
    ↓
Lecteur (consultation)
```

### Permissions détaillées

| Fonctionnalité | Lecteur | Secrétaire | Trésorier | Admin | Super Admin |
|---|---|---|---|---|---|
| Voir membres | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ajouter membre | ❌ | ✅ | ❌ | ✅ | ✅ |
| Modifier membre | ❌ | ✅ | ❌ | ✅ | ✅ |
| Supprimer membre | ❌ | ❌ | ❌ | ✅ | ✅ |
| Enregistrer cotisation | ❌ | ❌ | ✅ | ✅ | ✅ |
| Créer prêt | ❌ | ❌ | ✅ | ✅ | ✅ |
| Créer événement | ❌ | ✅ | ❌ | ✅ | ✅ |
| Publier annonce | ❌ | ✅ | ❌ | ✅ | ✅ |
| Voir rapports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer utilisateurs | ❌ | ❌ | ❌ | ✅ | ✅ |
| Paramètres globaux | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 👤 Gestion des utilisateurs

### Accès

Menu latéral → **Paramètres** (engrenage) → **Utilisateurs** (admin uniquement)

### 📋 Liste des utilisateurs

Affiche:
- **Nom** complet
- **Email**
- **Rôle**
- **Statut** (Actif ✅ | Inactif ❌)
- **Actions** (Modifier, Supprimer)

### ➕ Créer un nouvel utilisateur

1. Cliquez **"+ Ajouter utilisateur"**
2. Remplissez:

| Champ | Description |
|-------|-------------|
| **Nom complet** | Nom de l'utilisateur |
| **Email** | Email unique (utilisé pour login) |
| **Mot de passe** | Minimum 8 caractères |
| **Rôle** | Sélectionnez le rôle (Lecteur, Secrétaire, Trésorier, Admin) |
| **Actif** | ☑️ Oui pour activation immédiate |

3. Cliquez **"Créer"**

**Résultat**: L'utilisateur reçoit un email avec ses identifiants

### ✏️ Modifier un utilisateur

1. Cliquez sur l'utilisateur
2. Cliquez **"Modifier"**
3. Changez:
   - Nom, Email, Rôle
   - Mot de passe (optionnel)
   - Statut actif/inactif

4. Cliquez **"Enregistrer"**

### 🔑 Réinitialiser un mot de passe

1. Cliquez sur l'utilisateur
2. Cliquez **"Réinitialiser mot de passe"**
3. Entrez un nouveau mot de passe temporaire
4. Cliquez **"Enregistrer"**

**Résultat**: Un email est envoyé à l'utilisateur

### 🗑️ Supprimer un utilisateur

1. Cliquez sur l'utilisateur
2. Cliquez **"Supprimer"**
3. Confirmez dans la popup

⚠️ **Important**: L'utilisateur ne pourra plus se connecter

---

## 🏷️ Gestion des données de référence

### Accès

Menu latéral → **Paramètres** → **Données de référence** (admin)

### 📊 Qu'est-ce que les données de référence?

Les **données de référence** sont les énumérations de l'application:

- **Rôles membres** (Président, Vice-Président, Trésorier, etc.)
- **Catégories dépenses** (Fournitures, Transport, Événements, etc.)
- **Types événement** (Assemblée, Réunion, Formation, etc.)
- **Types annonce** (Mariage, Décès, Naissance, etc.)
- **Statuts membres** (Actif, Inactif, Suspendu)
- **Statuts cotisations** (Payé, Partiel, Impayé)
- **Et 8 autres...**

### 🔍 Interface de gestion

#### Onglets

13 onglets, chacun représentant une référence:
- Rôles membres
- Rôles utilisateurs
- Catégories dépenses
- Types événement
- Types annonce
- Statuts membres
- Et 7 autres...

#### Par référence

Vous pouvez:

1. **Chercher**: Filtrez par nom/libellé
2. **Trier**: Cliquez l'en-tête de colonne
3. **Ajouter**: Cliquez **"+ Ajouter"**
4. **Modifier**: Cliquez **"Modifier"**
5. **Supprimer**: Si non utilisée (bouton grisé sinon)
6. **Voir l'utilisation**: Badge "Utilisé X fois"

### ➕ Ajouter une référence

Exemple: Ajouter un nouveau rôle membre

1. Ouvrez l'onglet **"Rôles membres"**
2. Cliquez **"+ Ajouter"**
3. Remplissez:

| Champ | Description |
|-------|-------------|
| **Libellé** | Nom du rôle (ex: "Consultant") |
| **Description** | Détails du rôle (ex: "Conseille l'association") |
| **Ordre** | Position dans la liste |

4. Cliquez **"Enregistrer"**

**Résultat**: Disponible partout dans l'appli

### ✏️ Modifier une référence

1. Cliquez **"Modifier"** sur la ligne
2. Changez les valeurs
3. Cliquez **"Enregistrer"**

⚠️ **Attention**: Les changements s'appliquent **rétroactivement** à tous les enregistrements!

### 🗑️ Supprimer une référence

**Conditions**:
- ✅ Non utilisée nulle part (badge "Non utilisé")
- ❌ Utilisée = bouton "Supprimer" grisé

1. Cliquez **"Supprimer"** (si actif)
2. Confirmez
3. La référence est supprimée

**Impact**: Aucun impact sur les enregistrements existants (pas de suppression en cascade)

---

## 🔧 Maintenance

### Tâches mensuelles

#### 1️⃣ Vérifier les données

```bash
# Cherchez les:
- Doublons (2 membres avec même email)
- Données manquantes (emails, téléphones)
- Cotisations non payées depuis >3 mois
```

**Comment**: Utilisez les rapports & filtres

#### 2️⃣ Archiver les annonces anciennes

```bash
1. Allez à Annonces
2. Filtrez "Publiées"
3. Archivez les >3 mois
```

#### 3️⃣ Audit des utilisateurs

```bash
1. Allez à Utilisateurs
2. Vérifiez les statuts "Actif"
3. Désactivez ceux qui ne sont plus actifs
```

#### 4️⃣ Sauvegarder les données

```bash
# Voir section Sauvegardes ci-dessous
```

### Tâches annuelles

#### 1️⃣ Audit complet

- Vérifiez les soldes caisse
- Validez les cotisations de l'année
- Archivez les anciennes données
- Vérifiez les prêts en retard

#### 2️⃣ Changement d'exercice

1. Allez à **Paramètres** → **Finances**
2. Changez **"Exercice courant"** à l'année nouvelle
3. Cliquez **"Enregistrer"**

**Résultat**: Les rapports afficheront la nouvelle année

#### 3️⃣ Rétrospective

- Générez un rapport annuel
- Exportez en Excel
- Archivez pour audit

---

## 🔒 Sécurité

### Politique de mots de passe

| Politique | Recommandation |
|-----------|---|
| **Longueur minimum** | 8 caractères |
| **Caractères requis** | Lettres + Chiffres + Symboles |
| **Renouvellement** | Tous les 90 jours |
| **Historique** | Pas de réutilisation des 5 derniers |

### Accès et authentification

- ✅ **SSL/TLS**: Obligatoire (HTTPS)
- ✅ **Sessions**: 2 heures d'inactivité
- ✅ **IP restrictions**: Configurable en admin
- ✅ **2FA**: En développement

### Données sensibles

Données considérées comme sensibles:
- 💳 Numéros de téléphone
- 📧 Adresses email
- 💰 Montants financiers
- 📝 Commentaires personnels

**Protection**:
- ✅ Base de données chiffrée
- ✅ Backups sécurisés
- ✅ Accès rôle-based
- ✅ Audit logging

### Audit et logging

Toutes les actions sont enregistrées:
- Qui a fait quoi
- Quand (date/heure)
- Quel résultat
- Depuis quelle IP

**Accès aux logs** (Super Admin):
```
Paramètres → Logs d'audit
```

### Gestion des risques

| Risque | Mitigation |
|--------|-----------|
| **Compromission compte** | Changez mot de passe immédiatement |
| **Accès non autorisé** | Revoyez les permissions utilisateurs |
| **Perte de données** | Effectuez backups réguliers |
| **Injection SQL** | Entrées validées côté serveur |

---

## 📊 Monitoring

### Tableau de bord de monitoring

**Accès**: Paramètres → **Monitoring** (Super Admin)

### Métriques clés

| Métrique | Seuil d'alerte |
|----------|---|
| **Espace disque utilisé** | > 80% |
| **Mémoire disponible** | < 500 MB |
| **Erreurs applicatives** | > 5 par heure |
| **Taux d'erreur API** | > 1% |
| **Temps réponse moyen** | > 2 secondes |

### Vérifications recommandées

**Quotidiennement**:
- ✅ Appli accessible
- ✅ Pas d'erreurs critiques
- ✅ Sauvegardes complètes

**Hebdomadairement**:
- ✅ Performance (temps réponse)
- ✅ Espace disque
- ✅ Erreurs applicatives

**Mensuellement**:
- ✅ Audit utilisateurs
- ✅ Intégrité données
- ✅ Logs d'accès

### Alertes

Vous recevez une alerte si:
- 🚨 Espace disque < 10%
- 🚨 Base de données inaccessible
- 🚨 Erreur critique détectée
- 🚨 Tentative d'accès non autorisée

---

## 💾 Sauvegardes

### Stratégie de sauvegarde

**Fréquence recommandée**:
- 🟢 **Quotidienne**: Base de données
- 🟢 **Hebdomadaire**: Files de stockage
- 🟢 **Mensuelle**: Archive complète

### Sauvegardes automatiques

Les sauvegardes sont effectuées automatiquement:

```
Temps: 02:00 UTC (chaque nuit)
Durée: ~15 minutes
Destination: /backups/nafa-YYYYMMDD.sql
Rétention: 30 jours
```

### Sauvegarde manuelle

```bash
# Sur le serveur VPS
mysqldump -u nafa_user -p nafa > nafa-backup-$(date +%Y%m%d).sql

# Ou via interface admin:
Paramètres → Maintenance → Sauvegarder maintenant
```

### Restauration

En cas de problème:

1. **Contact Super Admin** pour accéder à la sauvegarde
2. **Arrêter** les services:
   ```bash
   sudo systemctl stop nginx php8.2-fpm
   ```
3. **Restaurer** la base:
   ```bash
   mysql -u nafa_user -p nafa < nafa-backup-YYYYMMDD.sql
   ```
4. **Redémarrer** les services:
   ```bash
   sudo systemctl start nginx php8.2-fpm
   ```

⚠️ **Important**: **Testez régulièrement** les restaurations!

---

## 🐛 Dépannage avancé

### Les pages de l'application affichent une erreur

**Vérifiez**:

1. État des services:
   ```bash
   sudo systemctl status nginx php8.2-fpm mysql
   ```

2. Logs d'erreur:
   ```bash
   tail -f /var/www/nafa/backend-laravel/storage/logs/laravel.log
   tail -f /var/log/nginx/error.log
   ```

3. Base de données accessible:
   ```bash
   mysql -u nafa_user -p -e "SELECT 1;"
   ```

**Solutions courantes**:
- Redémarrer les services
- Augmenter la mémoire PHP
- Vérifier l'espace disque

### Les emails ne sont pas envoyés

**Vérifiez**:

1. Configuration SMTP:
   ```
   Paramètres → Diffusion → Vérifier SMTP
   ```

2. Dans les logs:
   ```bash
   grep -i "mail" /var/www/nafa/backend-laravel/storage/logs/laravel.log
   ```

3. Firewall permet port SMTP (2465, 587):
   ```bash
   sudo ufw status
   ```

### Les SMS/WhatsApp ne fonctionnent pas

**Vérifiez**:

1. Configuration SMS activée:
   ```
   Paramètres → Diffusion → Activer SMS ☑️
   ```

2. Clés API valides:
   ```
   Paramètres → Diffusion → Tester les clés
   ```

3. Crédits disponibles (chez le provider)

### La base de données est lente

**Diagnostiquez**:

```bash
# Connexions actives
mysql> SHOW PROCESSLIST;

# Requêtes lentes
mysql> SHOW VARIABLES LIKE 'long_query_time';

# Index manquants
mysql> ANALYZE TABLE members;
```

**Solutions**:
- Augmenter le pool de connexions MySQL
- Ajouter des index manquants
- Archiver les anciennes données

### Espace disque plein (< 5%)

**Actions immédiatement**:

1. Arrêtez l'application:
   ```bash
   sudo systemctl stop nginx php8.2-fpm
   ```

2. Identifiez l'espace utilisé:
   ```bash
   du -sh /var/www/nafa/*
   du -sh /var/log/*
   du -sh /home/*
   ```

3. Nettoyez:
   ```bash
   # Logs
   rm /var/log/nginx/*.log*
   
   # Cache
   rm -rf /var/www/nafa/backend-laravel/bootstrap/cache/*
   
   # Temp
   rm -rf /tmp/*
   ```

4. Redémarrez:
   ```bash
   sudo systemctl start nginx php8.2-fpm
   ```

### Certificat SSL expiré

**Solution rapide**:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

**Vérifier l'expiration**:

```bash
sudo certbot certificates
```

---

## 📞 Support technique

### Escalade

1. **Problème résolu?** → ✅ Documenter la solution
2. **Besoin d'aide?** → Contacter Super Admin
3. **Bug applicatif?** → Signaler sur GitHub Issues
4. **Problème serveur?** → Contacter hébergeur VPS

### Documentation

- `GUIDE_UTILISATEUR.md` - Pour les utilisateurs finaux
- `GUIDE_ADMINISTRATEUR.md` - Ce document
- `deploy/DEPLOYMENT.md` - Pour l'infrastructure
- Code source commenté - Pour le développement

### Ressources

- **Laravel Docs**: https://laravel.com/docs
- **MySQL Docs**: https://dev.mysql.com/doc/
- **Nginx Docs**: https://nginx.org/en/docs/
- **GitHub Issues**: Pour les bugs

---

## 🎓 Bonnes pratiques pour administrateurs

### ✅ À FAIRE

✓ Vérifiez les logs **quotidiennement**  
✓ Effectuez les sauvegardes **régulièrement**  
✓ Testez les **restaurations** mensuellement  
✓ Changez les **mots de passe** tous les 90 jours  
✓ Archivez les **anciennes données** annuellement  
✓ Documentez les **changements** importants  
✓ Revoyez les **permissions** trimestriellement  

### ❌ À ÉVITER

✗ Partager le **compte admin** (créer des comptes)  
✗ Utiliser le **compte root** sans raison  
✗ Oublier les **sauvegardes**  
✗ Ignorer les **alertes de sécurité**  
✗ Modifier les **données en production** sans backup  
✗ Laisser des **mots de passe par défaut**  
✗ Accorder les **permissions maximales** à tous  

---

**Version du guide**: 1.0  
**Dernière mise à jour**: 2026-07-01  
**Application**: Nafa v1.0  
**Audience**: Administrateurs système & Super Admins

📞 **Pour questions techniques: Contacter le Super Admin**
