/* ΤΙ ΛΕΕΙ; ΠΕΤΑΜΕ! — Διεπαφή. Οι υπολογισμοί γίνονται στο calc.js και τα δεδομένα έρχονται από το data.js. */
(function () {
  'use strict';
  document.documentElement.lang = 'el'; /* σωστά κεφαλαία ελληνικά χωρίς τόνους */
  const D = window.TLP_DATA, C = window.TLP_CALC;
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmt = (x, d = 2) => (x == null || !Number.isFinite(x) ? '—' : x.toLocaleString('el-GR', { maximumFractionDigits: d }));
  const eur = (x) => (x == null || !Number.isFinite(x) ? '—' : x.toLocaleString('el-GR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €');
  const dmy = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');
  const today = () => new Date().toLocaleDateString('sv-SE');
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u || '')) ? String(u) : '');
  const val = (id) => $(id).value;

  /* ---- τοπική αποθήκευση: μόνο ευκολία του χρήστη, με προστασία από σφάλματα ---- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* αγνοείται */ } }
  };

  /* ---- κοινά κομμάτια εμφάνισης ---- */
  const confBadge = (c) => (c === 'final' ? '<span class="badge b-ok">Επιβεβαιωμένο</span>' : '<span class="badge b-warn">Προσωρινό: προς έλεγχο</span>');
  const statusBadge = (s) => ({ confirmed: '<span class="badge b-ok">Επιβεβαιωμένο</span>', to_verify: '<span class="badge b-warn">Προς έλεγχο</span>', ended: '<span class="badge b-off">Ανενεργό</span>' }[s] || '');
  function srcLinks(ids) {
    return ids.map((id) => { const s = D.sources[id]; return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.t)}</a>` : ''; }).filter(Boolean).join(' · ');
  }
  const checkedLine = (r) => `<span>Έλεγχος ${dmy(r.checked)}${r.check === 'reread' ? ' (ξαναδιαβάστηκε η επίσημη σελίδα)' : ' (από προηγούμενο έλεγχο)'}</span>`;
  const flow = (tag, cls, big, body, extra) => `<div class="card"><span class="flow-tag ${cls}">${tag}</span><div class="big">${big}</div>${body}${extra || ''}</div>`;

  /* ---- πλοήγηση: κύριο μενού + υπομενού εργαλείων ---- */
  const panels = [...document.querySelectorAll('.panel')];
  const TOOLS = ['calc', 'convert', 'value', 'goal'];
  const MAIN = [['home', 'Αρχική'], ['calc', 'Υπολογιστής'], ['offers', 'Προσφορές'], ['partners', 'Συνεργάτες'], ['guides', 'Οδηγοί'], ['status', 'Κατάσταση']];
  panels.forEach((p) => { if (TOOLS.includes(p.id)) p.classList.add('tool'); });
  const mainNav = $('mainnav'), tabsEl = $('tabs'), burger = $('burger');
  /* Μενού: στο κινητό είναι λίστα με εικονίδια, ομάδες και σύντομη περιγραφή· στον υπολογιστή μένει οριζόντιο (μόνο τα κύρια). */
  const IC = {
    home: '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8 7h8M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01"/>',
    convert: '<path d="M17 4l3 3-3 3M20 7H8a4 4 0 0 0-4 4M7 20l-3-3 3-3M4 17h12a4 4 0 0 0 4-4"/>',
    value: '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2a3 3 0 0 0-2.8-1.7c-1.7 0-2.9 1-2.9 2.3 0 3 5.8 1.6 5.8 4.6 0 1.3-1.3 2.3-2.9 2.3a3 3 0 0 1-2.9-1.8M12 6v1.5M12 16.5V18"/>',
    goal: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
    offers: '<path d="M12 3c1 3 4.5 4.5 4.5 9a4.5 4.5 0 0 1-9 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1.5-5 .5-8z"/>',
    partners: '<path d="M8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5M16 11a3 3 0 1 0 0-6M17 14.6c2.6.4 4.4 2.3 5 5.4"/>',
    guides: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20M8 7h8M8 11h6"/>',
    status: '<path d="M9 12l2 2 4-4"/><path d="M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6z"/>'
  };
  const NAV = [
    { id: 'home', t: 'Αρχική', top: 1 },
    { g: 'Εργαλεία' },
    { id: 'calc', t: 'Πόσα μίλια κερδίζω', d: 'Αγορές, καύσιμα, ξενοδοχεία', desk: 'Υπολογιστής', top: 1 },
    { id: 'convert', t: 'Μετατροπή πόντων', d: 'Πόντοι Bonus, BPme, Smile → μίλια' },
    { id: 'value', t: 'Αξία μιλίων', d: 'Συμφέρει η εξαργύρωση; Σύγκρινε ταξίδια' },
    { id: 'goal', t: 'Στόχος', d: 'Σε πόσο καιρό φτάνω το ταξίδι μου' },
    { g: 'Ανακάλυψε' },
    { id: 'offers', t: 'Προσφορές', d: 'Ενεργές και επαναλαμβανόμενες', top: 1, badge: true },
    { id: 'partners', t: 'Συνεργάτες', d: 'Πού μαζεύεις μίλια', top: 1 },
    { id: 'guides', t: 'Οδηγοί', d: 'Απλές εξηγήσεις και κόλπα', top: 1 },
    { id: 'status', t: 'Πηγές και έλεγχοι', d: 'Τι επαληθεύτηκε και πότε', desk: 'Πηγές', top: 1, foot: 1 }
  ];
  const navIcon = (k) => `<svg class="ni" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`;
  function buildNav() {
    const nOff = D.offers.filter((o) => ['active', 'recurring'].includes(C.offerStatus(o, today()))).length;
    mainNav.innerHTML = NAV.map((n) => n.g ? `<div class="ngroup mob">${esc(n.g)}</div>`
      : `<a href="#${n.id}" data-t="${n.id}" class="${n.top ? 'ntop' : 'mob'}${n.foot ? ' nfoot' : ''}">${navIcon(n.id)}<span class="nt"><span class="nl"><span class="mobt">${esc(n.t)}</span><span class="deskt">${esc(n.desk || n.t)}</span>${n.badge && nOff ? `<span class="nbadge">${nOff}</span>` : ''}</span>${n.d ? `<small>${esc(n.d)}</small>` : ''}</span></a>`).join('');
  }
  buildNav();
  tabsEl.innerHTML = TOOLS.map((id) => `<a href="#${id}" data-t="${id}">${esc(document.getElementById(id).dataset.title)}</a>`).join('');
  const setMenu = (o) => { mainNav.classList.toggle('open', o); burger.setAttribute('aria-expanded', String(o)); burger.setAttribute('aria-label', o ? 'Κλείσιμο μενού' : 'Μενού'); document.body.classList.toggle('menu-open', o); };
  burger.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  function showTab() {
    if (location.hash === '#compare') { history.replaceState(null, '', '#value'); }
    const id = panels.some((p) => p.id === location.hash.slice(1)) ? location.hash.slice(1) : 'home';
    const isTool = TOOLS.includes(id);
    panels.forEach((p) => p.classList.toggle('on', p.id === id));
    tabsEl.hidden = !isTool;
    const mainId = isTool ? 'calc' : id;
    mainNav.querySelectorAll('a').forEach((a) => { if (a.dataset.t === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); a.classList.toggle('grp', a.dataset.t === mainId && a.dataset.t !== id); });
    tabsEl.querySelectorAll('a').forEach((a) => { if (a.dataset.t === id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    setMenu(false);
    if (isTool) { const cur = tabsEl.querySelector('[aria-current]'); if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ inline: 'center', block: 'nearest' }); } catch (e) { /* αγνοείται */ } } }
    if (id === 'offers') renderOffers();
  }
  /* Κουμπί «Πίσω»: γυρνά στην προηγούμενη οθόνη του site. Αν δεν υπάρχει, πάει στην αρχική (ποτέ εκτός site). */
  let navDepth = 0, goingBack = false;
  const backBtn = $('backbtn');
  const syncBack = () => { const id = location.hash.slice(1) || 'home'; backBtn.hidden = id === 'home'; };
  backBtn.addEventListener('click', () => {
    if (navDepth > 0) { navDepth -= 1; goingBack = true; history.back(); }
    else location.hash = '#home';
  });
  window.addEventListener('hashchange', () => {
    if (goingBack) goingBack = false; else navDepth += 1;
    showTab(); syncBack(); window.scrollTo(0, 0);
  });
  syncBack();

  /* ================= 1. ΥΠΟΛΟΓΙΣΤΗΣ ΑΓΟΡΑΣ ================= */
  const cardSel = $('c_card'), partnerSel = $('c_partner');
  /* Πρώτα επιλέγεται τράπεζα και μετά η κάρτα της. Οι κάρτες φιλτράρονται ανά τράπεζα. */
  function fillBanks(sel) { sel.innerHTML = ''; D.banks.forEach((b) => sel.add(new Option(b.name, b.id))); }
  function fillCards(bankSel, cardSel2, keep) {
    const list = D.cards.filter((c) => c.bank === bankSel.value);
    cardSel2.innerHTML = '';
    list.forEach((c) => cardSel2.add(new Option(c.name + (c.status === 'confirmed' ? '' : ' (προς έλεγχο)'), c.id)));
    if (keep && list.some((c) => c.id === keep)) cardSel2.value = keep;
  }
  fillBanks($('c_bank')); fillCards($('c_bank'), cardSel);
  $('c_bank').addEventListener('input', () => { fillCards($('c_bank'), cardSel); renderCalc(); });
  /* Πρώτα κατηγορία, μετά συνεργάτης (όπως τράπεζα → κάρτα). */
  const CALC_TYPES = ['per_eur', 'per_night', 'per_stay'];
  const isCalc = (p) => CALC_TYPES.includes(p.earn.type);
  const isHotel = (p) => p.cat === 'Ξενοδοχεία';
  const byName = (a, b) => a.name.localeCompare(b.name, 'el');
  const shortEarn = (p) => (p.earn.type === 'per_eur' ? `${fmt(p.earn.rate)} ${p.earn.rate === 1 ? 'μίλι' : 'μίλια'}/€` : p.earn.type === 'per_night' ? `${fmt(p.earn.miles, 0)} μίλια/νύχτα`
    : `${fmt(Math.min(...p.earn.tiers.map((t) => t.miles)), 0)}–${fmt(Math.max(...p.earn.tiers.map((t) => t.miles)), 0)} μίλια/διαμονή`);
  const pOpt = (p) => new Option(`${p.name} · ${shortEarn(p)}${p.status === 'confirmed' ? '' : ' (προς έλεγχο)'}`, 'p:' + p.id);
  const PCATS = D.partnerCats.map((c) => ({ id: c.name, name: c.name, list: D.partners.filter((p) => p.cat === c.name && isCalc(p)), alpha: D.alphaPartners.filter((p) => p.tier === 2 && p.cat === c.name) }))
    .filter((c) => c.list.length || c.alpha.length)
    .concat([{ id: '__aegean', name: 'Εισιτήρια AEGEAN / Olympic Air' }, { id: '__fuel', name: `Καύσιμα (${D.fuels.map((f) => f.name.split(' ')[0]).join(', ')})` },
      { id: '__alpha4', name: `Alpha Bonus · μεγάλοι συνεργάτες, 4 πόντοι/€ (${D.alphaPartners.filter((p) => p.tier === 4).length})` }]);
  const alphaRec = (key) => D.alphaPartners.find((p) => 'a:' + p.id === key);
  const catOfKey = (key) => (key === 'a:aegean' ? '__aegean' : key.startsWith('fuel:') ? '__fuel' : key.startsWith('a:') ? ((alphaRec(key) || {}).tier === 2 ? alphaRec(key).cat : '__alpha4') : (D.partners.find((p) => 'p:' + p.id === key) || {}).cat);
  function fillPCats(sel) { sel.innerHTML = ''; PCATS.forEach((c) => sel.add(new Option(c.list ? `${c.name} (${c.list.length + c.alpha.length})` : c.name, c.id))); }
  function fillPartners(catSel, pSel, keep) {
    const c = PCATS.find((x) => x.id === catSel.value) || PCATS[0];
    pSel.innerHTML = '';
    if (c.id === '__fuel') D.fuels.forEach((f) => pSel.add(new Option(`${f.name} · πόντοι ${D.programs[f.program].name} ανά λίτρο`, 'fuel:' + f.id)));
    else if (c.id === '__aegean') pSel.add(new Option('AEGEAN / Olympic Air · αγορά εισιτηρίου με την κάρτα', 'a:aegean'));
    else if (c.id === '__alpha4') D.alphaPartners.filter((p) => p.tier === 4).forEach((p) => pSel.add(new Option(`${p.name} · 4 πόντοι Bonus/€`, 'a:' + p.id)));
    else {
      const grp = (label) => { const g = document.createElement('optgroup'); g.label = label; pSel.appendChild(g); return g; };
      if (c.id === 'Ξενοδοχεία') {
        D.hotelAreas.forEach(([area]) => { const l = c.list.filter((p) => p.area === area).sort(byName); if (l.length) { const g = grp(area); l.forEach((p) => g.appendChild(pOpt(p))); } });
      } else if (c.list.length) {
        const g = grp('Miles+Bonus · μίλια');
        c.list.slice().sort((x, y) => (y.earn.rate || 0) - (x.earn.rate || 0) || byName(x, y)).forEach((p) => g.appendChild(pOpt(p)));
      }
      if (c.alpha.length) { const g = grp('Μόνο Alpha Bonus · 2 πόντοι/€'); c.alpha.slice().sort(byName).forEach((p) => g.appendChild(new Option(p.name, 'a:' + p.id))); }
    }
    if (keep && [...pSel.options].some((o) => o.value === keep)) pSel.value = keep;
  }
  /* Επιλογή συνεργάτη από άλλο σημείο (πλακίδια, κατάλογος, γρήγορη φόρμα): ορίζει πρώτα την κατηγορία. */
  function pickPartner(prefix, key) {
    const cs = $(prefix + '_pcat'), ps = $(prefix + '_partner'), cat = catOfKey(key);
    if (!cat) return;
    cs.value = cat; fillPartners(cs, ps, key);
    ps.dispatchEvent(new Event('input', { bubbles: true }));
  }
  fillPCats($('c_pcat'));
  $('c_pcat').addEventListener('input', () => { fillPartners($('c_pcat'), partnerSel); renderCalc(); });
  cardSel.value = 'premium';
  $('c_pcat').value = '__fuel'; fillPartners($('c_pcat'), partnerSel, 'fuel:bp');
  /* Οι τύποι καυσίμου αλλάζουν ανά εταιρεία. */
  function fillGrades(f) {
    const g = $('c_grade'); if (g.dataset.fuel === f.id) return;
    const prev = g.value; g.innerHTML = ''; f.grades.forEach(([k, t]) => g.add(new Option(t, k)));
    g.value = f.grades.some(([k]) => k === prev) ? prev : f.defGrade; g.dataset.fuel = f.id;
    setOfficialPrice(f);
  }
  /* Τιμή λίτρου: προεπιλογή η πανελλαδική μέση τιμή του δελτίου, όπου υπάρχει. Ο χρήστης μπορεί να βάλει την τιμή της αντλίας. */
  const fuelOf = () => D.fuels.find((f) => 'fuel:' + f.id === val('c_partner'));
  function officialPrice(f, grade) {
    const k = f && f.priceKey ? f.priceKey[grade] : null;
    return k ? C.fuelPrice(k, D.fuelPrices) : null;
  }
  function setOfficialPrice(f) {
    const op = officialPrice(f, val('c_grade'));
    $('c_ppl').value = op ? op.price : '';
    $('c_ppl').dataset.official = op ? String(op.price) : '';
    if (!op) $('c_litres').value = ''; // όχι παλιά λίτρα από άλλο καύσιμο
  }
  $('c_koffer').addEventListener('change', renderCalc);
  $('c_otype').addEventListener('input', () => { const t = val('c_otype'); $('c_oval_box').hidden = !t; $('c_oval_lbl').textContent = t === 'ppe' ? 'Πόντοι ανά 1 € (π.χ. 100)' : 'Πολλαπλασιαστής (π.χ. 2 για διπλά)'; });
  $('c_grade').addEventListener('input', () => { const f = fuelOf(); if (f) setOfficialPrice(f); });
  /* Λειτουργία ξενοδοχείων: ρωτά νύχτες και το ποσό γίνεται κόστος διαμονής. */
  function hotelMode(prefix, on) {
    $(prefix + '_nights_box').hidden = !on;
    $(prefix + '_amount_lbl').textContent = on ? 'Κόστος διαμονής (€)' : (prefix === 'c' ? 'Ποσό αγοράς (€)' : 'Ποσό (€)');
  }

  function renderCalc() {
    const card = D.cards.find((c) => c.id === val('c_card')), key = val('c_partner'), amount = val('c_amount');
    const fuelRec = key.startsWith('fuel:') ? D.fuels.find((f) => 'fuel:' + f.id === key) : null;
    $('c_fuel').hidden = !fuelRec;
    const shopMode = !!fuelRec && val('c_fkind') === 'shop';
    if (fuelRec) {
      fillGrades(fuelRec); const pv = C.promoValid(fuelRec.promo, today()); $('c_promo_box').hidden = !pv || shopMode; if (!pv) $('c_promo').checked = false;
      if (pv) $('c_promo_lbl').innerHTML = `🔥 Προσφορά: ${fuelRec.promo.pointsPerLitre} πόντοι ανά λίτρο σε ${fuelRec.promo.applies.join(' και ')}<small>${esc(fuelRec.promo.days)}, έως ${dmy(fuelRec.promo.end)}. Τσέκαρέ το αν βάζεις τέτοια μέρα.</small>`; $('c_fuelonly').hidden = shopMode;
      const pplOn = val('c_ppl') !== '';
      $('c_litres').readOnly = pplOn;
      $('c_litres_lbl').textContent = pplOn ? 'Λίτρα (ποσό ÷ τιμή λίτρου)' : 'Λίτρα (γράψ’ τα από την απόδειξη)';
      if (pplOn) { const lr = C.litresFromAmount({ amount, price: val('c_ppl') }); if (lr.ok) $('c_litres').value = lr.litres; }
      const off = $('c_ppl').dataset.official, op = officialPrice(fuelRec, val('c_grade'));
      const gName = (fuelRec.grades.find((x) => x[0] === val('c_grade')) || [, ''])[1];
      $('c_ppl').placeholder = op ? '' : 'Γράψε την τιμή της αντλίας';
      $('c_ppl_hint').className = !op && !pplOn ? 'hint warnhint' : 'hint';
      $('c_ppl_hint').textContent = !op ? (pplOn ? `Τιμή που έβαλες εσύ για ${gName}.` : `Δεν έχουμε τιμή για ${gName}. Γράψε την τιμή της αντλίας ή τα λίτρα από την απόδειξη.`)
        : (off && val('c_ppl') === off ? (op.estimated
          ? `Εκτίμηση για ${gName}: ${op.text} (δελτίο ${dmy(D.fuelPrices.date)}). Δεν υπάρχει επίσημη τιμή γι’ αυτό το καύσιμο. Αν ξέρεις την τιμή της αντλίας, γράψ’ τη εδώ.`
          : `Πανελλαδικός μέσος όρος ${op.label}, ${dmy(D.fuelPrices.date)}. Στο πρατήριό σου μπορεί να διαφέρει: γράψε την τιμή της αντλίας.`) : 'Τιμή που έβαλες εσύ.');
      $('c_ppl_hint').className = op && op.estimated && off && val('c_ppl') === off ? 'hint warnhint' : $('c_ppl_hint').className;
    }
    const prec = key.startsWith('p:') ? D.partners.find((p) => 'p:' + p.id === key) : null;
    const byStay = !!prec && prec.earn.type !== 'per_eur';
    const hm = val('c_pcat') === 'Ξενοδοχεία' || byStay;
    hotelMode('c', hm);
    if (fuelRec) $('c_amount_lbl').textContent = shopMode ? 'Ποσό στο κατάστημα (€)' : 'Ποσό που πλήρωσες (€)';
    $('c_nights_hint').textContent = !hm ? '' : key.startsWith('a:') ? 'Δίνει μόνο πόντους Alpha Bonus από το κόστος της διαμονής· οι νύχτες δεν μετράνε.' : byStay ? 'Τα μίλια του ξενοδοχείου βγαίνουν από τις νύχτες. Το κόστος μετρά για τους πόντους της κάρτας.'
      : 'Αυτό το ξενοδοχείο δίνει μίλια ανά € διαμονής, οπότε τα μίλια βγαίνουν από το κόστος, όχι από τις νύχτες.';
    const out = [], conf = [];
    let extLine = '';
    let mbRes = null, alRes = null, alMiles = null, partnerRec = null;
    let tier = null, tierStatus = 'to_verify', sources = [], checkedRec = null;

    if (key.startsWith('p:')) {
      partnerRec = D.partners.find((p) => 'p:' + p.id === key);
      tier = partnerRec.alphaTier; tierStatus = partnerRec.alphaTierStatus; sources = partnerRec.sources; checkedRec = partnerRec;
      if (byStay) {
        mbRes = C.stayMiles({ nights: val('c_nights'), earn: partnerRec.earn, status: partnerRec.status });
        if (mbRes.ok) { mbRes.base = mbRes.total; mbRes.bonus = 0; }
      } else {
        const m = val('c_otype') === 'mult' ? (parseFloat(val('c_oval')) || 1) : 1;
        mbRes = C.earnMiles({ amount, rate: partnerRec.rate, multiplier: m, status: partnerRec.status });
      }
    } else if (key.startsWith('a:')) {
      partnerRec = D.alphaPartners.find((p) => 'a:' + p.id === key);
      tier = partnerRec.tier; tierStatus = partnerRec.tierStatus; sources = partnerRec.sources; checkedRec = partnerRec;
    } else {
      tier = fuelRec.alphaTier; tierStatus = fuelRec.alphaTierStatus; sources = fuelRec.sources; checkedRec = fuelRec;
    }
    const model = card.model || 'alpha';
    let dRes = null;
    if (model === 'alpha') {
      alRes = C.alphaPoints({ amount, card, tier, tierStatus });
      if (alRes.ok) alMiles = C.alphaToMiles({ points: alRes.points, card });
    } else if (model === 'direct') {
      const aeNet = key === 'a:aegean' && card.earn.aegeanPerEuro;
      dRes = C.earnMiles({ amount, rate: aeNet ? card.earn.aegeanPerEuro : card.earn.perEuro, status: card.status });
      dRes.aeNet = !!aeNet;
    }
    const cardOk = model === 'alpha' ? alRes.ok : model === 'direct' ? dRes.ok : !(parseFloat(amount) < 0) && amount !== '';

    if (!(mbRes ? (mbRes.ok || mbRes.gap) : true) || !cardOk) { $('c_out').innerHTML = '<div class="notice err">Συμπλήρωσε ένα έγκυρο ποσό.</div>'; return; }

    /* Ροή 1: μίλια Miles+Bonus από συνεργάτη */
    if (mbRes && mbRes.gap) {
      out.push(flow('Μίλια Miles+Bonus από συνεργάτη', 't-mb', '— <small>μίλια</small>',
        `<div class="notice">${esc(mbRes.error)} Δεν υπολογίζεται ποσό· ρώτα το ξενοδοχείο ή δες τους όρους.</div>` + (partnerRec.cond ? `<div class="formula">${esc(partnerRec.cond)}</div>` : '')));
    } else if (mbRes) {
      out.push(flow('Μίλια Miles+Bonus από συνεργάτη', 't-mb', `${fmt(mbRes.total)} <small>μίλια</small>`,
        `<div class="formula">Τύπος: <code>${esc(mbRes.formula)}</code> (${byStay ? (partnerRec.earn.type === 'per_night' ? 'νύχτες × μίλια ανά νύχτα' : 'μίλια ανά διαμονή, ανάλογα με τις νύχτες') : 'ποσό × μίλια ανά ' + esc(partnerRec.unit)})</div>` +
        (mbRes.bonus ? `<div class="formula">Βασικά ${fmt(mbRes.base)} · από προσφορά ${fmt(mbRes.bonus)}</div>` : ''),
        `<div class="meta">${confBadge(mbRes.confidence)}</div>` +
        (partnerRec.cond ? `<div class="formula">Προϋποθέσεις: ${esc(partnerRec.cond)}</div>` : '') +
        (partnerRec.channels ? `<div class="formula">Κανάλι: ${esc(partnerRec.channels)}</div>` : '') +
        (partnerRec.excl ? `<div class="formula">Εξαιρέσεις: ${esc(partnerRec.excl)}</div>` : '') +
        (isHotel(partnerRec) ? `<div class="formula">${esc(D.hotelRules)}</div>` : '')));
      if (mbRes.confidence === 'final') conf.push(mbRes.total);
    } else if (key.startsWith('a:')) {
      out.push(flow('Μίλια Miles+Bonus από συνεργάτη', 't-mb', partnerRec.mbNote ? '— <small>μίλια</small>' : '0 <small>μίλια</small>', partnerRec.mbNote ? `<div class="formula">${esc(partnerRec.mbNote)}</div>` : `<div class="formula">Ο συνεργάτης δεν υπάρχει στην επίσημη λίστα Miles+Bonus (έλεγχος 22/10/2026). ${model === 'alpha' ? 'Παίρνεις μόνο πόντους Alpha Bonus.' : 'Δίνει πόντους Alpha Bonus μόνο με κάρτα Alpha Bank.'}</div>`));
    }

    const cardMeta = `<div class="meta">${checkedLine(card)}${card.sources.length ? `<span>Πηγή: ${srcLinks(card.sources)}</span>` : ''}</div>`;
    if (model === 'direct') {
      /* Ροή 2β: μίλια απευθείας από την κάρτα */
      const prog = D.programs[card.earn.program], isMb = card.earn.program === 'mb';
      out.push(flow(isMb ? 'Μίλια Miles+Bonus από την κάρτα' : `Μίλια ${esc(prog.name)} από την κάρτα (άλλο πρόγραμμα)`, isMb ? 't-alpha' : 't-ext',
        `${fmt(dRes.total)} <small>${isMb ? 'μίλια' : esc(prog.unit)}</small>`,
        `<div class="formula">Τύπος: <code>${esc(dRes.formula)}</code> (ποσό × μίλια ανά €${dRes.aeNet ? ', δίκτυο AEGEAN' : ''})</div>` +
        (card.excl ? `<div class="formula">${esc(card.excl)}</div>` : '') +
        (isMb ? '' : `<div class="formula"><b>Δεν είναι μίλια Miles+Bonus</b> και δεν προστίθενται στο σύνολο. Πιστώνονται στο ${esc(prog.name)}.</div>`) +
        `<div class="formula">${esc(card.notes)}</div>`,
        `<div class="meta">${confBadge(dRes.confidence)}</div>` + cardMeta));
      if (isMb && dRes.confidence === 'final') conf.push(dRes.total);
    } else if (model === 'none') {
      out.push(flow('Μίλια από την κάρτα', 't-ext', '0 <small>μίλια</small>',
        '<div class="formula">Δεν υπάρχει επιβεβαιωμένο πρόγραμμα μιλίων για αυτή την κάρτα. Τα μίλια του συνεργάτη παραπάνω δεν εξαρτώνται από την κάρτα: τα παίρνεις αν δηλώσεις τον αριθμό μέλους Miles+Bonus και τηρείς τους όρους του συνεργάτη.</div>'));
    }

    /* Προσφορά πόντων Alpha Bonus (γνωστή από τη λίστα προσφορών ή δική σου). */
    const kList = key.startsWith('a:') ? D.offers.filter((o) => o.kind === 'alpha_points' && 'a:' + o.alphaPartner === key && ['active', 'recurring', 'upcoming'].includes(C.offerStatus(o, today()))) : [];
    const kSel = $('c_koffer').querySelector('input:checked'), kWas = kSel ? kSel.value : '';
    $('c_koffer').innerHTML = kList.length ? `<div class="koffers"><b>🔥 Προσφορές ${kList.length > 1 ? '(διάλεξε όποια ισχύει για την αγορά σου)' : ''}</b>` +
      kList.map((o) => `<label class="koffer"><input type="${kList.length > 1 ? 'radio' : 'checkbox'}" name="c_kof" value="${esc(o.id)}"${kWas === o.id ? ' checked' : ''}> <span>${esc(o.title)}<small>${esc(o.recurring ? 'Ισχύει μόνο τις ώρες που την ανακοινώνει η Alpha. Τσέκαρέ το αν αγοράζεις τότε.' : (o.short || o.endNote || ''))}</small></span></label>`).join('') +
      (kList.length > 1 ? `<label class="koffer none"><input type="radio" name="c_kof" value=""${!kWas ? ' checked' : ''}> <span>Καμία</span></label>` : '') + '</div>' : '';
    const kOfferId = ($('c_koffer').querySelector('input:checked') || {}).value || '';
    const kOffer = kOfferId ? kList.find((o) => o.id === kOfferId) : null;
    const otype = val('c_otype');
    const fixedPromo = kOffer && kOffer.fixedPoints ? kOffer.fixedPoints : null;
    const ppePromo = fixedPromo ? -1 : kOffer ? kOffer.pointsPerEuro : (otype === 'ppe' ? parseFloat(val('c_oval')) : null);
    if (otype === 'mult' && !(mbRes && mbRes.ok && partnerRec && partnerRec.rate)) out.push('<div class="notice">Ο πολλαπλασιαστής αφορά μόνο μίλια Miles+Bonus από τον συνεργάτη, κι εδώ δεν υπάρχουν. Αν η προσφορά λέει «1€ = Χ πόντοι», διάλεξε «Πόντους Alpha Bonus ανά 1 €».</div>');

    /* Ροή 2: πόντοι Alpha Bonus → μίλια */
    if (model === 'alpha') out.push(flow('Πόντοι Alpha Bonus (κάρτα)', 't-alpha', `${fmt(alRes.points)} <small>πόντοι</small> → ${fmt(alMiles.miles)} <small>μίλια μετά τη μετατροπή</small>`,
      `<div class="formula">Πόντοι: <code>${esc(alRes.formula)}</code> (ποσό × πόντοι ανά €)${alRes.lowerBoundOnly ? '<br><b>Κατώτατο όριο</b>: η κατηγορία του συνεργάτη (4, 2 ή 1 πόντος/€) δεν έχει επιβεβαιωθεί, οπότε μετρά 1 πόντος/€.' : ''}</div>` +
      `<div class="formula">Μετατροπή: <code>${esc(alMiles.formula)}</code> (πολλαπλάσια των ${card.convert.multipleOf} πόντων)${alMiles.leftoverPoints ? ` · υπόλοιπο ${fmt(alMiles.leftoverPoints)} πόντοι` : ''}</div>`,
      (alRes.dropped ? `<div class="formula">Οι πόντοι Alpha μετράνε μόνο για ακέραια € και για αγορές πάνω από 1 €: μετράνε ${fmt(alRes.wholeEuros, 0)} €.</div>` : '') +
      (alRes.monthlyCapHit ? `<div class="notice">Οι όροι της Alpha δίνουν έως ${fmt(D.alphaRules.monthlyCapPoints, 0)} πόντους τον μήνα ανά κάρτα. Πάνω από αυτό δεν πιστώνονται.</div>` : '') +
      (partnerRec && partnerRec.alphaCond ? `<div class="formula">Όροι Alpha: ${esc(partnerRec.alphaCond)}${partnerRec.alphaSrc ? ' · ' + srcLinks([partnerRec.alphaSrc]) : ''}</div>` : '') +
      (partnerRec && partnerRec.alphaTierBasis === 'not-in-list' && !fuelRec ? `<div class="formula">Ο συνεργάτης δεν είναι στη λίστα συνεργατών Bonus της Alpha, οπότε η κάρτα δίνει τον βασικό πόντο (${card.pointsPerEuro[1] === 1 ? '1 πόντος/€' : '1 πόντος ανά 2 €'}). Έλεγχος λίστας ${dmy(partnerRec.alphaTierChecked)} · ${srcLinks(['alpha-partners'])}</div>` : '') +
      (fuelRec && fuelRec.alphaTierBasis === 'not-in-list' ? `<div class="formula">Η ${esc(fuelRec.name.split(' (')[0])} δεν είναι στη λίστα συνεργατών Bonus της Alpha: βασικός πόντος. Έλεγχος ${dmy(fuelRec.alphaTierChecked)}.</div>` : '') +
      (fuelRec && fuelRec.alphaNote ? `<div class="formula">${esc(fuelRec.alphaNote)} Πηγή: ${srcLinks([fuelRec.alphaSource])}</div>` : '') +
      `<div class="meta">${confBadge(alRes.confidence)}<span>Ετήσιο όριο μετατροπής: ${fmt(card.annualCapPoints, 0)} πόντοι (${esc(card.capPeriod)})</span><span>Μηνιαίο όριο: ${fmt(D.alphaRules.monthlyCapPoints, 0)} πόντοι · οι πόντοι λήγουν σε ${D.alphaRules.expiryYears} χρόνια (${srcLinks(D.alphaRules.sources)})</span></div>`));
    if (model === 'alpha' && alRes.confidence === 'final') conf.push(alMiles.miles);
    let promoLine = '';
    if (ppePromo) {
      if (model !== 'alpha') out.push('<div class="notice">Η προσφορά δίνει πόντους Alpha Bonus. Για να γίνουν μίλια χρειάζεται κάρτα Aegean Bonus της Alpha Bank.</div>');
      else {
        const pr = C.alphaPromoPoints({ amount, pointsPerEuro: ppePromo, fixedPoints: fixedPromo, normalPerEuro: alRes.pointsPerEuro, card });
        if (pr.ok) {
          const pm = C.alphaToMiles({ points: pr.overCap ? pr.cap : pr.points, card });
          out.push(`<div class="card promo"><span class="flow-tag t-offer">Με την προσφορά</span><div class="big">${fmt(pr.points)} <small>πόντοι</small> → ${fmt(pm.miles)} <small>μίλια</small></div>` +
            `<div class="formula">Πόντοι: <code>${esc(pr.formula)}</code> ${pr.fixed ? '. Η σελίδα δεν λέει αν παίρνεις <b>και</b> τους κανονικούς πόντους, οπότε μετράμε μόνο τους σταθερούς.' : ` (ποσό × ${fmt(ppePromo)} πόντοι ανά €). Είναι <b>αντί</b> για τους κανονικούς ${fmt(alRes.points)}, όχι επιπλέον: κερδίζεις ${fmt(pr.extra)} πόντους παραπάνω.`}</div>` +
            `<div class="formula">Μετατροπή: <code>${esc(pm.formula)}</code></div>` +
            (pr.monthlyCapHit ? `<div class="notice">${esc(D.alphaRules.capNote)} Αν μετράνε, θα πάρεις το πολύ ${fmt(D.alphaRules.monthlyCapPoints, 0)} πόντους αυτόν τον μήνα.</div>` : '') +
            (pr.overCap ? `<div class="notice">Ξεπερνά το ετήσιο όριο μετατροπής της κάρτας (${fmt(pr.cap, 0)} πόντοι). Τα μίλια υπολογίστηκαν μόνο για το όριο· οι υπόλοιποι πόντοι μένουν πόντοι.</div>` : '') +
            (kOffer ? `<div class="formula">${esc(kOffer.desc)} ${esc(kOffer.limits)}</div><div class="meta"><span>Πηγή: ${srcLinks(kOffer.sources)}</span>${checkedLine(kOffer)}</div>` : '<div class="formula">Δική σου προσφορά: βεβαιώσου στους όρους ότι καλύπτει την αγορά.</div>') +
            `<div class="meta">${confBadge('provisional')}<span>Εκτός επιβεβαιωμένου συνόλου: εξαρτάται από το αν ισχύει η προσφορά τη στιγμή της αγοράς.</span></div></div>`);
          promoLine = `<p><b>Με την προσφορά (αν ισχύει): ${fmt(pm.miles)} μίλια</b> από την κάρτα, αντί για ${fmt(alMiles.miles)}.</p>`;
        }
      }
    }

    /* Ροή 3: πόντοι προγράμματος πρατηρίου (BPme / EKO Smile) */
    if (fuelRec) {
      const prog = D.programs[fuelRec.program];
      const pk = D.conversions.find((c) => c.id === fuelRec.conv);
      const convLine = `<div class="formula">Γίνονται μίλια μόνο όταν τους μετατρέψεις: 1 πόντος = 1 μίλι, σε πακέτα ${pk.packages.map((x) => fmt(x, 0)).join(' / ')}. Δεν προστίθενται στα άμεσα μίλια.</div>`;
      if (shopMode) {
        const sp = C.shopPoints({ amount, pointsPerEuro: fuelRec.shop.pointsPerEuro, status: fuelRec.shop.status });
        if (sp.ok) out.push(flow(`Πόντοι ${esc(prog.name)} από το κατάστημα (εκτός συνόλου)`, 't-ext', `${fmt(sp.points)} <small>${esc(prog.unit)}</small>`,
          `<div class="formula">Τύπος: <code>${esc(sp.formula)}</code> (ποσό × ${fuelRec.shop.pointsPerEuro} πόντοι ανά €)</div>` +
          `<div class="notice">${esc(fuelRec.shop.cond)}</div>` + convLine,
          `<div class="meta">${confBadge(sp.confidence)}<span>Πηγή: ${srcLinks([fuelRec.shop.source])}</span></div>`));
      } else {
        const fp = C.fuelPoints({ litres: val('c_litres'), grade: val('c_grade'), fuel: fuelRec, promo: $('c_promo').checked });
        const lr = val('c_ppl') !== '' ? C.litresFromAmount({ amount, price: val('c_ppl') }) : null;
        const off = $('c_ppl').dataset.official;
        const priceLine = lr && lr.ok ? `<div class="formula">Λίτρα: <code>${esc(lr.formula)}</code> · ${off && val('c_ppl') === off ? `${officialPrice(fuelRec, val('c_grade')).estimated ? 'εκτίμηση από το δελτίο' : 'μέση τιμή δελτίου'} ${dmy(D.fuelPrices.date)} (<span>${srcLinks(D.fuelPrices.sources)}</span>)` : 'τιμή που έβαλες'}</div>` : '';
        if (fp.ok) {
          extLine = `<p>+ ${fmt(fp.points)} ${esc(prog.unit)} (χωριστά· γίνονται μίλια όταν μαζέψεις ${fmt(pk.packages[0], 0)} και τους μετατρέψεις).</p>`;
          out.push(flow(`Πόντοι ${esc(prog.name)} (εκτός συνόλου)`, 't-ext', `${fmt(fp.points)} <small>${esc(prog.unit)}</small>`,
            priceLine +
            `<div class="formula">Τύπος: <code>${esc(fp.formula)}</code> (ολόκληρα λίτρα × πόντοι ανά λίτρο)</div>` + convLine +
            `<div class="formula">Όρια ${esc(prog.name)}: ${esc(fuelRec.limits)}</div>` +
            (lr && lr.ok && off && val('c_ppl') === off ? '<div class="formula">Με μέση τιμή τα λίτρα είναι εκτίμηση. Για ακριβές αποτέλεσμα γράψε την τιμή της αντλίας ή τα λίτρα της απόδειξης.</div>' : '') +
            (fp.promoApplied ? `<div class="formula">🔥 Με την προσφορά: ${fp.pointsPerLitre} πόντοι ανά λίτρο αντί για ${fuelRec.pointsPerLitre[val('c_grade')]}. Πηγή: ${srcLinks(fuelRec.promo.sources)}</div>` : ''),
            `<div class="meta">${confBadge(lr && lr.ok && off && val('c_ppl') === off ? 'provisional' : fp.confidence)}</div>`));
        } else out.push(`<div class="notice err">${esc(fp.error)}</div>`);
      }
    }

    /* Σύνολο: μόνο επιβεβαιωμένες ροές. Η πρόσθεση κάρτας και συνεργάτη δεν έχει επιβεβαιωθεί από όρο. */
    const sum = conf.reduce((a, b) => a + b, 0);
    const two = conf.length > 1;
    const totalHtml = `<div class="total"><span>${two ? 'Ενδεικτικό σύνολο επιβεβαιωμένων μιλίων Miles+Bonus' : 'Επιβεβαιωμένα μίλια Miles+Bonus'}</span>
      <div class="big">${fmt(sum)} μίλια</div>
      <p>${two ? esc(D.stacking.note) + ' Δες χωριστά κάθε ροή παραπάνω.' : 'Μόνο οι ροές με «Επιβεβαιωμένο» υπολογίζονται εδώ.'}</p>${extLine}${promoLine}</div>`;
    out.push(totalHtml);
    out.push(`<div class="meta">${checkedLine(checkedRec)}<span>Πηγές: ${srcLinks(sources)}</span></div>`);
    $('c_out').innerHTML = out.join('');
  }
  ['c_card', 'c_partner', 'c_amount', 'c_nights', 'c_grade', 'c_litres', 'c_promo', 'c_otype', 'c_oval', 'c_fkind', 'c_ppl'].forEach((id) => $(id).addEventListener('input', renderCalc));

  /* ================= 2. ΜΕΤΑΤΡΟΠΗ ================= */
  D.conversions.forEach((c) => $('v_rule').add(new Option(c.from + (c.status === 'confirmed' ? '' : ' (προς έλεγχο)'), c.id)));
  $('v_rule').value = 'bpme';
  function renderConvert() {
    const c = D.conversions.find((x) => x.id === val('v_rule'));
    const r = C.convertPoints({ points: val('v_points'), basePoints: c.basePoints, baseMiles: c.baseMiles, multipleOf: c.multipleOf, packages: c.packages || null,
      bonusPct: val('v_bonus'), min: c.min, max: c.max, status: c.status });
    let h = '';
    if (!r.ok) h = `<div class="notice ${r.belowMin ? '' : 'err'}">${esc(r.error)}</div>`;
    else {
      const bonusOn = r.bonusMiles > 0;
      h = flow('Τελικά μίλια Miles+Bonus', 't-mb', `${fmt(r.totalMiles, 0)} <small>μίλια</small>`,
        `<dl class="kv"><dt>Πόντοι που μετατρέπονται</dt><dd>${fmt(r.usablePoints, 0)}</dd><dt>Βασικά μίλια</dt><dd>${fmt(r.baseMiles, 0)}</dd>` +
        `<dt>Bonus μετατροπής</dt><dd>${fmt(r.bonusMiles, 0)}${bonusOn && val('v_bonusend') ? ' (λήγει ' + dmy(val('v_bonusend')) + ')' : ''}</dd><dt>Υπόλοιπο πόντων</dt><dd>${fmt(r.leftoverPoints, 0)}</dd></dl>` +
        `<div class="formula">Τύπος: <code>${esc(r.formula)}</code></div>` + (r.packageNote ? `<div class="formula">${esc(r.packageNote)}</div>` : ''),
        `<div class="meta">${confBadge(r.confidence)}</div>`);
    }
    h += `<div class="card"><h3>Όροι και περιορισμοί</h3><ul class="plain"><li>Αναλογία: ${fmt(c.basePoints, 0)} ${c.basePoints === 1 ? 'πόντος' : 'πόντοι'} = ${fmt(c.baseMiles, 0)} ${c.baseMiles === 1 ? 'μίλι' : 'μίλια'}</li>` +
      (c.packages ? `<li>Πακέτα: ${c.packages.map((x) => fmt(x, 0)).join(' / ')} πόντοι</li>` : `<li>Πολλαπλάσια των ${c.multipleOf} πόντων</li>`) +
      `<li>Ετήσιο όριο: ${esc(c.annualCap)}</li><li>${esc(c.note)}</li></ul>` +
      `<div class="meta">${statusBadge(c.status)}${checkedLine(c)}</div><div class="meta"><span>Πηγή: ${srcLinks(c.sources)}</span></div></div>`;
    $('v_out').innerHTML = h;
  }
  ['v_rule', 'v_points', 'v_bonus', 'v_bonusend'].forEach((id) => $(id).addEventListener('input', renderConvert));

  /* ================= 3. ΑΞΙΑ ΜΙΛΙΩΝ ================= */
  const AE_SEARCH = 'https://el.aegeanair.com/';

  function renderValue() {
    const empty = !val('a_price') && !val('a_miles');
    $('a_savebox').hidden = true;
    if (empty) { $('a_out').innerHTML = '<div class="empty">Συμπλήρωσε τιμή και μίλια, ή πάτησε «Δες υποθετικό παράδειγμα».</div>'; return; }
    const r = C.redemptionValue({ cashPrice: val('a_price'), miles: val('a_miles'), taxes: val('a_taxes'), fees: val('a_fees'), travelers: val('a_trav') });
    if (!r.ok) { $('a_out').innerHTML = `<div class="notice err">${esc(r.error)}</div>`; return; }
    const goalLink = '<p style="margin:10px 0 0"><a id="a_goal" href="#goal">Δεν σου φτάνουν τα μίλια; Φτιάξε στόχο και δες πώς θα τα μαζέψεις →</a></p>';
    $('a_savebox').hidden = false;
    const v = C.valueVerdict(r.valuePer1000, D.valueBands), VB = D.valueBands;
    const pos = Math.max(0, Math.min(100, (r.valuePer1000 / 30) * 100));
    const verdict = v ? `<div class="verdict v-${v.key}"><b>${esc(v.label)}</b><p>${esc(v.text)}</p>` +
      `<div class="vscale" aria-hidden="true"><span class="vmark" style="left:${pos}%"></span></div>` +
      '<div class="vticks" aria-hidden="true"><span style="left:0">0 €</span><span style="left:16.67%">5</span><span style="left:33.33%">10</span><span style="left:83.33%">25</span></div></div>' : '';
    const vnote = `<div class="formula">Πώς κρίνουμε: η AEGEAN πουλάει μίλια ${eur(VB.buyPrice)} τα 1.000 (${srcLinks([VB.buySource])}), άρα από εκεί και πάνω η εξαργύρωση είναι εξαιρετική. Για πρόσθετες υπηρεσίες τα 1.000 μίλια μετράνε ${eur(VB.servicesPrice)} (${srcLinks([VB.servicesSource])}), άρα κάτω από αυτό η αξία είναι χαμηλή. Το όριο των 10 € είναι δικός μας πρακτικός κανόνας. Έλεγχος ${dmy(VB.checked)}.</div>`;
    $('a_out').innerHTML = verdict + flow('Αξία μιλίων', 't-eur', `${eur(r.valuePer1000)} <small>ανά 1.000 μίλια</small>`,
      `<dl class="kv"><dt>Μετρητά που πληρώνεις με μίλια</dt><dd>${eur(r.cashRequired)}</dd><dt>Καθαρή εξοικονόμηση ανά ταξιδιώτη</dt><dd>${eur(r.netSaving)}</dd>` +
      `<dt>Σύνολο για ${fmt(r.travelers, 0)} ${r.travelers === 1 ? 'ταξιδιώτη' : 'ταξιδιώτες'}</dt><dd>${eur(r.totalSaving)} και ${fmt(r.totalMiles, 0)} μίλια</dd></dl>` +
      `<div class="formula">Τύπος: <code>${esc(r.formula)}</code></div>` + (r.noSaving ? '<div class="notice">Με αυτά τα στοιχεία δεν υπάρχει εξοικονόμηση: τα μετρητά με μίλια ξεπερνούν την τιμή με χρήματα.</div>' : '') + vnote + goalLink);
  }
  ['a_price', 'a_miles', 'a_taxes', 'a_fees', 'a_trav'].forEach((id) => $(id).addEventListener('input', renderValue));
  $('a_out').addEventListener('click', (e) => { if (e.target.closest('#a_goal')) { $('g_need').value = Number(val('a_miles')) * Math.max(1, Number(val('a_trav')) || 1); $('g_tax').value = (Number(val('a_taxes')) || 0) * Math.max(1, Number(val('a_trav')) || 1);  $('g_need').dispatchEvent(new Event('input')); } });
  $('a_demo').addEventListener('click', () => { $('a_price').value = 180; $('a_miles').value = 12000; $('a_taxes').value = 45; $('a_fees').value = 0; $('a_trav').value = 1; renderValue(); });

  /* ================= 4. ΣΥΓΚΡΙΣΗ ================= */
  /* Σύγκριση: τα ταξίδια που «κράτησες» από την Αξία μιλίων, σε σειρά από το καλύτερο. Μόνο σε αυτή τη συσκευή. */
  let opts = store.get('tlp.compare.v1', []);
  let cmpSort = 'value';
  const mkId = () => 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  function renderCompare() {
    const sorted = C.compareOptions(opts.map((o) => ({ ...o })), cmpSort);
    if (!sorted.length) { $('a_cmp').innerHTML = ''; return; }
    const rows = sorted.map((o, i) => {
      const v = o.valid ? C.valueVerdict(o.valuePer1000, D.valueBands) : null;
      return `<div class="cmprow${v ? ' v-' + v.key : ''}"><div class="cmp-top"><b>${o.valid && i === 0 && sorted.length > 1 ? '🏆 ' : ''}${esc(o.dest)}</b>` +
        `<span class="cmp-val">${o.valid ? eur(o.valuePer1000) + ' <small>/ 1.000 μίλια</small>' : '—'}</span></div>` +
        `<div class="cmp-sub">${v ? `<span class="vpill">${esc(v.label)}</span>` : ''}${fmt(o.miles, 0)} μίλια · πληρώνεις ${eur(o.cashRequired)} · γλιτώνεις ${eur(o.netSaving)}${o.demo ? ' · <i>υποθετικό</i>' : ''}</div>` +
        `<div class="cmp-act"><button class="linkbtn" data-load="${esc(o.id)}">Άνοιξε</button><button class="linkbtn" data-del="${esc(o.id)}" aria-label="Διαγραφή: ${esc(o.dest)}">Διαγραφή</button></div></div>`;
    }).join('');
    $('a_cmp').innerHTML = `<h2 style="margin-top:22px">Τα ταξίδια σου (${sorted.length})</h2>` +
      (sorted.length > 1 ? `<div class="seg" role="group" aria-label="Σειρά"><button type="button" data-sort="value" aria-pressed="${cmpSort === 'value'}">Καλύτερη αξία</button><button type="button" data-sort="cost" aria-pressed="${cmpSort === 'cost'}">Λιγότερα € από την τσέπη</button></div>` : '<p class="hint">Κράτα κι άλλο ταξίδι για να τα συγκρίνεις.</p>') +
      `<div class="list">${rows}</div><p class="hint">Αποθηκεύονται μόνο σε αυτή τη συσκευή. Είναι δικά σου νούμερα, όχι επιβεβαιωμένες προσφορές.</p>`;
  }
  $('a_save').addEventListener('click', () => {
    const r = C.redemptionValue({ cashPrice: val('a_price'), miles: val('a_miles'), taxes: val('a_taxes'), fees: val('a_fees'), travelers: 1 });
    if (!r.ok) return;
    opts.push({ id: mkId(), dest: val('a_name').trim() || `Ταξίδι ${opts.length + 1}`, miles: +val('a_miles'), cashPrice: +val('a_price'), taxes: +val('a_taxes') || 0, fees: +val('a_fees') || 0 });
    store.set('tlp.compare.v1', opts); $('a_name').value = ''; renderCompare();
    const b = $('a_save'); b.textContent = '✓ Το κράτησα'; setTimeout(() => { b.textContent = '➕ Κράτα το για σύγκριση'; }, 1500);
  });
  $('a_cmp').addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.sort) { cmpSort = t.dataset.sort; renderCompare(); return; }
    if (t.dataset.del) { opts = opts.filter((o) => o.id !== t.dataset.del); store.set('tlp.compare.v1', opts); renderCompare(); return; }
    if (t.dataset.load) { const o = opts.find((x) => x.id === t.dataset.load); if (!o) return;
      $('a_miles').value = o.miles; $('a_taxes').value = o.taxes; $('a_price').value = o.cashPrice; $('a_fees').value = o.fees || 0; $('a_trav').value = 1; $('a_name').value = o.dest; renderValue();
      try { $('a_miles').scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (er) { /* αγνοείται */ } }
  });

  /* ================= 5. ΣΤΟΧΟΣ ================= */
  {
    const gc = $('g_card');
    D.banks.forEach((bk) => { const og = document.createElement('optgroup'); og.label = bk.name; D.cards.filter((c) => c.bank === bk.id).forEach((c) => og.appendChild(new Option(c.name, c.id))); if (og.children.length) gc.append(og); });
    gc.value = 'premium';
  }
  function liveOffers() { return D.offers.map((o) => ({ o, st: C.offerStatus(o, today()) })).filter((x) => ['active', 'upcoming', 'recurring'].includes(x.st)); }
  function renderGoal() {
    if (!val('g_have') && !val('g_need')) { $('g_out').innerHTML = '<div class="empty">Συμπλήρωσε πόσα μίλια έχεις και πόσα χρειάζεσαι (τα βλέπεις στην AEGEAN).</div>'; return; }
    const card = D.cards.find((c) => c.id === val('g_card'));
    const fuel = val('g_fbrand') ? D.fuels.find((f) => f.id === val('g_fbrand')) : null;
    const spend = +val('g_spend') || 0, big = Math.min(+val('g_big') || 0, spend);
    const p95 = C.fuelPrice('u95', D.fuelPrices).price;
    const args = { have: val('g_have'), need: val('g_need'), card, spendOther: spend - big, spendBig: big, fuelEur: val('g_fuel'), fuel, fuelPricePerL: p95 };
    const r = C.goalPlan(args);
    if (!r.ok) { $('g_out').innerHTML = `<div class="notice err">${esc(r.error)}</div>`; return; }
    const when = (m) => { const d = new Date(); d.setMonth(d.getMonth() + m); return d.toLocaleDateString('el-GR', { month: 'long', year: 'numeric' }); };
    let h = flow('Στόχος' + (val('g_name') ? ': ' + esc(val('g_name')) : ''), 't-mb', r.reached ? '🎉 Έχεις αρκετά μίλια!' : `Λείπουν ${fmt(r.gap, 0)} <small>μίλια</small>`,
      `<div class="pbar" role="progressbar" aria-valuenow="${r.progressPct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${r.progressPct}%"></i></div><div class="formula">Πρόοδος ${r.progressPct}%</div>`);
    if (!r.reached) {
      const pk = fuel ? D.conversions.find((c) => c.id === fuel.conv) : null;
      const prog = fuel ? D.programs[fuel.program] : null;
      const lines = [];
      if (card && (card.model || 'alpha') === 'alpha') lines.push(`<li>Κάρτα: ~${fmt(r.cardPoints, 0)} πόντοι Bonus → <b>~${fmt(r.cardMiles, 0)} μίλια</b></li>`);
      else if (card && card.model === 'direct' && !r.otherProgram) lines.push(`<li>Κάρτα: <b>~${fmt(r.cardMiles, 0)} μίλια</b></li>`);
      if (r.fuelPts) lines.push(`<li>Καύσιμα: ~${fmt(r.litres, 0)} λίτρα 95 → <b>~${fmt(r.fuelPts, 0)} ${esc(prog.unit)}</b> (γίνονται μίλια 1:1 σε πακέτα από ${fmt(pk.packages[0], 0)})</li>`);
      h += r.perMonth > 0
        ? `<div class="card"><span class="flow-tag t-alpha">Με τα έξοδά σου</span><div class="big">~${fmt(r.perMonth, 0)} <small>μίλια τον μήνα</small></div><ul class="plain">${lines.join('')}</ul>` +
          `<div class="goalwhen">Φτάνεις τον στόχο σε <b>περίπου ${fmt(r.months, 0)} ${r.months === 1 ? 'μήνα' : 'μήνες'}</b>, δηλαδή κάπου τον ${esc(when(r.months).replace(/ος /, "ο "))}.</div>` +
          (r.capped ? `<div class="notice">Ξεπερνάς το ετήσιο όριο μετατροπής της κάρτας (${fmt(card.annualCapPoints, 0)} πόντοι). Μετράμε μόνο όσα επιτρέπει το όριο.</div>` : '') +
          `<div class="meta">${confBadge('provisional')}<span>Περίπου: εξαρτάται από το πού θα ξοδέψεις. Τα καύσιμα με μέση τιμή 95 (${dmy(D.fuelPrices.date)}).</span></div></div>`
        : `<div class="card">${r.otherProgram ? `<p>Η κάρτα σου μαζεύει ${esc(D.programs[r.otherProgram].name)}, όχι μίλια Miles+Bonus.</p>` : ''}<p class="hint">Γράψε πόσα ξοδεύεις τον μήνα για να δεις σε πόσο καιρό φτάνεις τον στόχο.</p></div>`;
      // Συμβουλές
      const tips = [];
      if (card && (card.model || 'alpha') === 'alpha' && spend - big >= 50) {
        const move = Math.min(200, spend - big);
        const r2 = C.goalPlan({ ...args, spendOther: spend - big - move, spendBig: big + move });
        if (r2.perMonth > r.perMonth) tips.push(`<li><b>Ψώνισε σε «μεγάλους» συνεργάτες.</b> Αν ${fmt(move, 0)} € από τις αγορές σου γίνουν σε AB, Vodafone κ.λπ. (4 πόντοι/€ αντί για ${fmt(card.pointsPerEuro[1])}), κερδίζεις +${fmt(r2.perMonth - r.perMonth, 0)} μίλια τον μήνα${r2.months && r2.months < r.months ? ` και φτάνεις ${r.months - r2.months} ${r.months - r2.months === 1 ? 'μήνα' : 'μήνες'} νωρίτερα` : ''}.</li>`);
      }
      if (fuel && fuel.id === 'bp' && +val('g_fuel') > 0 && C.promoValid(fuel.promo, today())) {
        const p100 = C.fuelPrice('u100', D.fuelPrices).price, l100 = Math.floor(+val('g_fuel') / p100);
        const extra = l100 * fuel.promo.pointsPerLitre - r.fuelPts;
        if (extra > 0) tips.push(`<li><b>bp 100άρα Παρασκευή–Κυριακή.</b> Με τα ίδια ${fmt(+val('g_fuel'), 0)} € σε Ultimate 100 το Σαββατοκύριακο: ~${fmt(l100 * fuel.promo.pointsPerLitre, 0)} πόντοι BPme αντί για ~${fmt(r.fuelPts, 0)} (+${fmt(extra, 0)} τον μήνα). Ισχύει έως ${dmy(fuel.promo.end)}. Η 100 είναι ακριβότερη, οπότε βάζεις λιγότερα λίτρα.</li>`);
      }
      const k = D.offers.find((o) => o.id === 'kotsovolos-100');
      if (k && card && (card.model || 'alpha') === 'alpha') tips.push(`<li><b>Μεγάλη αγορά ηλεκτρονικών;</b> Περίμενε την προσφορά του Κωτσόβολου (1€ = 100 πόντοι, online). Π.χ. 200 € → ${fmt(200 * 100, 0)} πόντοι → ~${fmt(C.alphaToMiles({ points: 20000, card }).miles, 0)} μίλια. Πάνω από 200 € μπορεί να πιάσεις το μηνιαίο όριο των ${fmt(D.alphaRules.monthlyCapPoints, 0)} πόντων.</li>`);
      const wel = D.offers.filter((o) => o.kind === 'card_welcome' && C.offerStatus(o, today()) === 'active' && (!card || card.id !== o.cardId)).sort((a, b) => b.miles - a.miles)[0];
      if (wel) tips.push(`<li><b>Μπόνους νέας κάρτας.</b> ${esc(wel.title)} (αίτηση έως ${dmy(wel.end)}). Θα κάλυπτε το ${Math.min(100, Math.round(wel.miles / r.gap * 100))}% από όσα σου λείπουν. Η κάρτα έχει ετήσια συνδρομή: δες τους όρους της Alpha πριν αποφασίσεις.</li>`);
      if (tips.length) h += `<div class="card"><h3>💡 Πώς να φτάσεις πιο γρήγορα</h3><ul class="plain tips">${tips.join('')}</ul></div>`;
      const lo = liveOffers().filter((x) => x.o.kind !== 'redeem_deal');
      if (lo.length) h += `<div class="card"><h3>🔥 Προσφορές που βοηθούν να μαζέψεις μίλια</h3><ul class="plain">${lo.map((x) => `<li>${esc(x.o.title)} <small>(${x.st === 'recurring' ? 'έρχεται κατά διαστήματα' : 'έως ' + dmy(x.o.end)})</small></li>`).join('')}</ul><a href="#offers">Δες λεπτομέρειες →</a></div>`;
    }
    h += '<p class="hint">Τους φόρους του εισιτηρίου θα τους δεις στην AEGEAN όταν κάνεις την κράτηση.</p>';
    $('g_out').innerHTML = h;
  }
  const G_IDS = ['g_name', 'g_have', 'g_need', 'g_card', 'g_spend', 'g_big', 'g_fuel', 'g_fbrand'];
  G_IDS.forEach((id) => $(id).addEventListener('input', () => { const o = {}; G_IDS.forEach((k) => { o[k] = val(k); }); store.set('tlp.goal.v2', o); renderGoal(); }));
  const sg = store.get('tlp.goal.v2', null) || (() => { const o = store.get('tlp.goal.v1', null); return o ? { g_name: o.n, g_have: o.h, g_need: o.r } : null; })();
  if (sg) G_IDS.forEach((k) => { if (sg[k] != null && sg[k] !== '') $(k).value = sg[k]; });

  /* ================= 6. ΠΡΟΣΦΟΡΕΣ ================= */
  let userOffers = store.get('tlp.offers.v1', []);
  function offerCard(o, st, mine) {
    const badge = { recurring: '<span class="badge b-warn">Έρχεται κατά διαστήματα</span>', active: '<span class="badge b-ok">Ενεργή</span>', expired: '<span class="badge b-off">Έληξε</span>', upcoming: '<span class="badge b-warn">Ξεκινά σύντομα</span>', to_verify: '<span class="badge b-warn">Προς επιβεβαίωση</span>' }[st];
    const v = o.miles && o.voucherEur ? C.voucherValue({ miles: o.miles, voucherEur: o.voucherEur }) : null;
    const src = mine ? (safeUrl(o.sources && o.sources[0]) ? `<a href="${esc(o.sources[0])}" target="_blank" rel="noopener noreferrer">Πηγή</a>` : '<span>Χωρίς πηγή</span>') : `<span>Πηγή: ${srcLinks(o.sources)}</span>`;
    return `<div class="card"><div class="row-top"><h3>${esc(o.title)}</h3>${badge}</div>` +
      `<div class="meta"><span>${esc(o.partner || '')}</span>${mine ? '<span class="badge b-off">Δική σου καταχώρηση</span>' : ''}</div>` +
      (o.desc ? `<div class="formula">${esc(o.desc)}</div>` : '') + (o.bonus ? `<div class="formula">Bonus / έκπτωση: ${esc(o.bonus)}</div>` : '') +
      (o.recurring ? `<div class="formula">${esc(o.recurringNote)}</div>` : '') +
      `<dl class="kv"><dt>${o.recurring ? 'Τελευταία φορά' : 'Ισχύει'}</dt><dd>${o.start ? dmy(o.start) + ' – ' : 'έως '}${dmy(o.end)}${o.endNote && !o.recurring ? ' (' + esc(o.endNote) + ')' : ''}</dd>` +
      (o.action ? `<dt>Τι πρέπει να κάνεις</dt><dd>${esc(o.action)}</dd>` : '') + (o.limits ? `<dt>Όρια</dt><dd>${esc(o.limits)}</dd>` : '') +
      (v ? `<dt>Αξία ανά 1.000 μίλια</dt><dd>${eur(v.valuePer1000)} (κουπόνι μόνο για υπηρεσίες EKO)</dd>` : '') + '</dl>' +
      `<div class="meta">${o.checked ? checkedLine(o) : ''}${src}${mine ? `<button class="linkbtn" data-delo="${esc(o.id)}">Διαγραφή</button>` : ''}</div></div>`;
  }
  function renderOffers() {
    const t = today();
    const all = D.offers.map((o) => ({ o, st: C.offerStatus(o, t), mine: false })).concat(userOffers.map((o) => ({ o: { ...o, sources: o.src ? [o.src] : [], status: safeUrl(o.src) ? 'confirmed' : 'to_verify' }, st: null, mine: true })));
    all.forEach((x) => { if (x.mine) { x.st = C.offerStatus({ ...x.o, sources: safeUrl(x.o.src) ? [x.o.src] : [] }, t); } });
    const grp = (st) => all.filter((x) => x.st === st);
    const sec = (title, list, empty) => `<h2>${title}</h2>` + (list.length ? list.map((x) => offerCard(x.o, x.st, x.mine)).join('') : `<div class="empty">${empty}</div>`);
    $('o_out').innerHTML = `<p class="hint" style="margin:0 0 6px">Σήμερα: ${dmy(t)}</p><div class="list">` +
      sec('Ενεργές', grp('active').concat(grp('upcoming')), 'Δεν υπάρχει ενεργή επιβεβαιωμένη προσφορά.') +
      (grp('recurring').length ? sec('Επαναλαμβανόμενες (έρχονται κατά διαστήματα)', grp('recurring'), '') : '') +
      (grp('to_verify').length ? sec('Προς επιβεβαίωση', grp('to_verify'), '') : '') +
      sec('Ιστορικό (ληγμένες)', grp('expired'), 'Καμία ληγμένη προσφορά ακόμη.') + '</div>';
  }
  $('o_form').addEventListener('submit', (e) => {
    e.preventDefault();
    userOffers.push({ id: mkId(), title: val('o_title').trim(), partner: val('o_partner').trim(), bonus: val('o_bonus').trim(), start: val('o_start'), end: val('o_end'), src: val('o_src').trim() });
    store.set('tlp.offers.v1', userOffers); $('o_form').reset(); renderOffers();
  });
  $('o_out').addEventListener('click', (e) => { const id = e.target.dataset && e.target.dataset.delo; if (id) { userOffers = userOffers.filter((o) => o.id !== id); store.set('tlp.offers.v1', userOffers); renderOffers(); } });

  /* ================= 7. ΚΑΤΑΛΟΓΟΣ ΣΥΝΕΡΓΑΤΩΝ ================= */
  const TYPES = [['all', 'Όλοι'], ['per_eur', 'Μίλια ανά €'], ['stay', 'Ανά διαμονή'], ['convert', 'Μετατροπή πόντων'], ['per_action', 'Ανά ενέργεια'], ['benefit', 'Μόνο προνόμια']];
  const typeOf = (p) => (p.earn.type === 'per_night' || p.earn.type === 'per_stay' ? 'stay' : p.earn.type);
  const CICON = {
    all: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
    cup: '<path d="M4 9h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6zM17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3v3M12 3v3"/>',
    car: '<path d="M5 16V11l2-5h10l2 5v5M3 16h18v3H3zM7 19v2M17 19v2M5 11h14"/><circle cx="7.5" cy="13.5" r=".6"/><circle cx="16.5" cy="13.5" r=".6"/>',
    bed: '<path d="M3 19V6M3 15h18v4M21 15v-3a3 3 0 0 0-3-3h-7v6M7 12a1.8 1.8 0 1 0 0-.01"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
    home: '<path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-6h4v6"/>',
    shirt: '<path d="M8 3l-5 3 2 5 3-1v11h8V10l3 1 2-5-5-3a4 4 0 0 1-8 0z"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>'
  };
  const ico = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${CICON[k] || CICON.all}</svg>`;
  const cats = D.partnerCats.map((c) => c.name);
  const catIcon = (name) => (D.partnerCats.find((c) => c.name === name) || {}).icon;
  const PREVIEW = 3;
  let pType = 'all', pCat = 'all', pArea = 'all';

  function earnHead(p) {
    const e = p.earn;
    if (e.type === 'per_eur') return `<b>${fmt(e.rate)}</b><span>${e.rate === 1 ? 'μίλι' : 'μίλια'} / €${/διαμονής|μίσθωμα|χωρίς φόρους/.test(e.unit) ? ` <small>(${esc(e.unit.replace(/^ευρώ\s*/, '').replace(/[()]/g, ''))})</small>` : ''}</span>`;
    if (e.type === 'per_night') return `<b>${fmt(e.miles, 0)}</b><span>μίλια / νύχτα</span>`;
    if (e.type === 'per_stay') {
      const lo = Math.min(...e.tiers.map((t) => t.miles)), hi = Math.max(...e.tiers.map((t) => t.miles));
      return `<b>${lo === hi ? fmt(lo, 0) : fmt(lo, 0) + '–' + fmt(hi, 0)}</b><span>μίλια / διαμονή</span>`;
    }
    if (e.type === 'convert') return '<b class="sm">Μετατροπή</b><span>πόντων σε μίλια</span>';
    if (e.type === 'per_action') return `<b class="sm">έως ${fmt(e.maxMiles, 0)}</b><span>μίλια / ενέργεια</span>`;
    return '<b class="sm">Χωρίς μίλια</b><span>μόνο προνόμια</span>';
  }
  const sortKey = (p) => { const e = p.earn; return e.type === 'per_eur' ? 1e6 + e.rate : e.type === 'per_night' ? 5e5 + e.miles : e.type === 'per_stay' ? 4e5 + Math.max(...e.tiers.map((t) => t.miles)) : { convert: 3, per_action: 2, benefit: 1 }[e.type] || 0; };
  function alphaLine(p) {
    if (p.alphaTier && p.alphaTierStatus === 'confirmed') return `${p.alphaTier} πόντοι/€ <small>(συνεργάτης Bonus)</small>`;
    return '1 πόντος/€ <small>(δεν βρέθηκε στη λίστα Bonus)</small>';
  }
  function pcard(p) {
    const e = p.earn, where = [p.place, p.region !== 'Ελλάδα' ? p.region : ''].filter(Boolean).join(' · ');
    const facts = [];
    if (p.redeem) facts.push(['Εξαργύρωση', esc(p.redeem)]);
    if (p.redeemFrom) facts.push(['Δωρεάν διαμονή', `από ${fmt(p.redeemFrom, 0)} μίλια / νύχτα`]);
    if (e.type !== 'benefit') facts.push(['Alpha Bonus', alphaLine(p)]);
    const terms = [];
    if (e.type === 'per_stay') terms.push(`<table class="tiers"><caption class="sr">Κλίμακα μιλίων</caption><thead><tr><th scope="col">Νύχτες</th><th scope="col">Μίλια</th></tr></thead><tbody>${e.tiers.map((t) => `<tr><td>${t.max == null ? fmt(t.min, 0) + '+' : t.min === t.max ? fmt(t.min, 0) : fmt(t.min, 0) + '–' + fmt(t.max, 0)}</td><td>${fmt(t.miles, 0)}</td></tr>`).join('')}</tbody></table>`);
    if (p.channels) terms.push(`<p><b>Πώς:</b> ${esc(p.channels)}</p>`);
    if (p.cond) terms.push(`<p><b>Προϋποθέσεις:</b> ${esc(p.cond)}</p>`);
    if (p.excl) terms.push(`<p><b>Εξαιρέσεις:</b> ${esc(p.excl)}</p>`);
    if (isHotel(p)) terms.push(`<p>${esc(D.hotelRules)}</p>`);
    const go = isCalc(p) ? `<button type="button" class="pc-go" data-calc="p:${esc(p.id)}">Υπολόγισε <span aria-hidden="true">→</span></button>`
      : e.type === 'convert' ? `<button type="button" class="pc-go" data-conv="${esc(e.conv)}">Μετατροπή <span aria-hidden="true">→</span></button>` : '';
    const srcs = p.sources.map((s, i) => D.sources[s] ? `<a href="${esc(D.sources[s].url)}" target="_blank" rel="noopener noreferrer" title="${esc(D.sources[s].t)}">${i ? esc(D.sources[s].pub) : 'Πηγή'}</a>` : '').filter(Boolean).join(' · ');
    return `<article class="pcard t-${typeOf(p)}"><div class="pc-head"><div class="pc-name"><h3>${esc(p.name)}</h3>${where ? `<p class="pc-sub">${esc(where)}</p>` : ''}</div>${p.status === 'confirmed' ? '' : statusBadge(p.status)}</div>` +
      `<div class="pc-earn">${earnHead(p)}</div>` +
      (e.text ? `<p class="pc-note">${esc(e.text)}</p>` : '') +
      (facts.length ? `<dl class="pc-facts">${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>` : '') +
      (terms.length ? `<details class="pc-terms"><summary>Όροι και τρόπος</summary>${terms.join('')}</details>` : '') +
      `<div class="pc-foot"><span class="pc-src">Έλεγχος ${dmy(p.checked)} · ${srcs}</span>${go}</div></article>`;
  }
  /* Σύντομη περίληψη για το πλακίδιο κατηγορίας. */
  function catSummary(list) {
    const eurs = list.filter((p) => p.earn.type === 'per_eur').map((p) => p.earn.rate);
    if (eurs.length && eurs.length >= list.length / 2) return `έως ${fmt(Math.max(...eurs))} μίλια/€`;
    if (list.some((p) => p.earn.type === 'per_night')) return 'συνήθως 250 μίλια/νύχτα';
    if (list.some((p) => p.earn.type === 'convert')) return 'μετατροπή πόντων';
    return eurs.length ? `έως ${fmt(Math.max(...eurs))} μίλια/€` : 'προνόμια';
  }
  const grid = (l) => `<div class="pgrid">${l.map(pcard).join('')}</div>`;

  function renderPartners() {
    const q = val('p_q').trim().toLowerCase(), only = $('p_only').checked, sort = val('p_sort');
    const hay = (p) => [p.name, p.cat, p.area, p.place, p.region, p.earn.text].join(' ').toLowerCase();
    const sorter = sort === 'name' ? byName : (a, b) => sortKey(b) - sortKey(a) || byName(a, b);
    const pre = D.partners.filter((p) => (!q || hay(p).includes(q)) && (!only || p.status === 'confirmed') && (pType === 'all' || typeOf(p) === pType));
    /* Συνεργάτες μόνο Alpha (2 πόντοι/€) μέσα στις κατηγορίες· εμφανίζονται όταν δεν φιλτράρεται «τι δίνει». */
    const apre = pType === 'all' ? D.alphaPartners.filter((p) => p.tier === 2 && (!q || (p.name + ' ' + p.cat).toLowerCase().includes(q))).sort(byName) : [];
    const chips = (l) => `<div class="achips">${l.map((p) => `<button type="button" class="achip" data-calc="a:${esc(p.id)}">${esc(p.name)} <b>${p.tier} π./€</b></button>`).join('')}</div>`;
    const alphaBlock = (l) => (l.length ? `<div class="acat"><h3 class="asub">Μόνο Alpha Bonus · 2 πόντοι/€ <span class="n">${l.length}</span></h3>${chips(l)}</div>` : '');
    /* Πλακίδια κατηγοριών (οι αριθμοί ακολουθούν τα υπόλοιπα φίλτρα) */
    $('p_cats').innerHTML = [['all', 'Όλες', 'all', pre, apre]].concat(cats.map((c) => [c, c, catIcon(c), pre.filter((p) => p.cat === c), apre.filter((p) => p.cat === c)])).map(([k, t, ic, l, al]) => {
      const n = l.length + al.length, mbAll = D.partners.filter((p) => p.cat === k);
      const sum = k === 'all' ? 'συνεργάτες' : mbAll.length ? catSummary(mbAll) : 'πόντοι Alpha Bonus';
      return `<button type="button" class="ptile" data-cat="${esc(k)}" aria-pressed="${pCat === k}"${n || k === 'all' ? '' : ' disabled'}><span class="pt-ico">${ico(ic)}</span><span class="pt-txt"><b>${esc(t)}</b><small>${n}<span class="pt-sum"> · ${esc(sum)}</span></small></span></button>`;
    }).join('');
    const inCat = pre.filter((p) => pCat === 'all' || p.cat === pCat);
    const aInCat = apre.filter((p) => pCat === 'all' || p.cat === pCat);
    /* Τύπος (μετρά μέσα στην επιλεγμένη κατηγορία, μόνο συνεργάτες Miles+Bonus) */
    const typeBase = D.partners.filter((p) => (!q || hay(p).includes(q)) && (!only || p.status === 'confirmed') && (pCat === 'all' || p.cat === pCat));
    $('p_type').innerHTML = TYPES.map(([k, t]) => { const n = k === 'all' ? typeBase.length : typeBase.filter((p) => typeOf(p) === k).length;
      return `<button type="button" class="seg" data-t="${k}" aria-pressed="${pType === k}"${n || k === 'all' ? '' : ' disabled'}>${t} <span>${n}</span></button>`; }).join('');
    /* Περιοχές ξενοδοχείων */
    const areaEl = $('p_area'), isH = pCat === 'Ξενοδοχεία';
    areaEl.hidden = !isH;
    if (isH) {
      areaEl.innerHTML = [['all', inCat.length]].concat(D.hotelAreas.map(([a]) => [a, inCat.filter((p) => p.area === a).length])).map(([a, n]) =>
        `<button type="button" class="seg" data-a="${esc(a)}" aria-pressed="${pArea === a}"${n || a === 'all' ? '' : ' disabled'}>${a === 'all' ? 'Όλες οι περιοχές' : esc(a)} <span>${n}</span></button>`).join('');
    }
    const list = inCat.filter((p) => !isH || pArea === 'all' || p.area === pArea).sort(sorter);
    const aList = isH && pArea !== 'all' ? [] : aInCat;

    let h = `<p class="pcount">${list.length} Miles+Bonus${aList.length ? ` · ${aList.length} μόνο Alpha Bonus` : ''}${pCat === 'all' ? '' : ' · ' + esc(pCat)}${isH && pArea !== 'all' ? ' · ' + esc(pArea) : ''}</p>`;
    if (!list.length && !aList.length) h += '<div class="empty">Κανένας συνεργάτης με αυτά τα φίλτρα.</div>';
    else if (pCat === 'all') {
      /* Επισκόπηση: κάθε κατηγορία με λίγους συνεργάτες και «Δες όλους». Με αναζήτηση εμφανίζονται όλα τα αποτελέσματα. */
      h += cats.map((c) => [c, list.filter((p) => p.cat === c), aList.filter((p) => p.cat === c)]).filter(([, l, al]) => l.length || al.length).map(([c, l, al]) => {
        const show = q ? l : l.slice(0, PREVIEW), more = l.length > show.length || (!q && al.length);
        const aPart = !al.length ? '' : q ? alphaBlock(al)
          : `<p class="apeek"><b>+ ${al.length} μόνο Alpha Bonus</b> (2 πόντοι/€): ${esc(al.slice(0, 5).map((p) => p.name).join(', '))}${al.length > 5 ? '…' : ''}</p>`;
        return `<section class="pgroup"><div class="pg-head"><h2><span class="pg-ico">${ico(catIcon(c))}</span>${esc(c)} <span class="n">${l.length + al.length}</span></h2>` +
          (more ? `<button type="button" class="pg-all" data-cat="${esc(c)}">Δες όλους (${l.length + al.length}) <span aria-hidden="true">→</span></button>` : '') + `</div>${show.length ? grid(show) : ''}${aPart}</section>`;
      }).join('');
    } else if (isH && pArea === 'all' && sort !== 'name') {
      h += D.hotelAreas.map(([a]) => [a, list.filter((p) => p.area === a)]).filter(([, l]) => l.length)
        .map(([a, l]) => `<section class="pgroup"><div class="pg-head"><h2>${esc(a)} <span class="n">${l.length}</span></h2></div>${grid(l)}</section>`).join('') + alphaBlock(aList);
    } else {
      h += `<section class="pgroup">${list.length ? grid(list) : ''}${alphaBlock(aList)}</section>`;
    }
    if (isH) h += `<p class="hint">${esc(D.hotelRules)}</p>`;
    if (aList.length && pCat !== 'all') h += `<p class="hint">Οι συνεργάτες «μόνο Alpha Bonus» δεν δίνουν μίλια Miles+Bonus. Με κάρτα Aegean Bonus Visa δίνουν 2 πόντους Bonus/€, που γίνονται μίλια με τη μετατροπή της κάρτας. Πηγή: ${srcLinks(['alpha-partners'])}</p>`;

    const a4 = D.alphaPartners.filter((p) => p.tier === 4 && (!q || p.name.toLowerCase().includes(q)));
    if (a4.length && pType === 'all' && pCat === 'all') {
      h += `<section class="pgroup alpha-only"><div class="pg-head"><h2>Μεγάλοι συνεργάτες Alpha Bonus <span class="n">${a4.length}</span></h2></div><p class="hint" style="margin-top:0">Δεν είναι συνεργάτες Miles+Bonus (εκτός από τα εισιτήρια AEGEAN). Με κάρτα Aegean Bonus Visa δίνουν 4 πόντους Bonus/€, που γίνονται μίλια με τη μετατροπή της κάρτας.</p>` +
        chips(a4) + `<p class="hint">${esc(D.alphaNote)} Πηγή: ${srcLinks(['alpha-major', 'alpha-partners'])}</p></section>`;
    }
    if (!q && pCat === 'all' && pType === 'all') {
      h += `<details class="more" style="margin-top:22px"><summary>Αεροπορικές εταιρείες (${D.airlinePartners.names.length})</summary><p class="hint" style="margin-top:0">${esc(D.airlinePartners.names.join(', '))}.</p><p class="hint">${esc(D.airlinePartners.note)}</p></details>`;
      h += `<p class="hint">Η λίστα ξαναδιαβάστηκε στις ${dmy(D.rulesChecked)} από <a href="${esc(D.sources['ae-partners'].url)}" target="_blank" rel="noopener noreferrer">τη σελίδα συνεργατών της AEGEAN</a> (97 συνεργάτες: ${D.partners.length} εδώ, ${D.airlinePartners.names.length} αεροπορικές, οι κάρτες στον υπολογιστή και bp/EKO στη μετατροπή).</p>`;
    }
    $('p_out').innerHTML = h;
  }
  const pickCat = (c) => {
    pCat = c; pArea = 'all'; renderPartners();
    const top = $('p_cats').getBoundingClientRect().top + window.scrollY - 70;
    if (window.scrollY > top) window.scrollTo({ top, behavior: 'smooth' });
  };
  ['p_q', 'p_sort', 'p_only'].forEach((id) => $(id).addEventListener('input', renderPartners));
  $('p_cats').addEventListener('click', (e) => { const b = e.target.closest('[data-cat]'); if (b && !b.disabled) pickCat(pCat === b.dataset.cat && b.dataset.cat !== 'all' ? 'all' : b.dataset.cat); });
  $('p_type').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b && !b.disabled) { pType = b.dataset.t; renderPartners(); } });
  $('p_area').addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) { pArea = b.dataset.a; renderPartners(); } });
  $('p_out').addEventListener('click', (e) => {
    const c = e.target.closest('[data-calc]'), v = e.target.closest('[data-conv]'), g = e.target.closest('[data-cat]');
    if (c) { pickPartner('c', c.dataset.calc); location.hash = '#calc'; }
    else if (v) { setSel('v_rule', v.dataset.conv); location.hash = '#convert'; }
    else if (g) pickCat(g.dataset.cat);
  });

  /* ================= 8. ΚΑΤΑΣΤΑΣΗ ΥΛΟΠΟΙΗΣΗΣ ================= */
  /* Δημόσια σελίδα «Πηγές και έλεγχοι»: όλα βγαίνουν αυτόματα από τα δεδομένα, με πηγή και ημερομηνία. */
  function renderStatus() {
    const st = (x) => (x === 'confirmed' ? '<span class="badge b-ok">Επιβεβαιωμένο</span>' : '<span class="badge b-warn">Προσωρινό</span>');
    const row = (what, rule, r, srcIds) => `<tr><th scope="row">${what}</th><td>${rule}</td><td>${st(r.status)}<div class="sm">${dmy(r.checked)}</div></td><td class="sm">${srcLinks(srcIds || r.sources || [])}</td></tr>`;
    const tbl = (title, rows) => `<div class="card"><h2>${title}</h2><div class="tblwrap"><table class="srct"><thead><tr><th>Τι</th><th>Κανόνας</th><th>Έλεγχος</th><th>Πηγή</th></tr></thead><tbody>${rows.join('')}</tbody></table></div></div>`;
    const cardsRows = D.conversions.filter((c) => c.to === 'mb').map((c) => row(esc(c.from), `${fmt(c.basePoints, 0)} ${c.basePoints === 1 ? 'πόντος' : 'πόντοι'} = ${fmt(c.baseMiles, 0)} ${c.baseMiles === 1 ? 'μίλι' : 'μίλια'}${c.packages ? `, σε πακέτα από ${fmt(c.packages[0], 0)}` : ''}${c.annualCap && !/^Δεν/.test(c.annualCap) ? `<div class="sm">Όριο: ${esc(c.annualCap)}</div>` : ''}`, c));
    const direct = D.cards.filter((c) => c.model === 'direct').map((c) => row(esc(c.name), `${fmt(c.earn.perEuro)} ${esc(c.earn.perEuro === 1 ? D.programs[c.earn.program].unit.replace(/^μίλια/, 'μίλι') : D.programs[c.earn.program].unit)} ανά €`, c));
    const fuelRows = D.fuels.map((f) => row(esc(f.name.split(' (')[0]), f.grades.map(([k, t]) => `${esc(t)}: ${fmt(f.pointsPerLitre[k])}`).join(' · ') + ' πόντοι/λίτρο', { status: f.pointsStatus, checked: f.checked }, [f.pointsSource]));
    const FP = D.fuelPrices;
    const priceRows = Object.keys(FP.prices).map((k) => row(esc(FP.labels[k]), `${fmt(FP.prices[k], 3)} €/λίτρο (μέσος όρος χώρας, ${dmy(FP.date)})`, { status: 'confirmed', checked: FP.checked }, FP.sources))
      .concat(Object.keys(FP.estimates).map((k) => { const e = C.fuelPrice(k, FP); return row(esc(e.label), `~${fmt(e.price, 3)} €/λίτρο · <b>εκτίμησή μας</b>: ${esc(e.text)}`, { status: 'estimate', checked: FP.checked }, FP.sources); }));
    const offRows = D.offers.map((o) => ({ o, s: C.offerStatus(o, today()) })).filter((x) => x.s !== 'expired').map((x) => row(esc(x.o.title), x.s === 'recurring' ? 'Κατά διαστήματα' : `Έως ${dmy(x.o.end)}`, x.o));
    const VB = D.valueBands;
    const valRows = [row('Αγορά μιλίων από την AEGEAN', `${eur(VB.buyPrice)} ανά 1.000 μίλια → όριο «Εξαιρετική»`, { status: 'confirmed', checked: VB.checked }, [VB.buySource]),
      row('Μίλια για πρόσθετες υπηρεσίες', `200 μίλια = 1 € (${eur(VB.servicesPrice)} / 1.000) → όριο «Χαμηλή»`, { status: 'confirmed', checked: VB.checked }, [VB.servicesSource]),
      row('Όριο «Καλή» (10 €)', '<b>Δικός μας πρακτικός κανόνας</b>, όχι επίσημος', { status: 'estimate', checked: VB.checked }, [])];
    const nConf = D.partners.filter((p) => p.status === 'confirmed').length;
    $('s_out').innerHTML =
      `<div class="card"><h2>Πώς δουλεύουμε</h2><ul class="plain">` +
      '<li>Παίρνουμε τους κανόνες <b>μόνο από επίσημες σελίδες</b>: AEGEAN Miles+Bonus, Alpha Bank, bp, EKO και το Παρατηρητήριο Τιμών Καυσίμων.</li>' +
      '<li>Κάθε κανόνας έχει <b>πηγή και ημερομηνία ελέγχου</b>. Τους ξαναδιαβάζουμε όταν αλλάζουν.</li>' +
      '<li>Ό,τι δεν είναι σίγουρο, π.χ. εκτίμηση ή ασάφεια στους όρους, γράφει <b>«Προσωρινό»</b> και δεν μπαίνει στα επιβεβαιωμένα σύνολα.</li></ul></div>' +
      tbl('Μετατροπή πόντων σε μίλια Miles+Bonus', cardsRows) +
      tbl('Κανόνες Alpha Bonus', [row('Πόντοι ανά αγορά', 'Μόνο για ακέραια € και αγορές πάνω από 1 €', D.alphaRules),
        row('Μηνιαίο όριο', `${fmt(D.alphaRules.monthlyCapPoints, 0)} πόντοι ανά κάρτα (η τράπεζα μπορεί να το αλλάξει)`, D.alphaRules),
        row('Λήξη πόντων', `${D.alphaRules.expiryYears} χρόνια από την πίστωση`, D.alphaRules),
        row('bp', 'Οι 4 πόντοι/€ ισχύουν σε όλες τις αγορές μέσα στο πρατήριο, εκτός από τους αυτόματους πωλητές (1/€)', { status: 'confirmed', checked: '2026-10-23' }, ['alpha-bp'])]) +
      (direct.length ? tbl('Κάρτες που δίνουν μίλια απευθείας', direct) : '') +
      tbl('Πόντοι καυσίμων', fuelRows) +
      tbl('Τιμές καυσίμων', priceRows) +
      (offRows.length ? tbl('Προσφορές σε ισχύ', offRows) : '') +
      tbl('Πώς κρίνουμε αν συμφέρει μια εξαργύρωση', valRows) +
      `<div class="card"><h2>Συνεργάτες</h2><p>${fmt(nConf, 0)} συνεργάτες Miles+Bonus με επιβεβαιωμένο κανόνα, ο καθένας με τη δική του επίσημη σελίδα και ημερομηνία ελέγχου. Τους βλέπεις στη σελίδα <a href="#partners">Συνεργάτες</a>.</p></div>` +
      '<div class="notice">Οι υπολογισμοί είναι <b>ενδεικτικοί</b>. Ισχύουν πάντα οι επίσημοι όροι κάθε προγράμματος. Το «ΤΙ ΛΕΕΙ; ΠΕΤΑΜΕ!» είναι ανεξάρτητο και δεν συνδέεται με την AEGEAN, την Alpha Bank ή τους συνεργάτες τους.</div>';
  }

  /* ================= ΑΡΧΙΚΗ ================= */
  function setSel(id, v) { const el = $(id); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }
  fillBanks($('q_bank')); fillCards($('q_bank'), $('q_card'), 'premium');
  $('q_bank').addEventListener('input', () => fillCards($('q_bank'), $('q_card')));
  fillPCats($('q_pcat')); $('q_pcat').addEventListener('input', () => { fillPartners($('q_pcat'), $('q_partner')); hotelMode('q', val('q_pcat') === 'Ξενοδοχεία'); });
  pickPartner('q', 'p:hertz-fd');
  $('q_rule').innerHTML = $('v_rule').innerHTML; $('q_rule').value = 'bpme';
  const qIds = [['qt_buy', 'q_buy'], ['qt_conv', 'q_conv'], ['qt_val', 'q_val']];
  qIds.forEach(([t, f]) => $(t).addEventListener('click', () => qIds.forEach(([t2, f2]) => { $(t2).setAttribute('aria-selected', String(t2 === t)); $(f2).hidden = f2 !== f; })));
  $('q_buy').addEventListener('submit', (e) => { e.preventDefault(); setSel('c_bank', val('q_bank')); setSel('c_card', val('q_card')); pickPartner('c', val('q_partner')); if (val('q_pcat') === 'Ξενοδοχεία') setSel('c_nights', val('q_nights')); setSel('c_amount', val('q_amount')); location.hash = '#calc'; });
  $('q_conv').addEventListener('submit', (e) => { e.preventDefault(); setSel('v_rule', val('q_rule')); setSel('v_points', val('q_points')); location.hash = '#convert'; });
  $('q_val').addEventListener('submit', (e) => { e.preventDefault(); setSel('a_price', val('q_price')); setSel('a_miles', val('q_miles')); setSel('a_taxes', val('q_taxes') || 0); location.hash = '#value'; });

  /* ---- hero: παγκόσμιος χάρτης με διαδρομές και αεροπλανάκια ---- */
  const PLANE = 'M10 0L4-1.2 1-6.5-1-6.5.5-1.2-5-1-7-3.6-8.6-3.6-7.6 0-8.6 3.6-7 3.6-5 1 .5 1.2-1 6.5 1 6.5 4 1.2Z';
  function renderHeroMap() {
    const W = window.TLP_WORLD, svg = $('heroMap');
    if (window.TLP_GLOBE && $('globe')) { try { window.TLP_GLOBE.start($('globe'), $('gpin'), { seconds: 40 }); } catch (e) { /* αγνοείται */ } }
    if (!W || !svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', `0 0 ${W.w} ${W.h}`);
    const lbl = (c) => { const left = c.p[0] < W.athens[0]; return `<text class="lbl" x="${c.p[0] + (left ? -10 : 10)}" y="${c.p[1] + 5}" text-anchor="${left ? 'end' : 'start'}">${esc(c.name)}</text>`; };
    svg.innerHTML = `<path class="grat" d="${W.graticule}"/><path class="land" d="${W.land}"/>` +
      W.cities.map((c) => `<path class="rt${c.featured ? ' f' : ''}" id="rt_${c.id}" d="${c.route}"/>`).join('') +
      W.cities.map((c) => `<circle class="dot" cx="${c.p[0]}" cy="${c.p[1]}" r="${c.featured ? 5.5 : 4}"/>`).join('') +
      W.cities.filter((c) => c.featured && !['rome', 'paris'].includes(c.id)).map(lbl).join('') +
      `<circle class="ath-ring" cx="${W.athens[0]}" cy="${W.athens[1]}" r="13"/><circle class="ath" cx="${W.athens[0]}" cy="${W.athens[1]}" r="6.5"/>` +
      `<text class="lbl" x="${W.athens[0] + 14}" y="${W.athens[1] + 24}">Αθήνα</text>`;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fly = W.cities.filter((c) => c.featured).map((c, i) => {
      const path = svg.querySelector('#rt_' + c.id), g = document.createElementNS(NS, 'path');
      g.setAttribute('d', PLANE); g.setAttribute('class', 'plane'); svg.appendChild(g);
      return { path, g, len: path.getTotalLength(), dur: 7000 + (path.getTotalLength() * 9), off: i * 0.17 };
    });
    const place = (f, t) => {
      const L = f.len, at = Math.max(0.5, Math.min(L - 0.5, t * L));
      const a = f.path.getPointAtLength(at), b = f.path.getPointAtLength(Math.min(L, at + 1));
      const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
      f.g.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) rotate(${ang.toFixed(1)}) scale(1.35)`);
      f.g.setAttribute('opacity', String(Math.min(1, Math.min(t, 1 - t) * 8)));
    };
    if (reduce) { fly.forEach((f) => place(f, 0.55)); return; }
    const t0 = performance.now();
    const tick = (now) => { fly.forEach((f) => place(f, (((now - t0) / f.dur) + f.off) % 1)); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }

  const ICONS = {
    offer: '<path d="M20 12v8H4v-8M2 7h20v5H2zM12 22V7M12 7H8a2.5 2.5 0 1 1 0-5c3 0 4 5 4 5zm0 0h4a2.5 2.5 0 1 0 0-5c-3 0-4 5-4 5z"/>',
    card: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/>',
    fuel: '<path d="M4 21V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16M3 21h13M7 8h5M15 11h2a2 2 0 0 1 2 2v4a1.5 1.5 0 0 0 3 0V9l-3-3"/>',
    scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>'
  };
  const thumb = (cls, ic) => `<span class="thumb ${cls}" aria-hidden="true"><svg viewBox="0 0 24 24">${ICONS[ic]}</svg></span>`;

  function renderHome() {
    renderHeroMap();
    const lo = liveOffers();
    $('h_offers').innerHTML = lo.length ? lo.map((x) => `<a class="hoffer" href="#offers"><span class="badge ${x.st === 'recurring' ? 'b-warn' : 'b-ok'}">${x.st === 'recurring' ? 'Κατά διαστήματα' : 'Έως ' + dmy(x.o.end)}</span><b>${esc(x.o.title)}</b><small>${esc(x.o.partner || '')}</small></a>`).join('')
      : '<div class="empty">Δεν υπάρχει ενεργή επιβεβαιωμένη προσφορά αυτή τη στιγμή.</div>';
    const AL = D.airlinePartners;
    $('h_airlines').innerHTML = AL.names.map((n, i) => `<span class="al${i < 2 ? ' main' : ''}">${esc(n)}</span>`).join('');
    $('h_airlines_note').innerHTML = `${esc(AL.note)} Έλεγχος ${dmy(AL.checked)} · Πηγή: ${srcLinks(AL.sources)}`;
    const W = window.TLP_WORLD;
    const top = D.partners.filter((p) => p.status === 'confirmed' && p.earn.type === 'per_eur').sort((a, b) => b.rate - a.rate).filter((p, i, arr) => arr.findIndex((x) => x.name.split(' – ')[0] === p.name.split(' – ')[0]) === i).slice(0, 6);
    $('h_partners').innerHTML = top.map((p) => `<a class="tile" href="#calc" data-partner="p:${esc(p.id)}"><h3>${esc(p.name.split(' – ')[0].split(' (')[0])}</h3><span class="rate">${fmt(p.rate)} <small>μίλια ανά €</small></span><span class="tmeta">${esc(p.cat)}</span><span class="go" aria-hidden="true">→</span></a>`).join('');
    $('h_news').innerHTML = GUIDES.map((g, i) => guideCard(g, i)).join('');
  }
  /* «Ξεκίνα τώρα»: απλός σύνδεσμος στο #calc (ο υπολογιστής). Το scroll μέσα στην εφαρμογή Claude δεν δούλευε. */
  $('h_news').addEventListener('click', (e) => { const a = e.target.closest('[data-g]'); if (a) setTimeout(() => { const el = document.getElementById('guide-' + a.dataset.g); if (el) el.scrollIntoView({ block: 'start' }); }, 80); });
  $('al_prev').addEventListener('click', () => $('h_airlines').scrollBy({ left: -260 }));
  $('al_next').addEventListener('click', () => $('h_airlines').scrollBy({ left: 260 }));
  /* «Θέλω ειδοποιήσεις»: απλός σύνδεσμος προς ξεχωριστή φόρμα/λίστα Brevo (όχι το newsletter). */
  $('h_partners').addEventListener('click', (e) => { const a = e.target.closest('[data-partner]'); if (a) { pickPartner('c', a.dataset.partner); setSel('c_bank', 'alpha'); setSel('c_card', 'premium'); } });

  /* ================= ΟΔΗΓΟΙ (από επαληθευμένα δεδομένα) ================= */
  const pr = D.cards.find((c) => c.id === 'premium'), bpc = D.conversions.find((c) => c.id === 'bpme'), eko = D.offers.find((o) => o.id === 'eko-oct26');
  const ekoV = C.voucherValue({ miles: eko.miles, voucherEur: eko.voucherEur });
  /* Οι πόλεις της υδρογείου γίνονται εικόνες των οδηγών. */
  const GCITY = ['rome', 'paris', 'london', 'newyork', 'tokyo', 'sydney'];
  const guideCard = (g, i) => `<a class="dest" href="#guides" data-g="${i}"><img src="assets/dest/${GCITY[i % GCITY.length]}.svg" width="480" height="300" alt="" loading="lazy"><span class="dt"><span class="from">Οδηγός</span><b>${esc(g.title)}</b></span><span class="go" aria-hidden="true">→</span></a>`;
  const GUIDES = [
    { title: 'Πώς γίνονται μίλια οι πόντοι της κάρτας', src: ['alpha-premium'], body: [
      `Με την Aegean Bonus Visa Premium οι αγορές σου δίνουν πόντους Alpha Bonus: ${pr.pointsPerEuro[4]} πόντοι ανά € στους μεγάλους συνεργάτες, ${pr.pointsPerEuro[2]} σε άλλους συνεργάτες και ${pr.pointsPerEuro[1]} παντού αλλού.`,
      `Οι πόντοι γίνονται μίλια Miles+Bonus με αναλογία ${pr.convert.points} πόντοι = ${pr.convert.miles} μίλια, σε πολλαπλάσια των ${pr.convert.multipleOf}. Παράδειγμα: 400 πόντοι δίνουν 500 μίλια.`,
      `Το ετήσιο όριο είναι ${fmt(pr.annualCapPoints, 0)} πόντοι (${pr.capPeriod}) και οι πόντοι πρέπει να μετατραπούν εντός 12 μηνών από τη συγκέντρωση.`,
      'Η πιστωτική και η Debit έχουν άλλες αναλογίες που είναι ακόμη «προς έλεγχο» στη βάση.'] },
    { title: 'bp και EKO: από πόντους καυσίμων σε μίλια', src: ['ae-bp', 'ae-eko', 'bp-terms', 'eko-terms'], body: [
      `Οι πόντοι BPme και EKO Smile γίνονται μίλια 1:1, σε πακέτα ${bpc.packages.map((x) => fmt(x, 0)).join(' / ')} πόντων.`,
      `Στο bp παίρνεις ${D.fuel.pointsPerLitre['95']}, ${D.fuel.pointsPerLitre['98']} ή ${D.fuel.pointsPerLitre['100']} πόντους ανά λίτρο στα 95, 98 και 100 οκτάνια, μόνο για ολόκληρα λίτρα. Με 25 L στο 98 παίρνεις 50 πόντους, άρα το μικρότερο πακέτο των 2.000 πόντων θέλει 1.000 L στο 98.`,
      'Στο EKO παίρνεις 1 πόντο Smile ανά λίτρο σε Unleaded 95, Diesel EKONOMY και υγραέριο, 2 σε Premium 98 και Diesel Avio, 3 στο Racing 100, πάλι μόνο για ολόκληρα λίτρα και έως 2 συναλλαγές την ημέρα.',
      'Το όριο των 45.000 μιλίων τον χρόνο που αναφέρεται στις σελίδες αφορά την αντίστροφη κατεύθυνση: μίλια που γίνονται κουπόνι ή πόντοι EKO.'] },
    { title: 'Πώς να κρίνεις αν μια εξαργύρωση συμφέρει', src: ['ae-eko-promo'], body: [
      'Η αξία ανά 1.000 μίλια είναι: (τιμή με χρήματα − φόροι και τέλη που πληρώνεις με μίλια) ÷ μίλια × 1.000. Αν το αποτέλεσμα είναι αρνητικό, τα μίλια δεν εξοικονομούν χρήματα.',
      `Παράδειγμα από πραγματική προσφορά: στην προσφορά EKO του Οκτωβρίου 2026, ${fmt(eko.miles, 0)} μίλια δίνουν κουπόνι ${fmt(eko.voucherEur, 0)} €, δηλαδή ${eur(ekoV.valuePer1000)} ανά 1.000 μίλια, με χρήση μόνο σε υπηρεσίες EKO.`,
      'Η αξία δεν είναι σταθερή: αλλάζει με τον προορισμό, την ημερομηνία, τη διαθεσιμότητα και τα πρόσθετα κόστη, γι’ αυτό το εργαλείο «Αξία μιλίων» την υπολογίζει κάθε φορά για τα δικά σου στοιχεία.'] }
  ];
  function renderGuides() {
    $('gd_out').innerHTML = GUIDES.map((g, i) => `<article class="article" id="guide-${i}"><img class="gimg" src="assets/dest/${GCITY[i % GCITY.length]}.svg" width="480" height="300" alt="" loading="lazy"><h2>${esc(g.title)}</h2>${g.body.map((t) => `<p>${esc(t)}</p>`).join('')}<div class="meta"><span>Έλεγχος ${dmy(D.rulesChecked)}</span><span>Πηγές: ${srcLinks(g.src)}</span></div></article>`).join('');
  }

  /* ---- εκκίνηση ---- */
  showTab(); renderHome(); renderGuides(); renderCalc(); renderConvert(); renderValue(); renderCompare(); renderGoal(); renderOffers(); renderPartners(); renderStatus();
  /* Ο browser μπορεί να «θυμηθεί» παλιές επιλογές (πίσω/επαναφόρτωση καρτέλας) χωρίς να στείλει events.
     Ξαναγεμίζουμε συνεργάτες/κάρτες για τις τρέχουσες τιμές και ξαναζωγραφίζουμε. */
  function resync() {
    [['c_bank', cardSel, 'c'], ['q_bank', $('q_card'), 'q']].forEach(([b, cs]) => { const keep = cs.value; fillCards($(b), cs); if ([...cs.options].some((o) => o.value === keep)) cs.value = keep; });
    [['c_pcat', partnerSel], ['q_pcat', $('q_partner')]].forEach(([c, ps]) => { const keep = ps.value; fillPartners($(c), ps, [...ps.options].some((o) => o.value === keep) ? keep : undefined); });
    hotelMode('q', val('q_pcat') === 'Ξενοδοχεία');
    renderCalc(); renderConvert(); renderValue(); renderGoal();
  }
  window.addEventListener('pageshow', () => setTimeout(resync, 0));
  /* Εγγραφή newsletter (+ προαιρετικά «Θέλω ειδοποιήσεις») μέσα στο site.
     Η φόρμα στέλνεται στο Brevo σε κρυφό iframe (ένα ανά λίστα), οπότε ο χρήστης μένει στο tileei.gr.
     Στην αρχική φαίνεται πάντα· στα εργαλεία εμφανίζεται κάτω από το αποτέλεσμα μετά τον πρώτο υπολογισμό. */
  const SIB = {
    nl: ['sib_nl', 'https://54914687.sibforms.com/serve/MUIFAN72yRDcIxaYvBpF7AZ0sZ-RzGZuyOQmgeixCl3oDcYdeJjcHMK5TxPC0a6eobY2kv9M_SJ0a7wgzL2jwMUVNU9jnACXt33EjDwT_r3VC_mk6V1Btai9Hzkj754Q9ccCC9SE5vakmE9_K39kKcLTKQUz9Squ3GcMcBv3pHjeyGI8GM9zmZZdV199bp7k-dtUWiKHnb_DD3zVmA=='],
    al: ['sib_al', 'https://54914687.sibforms.com/serve/MUIFALAVbUh3xB0Iq5pGamMcaktV4lClqGgdZJ4Zdgh_OV1C90dj28BudmnyV0w3QgW7Q-yTled8_VjWFgs9S9W8t-uYeOkBbu9t5fSZ_ssCMwH-WVjJrW6KoeXPb9waQh5MhTpIsVuFxriRRJb1CFY7IoX-feaadXGrGP-b-DkgIZZQV7aDuHL8gVM1Aeko_cLTujM_CcuuTBe-Kw==']
  };
  const SU_TITLE = {
    home: 'Μην χάνεις καμία προσφορά μιλίων ✈️',
    convert: 'Μην χάνεις καμία προσφορά μιλίων ✈️',
    calc: 'Θες να μαθαίνεις όταν ένας συνεργάτης δίνει διπλά μίλια;',
    value: 'Θες να μαθαίνεις πότε συμφέρει να εξαργυρώσεις;',
    goal: 'Θες βοήθεια να φτάσεις πιο γρήγορα στον στόχο σου;'
  };
  const SU_KEY = 'tlp.signup.v1';
  function sibPost(which, email) {
    const [target, url] = SIB[which];
    const f = document.createElement('form');
    f.method = 'POST'; f.action = url; f.target = target; f.hidden = true;
    [['EMAIL', email], ['email_address_check', ''], ['locale', 'el']].forEach(([n, v]) => { const i = document.createElement('input'); i.type = 'hidden'; i.name = n; i.value = v; f.appendChild(i); });
    document.body.appendChild(f); f.submit(); f.remove();
  }
  document.querySelectorAll('.signup').forEach((box) => {
    const ctx = box.dataset.ctx, id = box.id, home = ctx === 'home';
    box.innerHTML = `${home ? '' : `<button type="button" class="su-x" aria-label="Κλείσιμο">✕</button>`}
      <h2 class="su-h">${SU_TITLE[ctx]}</h2>
      <p class="su-p">Ένα email την εβδομάδα με νέες προσφορές και αλλαγές κανόνων, μόνο από επίσημες πηγές.</p>
      <form class="su-form" novalidate>
        <div class="su-row"><label class="sr-only" for="${id}_e">Το email σου</label>
          <input id="${id}_e" type="email" inputmode="email" autocomplete="email" required placeholder="Το email σου">
          <button type="submit" class="primary">${home ? 'Γράψου' : 'Θέλω'}</button></div>
        <label class="check su-al"><input type="checkbox" id="${id}_al"><span>🔔 Θέλω και <b>προσωπικές ειδοποιήσεις</b> για προσφορές που ταιριάζουν στην κάρτα μου, όταν ανοίξουν <span class="muted">(δεν υπάρχουν ακόμα· έτσι μας δείχνεις ότι αξίζει να τις φτιάξουμε)</span></span></label>
        <p class="su-err" role="alert" hidden>Γράψε ένα σωστό email.</p>
      </form>
      <p class="su-small">Η εγγραφή επιβεβαιώνεται με email (Brevo). Διαγραφή όποτε θέλεις · <a href="#privacy">Πολιτική απορρήτου</a></p>
      <p class="nl-ok" role="status" hidden></p>`;
    const form = box.querySelector('form'), email = box.querySelector('input[type=email]'), err = box.querySelector('.su-err'), ok = box.querySelector('.nl-ok');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.hidden = false; email.focus(); return; }
      err.hidden = true;
      const al = $(id + '_al').checked;
      form.querySelector('button').disabled = true;
      sibPost('nl', v);
      if (al) setTimeout(() => sibPost('al', v), 400);
      setTimeout(() => {
        form.hidden = true;
        ok.textContent = 'Σχεδόν έτοιμο! Σου στείλαμε ' + (al ? 'δύο email (ένα για το newsletter και ένα για τις ειδοποιήσεις)' : 'email') + ' για να επιβεβαιώσεις την εγγραφή. Δες και στα ανεπιθύμητα. Αν είσαι ήδη γραμμένος, δεν χρειάζεται να κάνεις τίποτα.';
        ok.hidden = false;
        store.set(SU_KEY, { done: true });
      }, 700);
    });
    const x = box.querySelector('.su-x');
    if (x) x.addEventListener('click', () => { box.hidden = true; store.set(SU_KEY, { dismissed: true }); });
  });
  /* Στα εργαλεία: εμφάνιση μετά τον πρώτο υπολογισμό, αν δεν έχει ήδη γραφτεί ή κλείσει το κουτί. */
  [['calc', 'calc'], ['convert', 'convert'], ['value', 'value'], ['goal', 'goal']].forEach(([panel, ctx]) => {
    const sec = $(panel), box = $('su_' + ctx);
    if (!sec || !box) return;
    sec.querySelector('.form').addEventListener('input', () => {
      const st = store.get(SU_KEY, {});
      if (!st.done && !st.dismissed) box.hidden = false;
    });
  });
})();
