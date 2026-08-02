#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convertir le guide markdown en PDF
"""

import os
import sys

# Forcer UTF-8
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

md_file = r"C:\Projects\Nafa\GUIDE_UTILISATEUR.md"
html_file = r"C:\Projects\Nafa\GUIDE_UTILISATEUR_IMPRIMABLE.html"

# Lire le contenu
with open(md_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Créer le HTML optimisé pour l'impression
html_template = """<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NAFA — Guide Utilisateur Complet</title>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{
            font-family: 'Calibri', 'Arial', sans-serif;
            line-height: 1.6;
            color: #000;
            background: white;
            padding: 20mm;
            max-width: 210mm;
            margin: 0 auto;
            font-size: 11pt;
        }}
        h1 {{ font-size: 28pt; margin: 20mm 0 10mm 0; color: #000; page-break-after: avoid; }}
        h2 {{ font-size: 18pt; margin: 15mm 0 8mm 0; color: #000; border-bottom: 2pt solid #000; padding-bottom: 5mm; page-break-after: avoid; }}
        h3 {{ font-size: 14pt; margin: 10mm 0 5mm 0; color: #000; page-break-after: avoid; }}
        h4 {{ font-size: 12pt; margin: 8mm 0 4mm 0; color: #000; page-break-after: avoid; }}
        p {{ margin: 3mm 0; }}
        ul, ol {{ margin: 5mm 0 5mm 10mm; }}
        li {{ margin: 2mm 0; }}
        table {{ width: 100%; border-collapse: collapse; margin: 8mm 0; page-break-inside: avoid; font-size: 10pt; }}
        table th, table td {{ border: 1pt solid #000; padding: 4mm; text-align: left; }}
        table th {{ background: #e6e6e6; font-weight: bold; }}
        code {{ font-family: 'Courier New', monospace; background: #f5f5f5; padding: 1mm 2mm; }}
        pre {{
            background: #f5f5f5;
            padding: 4mm;
            border: 1pt solid #999;
            margin: 5mm 0;
            overflow-x: auto;
            page-break-inside: avoid;
            font-size: 9pt;
            font-family: 'Courier New', monospace;
        }}
        blockquote {{
            border-left: 3pt solid #000;
            padding-left: 5mm;
            margin: 5mm 0;
            color: #333;
            font-size: 10pt;
        }}
        hr {{ border: none; border-top: 1pt solid #999; margin: 10mm 0; }}
        .toc {{ margin: 10mm 0; padding: 5mm; background: #f9f9f9; border: 1pt solid #ddd; page-break-inside: avoid; }}
        @media print {{
            body {{ padding: 10mm; margin: 0; }}
            h2 {{ page-break-before: always; }}
            table {{ page-break-inside: avoid; }}
            blockquote {{ page-break-inside: avoid; }}
        }}
    </style>
</head>
<body>
<h1>📖 NAFA — Guide Utilisateur</h1>
<p><strong>Version:</strong> 1.0 | <strong>Date:</strong> 2026-07-01</p>
<hr>

{content}

<hr>
<p style="margin-top: 20mm; text-align: center; color: #999; font-size: 9pt;">
    Document généré automatiquement — Pour plus d'informations, consultez la documentation complète
</p>
</body>
</html>"""

# Formatter le HTML
html = html_template.format(content=content)

# Écrire le fichier HTML
with open(html_file, 'w', encoding='utf-8') as f:
    f.write(html)

print("[OK] Conversion reussie!")
print("[FILE] Fichier cree: GUIDE_UTILISATEUR_IMPRIMABLE.html")
print(f"[PATH] Localisation: {html_file}")
print("\n[GUIDE] Comment generer le PDF:")
print("   1. Ouvrez le fichier HTML dans votre navigateur")
print("   2. Appuyez sur Ctrl+P (Windows/Linux) ou Cmd+P (Mac)")
print("   3. Selectionnez 'Imprimer sur PDF' ou 'Enregistrer en PDF'")
print("   4. Cliquez sur 'Enregistrer'")
print("\n[DONE] Le fichier PDF sera genere avec la mise en forme optimisee")
