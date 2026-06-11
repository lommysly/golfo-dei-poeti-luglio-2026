/* ═══════════════════════════════════════════════════════════
   CONFIGURAZIONE CENTRALIZZATA — Golfo dei Poeti Luglio 2026
   ═══════════════════════════════════════════════════════════

   ISTRUZIONI CREW LIST — NUOVO FLUSSO AUTOMATICO:
   ──────────────────────────────────────────────────────────
   1. Crea un nuovo Google Spreadsheet vuoto
   2. Vai su Estensioni → Apps Script
   3. Incolla il codice da docs/google-apps-script.gs
   4. Salva, poi TORNA AL FOGLIO GOOGLE
   5. Vedrai il menu "Crew List" → clicca "Setup" (crea foglio auto)
   6. Vai su Distribuisci → Nuova distribuzione → Applicazione web
      - Esegui come: IO | Chi ha accesso: Tutti
   7. Copia l'URL e incollalo qui sotto (uno per barca)
   ────────────────────────────────────────────────────────── */

const CONFIG = {
  // ── CREW LIST (sincronizzata tra dispositivi) ───────────
  // URL separati per barca. Se vuoto '', usa solo localStorage
  CREW_SHEETS_URL_ATLANTICA: 'https://script.google.com/macros/s/AKfycbyAnJF9btUcKFHJc-aQ-LPRSaFvOI0J2_iGq-0-ouPA08i65FgwNjTmiiFjWGG7bWL8/exec',
  CREW_SHEETS_URL_SHAREL:    'https://script.google.com/macros/s/AKfycbyzQrNKZzN8vT6ykT3aY7qsBxLiepMoNvYDzXMgZs0VGZiLGeSrCjrJ5b-29YjHhGShAw/exec',

  // Password per download PDF (da usare con Google Sheets)
  ADMIN_PASSWORD: 'Skipper2026',

  // ── CAMBUSA (opzionale, se vuoi sincronizzarla) ────────
  // Se vuoto '', la Cambusa usa localStorage
  CAMBUSA_SHEETS_URL: '',

  // Password cambusa (se si usa localStorage, viene ignorata)
  CAMBUSA_PASSWORD: 'Skipper2026',

  // ── CHECK-IN e INVENTARIO ───────────────────────────────
  // Usano SEMPRE localStorage (nessun servizio esterno)

  // ── DATE EVENTO ─────────────────────────────────────────
  DEPARTURE_DATE: '2026-07-17T17:00:00+02:00',

  // ── INFO BARCHE ─────────────────────────────────────────
  BARCHE: {
    atlantica: { nome: 'Atlantica', modello: 'Beneteau Oceanis 45', maxPax: 10, cabine: 4, bagni: 2 },
    sharel:    { nome: 'Sharel',    modello: 'Beneteau Oceanis 48', maxPax: 12, cabine: 4, bagni: 2, note: '1 cabina con letti a castello' }
  }
};

/* Helper per controllare se un URL è configurato */
function isConfigured(url) {
  return url && url.startsWith('https://script.google.com/');
}
