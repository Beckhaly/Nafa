#!/bin/bash
# Script pour réexécuter le schéma SQL complet
# Utilisation: ./refresh-schema.sh

set -e

echo "🔄 Réexécution du schéma Nafa..."

# Option 1: Via Laravel Artisan (recommandé)
if [ -f "backend-laravel/artisan" ]; then
    echo "📝 Utilisation de: php artisan db:seed-schema"
    cd backend-laravel
    php artisan db:seed-schema
    cd ..
    echo "✅ Schéma réexécuté avec succès via Artisan!"
else
    echo "⚠️  backend-laravel/artisan non trouvé"
    echo ""
    echo "Option manuelle - Connectez-vous à MySQL et exécutez:"
    echo "  mysql -u root -p nafa < database/01_schema.sql"
    echo "  mysql -u root -p nafa < database/02_procedures.sql"
fi

echo ""
echo "✨ Prêt à l'emploi!"
