/* ═══════════════════════════════════════════════════════════
   GOOGLE APPS SCRIPT — Crew List · Golfo dei Poeti Luglio 2026
   ═══════════════════════════════════════════════════════════

   ISTRUZIONI (1 minuto):
   ──────────────────────────────────────────────────────────
   1. Crea un nuovo Google Spreadsheet vuoto
   2. Vai su Estensioni → Apps Script
   3. Incolla questo codice nel file Code.gs
   4. Clicca su Salva (icona disco)
   5. Vai su Distribuisci → Nuova distribuzione
      - Tipo: Applicazione web
      - Esegui come: IO
      - Chi ha accesso: Tutti
   6. Copia l'URL di deployment
   7. Incolla l'URL in config.js (CREW_SHEETS_URL_ATLANTICA o SHAREL)

   Il foglio "Crew" viene creato AUTOMATICAMENTE alla prima
   chiamata dal sito web. Non serve fare nulla a mano.
   ────────────────────────────────────────────────────────── */

const SHEET_NAME = 'Crew';

/* ── Crea foglio se non esiste (chiamato automaticamente) ─ */
function ensureSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) return sheet;

  sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow([
    'timestamp', 'boat', 'nome', 'sesso', 'nascita', 'luogo',
    'nazionalita', 'residenza', 'cap', 'tipoDoc', 'numDoc',
    'scadDoc', 'ruolo', 'cf', 'regolaAccettata'
  ]);

  const headerRange = sheet.getRange(1, 1, 1, 15);
  headerRange.setBackground('#0b3c5d');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 100);
  sheet.setColumnWidth(3, 180);
  sheet.setColumnWidth(4, 70);
  sheet.setColumnWidth(5, 120);
  sheet.setColumnWidth(6, 180);
  sheet.setColumnWidth(7, 120);
  sheet.setColumnWidth(8, 250);
  sheet.setColumnWidth(9, 70);
  sheet.setColumnWidth(10, 80);
  sheet.setColumnWidth(11, 120);
  sheet.setColumnWidth(12, 120);
  sheet.setColumnWidth(13, 120);
  sheet.setColumnWidth(14, 140);
  sheet.setColumnWidth(15, 120);

  return sheet;
}

/* ── API: GET (legge dati) ──────────────────────────── */
function doGet(e) {
  const boat = e.parameter.boat || 'atlantica';
  const action = e.parameter.action || '';

  if (action === 'pdf') {
    return generatePDF(boat);
  }

  try {
    const data = getCrewData(boat);
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      members: [], count: 0, error: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── API: POST (salva membro) ────────────────────────── */
function doPost(e) {
  try {
    const payload = JSON.parse(e.parameter.payload || '{}');
    const boat = payload.boat || 'atlantica';
    saveMember(boat, payload);
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({success: false, error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/* ── Legge dati dal foglio ────────────────────────────── */
function getCrewData(boat) {
  const sheet = ensureSheet();
  const data = sheet.getDataRange().getValues();
  const members = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === boat) {
      members.push({
        nome: data[i][2],
        sesso: data[i][3],
        ruolo: data[i][12]
      });
    }
  }
  return {members, count: members.length};
}

/* ── Salva membro nel foglio ─────────────────────────── */
function saveMember(boat, data) {
  const sheet = ensureSheet();
  sheet.appendRow([
    new Date().toISOString(),
    boat,
    data.nome, data.sesso, data.nascita, data.luogo,
    data.nazionalita, data.residenza, data.cap,
    data.tipoDoc, data.numDoc, data.scadDoc,
    data.ruolo, data.cf, data.regolaAccettata
  ]);
}

/* ── Genera PDF crew list ─────────────────────────────── */
function generatePDF(boat) {
  const data = getCrewData(boat);
  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Crew List ${boat}</title>
<style>body{font-family:Arial,sans-serif;padding:40px}h1{color:#0b3c5d}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#0b3c5d;color:#fff}</style></head>
<body><h1>Crew List — ${boat.toUpperCase()}</h1><p>Generato il ${new Date().toLocaleDateString('it-IT')}</p>
<table><tr><th>Nome</th><th>Sesso</th><th>Ruolo</th></tr>
${data.members.map(m => `<tr><td>${m.nome}</td><td>${m.sesso}</td><td>${m.ruolo}</td></tr>`).join('')}
</table><p>Totale: ${data.count} membri</p></body></html>`;
  return HtmlService.createHtmlOutput(html);
}
