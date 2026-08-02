#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convertir le guide markdown en PDF avec fpdf2
"""

import sys
import re
import unicodedata
from pathlib import Path

# UTF-8 encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

try:
    from fpdf import FPDF
except ImportError as e:
    print(f"[ERROR] Missing dependency: {e}")
    sys.exit(1)

def remove_non_latin(text):
    """Remove emojis and special unicode characters"""
    # Remove emoji ranges
    text = re.sub(r'[\U0001F300-\U0001F9FF]+', '', text)
    # Remove other special unicode
    text = re.sub(r'[^\x00-\x7FÀ-ÿ]+', '', text)
    return text.strip()

# Paths
md_file = Path(r"C:\Projects\Nafa\GUIDE_UTILISATEUR.md")
pdf_file = Path(r"C:\Projects\Nafa\GUIDE_UTILISATEUR.pdf")

# Read markdown
if not md_file.exists():
    print(f"[ERROR] File not found: {md_file}")
    sys.exit(1)

with open(md_file, 'r', encoding='utf-8') as f:
    md_content = f.read()

# Create PDF
try:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 15, "NAFA - Guide Utilisateur", ln=True, align="C")
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 8, "Version 1.0 | 2026-07-01", ln=True, align="C")
    pdf.ln(10)

    # Parse markdown
    lines = md_content.split('\n')
    pdf.set_font("Helvetica", "", 11)

    for line in lines:
        # Remove special characters
        line = remove_non_latin(line)

        if not line:
            pdf.ln(3)
        elif line.startswith('# '):
            # Skip main title
            continue
        elif line.startswith('## '):
            pdf.set_font("Helvetica", "B", 14)
            text = line.replace('## ', '').strip()
            if len(text) > 0:
                pdf.cell(0, 10, text, ln=True)
            pdf.ln(2)
            pdf.set_font("Helvetica", "", 11)
        elif line.startswith('### '):
            pdf.set_font("Helvetica", "B", 12)
            text = line.replace('### ', '').strip()
            if len(text) > 0:
                pdf.cell(0, 8, text, ln=True)
            pdf.ln(1)
            pdf.set_font("Helvetica", "", 11)
        elif line.startswith('#### '):
            pdf.set_font("Helvetica", "B", 11)
            text = line.replace('#### ', '').strip()
            if len(text) > 0:
                pdf.cell(0, 7, text, ln=True)
            pdf.ln(1)
            pdf.set_font("Helvetica", "", 11)
        elif line.startswith('- ') or line.startswith('* '):
            # Bullet point
            text = re.sub(r'^[-*]\s+', '', line).strip()
            if len(text) > 0:
                pdf.set_x(pdf.get_x() + 5)
                pdf.set_font("Helvetica", "", 11)
                # Wrap long text
                pdf.multi_cell(0, 5, text)
            pdf.ln(1)
        elif line.startswith('> '):
            # Blockquote
            text = line.replace('> ', '').strip()
            if len(text) > 0:
                pdf.set_font("Helvetica", "I", 10)
                pdf.multi_cell(0, 5, text)
                pdf.set_font("Helvetica", "", 11)
                pdf.ln(2)
        elif line.startswith('|'):
            # Table - skip for now
            continue
        else:
            # Regular text
            text = line
            if len(text) > 0:
                # Clean markdown formatting
                text = re.sub(r'[*_]{1,2}(.+?)[*_]{1,2}', r'\1', text)
                text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
                text = re.sub(r'`([^`]+)`', r'\1', text)
                if len(text) > 0:
                    pdf.multi_cell(0, 5, text)
                    pdf.ln(1)

    # Output
    pdf.output(str(pdf_file))

    # Get file size
    file_size = pdf_file.stat().st_size / 1024  # KB

    print("[OK] PDF generated successfully!")
    print(f"[FILE] {pdf_file.name}")
    print(f"[SIZE] {file_size:.1f} KB")
    print(f"[PATH] {pdf_file}")

except Exception as e:
    print(f"[ERROR] PDF generation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
