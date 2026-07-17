// Crew List Sync Script (dedicated)
// Deploy as Web App: execute as Me, access: Anyone
// Required sheets: one tab per boat (atlantica, oceanis)

const BOAT_CONFIG = {
  atlantica: {
    sheetName: 'atlantica',
    boatName: 'ATLANTICA 45',
  },
  oceanis: {
    sheetName: 'oceanis',
    boatName: 'SHAREL (OCEANIS 48)',
  },
};

const HEADERS = [
  'submissionId',
  'boat',
  'nome',
  'sesso',
  'nascita',
  'luogo',
  'nazionalita',
  'residenza',
  'cap',
  'tipoDoc',
  'numDoc',
  'scadDoc',
  'ruolo',
  'cf',
  'regolaAccettata',
  'updatedAt',
  'createdAt',
];

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const action = (params.action || '').toLowerCase();
  const boat = normalizeBoat(params.boat || '');

  if (action === 'pdf') {
    return handlePdf_(boat);
  }

  return handleList_(boat);
}

function doPost(e) {
  try {
    const payloadRaw = e && e.parameter ? e.parameter.payload : '';
    if (!payloadRaw) return json_({ ok: false, error: 'missing_payload' });

    const payload = JSON.parse(payloadRaw);
    const boat = normalizeBoat(payload.boat || '');
    if (!boat) return json_({ ok: false, error: 'invalid_boat' });

    const sh = getOrCreateBoatSheet_(boat);
    const data = normalizePayload_(payload, boat);

    // Upsert strategy (strong):
    // 1) submissionId match within same boat
    // 2) fallback cf match within same boat (if submissionId not found)
    const rowToUpdate = findExistingRow_(sh, data);

    if (rowToUpdate > 0) {
      sh.getRange(rowToUpdate, 1, 1, HEADERS.length).setValues([rowValues_(data)]);
      return json_({ ok: true, mode: 'update', row: rowToUpdate });
    }

    sh.appendRow(rowValues_(data));
    return json_({ ok: true, mode: 'create', row: sh.getLastRow() });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function handleList_(boat) {
  if (!boat) return json_({ members: [], count: 0 });

  const sh = getOrCreateBoatSheet_(boat);
  const last = sh.getLastRow();
  if (last < 2) return json_({ members: [], count: 0 });

  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const members = values
    .filter(r => String(r[2] || '').trim())
    .map(r => ({
      nome: String(r[2] || ''),
      sesso: String(r[3] || ''),
      ruolo: String(r[12] || ''),
    }));

  return json_({ members: members, count: members.length });
}

function handlePdf_(boat) {
  if (!boat) return text_('Boat non valida');

  const sh = getOrCreateBoatSheet_(boat);
  const last = sh.getLastRow();
  if (last < 2) return text_('Nessun dato disponibile');

  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();
  const rows = values
    .filter(r => String(r[2] || '').trim())
    .map((r, i) => [
      i + 1,
      String(r[2] || ''),
      String(r[4] || ''),
      String(r[5] || ''),
      String(r[6] || ''),
      String(r[9] || ''),
      String(r[10] || ''),
      String(r[11] || ''),
      String(r[12] || ''),
    ]);

  const html = buildPdfHtml_(boat, rows);
  return HtmlService.createHtmlOutput(html);
}

function normalizeBoat(boat) {
  const key = String(boat || '').trim().toLowerCase();
  return BOAT_CONFIG[key] ? key : '';
}

function normalizePayload_(payload, boat) {
  const now = new Date();
  const clean = {
    submissionId: String(payload.submissionId || '').trim(),
    boat: boat,
    nome: up_(payload.nome),
    sesso: up_(payload.sesso),
    nascita: String(payload.nascita || '').trim(),
    luogo: up_(payload.luogo),
    nazionalita: up_(payload.nazionalita),
    residenza: up_(payload.residenza),
    cap: String(payload.cap || '').trim(),
    tipoDoc: up_(payload.tipoDoc),
    numDoc: up_(payload.numDoc),
    scadDoc: String(payload.scadDoc || '').trim(),
    ruolo: up_(payload.ruolo),
    cf: up_(payload.cf).replace(/\s/g, ''),
    regolaAccettata: payload.regolaAccettata ? 'TRUE' : 'FALSE',
    updatedAt: now,
    createdAt: now,
  };

  if (!clean.submissionId) {
    clean.submissionId = 'crew-' + boat + '-' + now.getTime();
  }

  return clean;
}

function findExistingRow_(sh, data) {
  const last = sh.getLastRow();
  if (last < 2) return -1;

  const values = sh.getRange(2, 1, last - 1, HEADERS.length).getValues();

  // match by submissionId first
  if (data.submissionId) {
    for (let i = values.length - 1; i >= 0; i--) {
      const rowSubmissionId = String(values[i][0] || '').trim();
      const rowBoat = String(values[i][1] || '').trim().toLowerCase();
      if (rowSubmissionId && rowSubmissionId === data.submissionId && rowBoat === data.boat) {
        data.createdAt = values[i][16] || data.createdAt;
        return i + 2;
      }
    }
  }

  // fallback by CF + boat
  if (data.cf) {
    for (let i = values.length - 1; i >= 0; i--) {
      const rowCf = String(values[i][13] || '').trim().toUpperCase();
      const rowBoat = String(values[i][1] || '').trim().toLowerCase();
      if (rowCf && rowCf === data.cf && rowBoat === data.boat) {
        data.submissionId = String(values[i][0] || '').trim() || data.submissionId;
        data.createdAt = values[i][16] || data.createdAt;
        return i + 2;
      }
    }
  }

  return -1;
}

function rowValues_(d) {
  return [
    d.submissionId,
    d.boat,
    d.nome,
    d.sesso,
    d.nascita,
    d.luogo,
    d.nazionalita,
    d.residenza,
    d.cap,
    d.tipoDoc,
    d.numDoc,
    d.scadDoc,
    d.ruolo,
    d.cf,
    d.regolaAccettata,
    d.updatedAt,
    d.createdAt,
  ];
}

function getOrCreateBoatSheet_(boat) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const cfg = BOAT_CONFIG[boat];
  let sh = ss.getSheetByName(cfg.sheetName);
  if (!sh) sh = ss.insertSheet(cfg.sheetName);

  const firstRow = sh.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasHeader = String(firstRow[0] || '').trim() === HEADERS[0];
  if (!hasHeader) {
    sh.clear();
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sh.setFrozenRows(1);
  }

  return sh;
}

function up_(v) {
  return String(v || '').trim().toUpperCase();
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function text_(msg) {
  return ContentService
    .createTextOutput(String(msg || ''))
    .setMimeType(ContentService.MimeType.TEXT);
}

function buildPdfHtml_(boat, rows) {
  const cfg = BOAT_CONFIG[boat];
  const rowsHtml = rows.map(r => {
    return '<tr>' +
      '<td>' + r[0] + '</td>' +
      '<td>' + r[1] + '</td>' +
      '<td>' + r[2] + '</td>' +
      '<td>' + r[3] + '</td>' +
      '<td>' + r[4] + '</td>' +
      '<td>' + r[5] + '</td>' +
      '<td>' + r[6] + '</td>' +
      '<td>' + r[7] + '</td>' +
      '<td>' + r[8] + '</td>' +
    '</tr>';
  }).join('');

  return '<!doctype html><html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;font-size:11px;color:#111;padding:20px;}' +
    'h1{font-size:18px;margin:0 0 10px;}' +
    'table{width:100%;border-collapse:collapse;}' +
    'th,td{border:1px solid #999;padding:6px;vertical-align:top;}' +
    'th{background:#f2f2f2;text-transform:uppercase;font-size:10px;}' +
    '</style></head><body>' +
    '<h1>CREW LIST - ' + cfg.boatName + '</h1>' +
    '<p>Weekend Golfo dei Poeti - ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm') + '</p>' +
    '<table><thead><tr>' +
    '<th>#</th><th>NOME</th><th>NASCITA</th><th>LUOGO</th><th>NAZIONALITA</th><th>TIPO DOC</th><th>NUM DOC</th><th>SCADENZA</th><th>RUOLO</th>' +
    '</tr></thead><tbody>' + rowsHtml + '</tbody></table>' +
    '<script>window.onload=function(){window.print();};</script>' +
    '</body></html>';
}
