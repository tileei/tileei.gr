/* ΤΙ ΛΕΕΙ; ΠΕΤΑΜΕ! — Πυρήνας υπολογισμών (καθαρές συναρτήσεις, χωρίς DOM).
 * Κάθε συνάρτηση επιστρέφει { ok, ... } ή { ok:false, error } και, όπου χρειάζεται, την «formula» που εμφανίζεται στον χρήστη.
 * Το αποτέλεσμα είναι «final» μόνο όταν ο κανόνας είναι επιβεβαιωμένος· αλλιώς «provisional» και δεν μπαίνει σε σύνολα. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TLP_CALC = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const num = (x) => (x === '' || x === null || x === undefined ? NaN : Number(x));
  const bad = (...v) => v.some((x) => !Number.isFinite(x) || x < 0);
  const r2 = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
  const g = (x) => Number(x).toLocaleString('el-GR', { maximumFractionDigits: 2 });
  const fail = (error) => ({ ok: false, error });
  const confidence = (...statuses) => (statuses.every((s) => s === 'confirmed') ? 'final' : 'provisional');

  /* 1. Μίλια από συναλλαγή με συνεργάτη Miles+Bonus. multiplier = πολλαπλασιαστής προσφοράς (1 = χωρίς προσφορά). */
  function earnMiles({ amount, rate, multiplier = 1, status = 'confirmed' }) {
    const a = num(amount), r = num(rate), m = num(multiplier);
    if (bad(a, r, m) || m === 0) return fail('Συμπλήρωσε ποσό και αναλογία.');
    const base = r2(a * r), total = r2(a * r * m);
    return { ok: true, base, bonus: r2(total - base), total, confidence: confidence(status),
      formula: `${g(a)} × ${g(r)}${m !== 1 ? ' × ' + g(m) : ''} = ${g(total)}` };
  }

  /* 2. Πόντοι Alpha Bonus από αγορά. Όταν η κατηγορία (4/2/1) δεν έχει επιβεβαιωθεί, δίνεται μόνο το κατώτατο όριο. */
  /* Alpha Bonus: πόντοι μόνο για ακέραια € και για αγορές άνω του 1 € (Όροι IV.1–IV.2). */
  const wholeEur = (a) => (a > 1 ? Math.floor(a) : 0);
  function alphaPoints({ amount, card, tier, tierStatus }) {
    const raw = num(amount);
    if (bad(raw)) return fail('Συμπλήρωσε ποσό.');
    const a = wholeEur(raw);
    const known = tier != null && tierStatus === 'confirmed';
    const ppe = known ? card.pointsPerEuro[tier] : card.pointsPerEuro[1];
    const points = r2(a * ppe);
    return { ok: true, points, pointsPerEuro: ppe, lowerBoundOnly: !known,
      confidence: confidence(card.status, known ? 'confirmed' : 'to_verify'),
      wholeEuros: a, dropped: raw !== a, monthlyCapHit: points > 20000,
      formula: `${g(a)} × ${g(ppe)} = ${g(points)}` };
  }

  /* 3. Μετατροπή πόντων Alpha σε μίλια (πολλαπλάσια των 4). */
  function alphaToMiles({ points, card }) {
    const p = num(points);
    if (bad(p)) return fail('Συμπλήρωσε πόντους.');
    const { points: bp, miles: bm, multipleOf } = card.convert;
    const usable = Math.floor(p / multipleOf) * multipleOf;
    const miles = (usable / bp) * bm;
    return { ok: true, usablePoints: usable, leftoverPoints: r2(p - usable), miles, confidence: confidence(card.status),
      formula: `${g(usable)} ÷ ${g(bp)} × ${g(bm)} = ${g(miles)}` };
  }

  /* 4. Πόντοι προγράμματος καυσίμου ανά λίτρο. Μετρούν μόνο ολόκληρα λίτρα. */
  function fuelPoints({ litres, grade, fuel, promo = false }) {
    const l = num(litres);
    if (bad(l)) return fail('Συμπλήρωσε λίτρα.');
    const whole = fuel.wholeLitresOnly ? Math.floor(l) : l;
    const promoOn = !!(promo && fuel.promo && fuel.promo.applies.includes(grade));
    const ppl = promoOn ? fuel.promo.pointsPerLitre : fuel.pointsPerLitre[grade];
    if (ppl === undefined) return fail('Άγνωστος τύπος καυσίμου.');
    const points = whole * ppl;
    const status = promoOn ? fuel.promo.status : fuel.pointsStatus;
    return { ok: true, wholeLitres: whole, pointsPerLitre: ppl, points, promoApplied: promoOn, confidence: confidence(status),
      formula: `${g(whole)} L × ${g(ppl)} = ${g(points)}` };
  }

  /* 5. Μετατροπή πόντων προγράμματος σε μίλια: βασική αναλογία, bonus %, πολλαπλάσια ή πακέτα, ελάχιστο/μέγιστο. */
  function convertPoints({ points, basePoints, baseMiles, multipleOf = 1, packages = null, bonusPct = 0, min = 0, max = null, status = 'confirmed' }) {
    const p = num(points), bp = num(basePoints), bm = num(baseMiles), b = num(bonusPct) || 0;
    if (bad(p, bp, bm, b) || bp === 0) return fail('Συμπλήρωσε πόντους και αναλογία.');
    if (p < min) return { ok: false, belowMin: true, error: `Κάτω από το ελάχιστο όριο (${min} πόντοι).` };
    let usable;
    if (packages) {
      const fit = packages.filter((k) => k <= p);
      if (!fit.length) return { ok: false, belowMin: true, error: `Το μικρότερο πακέτο είναι ${Math.min(...packages)} πόντοι.` };
      usable = Math.max(...fit);
    } else {
      usable = Math.floor(p / multipleOf) * multipleOf;
    }
    let capped = false;
    if (max != null && usable > max) { usable = max; capped = true; }
    const baseTotal = (usable / bp) * bm;
    const bonus = Math.floor(baseTotal * b / 100);
    const total = Math.floor(baseTotal) + bonus;
    return { ok: true, usablePoints: usable, leftoverPoints: r2(p - usable), baseMiles: Math.floor(baseTotal), bonusMiles: bonus, totalMiles: total, capped,
      confidence: confidence(status),
      formula: `${g(usable)} ÷ ${g(bp)} × ${g(bm)}${b ? ` + ${g(b)}% bonus` : ''} = ${g(total)}`,
      packageNote: packages ? 'Υπολογίστηκε το μεγαλύτερο ένα πακέτο που χωράει στους πόντους σου· περισσότερα πακέτα μπορούν να γίνουν χωριστά, εφόσον το επιτρέπουν οι όροι.' : '' };
  }

  /* 6. Αξία μιλίων: καθαρή εξοικονόμηση και αξία ανά 1.000 μίλια (ανά ταξιδιώτη και συνολικά). */
  function redemptionValue({ cashPrice, miles, taxes = 0, fees = 0, travelers = 1 }) {
    const p = num(cashPrice), m = num(miles), t = num(taxes) || 0, f = num(fees) || 0, k = num(travelers) || 1;
    if (bad(p, m, t, f, k) || m === 0 || k === 0) return fail('Συμπλήρωσε τιμή και μίλια.');
    const cash = t + f, saving = r2(p - cash), per1000 = r2((saving / m) * 1000);
    return { ok: true, cashRequired: r2(cash), netSaving: saving, valuePer1000: per1000, travelers: k,
      totalSaving: r2(saving * k), totalMiles: m * k, noSaving: saving <= 0,
      formula: `${g(p)} − ${g(cash)} = ${g(saving)} · ${g(saving)} ÷ ${g(m)} × 1.000 = ${g(per1000)}` };
  }

  /* 7. Σύγκριση επιλογών. criterion: 'value' (€/1.000 μίλια, φθίνουσα) ή 'cost' (συνολικό κόστος σε €, αύξουσα). */
  function compareOptions(options, criterion = 'value') {
    const rows = options.map((o) => {
      const v = redemptionValue({ cashPrice: o.cashPrice, miles: o.miles, taxes: o.taxes, fees: o.fees, travelers: 1 });
      return { ...o, valid: v.ok, netSaving: v.ok ? v.netSaving : null, valuePer1000: v.ok ? v.valuePer1000 : null, cashRequired: v.ok ? v.cashRequired : null };
    });
    const valid = rows.filter((r) => r.valid);
    valid.sort(criterion === 'cost' ? (a, b) => a.cashRequired - b.cashRequired : (a, b) => b.valuePer1000 - a.valuePer1000);
    return valid.concat(rows.filter((r) => !r.valid));
  }

  /* 8. Ταξιδιωτικός στόχος: έλλειμμα, πρόοδος και εκτίμηση μηνών (μόνο αν δοθεί ρυθμός). */
  function goalGap({ have, need, monthly }) {
    const h = num(have), n = num(need), mo = num(monthly);
    if (bad(h, n) || n === 0) return fail('Συμπλήρωσε διαθέσιμα και απαιτούμενα μίλια. Χωρίς επιβεβαιωμένη εξαργύρωση απαιτείται νέος έλεγχος.');
    const gap = Math.max(0, n - h);
    return { ok: true, gap, reached: gap === 0, progressPct: Math.min(100, Math.round((h / n) * 100)),
      months: gap > 0 && Number.isFinite(mo) && mo > 0 ? Math.ceil(gap / mo) : null };
  }

  /* 9. Κατάσταση προσφοράς σε συγκεκριμένη ημερομηνία (YYYY-MM-DD). Η ημέρα λήξης θεωρείται ακόμη ενεργή. */
  function offerStatus(offer, today) {
    if (!offer.sources || !offer.sources.length || offer.status !== 'confirmed') return 'to_verify';
    if (offer.end && offer.end < today) return offer.recurring ? 'recurring' : 'expired';
    if (offer.start && offer.start > today) return 'upcoming';
    return 'active';
  }

  /* 10. Αξία «κουπονιού»: ευρώ ανά 1.000 μίλια όταν η εξαργύρωση δίνει χρηματική αξία (π.χ. κουπόνι EKO). */
  function voucherValue({ miles, voucherEur }) {
    const m = num(miles), v = num(voucherEur);
    if (bad(m, v) || m === 0) return fail('Συμπλήρωσε μίλια και αξία κουπονιού.');
    return { ok: true, valuePer1000: r2((v / m) * 1000), formula: `${g(v)} ÷ ${g(m)} × 1.000 = ${g(r2((v / m) * 1000))}` };
  }

  /* 11. Μίλια από διαμονή σε ξενοδοχείο: σταθερά ανά νύχτα (per_night) ή κλίμακα ανά διαμονή (per_stay).
   * Αν οι νύχτες δεν καλύπτονται από την κλίμακα, δεν δίνεται αποτέλεσμα (gap). */
  function stayMiles({ nights, earn, status = 'confirmed' }) {
    const n = num(nights);
    if (!Number.isInteger(n) || n < 1) return fail('Συμπλήρωσε ακέραιο αριθμό νυχτών (1 ή περισσότερες).');
    if (earn.type === 'per_night') {
      const total = n * earn.miles;
      return { ok: true, total, confidence: confidence(status), formula: `${g(n)} νύχτες × ${g(earn.miles)} = ${g(total)}` };
    }
    if (earn.type === 'per_stay') {
      const t = earn.tiers.find((x) => n >= x.min && (x.max == null || n <= x.max));
      if (!t) return { ok: false, gap: true, error: `Οι όροι δεν ορίζουν μίλια για ${g(n)} νύχτες.` };
      const range = t.max == null ? `${g(t.min)}+ νύχτες` : t.min === t.max ? `${g(t.min)} νύχτες` : `${g(t.min)}–${g(t.max)} νύχτες`;
      return { ok: true, total: t.miles, confidence: confidence(status), formula: `${g(n)} νύχτες → κλίμακα ${range} = ${g(t.miles)}` };
    }
    return fail('Ο συνεργάτης δεν δίνει μίλια ανά διαμονή.');
  }

  /* 12. Λίτρα από ποσό και τιμή λίτρου (όταν ο χρήστης ξέρει μόνο πόσα € έβαλε). */
  function litresFromAmount({ amount, price }) {
    const a = num(amount), pr = num(price);
    if (bad(a, pr) || pr === 0) return fail('Συμπλήρωσε ποσό και τιμή λίτρου.');
    const litres = Math.floor((a / pr) * 100) / 100;
    return { ok: true, litres, formula: `${g(a)} € ÷ ${pr.toLocaleString('el-GR', { maximumFractionDigits: 3 })} €/L = ${g(litres)} L` };
  }

  /* 13. Πόντοι από αγορές στο κατάστημα του πρατηρίου (πόντοι ανά €, μόνο για προϊόντα με σήμανση). */
  function shopPoints({ amount, pointsPerEuro, status = 'confirmed' }) {
    const a = num(amount), r = num(pointsPerEuro);
    if (bad(a, r)) return fail('Συμπλήρωσε ποσό.');
    const points = r2(a * r);
    return { ok: true, points, confidence: confidence(status), formula: `${g(a)} € × ${g(r)} = ${g(points)}` };
  }

  /* 14. Απόσταση μεγάλου κύκλου σε αγγλικά μίλια. */
  function distanceMiles(a, b) {
    const R = 3958.8, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  /* 15. Μίλια εισιτηρίου AEGEAN ανά πτήση. Εσωτερικού: σταθερά. Εξωτερικού: πολλαπλάσιο × απόσταση, με ελάχιστο.
   * Το αποτέλεσμα είναι οριστικό όταν ισχύει σίγουρα το ελάχιστο· αλλιώς «περίπου», γιατί η απόσταση της AEGEAN μπορεί να διαφέρει. */
  function awardMiles({ from, to, cabin, chart }) {
    if (!from || !to || from.code === to.code) return fail('Διάλεξε δύο διαφορετικά αεροδρόμια.');
    if (!chart.domestic[cabin]) return fail('Άγνωστη θέση.');
    const dist = distanceMiles(from, to);
    if (from.country === 'GR' && to.country === 'GR') {
      const m = chart.domestic[cabin];
      return { ok: true, miles: m, domestic: true, distance: Math.round(dist), minApplied: false, confidence: confidence(chart.status), formula: `πτήση εσωτερικού = ${g(m)}` };
    }
    const { mult, min } = chart.international[cabin];
    const raw = mult * dist, minApplied = raw < min;
    const miles = minApplied ? min : Math.round(raw);
    const sure = raw <= min * 0.97;
    return { ok: true, miles, domestic: false, distance: Math.round(dist), minApplied, confidence: sure ? confidence(chart.status) : 'provisional',
      formula: `${mult} × ${g(Math.round(dist))} μίλια απόσταση = ${g(Math.round(raw))}${minApplied ? ` → ισχύει το ελάχιστο ${g(min)}` : ''}` };
  }

  /* Ολόκληρο ταξίδι: το Miles+Bonus είναι «ανά πτήση», άρα με αλλαγή στην Αθήνα πληρώνεται κάθε πτήση χωριστά. */
  function tripMiles({ from, to, cabin, roundTrip, chart, hub }) {
    if (!from || !to || from.code === to.code) return fail('Διάλεξε δύο διαφορετικά σημεία.');
    if (cabin !== 'eco' && cabin !== 'business') return fail('Διάλεξε Economy ή Business.');
    const legs = [];
    let alt = null;
    const aeLeg = (a, b) => { const r = awardMiles({ from: a, to: b, cabin, chart }); return { label: `${a.city} → ${b.city}`, airline: 'AEGEAN', miles: r.miles, confidence: r.confidence, formula: r.formula }; };
    if (to.roundTrip) { // συνεργάτης με πίνακα ζωνών
      if (from.code !== to.hub) legs.push(aeLeg(from, hub));
      const m = to.roundTrip[cabin] / 2, conflict = to.conflict && to.conflict[cabin];
      legs.push({ label: `${hub.city} → ${to.city}`, airline: to.airline, miles: m, confidence: conflict ? 'provisional' : confidence(to.status),
        formula: `ζώνη ${to.zone}: ${g(to.roundTrip[cabin])} μετ’ επιστροφής ÷ 2`, note: conflict || '' });
    } else if (from.code === 'ATH' || to.code === 'ATH' || !hub) {
      legs.push(aeLeg(from, to));
    } else {
      legs.push(aeLeg(from, hub), aeLeg(hub, to));
      alt = aeLeg(from, to).miles;
    }
    const oneWay = legs.reduce((s, l) => s + l.miles, 0), n = roundTrip ? 2 : 1;
    const conf = legs.every((l) => l.confidence === 'final') && !(to.roundTrip && legs.length > 1) ? 'final' : 'provisional';
    return { ok: true, legs, oneWay, total: oneWay * n, trips: n, altDirect: alt == null ? null : alt * n, confidence: conf,
      formula: legs.map((l) => g(l.miles)).join(' + ') + (legs.length > 1 ? ` = ${g(oneWay)}` : '') + (n === 2 ? ` · × 2 (πήγαινε-έλα) = ${g(oneWay * 2)}` : '') };
  }

  /* Μόνο πραγματικές τιμές που έχουν φανεί στην AEGEAN. Χωρίς παρατήρηση → δεν δίνουμε νούμερο. */
  function awardLookup({ from, to, roundTrip, have, observed }) {
    if (!from || !to || from === to) return fail('Διάλεξε δύο διαφορετικές πόλεις.');
    const o = observed.find((x) => (x.a === from && x.b === to) || (x.a === to && x.b === from));
    if (!o) return { ok: true, found: false };
    const n = roundTrip ? 2 : 1, min = o.oneWay[0] * n, max = o.oneWay[1] * n;
    const h = Number(have) > 0 ? Number(have) : null;
    return { ok: true, found: true, min, max, trips: n, taxes: roundTrip ? o.rtTaxes : null, dates: o.dates, checked: o.checked, sources: o.sources,
      short: h == null ? null : Math.max(0, min - h), enough: h == null ? null : h >= min };
  }

  /* Προσφορά πόντων Alpha Bonus ανά € (π.χ. 1€ = 100): ΑΝΤΙΚΑΘΙΣΤΑ τους κανονικούς πόντους, δεν προστίθεται.
     Μέχρι να βεβαιωθεί ότι ισχύει για τη συγκεκριμένη αγορά, μένει εκτός επιβεβαιωμένου συνόλου (provisional). */
  function alphaPromoPoints({ amount, pointsPerEuro, fixedPoints, normalPerEuro, card }) {
    const raw = num(amount), ppe = num(pointsPerEuro), fx = num(fixedPoints);
    if (bad(raw)) return fail('Συμπλήρωσε ποσό.');
    const a = wholeEur(raw);
    if (fx > 0) { // σταθεροί πόντοι προσφοράς (π.χ. 10.000 με ασφάλεια)· δεν ξέρουμε αν προστίθενται οι κανονικοί
      const cap0 = card && card.annualCapPoints ? card.annualCapPoints : null;
      return { ok: true, points: fx, extra: r2(fx - a * (normalPerEuro || 0)), fixed: true, overCap: cap0 != null && fx > cap0, cap: cap0, monthlyCapHit: fx > 20000, confidence: 'provisional', formula: `σταθεροί ${g(fx)} πόντοι προσφοράς` };
    }
    if (bad(ppe) || ppe <= 0) return fail('Συμπλήρωσε πόντους ανά €.');
    const points = r2(a * ppe), extra = r2(points - a * (normalPerEuro || 0));
    const cap = card && card.annualCapPoints ? card.annualCapPoints : null;
    return { ok: true, points, extra, overCap: cap != null && points > cap, cap, monthlyCapHit: points > 20000, confidence: 'provisional',
      formula: `${g(a)} × ${g(ppe)} = ${g(points)}` };
  }
  /* Ισχύει ακόμα η προσφορά καυσίμου; (ημερομηνία λήξης) */
  function promoValid(promo, today) { return !!promo && promo.status === 'confirmed' && (!promo.end || promo.end >= today); }

  /* Τιμή λίτρου: επίσημη από το δελτίο ή εκτίμηση (δική μας) για 98 / ενισχυμένο diesel. */
  function fuelPrice(key, fp) {
    if (fp.prices[key] != null) return { price: fp.prices[key], label: fp.labels[key], estimated: false };
    const e = fp.estimates && fp.estimates[key];
    if (!e) return null;
    const P = fp.prices;
    let price;
    if (e.rule === 'avg') price = (P[e.of[0]] + P[e.of[1]]) / 2;
    else if (e.rule === 'plusHalfGap') price = P[e.base] + (P[e.gap[1]] - P[e.gap[0]]) / 2;
    else return null;
    return { price: Math.round(price * 1000) / 1000, label: e.label, estimated: true, text: e.text };
  }

  /* Πλάνο στόχου: μίλια τον μήνα από την κάρτα και τα καύσιμα → μήνες μέχρι τον στόχο. Πάντα «περίπου». */
  function goalPlan({ have, need, card, spendOther, spendBig, fuelEur, fuel, fuelPricePerL }) {
    const h = num(have), n = num(need);
    if (bad(h, n) || n === 0) return fail('Συμπλήρωσε πόσα μίλια έχεις και πόσα χρειάζεσαι.');
    const so = num(spendOther) || 0, sb = num(spendBig) || 0, fe = num(fuelEur) || 0;
    if ([so, sb, fe].some((x) => x < 0)) return fail('Τα ποσά δεν μπορεί να είναι αρνητικά.');
    const gap = Math.max(0, n - h);
    let cardPoints = 0, cardMiles = 0, capMilesMonth = null, fuelTierKnown = true, otherProgram = null;
    const model = card ? card.model || 'alpha' : 'none';
    if (model === 'alpha') {
      const ppe = card.pointsPerEuro;
      const fuelTier = fuel && fuel.alphaTier != null && fuel.alphaTierStatus === 'confirmed' ? fuel.alphaTier : 1;
      fuelTierKnown = !fe || !fuel || fuelTier !== 1 || (fuel.alphaTier === 1);
      cardPoints = so * ppe[1] + sb * ppe[4] + fe * ppe[fuelTier];
      cardMiles = (cardPoints / card.convert.points) * card.convert.miles;
      capMilesMonth = card.annualCapPoints ? (card.annualCapPoints / 12 / card.convert.points) * card.convert.miles : null;
    } else if (model === 'direct') {
      if (card.earn.program === 'mb') cardMiles = (so + sb + fe) * card.earn.perEuro; else otherProgram = card.earn.program;
    }
    const capped = capMilesMonth != null && cardMiles > capMilesMonth;
    if (capped) cardMiles = capMilesMonth;
    let fuelPts = 0, litres = 0;
    if (fuel && fe > 0 && fuelPricePerL > 0) { litres = Math.floor(fe / fuelPricePerL); fuelPts = litres * fuel.pointsPerLitre['95']; }
    const perMonth = cardMiles + fuelPts;
    const months = gap > 0 && perMonth > 0 ? Math.ceil(gap / perMonth) : null;
    return { ok: true, gap, reached: gap === 0, progressPct: Math.min(100, Math.round((h / n) * 100)),
      cardPoints: Math.round(cardPoints), cardMiles: Math.round(cardMiles), fuelPts, litres, perMonth: Math.round(perMonth), months, capped, fuelTierKnown, otherProgram, confidence: 'provisional' };
  }

  function valueVerdict(valuePer1000, vb) {
    if (!Number.isFinite(valuePer1000)) return null;
    // 0 ή αρνητικό = δεν συμφέρει· αλλιώς η υψηλότερη ζώνη που φτάνει.
    const b = valuePer1000 <= 0 ? vb.bands[0] : vb.bands.filter((x) => valuePer1000 >= x.min).pop();
    return { ...b, pctOfBuy: Math.round((valuePer1000 / vb.buyPrice) * 100) };
  }

  return { goalPlan, fuelPrice, alphaPromoPoints, promoValid, valueVerdict, awardLookup, tripMiles, distanceMiles, awardMiles, litresFromAmount, shopPoints, stayMiles, earnMiles, alphaPoints, alphaToMiles, fuelPoints, convertPoints, redemptionValue, compareOptions, goalGap, offerStatus, voucherValue };
});
