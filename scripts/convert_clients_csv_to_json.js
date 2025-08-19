#!/usr/bin/env node
// Script pour convertir clients.csv (séparateur ;) en JSON
// Usage: node scripts\convert_clients_csv_to_json.js [inputCsv] [outputJson] [--unique]

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const input = args[0] ? path.resolve(process.cwd(), args[0]) : path.join(__dirname, '..', 'clients.csv');
const output = args[1] ? path.resolve(process.cwd(), args[1]) : path.join(__dirname, '..', 'clients.json');
const unique = args.includes('--unique') || args.includes('-u');

function parseCSV(data) {
  const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const header = lines.shift().split(';').map(h => h.trim());

  const rows = lines.map(line => {
    // split on semicolon - preserve empty fields
    const cols = line.split(';').map(c => c.trim());
    const obj = {};
    for (let i = 0; i < header.length; i++) {
      const key = header[i] || `col${i}`;
      obj[key] = (cols[i] !== undefined) ? cols[i] : '';
    }
    return obj;
  });

  return rows;
}

try {
  if (!fs.existsSync(input)) {
    console.error('Fichier introuvable:', input);
    process.exit(2);
  }

  const data = fs.readFileSync(input, 'utf8');
  let json = parseCSV(data);

  if (unique) {
    // dédupliquer sur la clé `matricule` en gardant la première occurrence
    const seen = new Set();
    json = json.filter(item => {
      const key = (item.matricule || '').trim();
      if (key === '') return true; // garder les entrées sans matricule
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  fs.writeFileSync(output, JSON.stringify(json, null, 2), 'utf8');
  console.log('Converti', input, '→', output, `(${json.length} enregistrements)`);
} catch (err) {
  console.error('Erreur:', err.message);
  process.exit(1);
}
