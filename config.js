/* ═══════════════════════════════════════════════════════════
   CONFIGURAZIONE CENTRALIZZATA — Golfo dei Poeti Luglio 2026
   ═══════════════════════════════════════════════════════════

   ISTRUZIONI PER LA CREW LIST (sincronizzata):
   ──────────────────────────────────────────────────────────
   1. Crea un nuovo Google Spreadsheet vuoto
   2. Vai su Estensioni → Apps Script
   3. Incolla il codice che trovi in docs/google-apps-script.gs
   4. Pubblica → Distribuisci come app web (esegui come: IO, accesso: TUTTI)
   5. Copia l'URL di deployment e incollalo qui sotto

   ISTRUZIONI PER LA CAMBUSA (opzionale):
   ──────────────────────────────────────────────────────────
   Se vuoi sincronizzare la cambusa tra dispositivi, crea un altro
   Google Spreadsheet con lo stesso procedimento e incolla l'URL.
   Altrimenti la cambusa funziona in localStorage (browser).

   Tutto il resto (Check-in, Inventario) usa localStorage.
   ═══════════════════════════════════════════════════════════ */

const CONFIG = {
  // ── CREW LIST (sincronizzata tra dispositivi) ───────────
  // Se vuoto '', la Crew List usa solo localStorage (non sincronizzata)
  // Se compilato con URL Google Apps Script, i dati vanno sul foglio
  CREW_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbyAnJF9btUcKFHJc-aQ-LPRSaFvOI0J2_iGq-0-ouPA08i65FgwNjTmiiFjWGG7bWL8/exec',

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
