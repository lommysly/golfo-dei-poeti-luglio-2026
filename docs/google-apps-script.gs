/* ═══════════════════════════════════════════════════════════
   GOOGLE APPS SCRIPT — Crew List · Golfo dei Poeti Luglio 2026
   ═══════════════════════════════════════════════════════════

   ISTRUZIONI (2 minuti):
   ──────────────────────────────────────────────────────────
   1. Crea un nuovo Google Spreadsheet vuoto
   2. Vai su Estensioni → Apps Script
   3. Incolla questo codice nel file Code.gs
   4. Clicca su Salva (icona disco)
   5. Clicca su Esegui (▶️) per autorizzare l'app (solo la prima volta)
   6. Vai su Distribuisci → Nuova distribuzione
      - Tipo: Applicazione web
      - Esegui come: IO
      - Chi ha accesso: Tutti
   7. Copia l'URL di deployment
   8. Incolla l'URL in config.js alla riga CREW_SHEETS_URL
   ────────────────────────────────────────────────────────── */

const SHEET_NAME = 'Crew';

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

function getCrewData(boat) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'boat', 'nome', 'sesso', 'nascita', 'luogo', 'nazionalita', 'residenza', 'cap', 'tipoDoc', 'numDoc', 'scadDoc', 'ruolo', 'cf', 'regolaAccettata']);
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

function saveMember(boat, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['timestamp', 'boat', 'nome', 'sesso', 'nascita', 'luogo', 'nazionalita', 'residenza', 'cap', 'tipoDoc', 'numDoc', 'scadDoc', 'ruolo', 'cf', 'regolaAccettata']);
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
