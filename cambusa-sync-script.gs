// ============================================================
// CAMBUSA PLANNER — Google Apps Script
// Menu giornaliero → lista spesa → cambusa.html
//
// COME USARE:
// 1. Apri il foglio → menu "🧭 Cambusa" → "⚙️ Setup (prima volta)"
// 2. Configura il tab "config" (persone, date già pre-compilate)
// 3. Compila il tab "menu": una riga per giorno, colonne Colazione/Pranzo/Cena
// 4. Compila "ricette": ingredienti per ogni piatto
// 5. Adatta "dotazioni" (acqua calcolata automaticamente)
// 6. "🛒 Calcola Spesa" → genera la lista → cambusa.html si aggiorna
// ============================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🧭 Cambusa')
    .addItem('⚙️ Setup (prima volta)', 'setup')
    .addSeparator()
    .addItem('🛒 Calcola Spesa', 'calcolaSpesa')
    .addItem('📋 Genera Riepilogo', 'generaRiepilogo')
    .addSeparator()
    .addItem('📅 Imposta Menu (sovrascrive)', 'forzaMenu')
    .addItem('🔄 Riscrive Dotazioni (sovrascrive)', 'forzaDotazioni')
    .addItem('🍝 Riscrive Ricette (sovrascrive)', 'forzaRicette')
    .addSeparator()
    .addItem('🛡️ Proteggi Fogli (una volta)', 'proteggiAltriSheet')
    .addToUi();
}

// ---- SETUP ------------------------------------------------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ['config','menu','ricette','dotazioni','spesa','cambusa'].forEach(name => {
    if (!ss.getSheetByName(name)) ss.insertSheet(name);
  });
  setupConfig(ss.getSheetByName('config'));
  setupMenu(ss.getSheetByName('menu'), ss);
  setupRicette(ss.getSheetByName('ricette'));
  setupDotazioni(ss.getSheetByName('dotazioni'));
  SpreadsheetApp.getUi().alert(
    '✅ Setup completato!\n\n' +
    '1. Controlla "config" (persone, date)\n' +
    '2. Compila "menu" — giorni già generati, inserisci i piatti\n' +
    '3. Compila "ricette" — ingredienti per ogni piatto\n' +
    '4. Adatta "dotazioni" se necessario\n' +
    '5. Clicca "Calcola Spesa"\n\n' +
    'Per rigenerare il menu: svuota il tab "menu" e ripeti Setup.'
  );
}

function setupConfig(sheet) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  sheet.setColumnWidth(1, 240); sheet.setColumnWidth(2, 160);
  sheet.getRange('A1:B1').setValues([['chiave','valore']]).setFontWeight('bold');
  sheet.getRange('A2:B9').setValues([
    ['persone', 12],
    ['data_inizio', '17/07/2026'],
    ['data_fine', '19/07/2026'],
    ['check_in_ora', '17:00'],
    ['check_out_ora', '17:00'],
    ['acqua_litri_per_persona_giorno', 1.5],
    ['acqua_litri_per_giorno_cucina', 3],
    ['acqua_litri_per_giorno_caffe', 1.5],
  ]);
}

function setupMenu(sheet, ss) {
  if (sheet.getLastRow() > 1) return;
  sheet.clearContents();
  [80, 80, 220, 220, 220, 200].forEach((w, i) => sheet.setColumnWidth(i + 1, w));

  // Intestazioni
  const headers = [['Data', 'Giorno', 'Colazione ☕', 'Pranzo 🥗', 'Cena 🍝', 'Note']];
  sheet.getRange('A1:F1').setValues(headers).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);

  // Leggi config per date
  const config = leggiConfig((ss || SpreadsheetApp.getActiveSpreadsheet()).getSheetByName('config'));
  if (!config['data_inizio'] || !config['data_fine']) return;

  const nomiGiorni = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab'];
  const inizio = parseData(config['data_inizio']);
  const fine   = parseData(config['data_fine']);
  const checkIn  = config['check_in_ora']  || '';
  const checkOut = config['check_out_ora'] || '';

  const rows = [];
  let giorno = new Date(inizio);
  while (giorno <= fine) {
    const dataStr = Utilities.formatDate(giorno, 'Europe/Rome', 'dd/MM/yyyy');
    const nomeGiorno = nomiGiorni[giorno.getDay()];
    const isFirst = giorno.getTime() === inizio.getTime();
    const isLast  = giorno.getTime() === fine.getTime();
    const nota = isFirst ? 'Check-in ' + checkIn : isLast ? 'Check-out ' + checkOut : '';
    // Primo giorno: solo cena (arrivo ore 17). Ultimo: solo colazione+pranzo (partenza ore 17)
    rows.push([dataStr, nomeGiorno, isFirst ? '—' : '', isLast ? '—' : '', isLast ? '—' : '', nota]);
    giorno = new Date(giorno.getTime() + 86400000);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 6).setValues(rows);
    // Colore alternato per leggibilità
    rows.forEach((_, i) => {
      if (i % 2 === 0) sheet.getRange(i + 2, 1, 1, 6).setBackground('#f4f8fc');
    });
    // Colore nota check-in/out
    sheet.getRange(2, 6).setFontColor('#888888').setFontStyle('italic');
    sheet.getRange(rows.length + 1, 6).setFontColor('#888888').setFontStyle('italic');
  }
}

var RICETTE_LIST = [
  // Colazione a bordo
  ['Colazione a bordo','Latte LC',200,'ml','Colazione'],
  ['Colazione a bordo','Caffè',10,'g','Colazione'],
  ['Colazione a bordo','Biscotti',40,'g','Colazione'],
  ['Colazione a bordo','Brioche/merendine',1,'pz','Colazione'],
  // Linguine tonno, limone, olive e pomodorini
  ['Linguine tonno e limone','Linguine',120,'g','Pasta/Cereali'],
  ['Linguine tonno e limone','Tonno',65,'g','Scatolame'],
  ['Linguine tonno e limone','Pomodorini',80,'g','Verdure'],
  ['Linguine tonno e limone','Olive Taggiasche',20,'g','Scatolame'],
  ['Linguine tonno e limone','Limone',0.25,'pz','Frutta'],
  ['Linguine tonno e limone','Aglio',0.1,'testa','Cucina'],
  ['Linguine tonno e limone','Olio',20,'ml','Cucina'],
  // Zucchine al sapore di cozza
  ['Zucchine al sapore di cozza','Zucchine',150,'g','Verdure'],
  ['Zucchine al sapore di cozza','Limone',0.25,'pz','Frutta'],
  ['Zucchine al sapore di cozza','Pepe nero',2,'g','Cucina'],
  ['Zucchine al sapore di cozza','Aglio',0.1,'testa','Cucina'],
  ['Zucchine al sapore di cozza','Olio',15,'ml','Cucina'],
  // Risotto allo zafferano
  ['Risotto allo zafferano','Risotto',100,'g','Pasta/Cereali'],
  ['Risotto allo zafferano','Zafferano',0.1,'bustina','Varie'],
  ['Risotto allo zafferano','Grana',20,'g','Freschi'],
  ['Risotto allo zafferano','Vino bianco',30,'ml','Bevande'],
  ['Risotto allo zafferano','Olio',15,'ml','Cucina'],
  ['Risotto allo zafferano','Basilico',3,'g','Varie'],
  // Frittata alle erbe
  ['Frittata alle erbe','Uova',2,'pz','Freschi'],
  ['Frittata alle erbe','Menta/erbe',5,'g','Varie'],
  ['Frittata alle erbe','Olio',10,'ml','Cucina'],
  // Pasta fredda
  ['Pasta fredda','Pasta fredda',100,'g','Pasta/Cereali'],
  ['Pasta fredda','Tonno',40,'g','Scatolame'],
  ['Pasta fredda','Mais',30,'g','Scatolame'],
  ['Pasta fredda','Piselli',20,'g','Scatolame'],
  // Insalata di riso
  ['Insalata di riso','Riso insalata',100,'g','Pasta/Cereali'],
  ['Insalata di riso','Condiriso',10,'g','Scatolame'],
  ['Insalata di riso','Mais',30,'g','Scatolame'],
  ['Insalata di riso','Piselli',20,'g','Scatolame'],
  // Caprese
  ['Caprese','Mozzarella',125,'g','Freschi'],
  ['Caprese','Pomodorini',80,'g','Verdure'],
  ['Caprese','Basilico',3,'g','Varie'],
  ['Caprese','Olio',15,'ml','Cucina'],
  // Pesce spada alla messinese
  ['Pesce spada alla messinese','Pesce spada',200,'g','Pesce'],
  ['Pesce spada alla messinese','Pomodorini',100,'g','Verdure'],
  ['Pesce spada alla messinese','Olive',30,'g','Scatolame'],
  ['Pesce spada alla messinese','Capperi',15,'g','Cucina'],
  ['Pesce spada alla messinese','Aglio',0.1,'testa','Cucina'],
  ['Pesce spada alla messinese','Olio',20,'ml','Cucina'],
  // Avocado toast con uova e bacon
  ['Avocado toast con uova','Avocado',0.5,'pz','Verdure'],
  ['Avocado toast con uova','Uova',2,'pz','Freschi'],
  ['Avocado toast con uova','Bacon',40,'g','Freschi'],
  ['Avocado toast con uova','Pane',2,'fette','Pane/Forno'],
  ['Avocado toast con uova','Pomodorini',60,'g','Verdure'],
  ['Avocado toast con uova','Mozzarella',60,'g','Freschi'],
  // Pasta fredda alla crudaiola
  ['Pasta fredda alla crudaiola','Pasta',100,'g','Pasta/Cereali'],
  ['Pasta fredda alla crudaiola','Pomodorini',80,'g','Verdure'],
  ['Pasta fredda alla crudaiola','Mozzarella',80,'g','Freschi'],
  ['Pasta fredda alla crudaiola','Basilico',3,'g','Varie'],
  ['Pasta fredda alla crudaiola','Aglio',0.1,'testa','Cucina'],
  ['Pasta fredda alla crudaiola','Olio',20,'ml','Cucina'],
];

// ---- MENU GIORNALIERO ----------------------------------------
// Colonne: [data, giorno, colazione, pranzo, cena, nota]
var MENU_LIST = [
  ['17/07/2026', 'Venerdì',   '—',                 '',                          '',                           'Check-in 17:00 · Apericena in navigazione'],
  ['18/07/2026', 'Sabato',    'Colazione a bordo', 'Frittata alle erbe',         'Pesce spada alla messinese', ''],
  ['19/07/2026', 'Domenica',  'Colazione a bordo', 'Avocado toast con uova',     'Linguine tonno e limone',    ''],
];

function forzaMenu() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('menu');
  if (!sheet) { SpreadsheetApp.getUi().alert('Tab "menu" non trovato. Esegui prima il Setup.'); return; }
  // Trova ogni riga per data e aggiorna colazione/pranzo/cena
  const data = sheet.getDataRange().getValues();
  MENU_LIST.forEach(function(m) {
    for (var i = 1; i < data.length; i++) {
      const dataCell = String(data[i][0] instanceof Date
        ? Utilities.formatDate(data[i][0], 'Europe/Rome', 'dd/MM/yyyy')
        : data[i][0]).trim();
      if (dataCell === m[0]) {
        sheet.getRange(i + 1, 3).setValue(m[2]); // colazione
        sheet.getRange(i + 1, 4).setValue(m[3]); // pranzo
        sheet.getRange(i + 1, 5).setValue(m[4]); // cena
        if (m[5]) sheet.getRange(i + 1, 6).setValue(m[5]); // nota (solo se presente)
        break;
      }
    }
  });
  SpreadsheetApp.getUi().alert('✅ Menu impostato — ' + MENU_LIST.length + ' giorni.');
}

function setupRicette(sheet) {
  if (sheet.getLastRow() > 1) return;
  _scriviRicette(sheet);
}

function forzaRicette() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ricette');
  if (!sheet) { SpreadsheetApp.getUi().alert('Tab "ricette" non trovato. Esegui prima il Setup.'); return; }
  _scriviRicette(sheet);
  const nPiatti = new Set(RICETTE_LIST.map(function(r){return r[0];})).size;
  SpreadsheetApp.getUi().alert('✅ Ricette riscritte — ' + RICETTE_LIST.length + ' righe · ' + nPiatti + ' piatti.');
}

function _scriviRicette(sheet) {
  sheet.clearContents();
  [200, 200, 80, 80, 140].forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange('A1:E1').setValues([['Piatto','Ingrediente','Qtà/persona','Unità','Categoria']]).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);
  sheet.getRange(2, 1, RICETTE_LIST.length, 5).setValues(RICETTE_LIST);
}

var DOTAZIONI_LIST = [
  // BASE — Cucina
  ['Sale grosso',          1,   'kg',        'Cucina',        ''],
  ['Sale fino',            1,   'conf.',     'Cucina',        ''],
  ['Olio',                 1,   'bottiglia', 'Cucina',        ''],
  ['Zucchero',             1,   'busta',     'Cucina',        ''],
  ['Aglio',                1,   'testa',     'Cucina',        ''],
  ['Pepe nero',            1,   'conf.',     'Cucina',        'macinato'],
  ['Origano',              1,   'conf.',     'Cucina',        ''],
  // VERDURE
  ['Rucola/insalata mista',4,   'buste',     'Verdure',       ''],
  ['Pomodorini',           2,   'conf.',     'Verdure',       ''],
  ['Zucchine',             4,   'pz',        'Verdure',       ''],
  ['Cetrioli',             4,   'pz',        'Verdure',       ''],
  ['Avocado',              7,   'pz',        'Verdure',       ''],
  ['Scalogno/cipollotto',  4,   'pz',        'Verdure',       ''],
  // FRUTTA
  ['Pesche',              10,   'pz',        'Frutta',        ''],
  ['Mele/banane',         10,   'pz',        'Frutta',        ''],
  ['Uva',                  2,   'grappoli',  'Frutta',        ''],
  ['Arance',               2,   'conf.',     'Frutta',        'anche per spritz'],
  ['Melone',               2,   'pz',        'Frutta',        ''],
  ['Limoni',               6,   'pz',        'Frutta',        ''],
  // COLAZIONE
  ['Latte LC',             4,   'litri',     'Colazione',     ''],
  ['Caffè',                1,   'conf.',     'Colazione',     ''],
  ['Biscotti',             2,   'pacchi',    'Colazione',     ''],
  ['Brioche/merendine',    2,   'pacchi',    'Colazione',     ''],
  ['Yogurt greco',        10,   'pz',        'Colazione',     'vari gusti'],
  ['Cereali/Muesli',       2,   'conf.',     'Colazione',     ''],
  ['Nutella',              1,   'barattolo', 'Colazione',     ''],
  // PASTA/CEREALI
  ['Pasta fredda',        1.5,  'kg',        'Pasta/Cereali', ''],
  ['Linguine',            1.5,  'kg',        'Pasta/Cereali', ''],
  ['Risotto',             1.5,  'kg',        'Pasta/Cereali', ''],
  ['Riso insalata',       1.5,  'kg',        'Pasta/Cereali', ''],
  ['Pan Bauletto',         2,   'pz',        'Pasta/Cereali', ''],
  ['Grissini',             3,   'pz',        'Pasta/Cereali', ''],
  // BEVANDE
  ['Acqua naturale',        7,   'cartoni',   'Bevande',       '42 bottiglie da 1,5L'],
  ['Acqua gasata',          5,   'cartoni',   'Bevande',       '30 bottiglie da 1,5L'],
  ['Coca-Cola',             1,   'conf.',     'Bevande',       '12 lattine'],
  ['Coca-Cola Zero',        1,   'conf.',     'Bevande',       '12 lattine'],
  ['Succo di frutta/ACE',  4,   'brick',     'Bevande',       ''],
  ['Birra',               48,   'lattine',   'Bevande',       'Corona o simile'],
  ['Vino bianco',          2,   'casse',     'Bevande',       '12 bottiglie'],
  ['Prosecco',             3,   'casse',     'Bevande',       '18 bottiglie · qualità'],
  ['Aperol',               2,   'bottiglie', 'Bevande',       'per Aperol Spritz'],
  ['Campari',              1,   'bottiglia', 'Bevande',       'per Campari Spritz'],
  ['Seltz/Soda',           2,   'conf.',     'Bevande',       'per spritz'],
  ['Gin',                  2,   'bottiglie', 'Bevande',       'per gin tonic'],
  ['Vodka',                1,   'bottiglia', 'Bevande',       'per vodka tonic'],
  ['Tonica',               3,   'conf.',     'Bevande',       'gin tonic + vodka tonic'],
  ['Ghiaccio',            20,   'kg',        'Bevande',       'Platonica o simile'],
  // AFFETTATI
  ['Prosciutto crudo',     3,   'etti',      'Affettati',     ''],
  ['Bresaola',             2,   'etti',      'Affettati',     ''],
  ['Salame',               3,   'buste',     'Affettati',     ''],
  ['Salamino',             1,   'pz',        'Affettati',     ''],
  ['Mortadella',           3,   'etti',      'Affettati',     ''],
  // FRESCHI
  ['Formaggi misti',       1,   'conf.',     'Freschi',       'q.b.'],
  ['Grana',                1,   'busta',     'Freschi',       ''],
  ['Mozzarella',          12,   'pz',        'Freschi',       ''],
  ['Mozzarella ciliegini', 3,   'buste',     'Freschi',       ''],
  ['Uova',                25,   'pz',        'Freschi',       ''],
  // VARIE
  ['Taralli',              3,   'pacchi',    'Varie',         ''],
  ['Patatine',             5,   'conf.',     'Varie',         ''],
  ['Crostini',             2,   'conf.',     'Varie',         ''],
  ['Salatini freschi',     1,   'conf.',     'Varie',         ''],
  ['Zafferano',            1,   'bustine',   'Varie',         'per risotto'],
  ['Menta/erbe',           1,   'mazzetto',  'Varie',         'per frittata'],
  ['Basilico',             1,   'mazzetto',  'Varie',         'per risotto'],
  ['Prezzemolo',           1,   'mazzetto',  'Varie',         ''],
  ['Erba cipollina',       1,   'mazzetto',  'Varie',         ''],
  // SCATOLAME
  ['Tonno',               10,   'scatole',   'Scatolame',     ''],
  ['Mais',                 3,   'conf.',     'Scatolame',     ''],
  ['Piselli',              2,   'conf.',     'Scatolame',     ''],
  ['Condiriso',            1,   'conf.',     'Scatolame',     ''],
  ['Olive',                4,   'barattoli', 'Scatolame',     ''],
  // PULIZIE
  ['Bio per piatti',       1,   'conf.',     'Pulizie',       ''],
  ['Sgrassatore',          1,   'spray',     'Pulizie',       ''],
  ['Scottex/rotoloni',     1,   'rotolone',  'Pulizie',       ''],
  ['Carta igienica',      10,   'rotoli',    'Pulizie',       ''],
  ['Spugnette',            1,   'conf.',     'Pulizie',       ''],
  ['Stracci/strofinacci',  1,   'conf.',     'Pulizie',       ''],
  ['Sacchetti piccoli',   10,   'pz',        'Pulizie',       ''],
  ['Sacchetti grandi neri',10,  'pz',        'Pulizie',       ''],
  ['Carta argento',        1,   'rotolo',    'Pulizie',       ''],
  ['Bicchieri plastica',  80,   'pz',        'Pulizie',       ''],
  ['Piatti plastica',    100,   'pz',        'Pulizie',       ''],
  ['Tovaglioli carta',     3,   'conf.',     'Pulizie',       ''],
];

function setupDotazioni(sheet) {
  if (sheet.getLastRow() > 1) return;
  _scriviDotazioni(sheet);
}

function forzaDotazioni() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('dotazioni');
  if (!sheet) { SpreadsheetApp.getUi().alert('Tab "dotazioni" non trovato. Esegui prima il Setup.'); return; }
  _scriviDotazioni(sheet);
  SpreadsheetApp.getUi().alert('✅ Dotazioni riscritte — ' + DOTAZIONI_LIST.length + ' articoli.');
}

function _scriviDotazioni(sheet) {
  sheet.clearContents();
  [220, 80, 120, 140, 200].forEach(function(w, i) { sheet.setColumnWidth(i + 1, w); });
  sheet.getRange('A1:E1').setValues([['Articolo','Quantità','Unità','Categoria','Note']]).setFontWeight('bold').setBackground('#e8f0f7');
  sheet.setFrozenRows(1);
  sheet.getRange(2, 1, DOTAZIONI_LIST.length, 5).setValues(DOTAZIONI_LIST);
}

// ---- CALCOLA SPESA ----------------------------------------
function calcolaSpesa() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const config    = leggiConfig(ss.getSheetByName('config'));
  const menu      = leggiMenu(ss.getSheetByName('menu'));
  const ricette   = leggiRicette(ss.getSheetByName('ricette'));
  const dotazioni = leggiDotazioni(ss.getSheetByName('dotazioni'));

  const n_persone = Number(config['persone']) ||
    Object.entries(config).filter(([k]) => k.startsWith('persone_'))
      .reduce((s, [, v]) => s + (Number(v) || 0), 0);

  const giorni = daysBetween(config['data_inizio'], config['data_fine']);
  const acqua_pp   = Number(config['acqua_litri_per_persona_giorno']) || 1.5;
  const acqua_cuc  = Number(config['acqua_litri_per_giorno_cucina']) || 3;
  const acqua_caf  = Number(config['acqua_litri_per_giorno_caffe'])  || 1.5;

  if (n_persone === 0) {
    SpreadsheetApp.getUi().alert('⚠️ Imposta "persone" nel tab config prima di calcolare.');
    return;
  }

  // Conteggio pasti
  const n_col  = menu.filter(m => m.pasto === 'Colazione').length;
  const n_pran = menu.filter(m => m.pasto === 'Pranzo').length;
  const n_cen  = menu.filter(m => m.pasto === 'Cena').length;

  // Ingredienti da menu × ricette × persone
  const ing = {};
  menu.forEach(row => {
    if (!row.piatto) return;
    ricette.filter(r => r.piatto === row.piatto).forEach(r => {
      const k = r.ingrediente + '__' + r.unita;
      if (!ing[k]) ing[k] = { nome: r.ingrediente, qty: 0, unita: r.unita, categoria: r.categoria };
      ing[k].qty += r.qta_per_persona * n_persone;
    });
  });

  // Acqua: gestita manualmente nelle dotazioni (naturale + gasata)

  // Ordine categorie
  const catOrder = ['Cucina','Verdure','Frutta','Pasta/Cereali','Carne/Pesce','Freschi','Scatolame','Colazione','Varie','Bevande','Pulizie'];
  const sortCat = (a, b) => {
    const ia = catOrder.indexOf(a.categoria) >= 0 ? catOrder.indexOf(a.categoria) : 99;
    const ib = catOrder.indexOf(b.categoria) >= 0 ? catOrder.indexOf(b.categoria) : 99;
    return ia - ib || (a.nome || a.articolo || '').localeCompare(b.nome || b.articolo || '');
  };

  const rows = [];
  Object.values(ing).sort(sortCat).forEach(i => {
    rows.push([slugify(i.nome), i.nome, formatQty(i.qty, i.unita), i.unita, i.categoria, 'menu']);
  });
  dotazioni.sort(sortCat).forEach(d => {
    rows.push([slugify(d.articolo), d.articolo, d.quantita + (d.unita ? ' ' + d.unita : ''), d.unita, d.categoria, 'dotazione']);
  });

  // Scrivi tab spesa
  const spesaSheet = ss.getSheetByName('spesa') || ss.insertSheet('spesa');
  spesaSheet.clearContents();
  spesaSheet.getRange(1, 1, 1, 6).setValues([['ID','Articolo','Quantità','Unità','Categoria','Tipo']]).setFontWeight('bold').setBackground('#e8f0f7');
  if (rows.length > 0) spesaSheet.getRange(2, 1, rows.length, 6).setValues(rows);

  sincronizzaCambusa(ss, rows.map(r => r[0]));

  SpreadsheetApp.getUi().alert(
    '✅ Spesa calcolata!\n\n' +
    '👥 ' + n_persone + ' persone · 📅 ' + giorni + ' giorni\n' +
    '☕ ' + n_col + ' colazioni · 🥗 ' + n_pran + ' pranzi · 🍝 ' + n_cen + ' cene\n' +
    '📦 ' + rows.length + ' articoli in lista\n\n' +
    '📋 Tab "riepilogo" aggiornato — condividilo con il link del foglio.\n' +
    '🌐 La cambusa.html si aggiorna al prossimo accesso.\n' +
    '📋 Usa "Genera Riepilogo" per creare/aggiornare il tab condivisibile.'
  );
}

function sincronizzaCambusa(ss, ids) {
  const sheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  const existing = {};
  if (sheet.getLastRow() > 0) {
    sheet.getDataRange().getValues().forEach(r => { if (r[0]) existing[r[0]] = r[1] === true || r[1] === 'TRUE'; });
  }
  sheet.clearContents();
  if (ids.length > 0) sheet.getRange(1, 1, ids.length, 2).setValues(ids.map(id => [id, !!existing[id]]));
}

// ---- HELPERS -----------------------------------------------
function leggiConfig(sheet) {
  const cfg = {};
  if (!sheet || sheet.getLastRow() < 2) return cfg;
  sheet.getDataRange().getValues().slice(1).forEach(r => {
    if (r[0]) cfg[String(r[0])] = isNaN(r[1]) || r[1] === '' ? r[1] : Number(r[1]);
  });
  return cfg;
}

function leggiMenu(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  const meals = [];
  sheet.getDataRange().getValues().slice(1).forEach(r => {
    const [data, giorno, colazione, pranzo, cena] = r;
    if (colazione && colazione !== '—') meals.push({ data, giorno, pasto: 'Colazione', piatto: String(colazione) });
    if (pranzo   && pranzo   !== '—') meals.push({ data, giorno, pasto: 'Pranzo',    piatto: String(pranzo) });
    if (cena     && cena     !== '—') meals.push({ data, giorno, pasto: 'Cena',      piatto: String(cena) });
  });
  return meals;
}

function leggiRicette(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0] && r[1] && r[2])
    .map(r => ({ piatto: r[0], ingrediente: r[1], qta_per_persona: Number(r[2]) || 0, unita: r[3] || '', categoria: r[4] || 'Varie' }));
}

function leggiDotazioni(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1)
    .filter(r => r[0])
    .map(r => ({ articolo: r[0], quantita: r[1], unita: r[2] || '', categoria: r[3] || 'Varie', note: r[4] }));
}

function parseData(s) {
  if (s instanceof Date) return new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const p = String(s).split('/');
  if (p.length === 3) return new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0]));
  return new Date(s);
}

function daysBetween(d1, d2) {
  return Math.max(0, Math.round((parseData(d2) - parseData(d1)) / 86400000));
}

function slugify(s) {
  return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function formatQty(qty, unita) {
  if (unita === 'g'  && qty >= 1000) return (qty / 1000).toFixed(qty % 1000 ? 1 : 0).replace(/\.0$/, '') + ' kg';
  if (unita === 'ml' && qty >= 1000) return (qty / 1000).toFixed(qty % 1000 ? 1 : 0).replace(/\.0$/, '') + ' litri';
  if (unita === 'litri') return Number(qty).toFixed(qty % 1 ? 1 : 0) + ' litri';
  return Math.ceil(qty) + (unita ? ' ' + unita : '');
}

// ---- WEB APP (lato sito) -----------------------------------
function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const action = params.action || 'get';
  if (action === 'getList')            return getListAction(ss, params.callback);
  if (action === 'getRiepilogo')       return getRiepilogoAction(ss, params.callback);
  if (action === 'setRiepilogoCheck')  return setRiepilogoCheckAction(ss, params.nome, params.val, params.callback);
  if (action === 'getMenu')            return getMenuAction(ss, params.callback);
  if (action === 'getSheetUrl')        return getSheetUrlAction(ss, params.callback);
  if (action === 'addItem')            return addItemAction(ss, params.nome, params.qty, params.cat, params.callback);
  if (action === 'removeItem')         return removeItemAction(ss, params.id, params.callback);
  if (action === 'set')                return setAction(ss, params.id, params.val, params.callback);
  if (action === 'reset')              return resetAction(ss, params.callback);
  return getStateAction(ss, params.callback);
}

function getMenuAction(ss, callback) {
  const config  = leggiConfig(ss.getSheetByName('config'));
  const menuRaw = leggiMenuRaw(ss.getSheetByName('menu'));
  const ricette = leggiRicette(ss.getSheetByName('ricette'));
  const n_persone = Number(config['persone']) || 10;

  const ricMap = {};
  ricette.forEach(function(r) {
    if (!ricMap[r.piatto]) ricMap[r.piatto] = [];
    ricMap[r.piatto].push(r);
  });

  const giorni = menuRaw.map(function(row) {
    const pasti = [];
    [['Colazione', row.colazione], ['Pranzo', row.pranzo], ['Cena', row.cena]].forEach(function(pair) {
      const pasto = pair[0], piatto = String(pair[1] || '').trim();
      if (!piatto || piatto === '—') return;
      const ings = (ricMap[piatto] || []).map(function(r) {
        return { nome: r.ingrediente, qty: formatQty(r.qta_per_persona * n_persone, r.unita) };
      });
      pasti.push({ pasto: pasto, piatto: piatto, ingredienti: ings });
    });
    return { data: String(row.data), giorno: String(row.giorno), nota: String(row.nota || ''), pasti: pasti };
  }).filter(function(g) { return g.pasti.length > 0; });

  return jsonpResponse(callback, { n_persone: n_persone, giorni: giorni });
}

function leggiMenuRaw(sheet) {
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getDataRange().getValues().slice(1).map(function(r) {
    return { data: r[0], giorno: r[1], colazione: r[2] || '', pranzo: r[3] || '', cena: r[4] || '', nota: r[5] || '' };
  });
}

function getListAction(ss, callback) {
  const spesaSheet = ss.getSheetByName('spesa');
  if (!spesaSheet || spesaSheet.getLastRow() < 2) return jsonpResponse(callback, []);
  const state = {};
  const cambusaSheet = ss.getSheetByName('cambusa');
  if (cambusaSheet && cambusaSheet.getLastRow() > 0) {
    cambusaSheet.getDataRange().getValues().forEach(r => { if (r[0]) state[String(r[0])] = r[1] === true || r[1] === 'TRUE'; });
  }
  const catMap = {}, catOrder = [];
  spesaSheet.getDataRange().getValues().slice(1).forEach(r => {
    const [id, nome, qty, , categoria] = r;
    if (!id || !nome) return;
    if (!catMap[categoria]) { catMap[categoria] = []; catOrder.push(categoria); }
    catMap[categoria].push({ id: String(id), nome: String(nome), qty: String(qty || ''), checked: !!state[String(id)] });
  });
  return jsonpResponse(callback, catOrder.map(cat => ({ category: cat, items: catMap[cat] })));
}

function getRiepilogoAction(ss, callback) {
  const sheet = ss.getSheetByName('riepilogo');
  if (!sheet || sheet.getLastRow() < 4) return jsonpResponse(callback, []);
  const data = sheet.getRange(4, 1, sheet.getLastRow() - 3, 5).getValues();
  const result = [];
  data.forEach(function(r) {
    const colA = String(r[0] || '').trim();
    if (!colA) return;
    // Riga di categoria: B-D vuote
    if (!r[1] && !r[2] && !r[3]) {
      result.push({ category: colA, items: [] });
      return;
    }
    if (result.length === 0) return;
    const id = colA.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
                   .replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'').replace(/-+/g,'-').replace(/^-|-$/g,'');
    result[result.length - 1].items.push({
      id: id, nome: colA,
      qty: String(r[1] || ''), unit: String(r[2] || ''), nota: String(r[3] || ''),
      checked: r[4] === true || r[4] === 'TRUE'
    });
  });
  return jsonpResponse(callback, result.filter(function(c) { return c.items.length > 0; }));
}

function setRiepilogoCheckAction(ss, nome, val, callback) {
  const sheet = ss.getSheetByName('riepilogo');
  if (!sheet || !nome) return jsonpResponse(callback, { ok: false });
  const data = sheet.getDataRange().getValues();
  for (var i = 3; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(nome).trim()) {
      sheet.getRange(i + 1, 5).setValue(val === 'true');
      return jsonpResponse(callback, { ok: true });
    }
  }
  return jsonpResponse(callback, { ok: false });
}

function getStateAction(ss, callback) {
  const sheet = ss.getSheetByName('cambusa');
  const state = {};
  if (sheet && sheet.getLastRow() > 0) {
    sheet.getDataRange().getValues().forEach(r => { if (r[0]) state[String(r[0])] = r[1] === true || r[1] === 'TRUE'; });
  }
  return jsonpResponse(callback, state);
}

function setAction(ss, id, val, callback) {
  const sheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  const data = sheet.getLastRow() > 0 ? sheet.getDataRange().getValues() : [];
  let found = false;
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) { sheet.getRange(i + 1, 2).setValue(val === 'true'); found = true; break; }
  }
  if (!found) sheet.appendRow([id, val === 'true']);
  return jsonpResponse(callback, { ok: true });
}

function resetAction(ss, callback) {
  // Reset riepilogo column E (sovereign source of truth)
  const rSheet = ss.getSheetByName('riepilogo');
  if (rSheet && rSheet.getLastRow() > 3) {
    const data = rSheet.getRange(4, 1, rSheet.getLastRow() - 3, 5).getValues();
    for (var i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() && data[i][1]) {
        rSheet.getRange(i + 4, 5).setValue(false);
      }
    }
  }
  return jsonpResponse(callback, { ok: true });
}

function jsonpResponse(callback, data) {
  const json = JSON.stringify(data);
  const body = callback ? callback + '(' + json + ')' : json;
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getSheetUrlAction(ss, callback) {
  return jsonpResponse(callback, { url: ss.getUrl() });
}

function addItemAction(ss, nome, qty, cat, callback) {
  if (!nome) return jsonpResponse(callback, { ok: false });
  const spesaSheet = ss.getSheetByName('spesa') || ss.insertSheet('spesa');
  const id = slugify(nome) + '-' + String(Date.now()).slice(-6);
  spesaSheet.appendRow([id, nome, qty || '', '', cat || 'Varie', 'manuale']);
  const cambusaSheet = ss.getSheetByName('cambusa') || ss.insertSheet('cambusa');
  cambusaSheet.appendRow([id, false]);
  return jsonpResponse(callback, { ok: true, id: id, nome: nome, qty: qty || '', categoria: cat || 'Varie' });
}

function removeItemAction(ss, id, callback) {
  if (!id) return jsonpResponse(callback, { ok: false });
  const spesaSheet = ss.getSheetByName('spesa');
  if (spesaSheet && spesaSheet.getLastRow() > 0) {
    const data = spesaSheet.getDataRange().getValues();
    for (var i = data.length - 1; i >= 0; i--) {
      if (String(data[i][0]) === String(id)) { spesaSheet.deleteRow(i + 1); break; }
    }
  }
  const cambusaSheet = ss.getSheetByName('cambusa');
  if (cambusaSheet && cambusaSheet.getLastRow() > 0) {
    const cData = cambusaSheet.getDataRange().getValues();
    for (var j = cData.length - 1; j >= 0; j--) {
      if (String(cData[j][0]) === String(id)) { cambusaSheet.deleteRow(j + 1); break; }
    }
  }
  return jsonpResponse(callback, { ok: true });
}

// ---- RIEPILOGO CONDIVISIBILE (sovrano — non sovrascritto da Calcola Spesa) ----
function generaRiepilogo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const spesaSheet = ss.getSheetByName('spesa');
  if (!spesaSheet || spesaSheet.getLastRow() < 2) {
    SpreadsheetApp.getUi().alert('⚠️ Esegui prima "Calcola Spesa".');
    return;
  }

  // Mappa note: articolo → nota (da tab dotazioni)
  const noteMap = {};
  const dotSheet = ss.getSheetByName('dotazioni');
  if (dotSheet && dotSheet.getLastRow() > 1) {
    dotSheet.getDataRange().getValues().slice(1).forEach(function(r) {
      if (r[0]) noteMap[String(r[0])] = r[4] ? String(r[4]) : '';
    });
  }

  const config  = leggiConfig(ss.getSheetByName('config'));
  const persone = config['persone'] || 12;
  const giorni  = daysBetween(config['data_inizio'], config['data_fine']);
  const dataStr = Utilities.formatDate(new Date(), 'Europe/Rome', 'dd/MM/yyyy HH:mm');

  const rSheet = ss.getSheetByName('riepilogo') || ss.insertSheet('riepilogo');
  rSheet.clearContents();
  rSheet.clearFormats();

  // 5 colonne: Articolo | Quantità | Unità | Note | ✓ OK
  [220, 75, 95, 200, 55].forEach(function(w, i) { rSheet.setColumnWidth(i + 1, w); });

  rSheet.getRange('A1:E1').merge()
    .setValue('LISTA SPESA — CORSICA EXPERIENCE  ·  17 Lug–19 Lug 2026  ·  ' + persone + ' persone · ' + giorni + ' giorni')
    .setFontSize(12).setFontWeight('bold').setBackground('#0b3c5d').setFontColor('#fff').setVerticalAlignment('middle');
  rSheet.setRowHeight(1, 40);

  rSheet.getRange('A2:E2').merge()
    .setValue('Generata il ' + dataStr + '  —  Modifica liberamente: Calcola Spesa non sovrascriverà questo tab')
    .setFontSize(8).setFontColor('#777').setBackground('#f4f8fc').setVerticalAlignment('middle');

  rSheet.getRange('A3:E3').setValues([['Articolo', 'Quantità', 'Unità', 'Note', '✓ OK']])
    .setFontWeight('bold').setBackground('#1a5276').setFontColor('#fff').setFontSize(9);
  rSheet.setFrozenRows(3);

  const CAT_EMOJI = {
    'Cucina':'🧂','Verdure':'🥬','Frutta':'🍎','Pasta/Cereali':'🍝','Carne/Pesce':'🥩',
    'Freschi':'🧀','Affettati':'🥩','Scatolame':'🥫','Colazione':'☕','Varie':'🧺',
    'Bevande':'🥤','Pulizie':'🧽','Dotazioni':'⚓'
  };

  const catMap = {}, catOrder = [];
  spesaSheet.getDataRange().getValues().slice(1).forEach(function(r) {
    const cat = r[4]; if (!cat || !r[1]) return;
    if (!catMap[cat]) { catMap[cat] = []; catOrder.push(cat); }
    // Separa numero e unità dalla quantità formattata (es. "1.5 kg" → "1.5" + "kg")
    const qtyRaw  = String(r[2] || '');
    const parts   = qtyRaw.split(' ');
    const qtyNum  = parts[0];
    const qtyUnit = parts.length > 1 ? parts.slice(1).join(' ') : (r[3] ? String(r[3]) : '');
    const nota    = noteMap[String(r[1])] || '';
    catMap[cat].push({ nome: String(r[1]), num: qtyNum, unit: qtyUnit, nota: nota });
  });

  let rowIdx = 4;
  catOrder.forEach(function(cat) {
    rSheet.getRange(rowIdx, 1, 1, 5).merge()
      .setValue((CAT_EMOJI[cat] || '📦') + '  ' + cat)
      .setFontWeight('bold').setFontSize(9).setBackground('#d6e4f0').setFontColor('#0b3c5d');
    rowIdx++;
    catMap[cat].forEach(function(item, idx) {
      const bg = idx % 2 === 0 ? '#ffffff' : '#f7fafd';
      rSheet.getRange(rowIdx, 1).setValue(item.nome).setBackground(bg).setFontSize(9);
      rSheet.getRange(rowIdx, 2).setValue(item.num).setBackground(bg).setFontSize(11)
        .setFontWeight('bold').setFontColor('#0b3c5d').setHorizontalAlignment('right');
      rSheet.getRange(rowIdx, 3).setValue(item.unit).setBackground(bg).setFontSize(9).setFontColor('#444');
      rSheet.getRange(rowIdx, 4).setValue(item.nota).setBackground(bg).setFontSize(8).setFontColor('#888');
      rSheet.getRange(rowIdx, 5).insertCheckboxes().setBackground(bg);
      rowIdx++;
    });
  });

  const totalItems = Object.values(catMap).reduce(function(s, a) { return s + a.length; }, 0);
  rSheet.getRange(rowIdx, 1, 1, 4).merge()
    .setValue('Totale: ' + totalItems + ' articoli')
    .setFontWeight('bold').setFontSize(9).setBackground('#e8f0f7').setFontColor('#0b3c5d');
  rSheet.getRange(rowIdx, 5).setBackground('#e8f0f7');

  SpreadsheetApp.getUi().alert(
    '✅ Riepilogo generato!\n\n' +
    '📋 Puoi modificare liberamente il tab "riepilogo".\n' +
    'Calcola Spesa NON lo sovrascriverà mai più.'
  );
}

// ---- PROTEZIONE FOGLI -----------------------------------------
function proteggiAltriSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const daProteggere = ['config', 'menu', 'ricette', 'dotazioni', 'spesa', 'cambusa'];
  let count = 0;
  daProteggere.forEach(function(name) {
    const sheet = ss.getSheetByName(name);
    if (!sheet) return;
    sheet.getProtections(SpreadsheetApp.ProtectionType.SHEET).forEach(function(p) { p.remove(); });
    sheet.protect()
      .setDescription('Tab gestita dallo script — non modificare manualmente')
      .setWarningOnly(true);
    count++;
  });
  SpreadsheetApp.getUi().alert(
    '✅ Protezione applicata a ' + count + ' tab\n\n' +
    'Chi apre config/menu/ricette/dotazioni/spesa/cambusa\n' +
    'vedrà un avviso prima di poter modificare.\n\n' +
    'Il tab "riepilogo" è libero — condividilo con il link del foglio.'
  );
}
