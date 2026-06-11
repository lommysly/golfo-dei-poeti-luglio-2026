/* ═══════════════════════════════════════════════════════════
   GOOGLE APPS SCRIPT — Crew List · Golfo dei Poeti Luglio 2026
   ═══════════════════════════════════════════════════════════

   ISTRUZIONI (2 minuti):
   ──────────────────────────────────────────────────────────
   1. Crea un nuovo Google Spreadsheet vuoto
   2. Vai su Estensioni → Apps Script
   3. Incolla questo codice nel file Code.gs
   4. Clicca su Salva (icona disco)
   5. TORNA AL FOGLIO GOOGLE: vedrai il menu "Crew List"
   6. Clicca su Crew List → Setup (crea il foglio automaticamente)
   7. Vai su Distribuisci → Nuova distribuzione
      - Tipo: Applicazione web
      - Esegui come: IO
      - Chi ha accesso: Tutti
   8. Copia l'URL di deployment
   9. Incolla l'URL in config.js (CREW_SHEETS_URL_ATLANTICA o SHAREL)
   ────────────────────────────────────────────────────────── */

const SHEET_NAME = 'Crew';

/* ── Menu nel foglio Google ──────────────────────────── */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Crew List')
    .addItem('Setup (crea foglio Crew)', 'setup')
    .addToUi();
}

/* ── Setup automatico ────────────────────────────────── */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (sheet) {
    SpreadsheetApp.getUi().alert('Il foglio "Crew" esiste già. Nessuna modifica necessaria.');
    return;
  }

  sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow([
    'timestamp', 'boat', 'nome', 'sesso', 'nascita', 'luogo',
    'nazionalita', 'residenza', 'cap', 'tipoDoc', 'numDoc',
    'scadDoc', 'ruolo', 'cf', 'regolaAccettata'
  ]);

  // Formatta intestazione
  const headerRange = sheet.getRange(1, 1, 1, 15);
  headerRange.setBackground('#0b3c5d');
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');

  // Adatta larghezza colonne
  sheet.setColumnWidth(1, 160);  // timestamp
  sheet.setColumnWidth(2, 100);  // boat
  sheet.setColumnWidth(3, 180);  // nome
  sheet.setColumnWidth(4, 70);   // sesso
  sheet.setColumnWidth(5, 120);  // nascita
  sheet.setColumnWidth(6, 180);  // luogo
  sheet.setColumnWidth(7, 120);  // nazionalita
  sheet.setColumnWidth(8, 250);  // residenza
  sheet.setColumnWidth(9, 70);   // cap
  sheet.setColumnWidth(10, 80);  // tipoDoc
  sheet.setColumnWidth(11, 120); // numDoc
  sheet.setColumnWidth(12, 120); // scadDoc
  sheet.setColumnWidth(13, 120); // ruolo
  sheet.setColumnWidth(14, 140); // cf
  sheet.setColumnWidth(15, 120); // regolaAccettata

  SpreadsheetApp.getUi().alert('Foglio "Crew" creato con successo!');
}

/* ── API: GET (legge dati) ──────────────────────────── */
function doGet(e) {
  const boat = e.parameter.boat || 'atlantica';
  const action = e.parameter.action || '';

  if (action === 'pdf') {
    return generatePDF(boat);
  }

  const data = getCrewData(boat);
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    return {members: [], count: 0, error: 'Foglio Crew non trovato. Esegui il setup dal menu.'};
  }
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    throw new Error('Foglio Crew non trovato. Esegui il setup dal menu Crew List → Setup.');
  }
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
