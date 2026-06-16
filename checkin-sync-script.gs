// ────────────────────────────────────────────────────────────────────
//  CHECK-IN SYNC SCRIPT
//  Container-bound — crea SEMPRE da Extensions → Apps Script dentro il foglio
//  Un foglio per evento: usa tab separati per ogni barca (Lagoon40, Oceanis48, Atlantica…)
// ────────────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi().createMenu('🔑 Check-in')
    .addItem('Setup Corsica (Lagoon40 + Oceanis48)', 'setupCorsica')
    .addItem('Setup GDP (Atlantica)', 'setupGDP')
    .addToUi();
}

function setupCorsica() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['Lagoon40', 'Oceanis48'].forEach(boat => getOrCreateSheet(ss, boat));
  SpreadsheetApp.getUi().alert('✅ Schede create: Lagoon40 e Oceanis48');
}

function setupGDP() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  getOrCreateSheet(ss, 'Atlantica');
  SpreadsheetApp.getUi().alert('✅ Scheda creata: Atlantica');
}

// ── Helpers ──────────────────────────────────────────────────────────

function getOrCreateSheet(ss, name) {
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.getRange('A1:E1').setValues([['voceId', 'stato', 'nota', 'skipper', 'timestamp']]);
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 140);
    sh.setColumnWidth(3, 280);
  }
  return sh;
}

// ── doGet — JSONP: restituisce stato di tutte le voci per una barca ──

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const boat   = params.boat     || '';
  const cb     = params.callback || 'cb';

  try {
    const ss   = SpreadsheetApp.getActiveSpreadsheet();
    const sh   = ss.getSheetByName(boat);
    const data = {};

    if (sh && sh.getLastRow() > 1) {
      const rows = sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues();
      rows.forEach(function(row) {
        const voceId = row[0];
        const stato  = row[1];
        const nota   = row[2];
        if (voceId) {
          data[voceId] = {
            stato: stato === true || stato === 'true',
            nota:  nota  || ''
          };
        }
      });
    }

    const json = JSON.stringify({ ok: true, data: data });
    return ContentService
      .createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);

  } catch (err) {
    const json = JSON.stringify({ ok: false, error: err.message });
    return ContentService
      .createTextOutput(cb + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
}

// ── doPost — salva singola voce (no-cors POST) ───────────────────────

function doPost(e) {
  try {
    const params  = e.parameter;
    const boat    = params.boat    || '';
    const voceId  = params.voceId  || '';
    const stato   = params.stato   === 'true';
    const nota    = params.nota    || '';
    const skipper = params.skipper || '';

    if (!boat || !voceId) throw new Error('boat e voceId richiesti');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = getOrCreateSheet(ss, boat);

    // Cerca riga esistente, altrimenti aggiunge
    const lastRow = sh.getLastRow();
    let found = false;
    if (lastRow > 1) {
      const ids = sh.getRange(2, 1, lastRow - 1, 1).getValues().map(function(r) { return r[0]; });
      const idx = ids.indexOf(voceId);
      if (idx >= 0) {
        sh.getRange(idx + 2, 2, 1, 4).setValues([[stato, nota, skipper, new Date()]]);
        found = true;
      }
    }
    if (!found) {
      sh.appendRow([voceId, stato, nota, skipper, new Date()]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
