/* ══════════════════════════════════════════════════
   GOLFO DEI POETI WEEKEND — Script
   Luglio 2026
   ══════════════════════════════════════════════════ */

/* ── Google Sheets API ──────────────────────────── */
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyAnJF9btUcKFHJc-aQ-LPRSaFvOI0J2_iGq-0-ouPA08i65FgwNjTmiiFjWGG7bWL8/exec';
const ADMIN_PASSWORDS = {
  atlantica: 'Skipper2026',
  oceanis:   'Skipper2026'
};

/* ── Stato live equipaggio ──────────────────────── */
async function loadCrewStatus(boat, listId, countId) {
  const listEl  = document.getElementById(listId  || 'crewStatusList');
  const countEl = document.getElementById(countId || 'crewStatusCount');
  if (!listEl) return;
  listEl.innerHTML = '<span style="color:rgba(255,255,255,.3); font-size:.85rem;">Caricamento...</span>';
  try {
    const res = await fetch(SHEETS_URL + '?boat=' + boat);
    const json = await res.json();
    const members = (json.members || []).filter(m => m.nome && m.nome.trim());
    if (members.length === 0) {
      listEl.innerHTML = '<span style="color:rgba(255,255,255,.3); font-size:.85rem;">Nessuno ha ancora compilato.</span>';
      if (countEl) countEl.textContent = '';
      return;
    }
    listEl.innerHTML = members.map(m => {
      const ruolo = m.ruolo || '';
      const icon = ruolo.toLowerCase().includes('skipper') ? '⚓' : ruolo.toLowerCase().includes('co') ? '🧭' : '⛵';
      return `<div style="display:flex; align-items:center; gap:8px; background:rgba(28,167,168,.12); border:1px solid rgba(28,167,168,.25); border-radius:10px; padding:8px 14px;">
        <span style="font-size:1rem;">${icon}</span>
        <div>
          <div style="font-size:.88rem; font-weight:600; color:#fff;">${m.nome}</div>
          <div style="font-size:.7rem; color:rgba(255,255,255,.45); text-transform:uppercase; letter-spacing:.06em;">${ruolo || '—'}</div>
        </div>
      </div>`;
    }).join('');
    if (countEl) countEl.textContent = `${members.length} ${members.length === 1 ? 'membro ha' : 'membri hanno'} compilato`;
  } catch(e) {
    listEl.innerHTML = '<span style="color:rgba(255,255,255,.3); font-size:.85rem;">Impossibile caricare i dati.</span>';
  }
}

/* ── Preloader ──────────────────────────────────── */
window.addEventListener('load', () => {
  const loader = document.getElementById('preloader');
  if (loader) {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.querySelectorAll('#heroContent .reveal-up').forEach((el, i) => {
        setTimeout(() => el.classList.add('visible'), 100 + i * 150);
      });
    }, 1200);
  }
});

/* ── Navbar scroll ──────────────────────────────── */
const nav = document.getElementById('nav');
if (nav) {
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ── Mobile burger ──────────────────────────────── */
const burger    = document.getElementById('navBurger');
const mobileNav = document.getElementById('navMobile');
if (burger && mobileNav) {
  burger.addEventListener('click', () => mobileNav.classList.toggle('open'));
  mobileNav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => mobileNav.classList.remove('open'));
  });
}

/* ── Countdown ──────────────────────────────────── */
const DEPARTURE = new Date('2026-07-17T17:00:00+02:00').getTime();
function updateCountdown() {
  const cdDays  = document.getElementById('cdDays');
  if (!cdDays) return;
  const now  = Date.now();
  const diff = DEPARTURE - now;
  if (diff <= 0) {
    const cd = document.getElementById('countdown');
    if (cd) cd.innerHTML = '<div class="cd-block"><span class="cd-num">Salpati!</span></div>';
    return;
  }
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000)  / 60000);
  const s = Math.floor((diff % 60000)    / 1000);
  document.getElementById('cdDays').textContent  = String(d).padStart(2,'0');
  document.getElementById('cdHours').textContent = String(h).padStart(2,'0');
  document.getElementById('cdMins').textContent  = String(m).padStart(2,'0');
  document.getElementById('cdSecs').textContent  = String(s).padStart(2,'0');
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ── Scroll reveal (IntersectionObserver) ───────── */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
  // Skip hero content — handled by preloader callback
  if (!el.closest('#heroContent')) revealObserver.observe(el);
});

/* ── Meteo tabs ──────────────────────────────────── */
document.querySelectorAll('.mr-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.mr-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.meteo-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panelId = 'panel-' + tab.dataset.route;
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('active');
      // Re-trigger reveals inside newly visible panel
      panel.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        el.classList.add('visible');
      });
    }
  });
});

/* ── FAQ accordion ──────────────────────────────── */
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    // Close all
    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });
    // Open clicked if it was closed
    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      btn.nextElementSibling.classList.add('open');
    }
  });
});

/* ── Smooth anchor scroll ───────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - 72, behavior: 'smooth' });
    }
  });
});

/* ── Crew List — accettazione regole per barca (crewlist.html) ── */
function toggleAccettaBoat(cb, boat) {
  localStorage.setItem('regole_' + boat, cb.checked ? '1' : '');
  const status = document.getElementById('accettaStatus-' + boat);
  if (status) status.style.display = cb.checked ? 'block' : 'none';
}

/* ── Crew List — selezione barca ───────────────── */
function selectBoat(boat) {
  const boatNames = { atlantica: '⛵ Atlantica 45', oceanis: '⛵ Sharel (Oceanis 48)' };
  document.getElementById('crewBoatSelect').style.display = 'none';
  const formArea = document.getElementById('crewFormArea');
  formArea.style.display = 'block';
  document.getElementById('crewFormTitle').textContent = boatNames[boat];
  // mostra solo il pannello della barca scelta
  document.querySelectorAll('.crew-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('crew-' + boat);
  if (panel) panel.classList.add('active');
  // carica dati salvati o aggiungi 1 membro vuoto
  const container = document.getElementById('members-' + boat);
  if (container && container.children.length === 0) {
    const saved = loadFromStorage(boat);
    if (saved.length > 0) {
      saved.forEach(data => addMember(boat, data));
      const btn = document.getElementById('btnSalva-' + boat);
      if (btn) { btn.innerHTML = '✏️ Modifica i miei dati'; }
    } else {
      addMember(boat);
    }
  }
  // ripristina stato checkbox regole
  const accepted = localStorage.getItem('regole_' + boat) === '1';
  const cb = document.getElementById('checkRegole-' + boat);
  if (cb) cb.checked = accepted;
  const st = document.getElementById('accettaStatus-' + boat);
  if (st) st.style.display = accepted ? 'block' : 'none';
  // carica dashboard stato equipaggio
  loadCrewStatus(boat, 'crewStatusList-' + boat, 'crewStatusCount-' + boat);
  // scroll smooth al form
  formArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function backToBoatSelect() {
  document.getElementById('crewFormArea').style.display = 'none';
  document.getElementById('crewBoatSelect').style.display = 'block';
  document.getElementById('crewBoatSelect').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── Crew member row template ─────────────────── */
let memberCount = { atlantica: 0, oceanis: 0 };
const CREW_FIELDS = ['nome','cognome','sesso','nascita','comuneNascita','provNascita','nazionalita','via','citta','prov','cap','tipoDoc','numDoc','scadDoc','ruolo','cf'];

function saveToStorage(boat) {
  const container = document.getElementById('members-' + boat);
  if (!container) return;
  const data = [];
  container.querySelectorAll('.crew-member-row').forEach(row => {
    const member = {};
    CREW_FIELDS.forEach(f => { member[f] = row.querySelector(`[data-field="${f}"]`)?.value || ''; });
    data.push(member);
  });
  localStorage.setItem('crew_' + boat, JSON.stringify(data));
}

function loadFromStorage(boat) {
  try { return JSON.parse(localStorage.getItem('crew_' + boat)) || []; }
  catch(e) { return []; }
}

function addMember(boat, prefill) {
  const hint = document.getElementById('crewEmptyHint');
  if (hint) hint.style.display = 'none';
  memberCount[boat]++;
  const idx = memberCount[boat];
  const container = document.getElementById('members-' + boat);
  const row = document.createElement('div');
  row.className = 'crew-member-row';
  row.id = `member-${boat}-${idx}`;
  row.innerHTML = `
    <div class="crew-field">
      <label>Nome <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Mario" data-field="nome" autocomplete="given-name" />
    </div>
    <div class="crew-field">
      <label>Cognome <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Rossi" data-field="cognome" autocomplete="family-name" />
    </div>
    <div class="crew-field">
      <label>Sesso <span style="color:#e05">*</span></label>
      <select data-field="sesso">
        <option value="" disabled selected>— M / F —</option>
        <option value="M">Maschio</option>
        <option value="F">Femmina</option>
      </select>
    </div>
    <div class="crew-field">
      <label>Data di Nascita <span style="color:#e05">*</span></label>
      <input type="date" data-field="nascita" />
    </div>
    <div class="crew-field">
      <label>Comune di Nascita <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Roma" data-field="comuneNascita" />
    </div>
    <div class="crew-field">
      <label>Prov. Nascita</label>
      <input type="text" placeholder="RM" data-field="provNascita" maxlength="3" style="text-transform:uppercase" />
    </div>
    <div class="crew-field">
      <label>Nazionalità <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Italiana" data-field="nazionalita" maxlength="30" />
    </div>
    <div class="crew-field crew-field-full">
      <label>Via / Indirizzo di Residenza <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Via Roma 1" data-field="via" autocomplete="street-address" />
    </div>
    <div class="crew-field">
      <label>Città di Residenza <span style="color:#e05">*</span></label>
      <input type="text" placeholder="Roma" data-field="citta" autocomplete="address-level2" />
    </div>
    <div class="crew-field">
      <label>Provincia Residenza</label>
      <input type="text" placeholder="RM" data-field="prov" maxlength="3" style="text-transform:uppercase" />
    </div>
    <div class="crew-field">
      <label>CAP <span style="color:#e05">*</span></label>
      <input type="text" placeholder="00100" data-field="cap" maxlength="5" inputmode="numeric" pattern="[0-9]{5}" oninput="this.value=this.value.replace(/[^0-9]/g,'')" />
    </div>
    <div class="crew-field">
      <label>Tipo Documento <span style="color:#e05">*</span></label>
      <select data-field="tipoDoc">
        <option value="" disabled selected>— Seleziona tipo —</option>
        <option>Passaporto</option>
        <option>Carta d'Identità</option>
        <option>Patente</option>
      </select>
    </div>
    <div class="crew-field">
      <label>N° Documento <span style="color:#e05">*</span></label>
      <input type="text" placeholder="AA0000000" data-field="numDoc" style="text-transform:uppercase" maxlength="20" />
    </div>
    <div class="crew-field">
      <label>Scadenza Documento <span style="color:#e05">*</span></label>
      <input type="date" data-field="scadDoc" />
    </div>
    <div class="crew-field crew-field-ruolo">
      <label>Ruolo a Bordo <span style="color:#e05">*</span></label>
      <select data-field="ruolo">
        <option value="" disabled selected>— Seleziona il tuo ruolo —</option>
        <option>Skipper</option>
        <option>Co-skipper</option>
        <option>Equipaggio</option>
      </select>
    </div>
    <div class="crew-field cf-field">
      <label>Codice Fiscale <span style="color:#e05">*</span></label>
      <input type="text" placeholder="RSSMRA80A01H501U" data-field="cf" style="text-transform:uppercase" maxlength="16" pattern="[A-Z0-9]{16}" />
      <div data-cf-hint style="font-size:.72rem; margin-top:4px; min-height:16px;"></div>
    </div>
  `;
  container.appendChild(row);
  // Prefill from saved data
  if (prefill) {
    CREW_FIELDS.forEach(f => {
      const el = row.querySelector(`[data-field="${f}"]`);
      if (el && prefill[f]) el.value = prefill[f];
    });
    tryCalcCF(row);
  }
  // Auto-calcolo CF e autosave
  const cfTriggers = ['nome','cognome','sesso','nascita','comuneNascita','cf'];
  const upperFields = ['cf','numDoc','prov','provNascita'];
  row.querySelectorAll('input, select').forEach(el => {
    const field = el.dataset.field;
    if (upperFields.includes(field)) {
      el.addEventListener('input', () => { el.value = el.value.toUpperCase(); });
    }
    el.addEventListener('input', () => { if (cfTriggers.includes(field)) tryCalcCF(row); saveToStorage(boat); });
    el.addEventListener('change', () => { if (cfTriggers.includes(field)) tryCalcCF(row); saveToStorage(boat); });
  });
}

/* ── Calcolo Codice Fiscale ─────────────────────── */
function tryCalcCF(row) {
  const g = f => (row.querySelector(`[data-field="${f}"]`)?.value || '').trim();
  const nome = g('nome'), cognome = g('cognome'), sesso = g('sesso');
  const nascita = g('nascita'), comune = g('comuneNascita');
  const hint = row.querySelector('[data-cf-hint]');
  if (!nome || !cognome || !sesso || !nascita || !comune) { if (hint) hint.textContent = ''; return; }
  const calcolato = calcolaCodiceFiscale(cognome, nome, sesso, nascita, comune);
  if (!calcolato) {
    const cfGiaValido = /^[A-Z0-9]{16}$/i.test(row.querySelector('[data-field="cf"]')?.value || '');
    if (hint) {
      if (cfGiaValido) { hint.textContent = ''; }
      else { hint.textContent = '⚠️ Comune non in tabella — inserisci il CF manualmente'; hint.style.color = '#ffb347'; }
    }
    return;
  }
  const cfEl = row.querySelector('[data-field="cf"]');
  const inserito = (cfEl?.value || '').trim().toUpperCase();
  if (!inserito) {
    if (cfEl) cfEl.value = calcolato;
    if (hint) { hint.textContent = '✅ CF calcolato automaticamente — verificalo'; hint.style.color = 'rgba(28,167,168,.9)'; }
  } else if (inserito === calcolato) {
    if (hint) { hint.textContent = '✅ Codice fiscale corretto'; hint.style.color = '#25D366'; }
  } else {
    if (hint) { hint.textContent = '⚠️ Non corrisponde al calcolato: ' + calcolato; hint.style.color = '#ffb347'; }
  }
}

function calcolaCodiceFiscale(cognome, nome, sesso, nascitaISO, luogo) {
  try {
    const codCognome = _cfConsonanti(cognome, 3);
    const codNome    = _cfNome(nome);
    const [year, month, day] = nascitaISO.split('-').map(Number);
    const mesi = 'ABCDEHLMPRST';
    const codData = String(year).slice(-2) + mesi[month - 1] + (sesso === 'M' ? String(day).padStart(2,'0') : String(day + 40).padStart(2,'0'));
    const codLuogo = _cfLuogo(luogo);
    if (!codLuogo) return null;
    const base = (codCognome + codNome + codData + codLuogo).toUpperCase();
    if (base.length !== 15) return null;
    const controllo = _cfControllo(base);
    return base + controllo;
  } catch(e) { return null; }
}

function _cfConsonanti(s, n) {
  s = s.toUpperCase().replace(/[^A-Z]/g,'');
  const cons = s.replace(/[AEIOU]/g,'');
  const voc  = s.replace(/[^AEIOU]/g,'');
  return (cons + voc + 'XXX').slice(0, n);
}

function _cfNome(s) {
  s = s.toUpperCase().replace(/[^A-Z]/g,'');
  const cons = s.replace(/[AEIOU]/g,'');
  const voc  = s.replace(/[^AEIOU]/g,'');
  if (cons.length >= 4) return cons[0] + cons[2] + cons[3];
  return (cons + voc + 'XXX').slice(0, 3);
}

const _BELFIORE = {}; // popolato sotto
function _cfLuogo(luogo) {
  const key = luogo.toUpperCase().trim();
  return _BELFIORE[key] || null;
}

function _cfControllo(base) {
  const odd  = [1,0,5,7,9,13,15,17,19,21,2,4,18,20,11,3,6,8,12,14,16,10,22,25,24,23];
  let s = 0;
  for (let i = 0; i < 15; i++) {
    const c = base.charCodeAt(i);
    const v = c >= 48 && c <= 57 ? c - 48 : c - 65;
    s += (i % 2 === 0) ? odd[v] : v;
  }
  return String.fromCharCode(65 + (s % 26));
}

// Tabella Belfiore — comuni principali (estendibile)
(function(){
  const T = {
    'AGRIGENTO':'G273','ALESSANDRIA':'A182','ANCONA':'A271','AOSTA':'A326',
    'AREZZO':'A390','ASCOLI PICENO':'A462','ASTI':'A479','AVELLINO':'A509',
    'BARI':'A662','BARLETTA':'A669','BELLUNO':'A757','BENEVENTO':'A783',
    'BERGAMO':'A794','BIELLA':'A859','BOLOGNA':'A944','BOLZANO':'A952',
    'BRESCIA':'B157','BRINDISI':'B180','CAGLIARI':'B354','CALTANISSETTA':'B429',
    'CAMPOBASSO':'B519','CASERTA':'B963','CATANIA':'C351','CATANZARO':'C352',
    'CHIETI':'C469','COMO':'C933','COSENZA':'D086','CREMONA':'D150',
    'CROTONE':'D122','CUNEO':'D205','ENNA':'C342','FERMO':'D542',
    'FERRARA':'D548','FIRENZE':'D612','FOGGIA':'D643','FORLÌ':'D704',
    'FROSINONE':'D810','GENOVA':'D969','GORIZIA':'E098','GROSSETO':'E202',
    'IMPERIA':'E290','ISERNIA':'E335','L\'AQUILA':'A345','LA SPEZIA':'E463',
    'LATINA':'E472','LECCE':'E506','LECCO':'E507','LIVORNO':'E625',
    'LODI':'E648','LUCCA':'E715','MACERATA':'E783','MANTOVA':'E897',
    'MASSA':'F023','MATERA':'F052','MESSINA':'F158','MILANO':'F205',
    'MODENA':'F257','MONZA':'F704','NAPOLI':'F839','NOVARA':'F952',
    'NUORO':'F979','ORISTANO':'G113','PADOVA':'G224','PALERMO':'G273',
    'PARMA':'G337','PAVIA':'G388','PERUGIA':'G478','PESARO':'G453',
    'PESCARA':'G482','PIACENZA':'G535','PISA':'G702','PISTOIA':'G713',
    'PORDENONE':'G888','POTENZA':'G942','PRATO':'G999','RAGUSA':'H163',
    'RAVENNA':'H199','REGGIO CALABRIA':'H224','REGGIO EMILIA':'H236',
    'RIETI':'H282','RIMINI':'H294','ROMA':'H501','ROVIGO':'H620',
    'SALERNO':'H703','SASSARI':'I452','SAVONA':'I480','SIENA':'I726',
    'SIRACUSA':'I754','SONDRIO':'I829','SUD SARDEGNA':'M209','TARANTO':'L049',
    'TERAMO':'L103','TERNI':'L117','TORINO':'L219','TRAPANI':'L331',
    'TRENTO':'L378','TREVISO':'L407','TRIESTE':'L424','UDINE':'L483',
    'VARESE':'L682','VENEZIA':'L736','VERBANIA':'L746','VERCELLI':'L750',
    'VERONA':'L781','VIBO VALENTIA':'F537','VICENZA':'L840','VITERBO':'M082',
    'LERICI':'E542','PORTOVENERE':'G927','LA SPEZIA':'E463','SARZANA':'I449',
    'AMEGLIA':'A259','ARCOLA':'A370','BOLANO':'A930','CALICE AL CORNOVIGLIO':'B410',
    'FOLLO':'D655','ORTONOVO':'G145','RICCÒ DEL GOLFO':'H275','SANTO STEFANO DI MAGRA':'I367',
    'VEZZANO LIGURE':'L820','ZIGNAGO':'M177'
  };
  Object.assign(_BELFIORE, T);
})();

function removeMember(boat, idx) {
  const row = document.getElementById(`member-${boat}-${idx}`);
  if (row) { row.remove(); saveToStorage(boat); }
}


/* ── Triple-click sul contatore → sblocca bottone admin ── */
const _counterClicks = {};
function handleCounterClick(boat, el) {
  _counterClicks[boat] = (_counterClicks[boat] || 0) + 1;
  clearTimeout(el._resetTimer);
  el._resetTimer = setTimeout(() => { _counterClicks[boat] = 0; }, 2000);
  if (_counterClicks[boat] >= 3) {
    _counterClicks[boat] = 0;
    const btn = document.getElementById('btnAdminPDF-' + boat);
    if (btn) btn.style.display = btn.style.display === 'none' ? 'inline-flex' : 'none';
  }
}

/* ── Salva membro su Google Sheets ──────────────── */
async function saveMemberToSheets(boat) {
  const container = document.getElementById('members-' + boat);
  const rows = container.querySelectorAll('.crew-member-row');
  if (rows.length === 0) { alert('Compila almeno un membro prima di salvare.'); return; }

  const row = rows[0];
  const get = f => row.querySelector(`[data-field="${f}"]`)?.value.trim() || '';
  const nome    = get('nome');
  const cognome = get('cognome');
  const sesso   = get('sesso');
  const nascita = get('nascita');
  const comuneNascita = get('comuneNascita');
  const numDoc  = get('numDoc');
  const tipoDoc = get('tipoDoc');
  const ruolo   = get('ruolo');
  const cf      = get('cf').toUpperCase().replace(/\s/g, '');
  const mancanti = [];
  if (!nome)    mancanti.push('Nome');
  if (!cognome) mancanti.push('Cognome');
  if (!sesso)   mancanti.push('Sesso');
  if (!nascita) mancanti.push('Data di Nascita');
  if (!comuneNascita) mancanti.push('Comune di Nascita');
  if (!get('nazionalita')) mancanti.push('Nazionalità');
  if (!get('via'))   mancanti.push('Indirizzo di Residenza');
  if (!get('citta')) mancanti.push('Città di Residenza');
  if (!get('cap'))   mancanti.push('CAP');
  if (!tipoDoc) mancanti.push('Tipo Documento');
  if (!numDoc)  mancanti.push('N° Documento');
  if (!get('scadDoc')) mancanti.push('Scadenza Documento');
  if (!ruolo)   mancanti.push('Ruolo a Bordo');
  if (!cf)      mancanti.push('Codice Fiscale');
  if (mancanti.length > 0) {
    alert('Campi obbligatori mancanti:\n• ' + mancanti.join('\n• '));
    return;
  }
  if (!/^[A-Z0-9]{16}$/.test(cf)) {
    alert('Codice Fiscale non valido.\nDeve essere esattamente 16 caratteri (lettere maiuscole e numeri).\nInserito: "' + cf + '" (' + cf.length + ' caratteri)');
    return;
  }
  if (numDoc.length < 6) { alert('Numero documento non valido — deve contenere almeno 6 caratteri.'); return; }
  if (nome.length < 2)    { alert('Nome troppo corto — verifica di aver inserito il nome completo.'); return; }
  if (cognome.length < 2) { alert('Cognome troppo corto — verifica di aver inserito il cognome completo.'); return; }

  const btn = document.getElementById('btnSalva-' + boat);
  if (btn) { btn.textContent = 'Invio in corso...'; btn.disabled = true; }

  const nomeCompleto = nome + ' ' + cognome;
  const data = {
    boat,
    nome: nomeCompleto, sesso,
    nascita, luogo: comuneNascita + (get('provNascita') ? ' (' + get('provNascita') + ')' : ''),
    nazionalita: get('nazionalita'),
    residenza: [get('via'), get('citta'), get('prov')].filter(Boolean).join(', '),
    cap: get('cap'), tipoDoc, numDoc,
    scadDoc: get('scadDoc'), ruolo: get('ruolo'), cf: get('cf'),
    regolaAccettata: true
  };

  saveToStorage(boat);

  // Invio tramite form hidden su iframe (bypass CORS garantito)
  let iframe = document.getElementById('_submitFrame');
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.name = '_submitFrame';
    iframe.id = '_submitFrame';
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = SHEETS_URL;
  form.target = '_submitFrame';
  form.style.display = 'none';
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  input.value = JSON.stringify(data);
  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => form.remove(), 3000);

  // Mostra conferma immediata
  const container2 = document.getElementById('members-' + boat);
  const addBtn2 = container2?.parentElement?.querySelector('.btn-add-member');
  const crewActions2 = document.getElementById('btnSalva-' + boat)?.closest('.crew-actions');
  const statusEl2 = document.getElementById('saveStatus-' + boat);
  if (container2) container2.style.display = 'none';
  if (addBtn2) addBtn2.style.display = 'none';
  if (crewActions2) crewActions2.style.display = 'none';
  if (statusEl2) {
    statusEl2.innerHTML = `
      <div style="font-size:1.4rem; margin-bottom:8px;">✅</div>
      <strong>${nome} ${cognome}</strong> — dati inviati correttamente.<br>
      <span style="font-size:.82rem; opacity:.75;">Puoi chiudere questa pagina. I tuoi dati sono stati salvati.</span><br>
      <button onclick="window._showFormAgain('${boat}')" style="margin-top:12px; background:rgba(255,255,255,.12); border:1px solid rgba(255,255,255,.25); color:#fff; padding:7px 16px; border-radius:8px; cursor:pointer; font-size:.82rem;">✏️ Modifica i miei dati</button>
    `;
    statusEl2.style.display = 'block';
    statusEl2.style.textAlign = 'center';
  }
  if (btn) { btn.textContent = '✅ Dati salvati!'; btn.style.background = 'var(--turq)'; btn.disabled = false; }
}

/* ── Mostra di nuovo il form dopo il salvataggio ── */
window._showFormAgain = function(boat) {
  const container = document.getElementById('members-' + boat);
  const addBtn = container?.parentElement?.querySelector('.btn-add-member');
  const crewActions = document.getElementById('btnSalva-' + boat)?.closest('.crew-actions');
  const statusEl = document.getElementById('saveStatus-' + boat);
  const btn = document.getElementById('btnSalva-' + boat);
  if (container) container.style.display = '';
  if (addBtn) addBtn.style.display = '';
  if (crewActions) crewActions.style.display = '';
  if (statusEl) { statusEl.style.display = 'none'; statusEl.innerHTML = ''; }
  if (btn) { btn.innerHTML = '✏️ Modifica i miei dati'; btn.style.background = ''; btn.disabled = false; }
};

/* ── Admin: genera PDF da Apps Script (crew list completa da Sheets) ── */
function adminDownloadPDF(boat) {
  const pwd = prompt('Password amministratore:');
  if (pwd !== ADMIN_PASSWORDS[boat]) { alert('Password errata.'); return; }
  const url = SHEETS_URL + '?action=pdf&boat=' + boat;
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => a.remove(), 1000);
}

/* ── Genera PDF unico con tutti i membri ────────── */
function generateCrewPDF(members, boatName, departureDate, arrivalDate) {
  const skipper = members.find(m => m.ruolo === 'Skipper') || members[0];
  const rows_html = members.map((m, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="name">${m.nome || '—'}</td>
      <td>${m.nascita ? new Date(m.nascita).toLocaleDateString('it-IT') : (m.nascita || '—')}</td>
      <td>${m.luogo || '—'}</td>
      <td>${m.nazionalita || '—'}</td>
      <td>${m.tipoDoc || '—'}</td>
      <td>${m.numDoc || '—'}</td>
      <td>${m.scadDoc ? new Date(m.scadDoc).toLocaleDateString('it-IT') : (m.scadDoc || '—')}</td>
      <td>${m.ruolo || '—'}</td>
    </tr>`).join('');

  const win = window.open('', '_blank');
  win.document.write(`<!DOCTYPE html>
<html lang="it"><head><meta charset="UTF-8"/>
<title>Crew List — ${boatName}</title>
<style>
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family:'Arial',sans-serif; font-size:10.5px; color:#111; background:#fff; }
  .page { padding:28px 32px; max-width:900px; margin:0 auto; }
  .doc-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #0b3c5d; padding-bottom:14px; margin-bottom:18px; }
  .doc-title h1 { font-size:20px; color:#0b3c5d; letter-spacing:.02em; margin-bottom:2px; }
  .doc-title p { font-size:11px; color:#555; }
  .doc-flag { font-size:28px; }
  .vessel-grid, .voyage-grid { display:grid; grid-template-columns:repeat(4,1fr); border:1px solid #c0cdd8; margin-bottom:0; }
  .voyage-grid { border-top:none; margin-bottom:24px; }
  .vessel-cell, .voyage-cell { padding:8px 10px; border-right:1px solid #c0cdd8; }
  .vessel-cell:last-child, .voyage-cell:last-child { border-right:none; }
  .voyage-cell { border-top:1px solid #c0cdd8; }
  .vc-label { font-size:8.5px; text-transform:uppercase; letter-spacing:.08em; color:#7a9cb8; margin-bottom:3px; }
  .vc-val { font-size:11px; font-weight:700; color:#0b3c5d; }
  .section-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.12em; color:#fff; background:#0b3c5d; padding:6px 10px; }
  table { width:100%; border-collapse:collapse; }
  thead tr { background:#e8f0f7; }
  th { padding:7px 8px; text-align:left; font-size:8.5px; text-transform:uppercase; color:#0b3c5d; border:1px solid #c0cdd8; font-weight:700; }
  td { padding:7px 8px; border:1px solid #dce5ed; font-size:10px; vertical-align:middle; }
  td.num { text-align:center; color:#7a9cb8; font-weight:700; width:28px; }
  td.name { font-weight:700; color:#0b3c5d; }
  tr:nth-child(even) td { background:#f4f8fc; }
  .sig-block { display:grid; grid-template-columns:1fr 1fr 1fr; gap:24px; margin-top:36px; }
  .sig-item { border-top:1px solid #0b3c5d; padding-top:6px; }
  .sig-item .sig-label { font-size:8.5px; text-transform:uppercase; color:#7a9cb8; margin-bottom:22px; }
  .sig-item .sig-name { font-size:10px; color:#0b3c5d; font-weight:700; }
  .doc-footer { margin-top:28px; padding-top:10px; border-top:1px solid #c0cdd8; display:flex; justify-content:space-between; font-size:8.5px; color:#9aacba; }
  @media print { body{font-size:9.5px} .page{padding:14px 18px} }
</style></head><body>
<div class="page">
  <div class="doc-header">
    <div class="doc-title">
      <h1>CREW LIST — LISTA EQUIPAGGIO</h1>
      <p>Documento richiesto per navigazione in acque straniere &nbsp;·&nbsp; Art. 184 Codice della Navigazione</p>
    </div>
    <div class="doc-flag">🇮🇹</div>
  </div>
  <div class="vessel-grid">
    <div class="vessel-cell"><div class="vc-label">Nome Imbarcazione</div><div class="vc-val">${boatName}</div></div>
    <div class="vessel-cell"><div class="vc-label">Bandiera</div><div class="vc-val">Italiana</div></div>
    <div class="vessel-cell"><div class="vc-label">Porto di Iscrizione</div><div class="vc-val">La Spezia</div></div>
    <div class="vessel-cell"><div class="vc-label">Comandante / Skipper</div><div class="vc-val">${skipper?.nome || '—'}</div></div>
  </div>
  <div class="voyage-grid">
    <div class="voyage-cell"><div class="vc-label">Porto di Partenza</div><div class="vc-val">Porto Mirabello, La Spezia</div></div>
    <div class="voyage-cell"><div class="vc-label">Data Partenza</div><div class="vc-val">${departureDate}</div></div>
    <div class="voyage-cell"><div class="vc-label">Porto di Arrivo</div><div class="vc-val">Porto Mirabello, La Spezia</div></div>
    <div class="voyage-cell"><div class="vc-label">Data Arrivo</div><div class="vc-val">${arrivalDate}</div></div>
  </div>
  <div class="section-title">Composizione Equipaggio &nbsp;·&nbsp; ${members.length} persone a bordo</div>
  <table>
    <thead><tr>
      <th>#</th><th>Cognome e Nome</th><th>Data di Nascita</th><th>Luogo di Nascita</th>
      <th>Nazionalità</th><th>Tipo Documento</th><th>N° Documento</th><th>Scadenza</th><th>Ruolo a Bordo</th>
    </tr></thead>
    <tbody>${rows_html}</tbody>
  </table>
  <div class="sig-block">
    <div class="sig-item"><div class="sig-label">Firma Comandante</div><div class="sig-name">${skipper?.nome || '___________________________'}</div></div>
    <div class="sig-item"><div class="sig-label">Timbro / Visto Autorità</div><div class="sig-name">&nbsp;</div></div>
    <div class="sig-item"><div class="sig-label">Data e Luogo</div><div class="sig-name">La Spezia, ${new Date().toLocaleDateString('it-IT')}</div></div>
  </div>
  <div class="doc-footer">
    <span>Golfo dei Poeti Weekend &nbsp;·&nbsp; Porto Mirabello, La Spezia &nbsp;·&nbsp; +39 351 844 7888</span>
    <span>Generato il ${new Date().toLocaleDateString('it-IT',{day:'2-digit',month:'long',year:'numeric'})}</span>
  </div>
</div>
<script>window.onload=()=>{ window.print(); }<\/script>
</body></html>`);
  win.document.close();
}


/* ── Floating particles in hero ─────────────────── */
(function spawnParticles() {
  const container = document.getElementById('heroParticles');
  if (!container) return;
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    const size  = Math.random() * 3 + 1;
    const left  = Math.random() * 100;
    const delay = Math.random() * 12;
    const dur   = 10 + Math.random() * 14;
    p.style.cssText = `
      position:absolute; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${left}%; bottom:-10px;
      background:rgba(255,255,255,${0.06 + Math.random() * 0.1});
      animation: floatParticle ${dur}s ease-in-out ${delay}s infinite;
      pointer-events:none;
    `;
    container.appendChild(p);
  }
  // inject keyframes once
  if (!document.getElementById('particleKF')) {
    const s = document.createElement('style');
    s.id = 'particleKF';
    s.textContent = `
      @keyframes floatParticle {
        0%   { transform: translateY(0) scale(1);   opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: 0.6; }
        100% { transform: translateY(-105vh) scale(.4); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }
})();

/* ── Dropdown nav ── */
(function() {
  const dd = document.getElementById('navDropdown');
  if (!dd) return;
  const toggle = dd.querySelector('.dropdown-toggle');
  const menu   = dd.querySelector('.dropdown-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dd.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!dd.contains(e.target)) dd.classList.remove('open');
  });
})();




// end of file










