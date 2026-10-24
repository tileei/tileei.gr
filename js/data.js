/* ΤΙ ΛΕΕΙ; ΠΕΤΑΜΕ! — Μοντέλο δεδομένων (schema v1)
 *
 * Οι τιμές καυσίμων ενημερώνονται αυτόματα από τον πρωινό έλεγχο (repo ti-leei-petame → GitHub Actions).
 * Κάθε κανόνας έχει: πηγή (sources[]), ημερομηνία ελέγχου (checked) και κατάσταση (status).
 *   status: 'confirmed'  = επιβεβαιωμένος από επίσημη πηγή, μπαίνει στα σύνολα
 *           'to_verify'  = προς έλεγχο, εμφανίζεται αλλά ΔΕΝ μπαίνει στα σύνολα
 *           'ended'      = έληξε / ανενεργός (μένει στο ιστορικό)
 *   check:  'reread'     = ξαναδιαβάστηκε η επίσημη σελίδα στις 22/10/2026
 *           'prior'      = καταγράφηκε σε προηγούμενο έλεγχο του project, δεν ξαναδιαβάστηκε
 *
 * Τρεις ξεχωριστές ροές, που δεν αθροίζονται αυτόματα:
 *   1. mb   : μίλια AEGEAN Miles+Bonus από συνεργάτη
 *   2. alpha: πόντοι Alpha Bank Bonus από κάρτα Aegean Bonus Visa (μετατρέπονται σε μίλια με όρια)
 *   3. ext  : πόντοι εξωτερικών προγραμμάτων (BPme, EKO Smile…) που μετατρέπονται σε πακέτα
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.TLP_DATA = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const AE = 'https://en.aegeanair.com/milesandbonus/partners/';
  const ALPHA = 'https://www.alpha.gr/en/personal/cards/pistotikes-kartes/pistotiki-karta-aegean-bonus-visa-premium';

  const sources = {
    'ae-partners':   { t: 'AEGEAN Miles+Bonus – Συνεργάτες', url: AE, pub: 'AEGEAN' },
    'alpha-bonus-terms': { t: 'Alpha Bank – Όροι προγράμματος Bonus (PDF)', url: 'https://www.alpha.gr/-/media/AlphaGr/pdf-files/bonus/Bonus_TC_GR.pdf', pub: 'Alpha Bank' },
    'alpha-bp': { t: 'Alpha Bank Bonus – bp (μεγάλος συνεργάτης)', url: 'https://www.alpha.gr/en/retail/Bonus/MajorPartners/bp', pub: 'Alpha Bank' },
    'alpha-premium': { t: 'Alpha Bank – Aegean Bonus Visa Premium', url: ALPHA, pub: 'Alpha Bank' },
    'ae-hertz':      { t: 'Miles+Bonus – Hertz', url: AE + 'rent-a-car/hertz/', pub: 'AEGEAN' },
    'ae-attica':     { t: 'Miles+Bonus – attica', url: AE + 'shopping/attica-department-stores/', pub: 'AEGEAN' },
    'ae-bp':         { t: 'Miles+Bonus – bp', url: AE + 'fuels/bp/', pub: 'AEGEAN' },
    'bp-terms':      { t: 'bp – Όροι BPme', url: 'https://www.bp.com/content/dam/bp/country-sites/el_gr/greece/retail/documents/BPme%20Terms%20and%20Conditions.pdf', pub: 'bp' },
    'ae-eko':        { t: 'Miles+Bonus – EKO', url: AE + 'fuels/eko/', pub: 'AEGEAN' },
    'bp-promo-98-100': { t: 'bp – Προσφορά 8 πόντων BPme/λίτρο σε 98 & 100', url: 'https://www.bp.com/el_gr/greece/retail/latest-offers/super-unleaded-98-ultimate-unleaded-100.html', pub: 'bp' },
    'alpha-kotsovolos': { t: 'Alpha Bank Bonus – Κωτσόβολος (προσφορές)', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/kotsovolos', pub: 'Alpha Bank' },
    'alpha-ab': { t: 'Alpha Bank Bonus – AB Βασιλόπουλος', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/AB-Basilopoulos', pub: 'Alpha Bank' },
    'alpha-vodafone': { t: 'Alpha Bank Bonus – Vodafone', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/vodafone', pub: 'Alpha Bank' },
    'alpha-hondos': { t: 'Alpha Bank Bonus – Hondos Center', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/hondos-center', pub: 'Alpha Bank' },
    'alpha-generali': { t: 'Alpha Bank Bonus – Generali', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/generali-asfalistiki', pub: 'Alpha Bank' },
    'alpha-fysiko': { t: 'Alpha Bank Bonus – Φυσικό Αέριο', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/fysiko-aerio-elliniki-etaireia-energeias', pub: 'Alpha Bank' },
    'alpha-box': { t: 'Alpha Bank Bonus – BOX', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/box-delivery', pub: 'Alpha Bank' },
    'alpha-attica': { t: 'Alpha Bank Bonus – attica', url: 'https://www.alpha.gr/el/idiotes/bonus/megaloi-sunergates/attica', pub: 'Alpha Bank' },
    'alpha-news': { t: 'Alpha Bank – Νέα του Bonus', url: 'https://www.alpha.gr/el/idiotes/bonus/bonus-news', pub: 'Alpha Bank' },
    'alpha-new-premium': { t: 'Alpha Bank – Νέα Aegean Bonus Visa Premium: 8.000 μίλια', url: 'https://www.alpha.gr/el/idiotes/bonus/bonus-news/bonus-pontoi-me-nea-xrusi-bonus-visa-i-aegean-bonus-visa-premium', pub: 'Alpha Bank' },
    'alpha-new-credit': { t: 'Alpha Bank – Νέα Aegean Bonus Visa: 5.000 μίλια', url: 'https://www.alpha.gr/el/idiotes/bonus/bonus-news/bonus-pontoi-me-nea-bonus-visa-i-aegean-bonus-visa', pub: 'Alpha Bank' },
    'alpha-intersport': { t: 'Alpha Bank – Διπλά Bonus στην INTERSPORT', url: 'https://www.alpha.gr/el/idiotes/bonus/bonus-news/kerdiste-dipla-me-bonus-stin-intersport', pub: 'Alpha Bank' },
    'alpha-kotsovolos-jun26': { t: 'Alpha Bank – Κωτσόβολος 1€ = 100 πόντοι Bonus (Ιούν 2026)', url: 'https://www.alpha.gr/el/idiotes/bonus/bonus-news/kotsovolos-weekendbomb-june26', pub: 'Alpha Bank' },
    'ae-eko-promo':  { t: 'Miles+Bonus – Προσφορά EKO Οκτ 2026', url: 'https://en.aegeanair.com/milesandbonus/news/2026/eko_promo_oct26/', pub: 'AEGEAN' },
    'ikea':          { t: 'IKEA Ελλάδας – Miles+Bonus', url: 'https://www.ikea.gr/en/ikea-partners-with-aegean-miles-bonus/', pub: 'IKEA' },
    'coffeeisland':  { t: 'Coffee Island – AEGEAN', url: 'https://www.coffeeisland.gr/en/pages/aegean', pub: 'Coffee Island' },
    'ae-marks':      { t: 'Miles+Bonus – Marks & Spencer', url: AE + 'shopping/marksandspencer/', pub: 'AEGEAN' },
    'ae-booking':    { t: 'Miles+Bonus – Booking.com', url: AE + 'accommodation/bookingcom/', pub: 'AEGEAN' },
    'ae-voyager':    { t: 'Miles+Bonus – Voyager', url: AE + 'shopping/voyager/', pub: 'AEGEAN' },
    'ae-dutyfree':   { t: 'Miles+Bonus – Hellenic Duty Free', url: AE + 'shopping/hellenic-duty-free-shops/', pub: 'AEGEAN' },
    'ae-samsonite':  { t: 'Miles+Bonus – Samsonite', url: AE + 'shopping/samsonite/', pub: 'AEGEAN' },
    'ae-mastiha':    { t: 'Miles+Bonus – Mastihashop', url: AE + 'shopping/mastihashop/', pub: 'AEGEAN' },
    'ae-ergon':      { t: 'Miles+Bonus – Ergon', url: AE + 'lifestyle/ergon-deli-restaurants/', pub: 'AEGEAN' },
    'ae-parking':    { t: 'Miles+Bonus – Στάθμευση Αεροδρομίου Αθηνών', url: AE + 'parking/aia/', pub: 'AEGEAN' },
    'ae-hellasdirect': { t: 'Miles+Bonus – Hellas Direct', url: AE + 'insurance-program/hellas-direct/', pub: 'AEGEAN' },
    'piraeus-mm':    { t: 'Τράπεζα Πειραιώς – Miles & More Visa', url: 'https://www.piraeusbank.gr/el/idiwtes/proionta-upiresies/kartes/pistwtikes/miles-and-more-visa', pub: 'Τράπεζα Πειραιώς' },
    'piraeus-mm-gold': { t: 'Τράπεζα Πειραιώς – Miles & More Visa Gold', url: 'https://www.piraeusbank.gr/el/idiwtes/proionta-upiresies/kartes/pistwtikes/miles-more-visa-gold', pub: 'Τράπεζα Πειραιώς' },
    'boc-terms': { t: 'Bank of Cyprus – Όροι Aegean Mastercard (PDF)', url: 'https://www.bankofcyprus.com/contentassets/76a50f07680242e691ea71d5a5e1a136/terms-aegean-scheme-en-final.pdf', pub: 'Bank of Cyprus' },
    'ae-boc':        { t: 'Miles+Bonus – Bank of Cyprus', url: AE + 'payment-cards/bank-of-cyprus/', pub: 'AEGEAN' },
    'alpha-credit':  { t: 'Alpha Bank – Aegean Bonus Visa (πιστωτική)', url: 'https://www.alpha.gr/en/personal/cards/pistotikes-kartes/pistotiki-karta-aegean-bonus-visa', pub: 'Alpha Bank' },
    'alpha-debit':   { t: 'Alpha Bank – Aegean Bonus Visa Debit', url: 'https://www.alpha.gr/en/personal/cards/xreostikes-kartes/xreostiki-karta-aegean-bonus-visa', pub: 'Alpha Bank' },
    'ae-buy-miles': { t: 'Miles+Bonus – Αγορά μιλίων', url: 'https://en.aegeanair.com/milesandbonus/how-to-earn/purchase-award-miles/', pub: 'AEGEAN' },
    'ae-search-2026-10-23': { t: 'Αναζήτηση εξαργύρωσης στην εφαρμογή AEGEAN (στιγμιότυπα 23/10/2026)', url: 'https://el.aegeanair.com/', pub: 'AEGEAN' },
    'ae-united-award': { t: 'Miles+Bonus – Εξαργύρωση σε πτήσεις United Airlines', url: AE + 'airlines/united_airlines/', pub: 'AEGEAN' },
    'ae-aegean-award': { t: 'Miles+Bonus – Εξαργύρωση σε πτήσεις AEGEAN', url: AE + 'airlines/aegean/', pub: 'AEGEAN' },
    'ae-terms':      { t: 'Miles+Bonus – Όροι προγράμματος', url: 'https://en.aegeanair.com/conditions-notices/milesbonus-terms-and-conditions/', pub: 'AEGEAN' },
    'fuelprices-daily': { t: 'Παρατηρητήριο Τιμών Υγρών Καυσίμων – Ημερήσιο δελτίο 22/10/2026', url: 'https://www.fuelprices.gr/files/deltia/IMERISIO_DELTIO_PANELLINIO_22_10_2026.pdf', pub: 'Υπουργείο Ανάπτυξης' },
    'eko-terms':     { t: 'EKO – Όροι EKO SMILE (16/03/2026)', url: 'https://www.eko.gr/wp-content/uploads/2026/03/Terms-and-Conditions-GR-2026.03.16.pdf', pub: 'EKO' },
    'alpha-major':   { t: 'Alpha Bank Bonus – Μεγάλοι συνεργάτες (4 πόντοι/€)', url: 'https://www.alpha.gr/en/personal/bonus/MajorPartners', pub: 'Alpha Bank' },
    'alpha-partners': { t: 'Alpha Bank Bonus – Συνεργάτες (2 πόντοι/€)', url: 'https://www.alpha.gr/en/personal/bonus/partners', pub: 'Alpha Bank' },
    'ae-revolut':    { t: 'Miles+Bonus – Revolut', url: AE + 'payment-cards/revolut/', pub: 'AEGEAN' },
    'dimocracy-wolt': { t: 'Δημοσίευμα (δευτερογενής πηγή) – Wolt', url: 'https://www.dimocracy.gr/oikonomia/aegean-to-milesbonus-synergazetai-me-to-wolt-eos-8-mines-dorean-syndromi-kai-milia/', pub: 'dimocracy.gr' }
  };

  /* Γενικοί κανόνες Alpha Bonus (Όροι προγράμματος, κεφ. IV), ξαναδιαβάστηκαν 23/10/2026. */
  const alphaRules = {
    sources: ['alpha-bonus-terms'], status: 'confirmed', check: 'reread', checked: '2026-10-23',
    wholeEuros: true, minAmountExclusive: 1,           // IV.1 «για κάθε ακέραιη μονάδα ευρώ», IV.2 «αξίας άνω του ενός (1) ευρώ»
    monthlyCapPoints: 20000,                           // IV.9 ανά Κάρτα, «μπορεί να μεταβληθεί κατά την κρίση της Τράπεζας»
    expiryYears: 2,                                    // IV.7 (πόντοι έκδοσης κάρτας: 1 έτος)
    capNote: 'Οι όροι βάζουν μέγιστο 20.000 πόντους τον μήνα ανά κάρτα. Δεν λένε ρητά αν μετράνε και οι πόντοι προσφορών.'
  };

  const programs = {
    mb:    { id: 'mb',    name: 'AEGEAN Miles+Bonus', unit: 'μίλια' },
    alpha: { id: 'alpha', name: 'Alpha Bank Bonus',   unit: 'πόντοι Bonus' },
    bpme:  { id: 'bpme',  name: 'BPme',               unit: 'πόντοι BPme' },
    eko:   { id: 'eko',   name: 'EKO Smile',          unit: 'πόντοι Smile' },
    mm:    { id: 'mm',    name: 'Miles & More (όμιλος Lufthansa)', unit: 'μίλια Miles & More' }
  };

  /* Τράπεζες με κάρτες που μετατρέπουν πόντους σε μίλια. Προστίθεται νέα τράπεζα μόνο όταν υπάρχει επίσημος κανόνας. */
  const banks = [
    { id: 'alpha',   name: 'Alpha Bank' },
    { id: 'piraeus', name: 'Τράπεζα Πειραιώς' },
    { id: 'boc',     name: 'Τράπεζα Κύπρου (Κύπρος)' },
    { id: 'other',   name: 'Άλλη τράπεζα' }
  ];
  /* Έλεγχος 22/10/2026: η επίσημη λίστα καρτών Miles+Bonus έχει Alpha Bank, Bank of Cyprus και Revolut.
   * Η Revolut ΔΕΝ ισχύει για λογαριασμούς Ελλάδας και Κύπρου (πηγή ae-revolut), γι' αυτό δεν εμφανίζεται. */

  /* Κάρτες Aegean Bonus Visa. Μόνο η Premium ξαναδιαβάστηκε στην επίσημη σελίδα της Alpha. Κάθε κάρτα ανήκει σε τράπεζα (bank). */
  const cards = [
    {
      id: 'premium', bank: 'alpha', model: 'alpha', name: 'Aegean Bonus Visa Premium', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      pointsPerEuro: { 4: 4, 2: 2, 1: 1 },
      convert: { points: 4, miles: 5, multipleOf: 4 },
      annualCapPoints: 200000, capPeriod: '1 Νοε – 31 Οκτ',
      notes: 'Οι πόντοι πρέπει να μετατραπούν εντός 12 μηνών από τη συγκέντρωση.',
      sources: ['alpha-premium']
    },
    {
      id: 'credit', bank: 'alpha', model: 'alpha', name: 'Aegean Bonus Visa (πιστωτική)', status: 'confirmed', check: 'reread', checked: '2026-10-23',
      pointsPerEuro: { 4: 4, 2: 2, 1: 1 },
      convert: { points: 4, miles: 4, multipleOf: 4 },
      annualCapPoints: 100000, capPeriod: '1 Νοε – 31 Οκτ',
      notes: 'Οι πόντοι μετατρέπονται μόνο σε πολλαπλάσια των 4 και μόνο όσοι συγκεντρώθηκαν τους τελευταίους 12 μήνες.',
      sources: ['alpha-credit']
    },
    {
      id: 'debit', bank: 'alpha', model: 'alpha', name: 'Aegean Bonus Visa Debit', status: 'confirmed', check: 'reread', checked: '2026-10-23',
      pointsPerEuro: { 4: 4, 2: 2, 1: 0.5 },
      convert: { points: 4, miles: 2, multipleOf: 4 },
      annualCapPoints: 50000, capPeriod: '1/11/2026 – 31/10/2027',
      notes: 'Στις υπόλοιπες αγορές δίνει 1 πόντο ανά 2 €. Όσοι είχαν το παλιό όριο των 15.000 πόντων το κρατούν έως 31/10/2026.',
      sources: ['alpha-debit']
    },
    /* model 'direct': η κάρτα δίνει απευθείας μίλια ανά € σε ένα πρόγραμμα (earn.program). */
    {
      id: 'piraeus-mm', bank: 'piraeus', model: 'direct', name: 'Miles & More Visa', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      earn: { program: 'mm', perEuro: 1 },
      notes: '1 μίλι ανά 1€ αγορών · 1 μίλι ανά 10€ για πληρωμές προς το Δημόσιο · 3.000 μίλια καλωσορίσματος με την πρώτη αγορά · συνδρομή δωρεάν τον 1ο χρόνο, μετά 40€.',
      sources: ['piraeus-mm']
    },
    {
      id: 'piraeus-mm-gold', bank: 'piraeus', model: 'direct', name: 'Miles & More Visa Gold', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      earn: { program: 'mm', perEuro: 1 },
      notes: '1 μίλι ανά 1€ αγορών · 1 μίλι ανά 10€ για πληρωμές προς το Δημόσιο · 5.000 μίλια καλωσορίσματος με την πρώτη αγορά · συνδρομή δωρεάν τον 1ο χρόνο, μετά 70€.',
      sources: ['piraeus-mm-gold']
    },
    {
      id: 'boc-aegean', bank: 'boc', model: 'direct', name: 'Aegean Mastercard', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      earn: { program: 'mb', perEuro: 0.5, aegeanPerEuro: 3 }, annualCapMiles: 100000,
      notes: 'Από 08/10/2025: 1 μίλι ανά 2€ σε Κύπρο και εξωτερικό · 3 μίλια ανά 1€ σε αγορές στο δίκτυο της AEGEAN · 3.000 μίλια καλωσορίσματος · έως 100.000 μίλια τον χρόνο ανά λογαριασμό κάρτας · συνδρομή 5€/μήνα. Η τράπεζα ΔΕΝ έχει δικό της πρόγραμμα συνεργατών.',
      excl: 'Δεν δίνουν μίλια: αναλήψεις, καταθέσεις, πάγιες εντολές, τραπεζικές χρεώσεις, φόροι και πληρωμές Δημοσίου, λογαριασμοί κοινής ωφέλειας, τυχερά παιχνίδια, μεταφορές χρημάτων.',
      sources: ['ae-boc', 'boc-terms'], checked: '2026-10-23'
    },
    {
      id: 'boc-aegean-business', bank: 'boc', model: 'direct', name: 'Aegean Mastercard Business', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      earn: { program: 'mb', perEuro: 1, aegeanPerEuro: 4 }, annualCapMiles: 100000,
      notes: 'Από 08/10/2025: 1 μίλι ανά 1€ σε Κύπρο και εξωτερικό · 4 μίλια ανά 1€ σε αγορές στο δίκτυο της AEGEAN · 4.000 μίλια καλωσορίσματος · έως 100.000 μίλια τον χρόνο ανά κάτοχο · συνδρομή 8€/μήνα. Η τράπεζα ΔΕΝ έχει δικό της πρόγραμμα συνεργατών.',
      excl: 'Δεν δίνουν μίλια: αναλήψεις, καταθέσεις, πάγιες εντολές, τραπεζικές χρεώσεις, φόροι και πληρωμές Δημοσίου, λογαριασμοί κοινής ωφέλειας, τυχερά παιχνίδια, μεταφορές χρημάτων.',
      sources: ['ae-boc', 'boc-terms'], checked: '2026-10-23'
    },
    /* model 'none': κάρτα χωρίς επιβεβαιωμένο κανόνα μιλίων. Μετρούν μόνο τα μίλια του συνεργάτη. */
    {
      id: 'other', bank: 'other', model: 'none', name: 'Κάρτα χωρίς πρόγραμμα μιλίων', status: 'confirmed', check: 'reread', checked: '2026-10-22',
      notes: 'Η κάρτα δεν δίνει μίλια σε αυτόν τον υπολογισμό.', sources: []
    }
  ];

  /* Αν οι ροές κάρτας και συνεργάτη αθροίζονται δεν έχει επιβεβαιωθεί από τους όρους. */
  const stacking = { status: 'to_verify', note: 'Δεν έχει επιβεβαιωθεί από επίσημο όρο ότι τα μίλια συνεργάτη και οι πόντοι κάρτας αθροίζονται σε κάθε συναλλαγή.' };

  /* Ροή 1: συνεργάτες Miles+Bonus. Όλες οι σελίδες ξαναδιαβάστηκαν στις 22/10/2026.
   * earn.type:
   *   per_eur    : μίλια ανά € (rate) — μπαίνει στον υπολογιστή με το ποσό
   *   per_night  : σταθερά μίλια ανά διανυκτέρευση (miles) — υπολογιστής με νύχτες
   *   per_stay   : μίλια ανά διαμονή με κλίμακα νυχτών (tiers) — υπολογιστής με νύχτες
   *   convert    : μετατροπή πόντων άλλου προγράμματος (βλ. conversions)
   *   per_action : σταθερά μίλια ανά ενέργεια (όχι ανά €)
   *   benefit    : μόνο εκπτώσεις/προνόμια, χωρίς μίλια
   * alphaTier: κατηγορία πόντων Alpha Bonus (4/2) όταν ο συνεργάτης είναι στη λίστα της Alpha· null = δεν βρέθηκε, μετρά το κατώτατο 1 πόντος/€. */
  const eur = (rate, unit = 'ευρώ') => ({ type: 'per_eur', rate, unit });
  const night = (miles) => ({ type: 'per_night', miles });
  const stay = (tiers) => ({ type: 'per_stay', tiers });
  const T3 = [{ min: 1, max: 2, miles: 500 }, { min: 3, max: 5, miles: 1000 }, { min: 7, max: null, miles: 1500 }];
  const T3_NOTE = 'Οι όροι λένε «πάνω από 6 νύχτες» για τα 1.500 μίλια· για ακριβώς 6 νύχτες δεν ορίζουν ποσό.';
  const P = (o) => {
    const r = Object.assign({ channels: '', cond: '', excl: '', redeem: '', place: '', region: 'Ελλάδα',
      /* Όσοι δεν είναι στη λίστα συνεργατών Bonus της Alpha (100 επιχειρήσεις, έλεγχος 22–23/10/2026) παίρνουν τον κανόνα «παντού αλλού»: 1 πόντος/€ (Debit: 1 ανά 2 €). */
      alphaTier: 1, alphaTierStatus: 'confirmed', alphaTierBasis: 'not-in-list', alphaTierChecked: '2026-10-23',
      status: 'confirmed', check: 'reread', checked: '2026-10-22' }, o);
    if (r.page) { sources['ae:' + r.id] = { t: 'Miles+Bonus – ' + r.name.split(' – ')[0], url: AE + r.page, pub: 'AEGEAN' }; }
    r.sources = (r.page ? ['ae:' + r.id] : []).concat(r.src || []);
    if (r.earn.type === 'per_eur') { r.rate = r.earn.rate; r.unit = r.earn.unit; }
    return r;
  };
  const A4 = { alphaTier: 4, alphaTierStatus: 'confirmed', alphaTierBasis: 'major' }, A2 = { alphaTier: 2, alphaTierStatus: 'confirmed', alphaTierBasis: 'partner' };

  const partners = [
    /* Ενοικίαση αυτοκινήτου */
    P({ id: 'hertz-fd', name: 'Hertz – ημερήσια ενοικίαση (Fly & Drive)', cat: 'Ενοικίαση αυτοκινήτου', earn: eur(10), page: 'rent-a-car/hertz/', src: ['alpha-major'], ...A4,
      channels: 'Δήλωση αριθμού μέλους κατά την κράτηση ή παραλαβή· στο hertz.com με τον κωδικό CDP της βαθμίδας.', cond: 'Ισχύει για κρατήσεις που ολοκληρώθηκαν από 19/01/2026.' }),
    P({ id: 'hertz-monthly', name: 'Hertz – FlexDrive / μηνιαία (30+ ημέρες)', cat: 'Ενοικίαση αυτοκινήτου', earn: eur(3), page: 'rent-a-car/hertz/', src: ['alpha-major'], ...A4, region: 'Ελλάδα, Κύπρος',
      channels: 'Δήλωση ταυτότητας στην έναρξη της ενοικίασης.', cond: 'Ελλάδα και Κύπρος· συγκέντρωση μόνο σε εγχώριους προορισμούς της AEGEAN.' }),
    P({ id: 'hertz-leasing', name: 'Autohellas Hertz Leasing', cat: 'Ενοικίαση αυτοκινήτου', earn: eur(1.5, 'ευρώ (μηνιαίο μίσθωμα χωρίς ΦΠΑ)'), page: 'rent-a-car/hertz/', src: ['alpha-major'], ...A4,
      channels: 'Συμβόλαια με σήμανση Miles+Bonus.', cond: 'Μόνο νέες συμβάσεις από 18/05/2022· τα μίλια πιστώνονται μετά την πλήρη εξόφληση του μηνιαίου τιμολογίου.' }),

    /* Εμπορικά */
    P({ id: 'attica', name: 'attica', cat: 'Εμπορικά', earn: eur(2), page: 'shopping/attica-department-stores/', src: ['alpha-major'], ...A4, alphaCond: 'Οι 4 πόντοι Alpha ισχύουν μόνο στα φυσικά καταστήματα attica (City Link, Golden Hall, Τσιμισκή, Mediterranean Cosmos).', alphaSrc: 'alpha-attica',
      channels: 'Επίδειξη αριθμού μέλους σε κάθε συναλλαγή στο κατάστημα ή εισαγωγή του στο atticadps.gr.' }),
    P({ id: 'attica-selections', name: 'Attica Selections', cat: 'Εμπορικά', earn: eur(2), page: 'shopping/attica-selections/', place: 'Navarino Dunes, Sani Resort, Αεροδρόμιο Αθηνών',
      channels: 'Μόνο στα 3 καταστήματα, με επίδειξη αριθμού μέλους πριν τη συναλλαγή.', cond: 'Navarino Dunes και Sani λειτουργούν Μάρτιο–Οκτώβριο.',
      redeem: '300 μίλια = 1€ (ελάχιστο 1.500 μίλια, έως 50% της αξίας)' }),
    P({ id: 'ikea', name: 'IKEA', cat: 'Εμπορικά', earn: eur(1), src: ['ikea', 'alpha-partners'], ...A2,
      channels: 'Καταστήματα και e-shop της IKEA.', excl: 'Εξαιρούνται πληρωμές τιμολογίων, υπηρεσίες και τα self check-out των εστιατορίων IKEA.',
      redeem: '300 μίλια = 1€ (ελάχιστο 1.500 μίλια· όχι για όλη την αξία της αγοράς)' }),
    P({ id: 'marks', name: 'Marks & Spencer', cat: 'Εμπορικά', earn: eur(3), page: 'shopping/marksandspencer/',
      channels: 'Καταστήματα στην Ελλάδα, με επίδειξη αριθμού μέλους πριν τη συναλλαγή.', redeem: '300 μίλια = 1€' }),
    P({ id: 'samsonite', name: 'Samsonite', cat: 'Εμπορικά', earn: eur(5), page: 'shopping/samsonite/', place: 'Αθήνα, Θεσσαλονίκη, Πειραιάς, Λάρισα',
      channels: 'Συμμετέχοντα καταστήματα στην Ελλάδα, με επίδειξη αριθμού μέλους πριν τη συναλλαγή.', redeem: '300 μίλια = 1€' }),
    P({ id: 'dutyfree', name: 'Hellenic Duty Free Shops', cat: 'Εμπορικά', earn: eur(2), page: 'shopping/hellenic-duty-free-shops/',
      channels: 'Στο ταμείο με κάρτα μέλους ή κάρτα επιβίβασης· και Reserve & Collect (shopdutyfree.com) έως 6 ώρες πριν την αναχώρηση.',
      cond: 'Τα μίλια μετρούν μόνο ως award μίλια.', redeem: '300 μίλια = 1€' }),
    P({ id: 'mastiha', name: 'Mastihashop', cat: 'Εμπορικά', earn: eur(10), page: 'shopping/mastihashop/', place: 'Αθήνα, Κηφισιά, Θεσσαλονίκη, Χίος',
      channels: 'Καταστήματα, με επίδειξη κάρτας πριν τη συναλλαγή.', excl: 'Εξαιρούνται πακέτα και προσφορές.', redeem: '200 μίλια = 1€ · 20% έκπτωση με την κάρτα' }),
    P({ id: 'voyager', name: 'Voyager-shop', cat: 'Εμπορικά', earn: eur(5), page: 'shopping/voyager/', place: 'e-shop και κατάστημα Αργυρούπολης',
      channels: 'Στο e-shop με αριθμό μέλους και κωδικό· στο κατάστημα με την κάρτα.', redeem: '200 μίλια = 1€' }),
    P({ id: 'yellowkorner', name: 'YellowKorner', cat: 'Εμπορικά', earn: eur(5), page: 'shopping/yellow-korner/', place: 'Αθήνα (Αγ. Ειρήνης, Golden Hall)',
      channels: 'Μόνο φυσικά καταστήματα, με την κάρτα.', redeem: '200 μίλια = 1€' }),
    P({ id: 'fiorissimo', name: 'Fiorissimo – Balloonissimo', cat: 'Εμπορικά', earn: eur(1), page: 'shopping/fiorissimo/',
      channels: 'Online για Αθήνα και αποστολές σε όλη την Ελλάδα (παραγγελία 1–3 εργάσιμες πριν).', cond: '10% έκπτωση σε επιλεγμένα προϊόντα, όχι μαζί με άλλη προσφορά.',
      excl: 'Αυθημερόν και διεθνείς αποστολές: μίλια ναι, έκπτωση όχι.', redeem: '200 μίλια = 1€ (online)' }),
    P({ id: 'gofas', name: 'Gofas Jewellery', cat: 'Εμπορικά', earn: eur(1), page: 'shopping/gofas-jewellery/', place: 'Αθήνα, Αεροδρόμιο, Θεσσαλονίκη, Μύκονος',
      channels: 'Καταστήματα, με την κάρτα πριν τη συναλλαγή.', excl: 'Προσφορές, εκπτώσεις και tax-free αγορές δεν δίνουν μίλια.', redeem: '200 μίλια = 1€' }),
    P({ id: 'cellier', name: 'Cellier', cat: 'Εμπορικά', earn: eur(4), page: 'shopping/cellier/', src: ['alpha-partners'], ...A2, place: 'e-shop και καταστήματα Αττικής',
      channels: 'Στο cellier.gr με αριθμό μέλους και κωδικό· στα καταστήματα με την κάρτα.', excl: 'Όχι μίλια σε προϊόντα με έκπτωση και σε μεταφορικά.', redeem: '200 μίλια = 1€ (όχι για μεταφορικά)' }),
    P({ id: 'antetokounbros', name: 'ANTETOKOUNBROS', cat: 'Εμπορικά', earn: eur(5), page: 'shopping/antetokounbros/', place: 'Αεροδρόμιο Αθηνών, Ερμού',
      channels: 'Καταστήματα, με αριθμό μέλους πριν την πληρωμή.', redeem: '300 μίλια = 1€' }),
    P({ id: 'designer-outlet', name: 'Designer Outlet Athens', cat: 'Εμπορικά', earn: { type: 'benefit', text: 'Έως 20% επιπλέον έκπτωση σε συμμετέχοντα καταστήματα. Δεν δίνει μίλια.' },
      page: 'shopping/designer_outlet_athens/', channels: 'Επικύρωση voucher στο Guest Services πριν τις αγορές.', excl: 'Δεν συνδυάζεται με άλλες εκπτώσεις· στις εκπτώσεις μόνο σε μη μειωμένα είδη.' }),

    /* Καφές και φαγητό */
    P({ id: 'coffeeisland', name: 'Coffee Island', cat: 'Καφές και φαγητό', earn: eur(2), src: ['coffeeisland'],
      channels: 'Μόνο εφαρμογή και coffeeisland.gr, με σύνδεση λογαριασμού Miles+Bonus.', cond: 'Δεν αναφέρονται τα φυσικά καταστήματα.', redeem: '200 μίλια = 1€' }),
    P({ id: 'wolt', name: 'Wolt (συνδρομητές Wolt+)', cat: 'Καφές και φαγητό', earn: eur(1), page: 'lifestyle/wolt/', region: 'Ελλάδα, Κύπρος',
      channels: 'Παραγγελίες σε wolt.com ή εφαρμογή, με αριθμό μέλους στο «Loyalty Cards».', cond: 'Μόνο με ενεργό Wolt+ και όταν εφαρμόζονται τα οφέλη Wolt+ στο checkout. 3 μήνες Wolt+ δωρεάν μέσω «My Coupons».' }),
    P({ id: 'ergon', name: 'Ergon Deli / εστιατόρια', cat: 'Καφές και φαγητό', earn: eur(1), page: 'lifestyle/ergon-deli-restaurants/', place: 'Αθήνα, Θεσσαλονίκη, Χαλκιδική, Αεροδρόμιο',
      channels: 'Με την κάρτα πριν τη συναλλαγή.', excl: 'Συναλλαγές με προσφορές δεν δίνουν μίλια.', redeem: '200 μίλια = 1€ (με ταυτότητα)' }),
    P({ id: 'balthazar', name: 'Balthazar', cat: 'Καφές και φαγητό', earn: eur(5), page: 'lifestyle/balthazar/', place: 'Αθήνα',
      channels: 'Με την κάρτα κατά την παραγγελία.', redeem: '200 μίλια = 1€' }),
    P({ id: 'athenee', name: 'Athénée', cat: 'Καφές και φαγητό', earn: { type: 'benefit', text: 'Έκπτωση 10% (Blue), 15% (Silver), 20% (Gold) σε κράτηση τραπεζιού. Δεν δίνει μίλια.' },
      page: 'lifestyle/athenee/', place: 'Αθήνα', channels: 'Με την κάρτα πριν την παραγγελία.' }),

    /* Στάθμευση, ασφάλειες, ενέργεια, ψυχαγωγία, αεροδρόμια */
    P({ id: 'parking', name: 'Στάθμευση Αεροδρομίου Αθηνών', cat: 'Στάθμευση', earn: eur(2), page: 'parking/aia/',
      channels: 'Κράτηση στην επίσημη σελίδα στάθμευσης του ΑΙΑ με αριθμό μέλους.', cond: 'Χωρίς αριθμό μέλους στην κράτηση δεν διεκδικούνται μίλια εκ των υστέρων. Πίστωση έως 7 ημέρες.',
      redeem: '300 μίλια = 1€ (ελάχιστο 1.500 μίλια)' }),
    P({ id: 'hellas-new', name: 'Hellas Direct – ασφάλεια αυτοκινήτου ή κατοικίας (πρώτο συμβόλαιο)', cat: 'Ασφάλειες', earn: eur(10), page: 'insurance-program/hellas-direct/', region: 'Ελλάδα (κατοικία και Κύπρος)',
      channels: 'Αγορά στο hellasdirect.gr / .com.cy με αριθμό μέλους στο πεδίο «Voucher Code».', cond: 'Μόνο την πρώτη φορά που ασφαλίζεις το όχημα ή την κατοικία.', excl: 'Δεν συνδυάζεται με άλλες προσφορές.' }),
    P({ id: 'hellas-renew', name: 'Hellas Direct – ασφάλεια αυτοκινήτου ή κατοικίας (ανανέωση)', cat: 'Ασφάλειες', earn: eur(5), page: 'insurance-program/hellas-direct/', region: 'Ελλάδα (κατοικία και Κύπρος)',
      channels: 'Αγορά στο hellasdirect.gr / .com.cy με αριθμό μέλους στο πεδίο «Voucher Code».', cond: 'Ανανέωση συμβολαίου.', excl: 'Δεν συνδυάζεται με άλλες προσφορές.' }),
    P({ id: 'ppc', name: 'ΔΕΗ (myDEI)', cat: 'Ενέργεια', earn: { type: 'per_action', text: 'Σταθερά μίλια ανά ενέργεια, έως 2.500: π.χ. 500 για πρώτη σύνδεση στο myDEI ή πάγια εντολή, 2.500 για αγορά myHome Plan / Maxima.', maxMiles: 2500 },
      page: 'energy-provider/ppc/', channels: 'Σύνδεση αριθμού μέλους στο «PPC myRewards Miles» του myDEI.', cond: 'Οικιακά ή επαγγελματικά τιμολόγια Γ21–Γ23. Ίδιο προϊόν μέσα σε 365 ημέρες δεν ξαναδίνει μίλια.',
      redeem: '300 μίλια = 1€ σε λογαριασμό ρεύματος (ελάχιστο 1.500, μόνο στο myDEI)' }),
    P({ id: 'pilot-center', name: 'The Pilot Center', cat: 'Ψυχαγωγία', earn: eur(5), page: 'culture/the-pilot-center/', place: 'Ηλιούπολη',
      channels: 'Online στο pilotcenter.gr με αριθμό μέλους ή στο κατάστημα με την κάρτα.', excl: 'Εξαιρούνται το ESHOP, προσφορές και εκπτώσεις.', redeem: '300 μίλια = 1€' }),
    P({ id: 'heathrow', name: 'Heathrow Rewards', cat: 'Αεροδρόμια', region: 'Ηνωμένο Βασίλειο', earn: { type: 'convert', text: '250 πόντοι Heathrow Rewards = 250 μίλια (πολλαπλάσια των 250, έως 10.000 πόντοι/ημέρα).', conv: 'heathrow' },
      page: 'shopping/heathrow-rewards/', cond: 'Ίδιο όνομα στους δύο λογαριασμούς. Πίστωση έως 15 ημέρες.' }),

    /* Υγεία και ευεξία */
    P({ id: 'polis-hammam', name: 'Polis Hammam – Polis Loutron', cat: 'Υγεία και ευεξία', earn: eur(10), page: 'health-beauty/polis-hammam/', place: 'Αθήνα, Θεσσαλονίκη, Πειραιάς',
      channels: 'Με την κάρτα πριν τη συναλλαγή.', redeem: '200 μίλια = 1€' }),
    P({ id: 'iaso', name: 'IASO Group', cat: 'Υγεία και ευεξία', earn: { type: 'per_action', text: '3.000 μίλια με ενεργοποίηση της προσφοράς AEGEAN στο πρόγραμμα WOW MOM· κατά τα άλλα εκπτώσεις, όχι μίλια ανά €.', maxMiles: 3000 },
      page: 'health-beauty/iaso-group/', channels: 'Με κάρτα μέλους και ταυτότητα στις κλινικές.' }),
    P({ id: 'hygeia', name: 'HYGEIA Group', cat: 'Υγεία και ευεξία', earn: { type: 'benefit', text: 'Εκπτώσεις και προνομιακές τιμές επισκέψεων (π.χ. 10% σε νοσηλεία). Δεν δίνει μίλια.' },
      page: 'health-beauty/hygeia/', channels: 'Ραντεβού τηλεφωνικά· κάρτα και ταυτότητα στην άφιξη.' }),
    P({ id: 'iatriko', name: 'Ιατρικό Αθηνών (Όμιλος)', cat: 'Υγεία και ευεξία', earn: { type: 'benefit', text: 'Εκπτώσεις (π.χ. 30% σε διαγνωστικές, 12% σε νοσηλεία). Δεν δίνει μίλια.' },
      page: 'health-beauty/iatriko/', channels: 'Με κάρτα μέλους και ταυτότητα.' }),
    P({ id: 'holmes', name: 'Holmes Place', cat: 'Υγεία και ευεξία', earn: { type: 'benefit', text: 'Δωρεάν ημέρες γυμναστηρίου για Silver (3) και Gold (5, με συνοδό). Δεν δίνει μίλια.' },
      page: 'health-beauty/holmes-place/', channels: 'Κουπόνι από τον λογαριασμό Miles+Bonus και κράτηση με τηλέφωνο.' }),

    /* Διαμονή */
    P({ id: 'booking', name: 'Booking.com', cat: 'Διαμονή', region: 'Παγκοσμίως', earn: eur(2, 'ευρώ (καθαρό ποσό χωρίς φόρους)'), page: 'accommodation/bookingcom/',
      channels: 'Κράτηση από τον σύνδεσμο της AEGEAN με αριθμό μέλους.', cond: 'Χωρίς φόρους και τέλη· σε άλλο νόμισμα, μετά τη μετατροπή σε €.' }),
    P({ id: 'marriott', name: 'Marriott Bonvoy', cat: 'Διαμονή', region: 'Παγκοσμίως', earn: { type: 'convert', text: '3 πόντοι Marriott Bonvoy = 1 μίλι· +5.000 μίλια για κάθε 60.000 πόντους ανά μεταφορά.', conv: 'marriott' },
      page: 'accommodation/marriott-bonvoy/', cond: 'Χρειάζεται λογαριασμός Marriott Bonvoy.' }),
    P({ id: 'accor', name: 'ALL – Accor Live Limitless', cat: 'Διαμονή', region: 'Παγκοσμίως', earn: { type: 'convert', text: '2.000 πόντοι ALL = 1.000 μίλια (ή αυτόματα 2 πόντοι = 1 μίλι).', conv: 'accor' },
      page: 'accommodation/leclubaccorhotels/', cond: 'Χρειάζεται λογαριασμός ALL και Miles+Bonus.' }),
    P({ id: 'coco-mat', name: 'COCO-MAT Hotels', cat: 'Διαμονή', place: 'Αθήνα', earn: night(250), page: 'accommodation/coco-mat/', redeemFrom: 27000 }),
    P({ id: 'electra', name: 'Electra Hotels & Resorts', cat: 'Διαμονή', earn: night(250), page: 'accommodation/electra-hotels-resorts/', redeemFrom: 43500, excl: 'Εξαιρείται το TERRA Café.' }),
    P({ id: 'wavemaker', name: 'Wavemaker Hospitality (Atlantica, MARE, Aphrodite Hills)', cat: 'Διαμονή', region: 'Ελλάδα, Κύπρος', earn: stay([{ min: 1, max: null, miles: 1500 }]),
      page: 'accommodation/wavemaker-hospitality/', status: 'to_verify', cond: 'Η σελίδα γράφει «1.500 μίλια στη διαμονή σου» χωρίς να ορίζει αν είναι ανά διαμονή, νύχτα ή ποσό.' }),
    P({ id: 'anatolia', name: 'Anatolia Hotels', cat: 'Διαμονή', place: 'Θεσσαλονίκη', earn: stay(T3), page: 'accommodation/anatolia-hotels-thessaloniki/', src: ['alpha-partners'], ...A2, redeemFrom: 18000,
      cond: T3_NOTE + ' Η περιγραφή της σελίδας αναφέρει 1.600 μίλια για 6 νύχτες.' }),
    P({ id: 'porto-palace', name: 'Porto Palace Hotel', cat: 'Διαμονή', place: 'Θεσσαλονίκη', earn: night(250), page: 'accommodation/porto-palace-hotel/', redeemFrom: 43500,
      excl: 'Όχι τιμές μέλους σε ΔΕΘ, AGROTICA και Πρωτοχρονιά.' }),
    P({ id: 'chandris-met', name: 'Chandris – The Met Hotel', cat: 'Διαμονή', place: 'Θεσσαλονίκη', earn: stay(T3), page: 'accommodation/chandris-hotels/', redeemFrom: 29000, cond: T3_NOTE }),
    P({ id: 'chandris-chios', name: 'Chandris – Chios Chandris Hotel', cat: 'Διαμονή', place: 'Χίος',
      earn: stay([{ min: 1, max: 2, miles: 300 }, { min: 3, max: 3, miles: 400 }, { min: 4, max: 4, miles: 500 }, { min: 6, max: null, miles: 800 }]), page: 'accommodation/chandris-hotels/', redeemFrom: 21000,
      cond: 'Οι όροι λένε «πάνω από 5 νύχτες» για τα 800 μίλια· για ακριβώς 5 νύχτες δεν ορίζουν ποσό.' }),
    P({ id: 'kydon', name: 'Kydon, The Heart City Hotel', cat: 'Διαμονή', place: 'Χανιά', earn: night(250), page: 'accommodation/kydon/', redeemFrom: 33000 }),
    P({ id: 'st-george', name: 'St George Lycabettus', cat: 'Διαμονή', place: 'Αθήνα', earn: night(250), page: 'accommodation/st-george-lycabettus-boutique-hotel/', redeemFrom: 24000 }),
    P({ id: 'donkey', name: 'Donkey Hotels & Resorts', cat: 'Διαμονή', earn: eur(2, 'ευρώ διαμονής'), page: 'accommodation/donkey-hotels-resorts/', redeemFrom: 20000,
      cond: 'Στο Semiramis (Αθήνα) διπλά μίλια για διαμονές Παρασκευή–Κυριακή.' }),
    P({ id: 'tor', name: 'TOR Hotel Group (City Hotel, The Excelsior)', cat: 'Διαμονή', place: 'Θεσσαλονίκη', earn: stay(T3), page: 'accommodation/tor-hotel-group/', redeemFrom: 18000, cond: T3_NOTE }),
    P({ id: 'sunrise', name: 'Sunrise Resort Hotel', cat: 'Διαμονή', place: 'Μόλυβος, Λέσβος', earn: eur(2, 'ευρώ διαμονής'), page: 'accommodation/sunrise-resort-hotel/', redeemFrom: 12000 }),
    P({ id: 'rodos-palace', name: 'Rodos Palace', cat: 'Διαμονή', place: 'Ρόδος', earn: night(250), page: 'accommodation/rodos-palace/', redeemFrom: 19000 }),
    P({ id: 'rodos-park', name: 'Rodos Park Suites & Spa', cat: 'Διαμονή', place: 'Ρόδος', earn: night(250), page: 'accommodation/rodos-park-suites-spa/', redeemFrom: 23600 }),
    P({ id: 'porto-veneziano', name: 'Porto Veneziano Hotel', cat: 'Διαμονή', place: 'Χανιά', earn: night(250), page: 'accommodation/porto-veneziano/', redeemFrom: 32385 }),
    P({ id: 'perianth', name: 'Perianth Hotel', cat: 'Διαμονή', place: 'Αθήνα', earn: night(250), page: 'accommodation/perianth-hotel/', redeemFrom: 30000 }),
    P({ id: 'mediterranean', name: 'Mediterranean Hotel', cat: 'Διαμονή', place: 'Ρόδος', earn: night(250), page: 'accommodation/mediterranean-hotel-rhodes/', redeemFrom: 14000 }),
    P({ id: 'makedonia-palace', name: 'Makedonia Palace', cat: 'Διαμονή', place: 'Θεσσαλονίκη', earn: night(250), page: 'accommodation/makedonia-palace-hotel/', redeemFrom: 32000 }),
    P({ id: 'kriti', name: 'Kriti Hotel', cat: 'Διαμονή', place: 'Χανιά', earn: night(250), page: 'accommodation/kriti-hotel/', redeemFrom: 14500 }),
    P({ id: 'heliotrope', name: 'Heliotrope Boutique Hotels', cat: 'Διαμονή', place: 'Μυτιλήνη', earn: night(250), page: 'accommodation/heliotrope-hotel/', redeemFrom: 13000 }),
    P({ id: 'epirus-palace', name: 'Epirus Palace', cat: 'Διαμονή', place: 'Ιωάννινα', earn: night(250), page: 'accommodation/epirus-palace-hotel/', redeemFrom: 14500 }),
    P({ id: 'elena', name: 'Elena Hotel', cat: 'Διαμονή', place: 'Μύκονος', earn: night(250), page: 'accommodation/elena-hotel/', redeemFrom: 20000 }),
    P({ id: 'elysion', name: 'Elysion Hotel', cat: 'Διαμονή', place: 'Μυτιλήνη', earn: night(250), page: 'accommodation/elysion-hotel/', redeemFrom: 18000,
      excl: 'Δωρεάν διαμονές, ειδικές εκπτωτικές τιμές και εταιρικές συμφωνίες δεν δίνουν μίλια.' }),
    P({ id: 'divani', name: 'Divani Collection Hotels', cat: 'Διαμονή', earn: night(250), page: 'accommodation/divani-collection-hotels/', redeemFrom: 54000, status: 'to_verify',
      cond: 'Η σελίδα γράφει 250 μίλια ανά νύχτα, αλλά η περιγραφή της αναφέρει ότι τα μίλια ξεκινούν από τη 2η νύχτα.' }),
    P({ id: 'domotel', name: 'Domotel Hotels & Resorts', cat: 'Διαμονή', earn: stay(T3), page: 'accommodation/domotel-hotels-resorts/', redeemFrom: 19000, cond: T3_NOTE + ' Δεν ισχύει για το Domotel Neve.' }),
    P({ id: 'domotel-neve', name: 'Domotel Neve', cat: 'Διαμονή', earn: eur(2, 'ευρώ διαμονής'), page: 'accommodation/domotel-hotels-resorts/' }),
    P({ id: 'best-western-rhodes', name: 'Best Western Plaza Hotel', cat: 'Διαμονή', place: 'Ρόδος', earn: night(250), page: 'accommodation/best-western-plaza-rhodes/', redeemFrom: 12000 }),
    P({ id: 'athenaeum', name: 'Athenaeum Hotels', cat: 'Διαμονή', place: 'Αθήνα', earn: night(250), page: 'accommodation/athenaeum-hotels/', redeemFrom: 16000 }),
    P({ id: 'ariti', name: 'Ariti Grand Hotel', cat: 'Διαμονή', place: 'Κέρκυρα', earn: stay(T3), page: 'accommodation/ariti-hotel-corfu/', redeemFrom: 25200, cond: T3_NOTE }),
    P({ id: 'aristi', name: 'Aristi Mountain Resort & Villas', cat: 'Διαμονή', place: 'Ζαγόρι', earn: eur(2, 'ευρώ διαμονής'), page: 'accommodation/aristi-mountain-resort/', redeemFrom: 40500 }),
    P({ id: 'aquila-atlantis', name: 'Aquila Atlantis Hotel', cat: 'Διαμονή', place: 'Ηράκλειο', earn: night(250), page: 'accommodation/aquila-atlantis-hotel/', redeemFrom: 20000 }),
    P({ id: 'amathus', name: 'Amathus Hotel', cat: 'Διαμονή', place: 'Λεμεσός', region: 'Κύπρος', earn: eur(2, 'ευρώ διαμονής'), page: 'accommodation/amathus-hotels/' })
  ];
  /* Ομάδες για την πλοήγηση. Ό,τι δεν αναφέρεται εδώ και ήταν «Διαμονή» πάει στα «Ξενοδοχεία». */
  const partnerCats = [
    { name: 'Μόδα, αξεσουάρ και αθλητικά', icon: 'shirt', ids: ['samsonite', 'gofas', 'antetokounbros', 'designer-outlet', 'attica-selections'] },
    { name: 'Ψώνια, σπίτι και εμπειρίες', icon: 'bag', ids: ['attica', 'marks', 'ikea', 'voyager', 'yellowkorner', 'fiorissimo', 'mastiha', 'cellier', 'pilot-center'] },
    { name: 'Φαγητό, καφές και ποτό', icon: 'cup', ids: ['coffeeisland', 'wolt', 'ergon', 'balthazar', 'athenee'] },
    { name: 'Ταξίδια και μετακίνηση', icon: 'car', ids: ['hertz-fd', 'hertz-monthly', 'hertz-leasing', 'parking', 'dutyfree', 'heathrow'] },
    { name: 'Ξενοδοχεία', icon: 'bed', ids: [] },
    { name: 'Κρατήσεις διαμονής', icon: 'key', ids: ['booking', 'marriott', 'accor'] },
    { name: 'Σπίτι, ενέργεια, ασφάλειες', icon: 'home', ids: ['ppc', 'hellas-new', 'hellas-renew'] },
    { name: 'Υγεία, ομορφιά, ευεξία', icon: 'heart', ids: ['polis-hammam', 'holmes', 'iaso', 'hygeia', 'iatriko'] },
    { name: 'Άλλα', icon: 'dots', ids: [] }
  ];
  const hotelAreas = [
    ['Αθήνα', ['coco-mat', 'st-george', 'perianth', 'athenaeum']],
    ['Θεσσαλονίκη', ['anatolia', 'porto-palace', 'chandris-met', 'tor', 'makedonia-palace']],
    ['Κρήτη', ['kydon', 'porto-veneziano', 'kriti', 'aquila-atlantis']],
    ['Ρόδος', ['rodos-palace', 'rodos-park', 'mediterranean', 'best-western-rhodes']],
    ['Λέσβος', ['sunrise', 'heliotrope', 'elysion']],
    ['Άλλα νησιά', ['elena', 'chandris-chios', 'ariti']],
    ['Ήπειρος', ['epirus-palace', 'aristi']],
    ['Κύπρος', ['amathus']],
    ['Όμιλοι σε πολλές περιοχές', ['electra', 'domotel', 'domotel-neve', 'divani', 'donkey', 'wavemaker']]
  ];
  partners.forEach((p) => {
    const c = partnerCats.find((g) => g.ids.includes(p.id));
    if (c) p.cat = c.name; else if (p.cat === 'Διαμονή') p.cat = 'Ξενοδοχεία';
    if (p.cat === 'Ξενοδοχεία') { const a = hotelAreas.find(([, ids]) => ids.includes(p.id)); p.area = a ? a[0] : 'Άλλες περιοχές'; }
  });

  /* Κοινοί κανόνες ξενοδοχείων της λίστας (εκτός Booking, Marriott, Accor) */
  const hotelRules = 'Τα μίλια πιστώνονται μόνο αν δείξεις την κάρτα Miles+Bonus στο check-in. Η εξαργύρωση γίνεται με online αίτημα από τον λογαριασμό σου τουλάχιστον 2 εργάσιμες πριν· ο φόρος διαμονής πληρώνεται στη ρεσεψιόν.';

  /* Αεροπορικές που εμφανίζονται στην επίσημη λίστα συνεργατών Miles+Bonus (ανάγνωση 22/10/2026).
   * Οι όροι συγκέντρωσης και εξαργύρωσης διαφέρουν ανά εταιρεία και δεν έχουν προστεθεί ακόμα. */
  const airlinePartners = {
    names: ['AEGEAN', 'Olympic Air', 'Lufthansa', 'Swiss', 'Austrian', 'Brussels Airlines', 'Turkish Airlines', 'United', 'Air Canada',
      'Singapore Airlines', 'All Nippon Airways', 'Emirates', 'TAP Air Portugal', 'ITA Airways', 'LOT', 'Croatia Airlines', 'Air China',
      'Air India', 'Air New Zealand', 'Asiana', 'Avianca', 'Copa Airlines', 'EgyptAir', 'Ethiopian Airlines', 'EVA Air', 'Shenzhen Airlines',
      'South African Airways', 'THAI'],
    status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae-partners'],
    note: 'Εμφανίζονται στην επίσημη λίστα συνεργατών. Οι κανόνες συγκέντρωσης και εξαργύρωσης ανά εταιρεία δεν έχουν προστεθεί ακόμα στο εργαλείο.'
  };

  /* Ροή 2: συνεργάτες μόνο Alpha Bonus (δεν υπάρχουν στη λίστα Miles+Bonus). */
  const alphaPartners = [
    /* alphaCond: όροι από τη σελίδα κάθε μεγάλου συνεργάτη στο alpha.gr (ξαναδιαβάστηκαν 23/10/2026). */
    { id: 'ab', name: 'AB Βασιλόπουλος', alphaCond: 'Καταστήματα και ab.gr. Εξαιρείται το κατάστημα Σεβαστουπόλεως 118 (Αμπελόκηποι). Στο ab.gr οι πόντοι υπολογίζονται στο τελικό ποσό της χρέωσης, την ημέρα παράδοσης.', alphaSrc: 'alpha-ab' },
    { id: 'vodafone', name: 'Vodafone', alphaCond: 'Σε καταστήματα Vodafone και στην εξόφληση λογαριασμού. Η πληρωμή λογαριασμού μέσω ΚΑΣ (αυτόματες πληρωμές) δίνει μόνο 1 πόντο/€.', alphaSrc: 'alpha-vodafone' },
    { id: 'kotsovolos', name: 'Κωτσόβολος', alphaSrc: 'alpha-kotsovolos' },
    { id: 'hondos', name: 'Hondos Center', alphaSrc: 'alpha-hondos' },
    { id: 'generali', name: 'Generali', alphaCond: 'Εξόφληση συμβολαίου με την κάρτα online στο generali.gr, με πάγια εντολή ή στη Generali. Μέσω ΚΑΣ μόνο 1 πόντος/€.', alphaSrc: 'alpha-generali' },
    { id: 'fysiko', name: 'Φυσικό Αέριο', alphaCond: 'Η εξόφληση λογαριασμού μέσω ΚΑΣ (αυτόματες πληρωμές) δίνει μόνο 1 πόντο/€.', alphaSrc: 'alpha-fysiko' },
    { id: 'box', name: 'BOX', alphaCond: 'Μόνο παραγγελίες φαγητού ή καφέ μέσω box.gr ή της εφαρμογής BOX. Οι πόντοι πιστώνονται μετά από 2 εργάσιμες.', alphaSrc: 'alpha-box' },
    { id: 'aegean', name: 'AEGEAN / Olympic Air (εισιτήρια)', mbNote: 'Τα μίλια Miles+Bonus της ίδιας της πτήσης δεν υπολογίζονται σε αυτό το εργαλείο· εδώ φαίνονται μόνο οι πόντοι Alpha Bonus της αγοράς εισιτηρίου.' }
  ].map((p) => Object.assign(p, { tier: 4, tierStatus: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['alpha-major', 'alpha-premium'] }))
  /* Οι υπόλοιποι συνεργάτες της λίστας Bonus (2 πόντοι/€), εκτός από τους μεγάλους, όσους είναι και συνεργάτες Miles+Bonus (IKEA, Cellier, Anatolia) και την ίδια την Alpha Bank.
   * Κάποια ονόματα στη σελίδα της Alpha φαίνονται μόνο ως λογότυπα· εδώ γράφονται όπως στη διεύθυνση της σελίδας τους. */
    .concat(Object.entries({
      'Μόδα, αξεσουάρ και αθλητικά': ['Babolat', 'Bloobox', 'Bodytalk', 'DKNY', 'DPAM', 'E-Tennis', 'Fila', 'Fila Sports Arena', 'Funky Buddha', 'Greek Fashion Room', 'Haralas',
        'Heaven of Brands', 'Hogan', 'Intersport', 'John Andy', 'Kalogirou', 'Kelly Shop', "Levi's", 'Margaritari', 'Megafitness', 'Michael Kors', 'Parabita', 'Puma',
        'Runner Store', 'Salvatore Ferragamo', 'Saucony', 'Terramare', "Tod's", 'Toi Moi', 'UGG', 'Under Armour'],
      'Ψώνια, σπίτι και εμπειρίες': ['Anemos', 'Bla Bla Toys', 'Funny Bunny', 'Kaktos (εκδόσεις)', 'Mothercare / Early Learning Centre', 'Notos', 'Pet City',
        'Skiadopoulos (φωτογραφικά)', 'The Ranch (πάρκο αναψυχής)', 'Toys-Shop.gr', 'Zizel My Shop', 'Zoulovits', 'Εφραίμογλου (χαλιά)'],
      'Φαγητό, καφές και ποτό': ['Andriopoulos', 'Cava Anthidis', 'Cava Drosia', 'Hard Rock Cafe', 'Kuzina', 'Mylonas Food Market', 'Napolitivo', 'TGI Fridays', 'Φυλλοσοφίες'],
      'Ταξίδια και μετακίνηση': ['Autovision (ΚΤΕΟ)', 'Caravel Travel', 'Ekdromi.gr', 'Fast Ferries', 'Harley-Davidson Athens', 'Lias Travel', 'Manessis Travel', 'Maroulis Travel', 'Minoan Lines', 'Velmar (συνεργείο αυτοκινήτων)'],
      'Ξενοδοχεία': ['Costa Ofrynio'],
      'Κρατήσεις διαμονής': ['Xenodoxeio.gr'],
      'Σπίτι, ενέργεια, ασφάλειες': ['Atlas Security', 'Ατλαντική Ένωση'],
      'Υγεία, ομορφιά, ευεξία': ['Beauty Princess', 'Biomedicin', 'Eye-Q Sykaras', 'Femme Fatale', 'Galerie de Beauté', 'Kiko Milano', 'Mediterraneo Hospital', 'Optika Occhio',
        'Pharma24.gr', 'Pharmacy 295', 'Sephora', 'Styloptic', 'Vardavas (οπτικά)', 'Φαρμακεία Αρσλάνογλου', 'Advance Pharmacies – Φαρμακεία Σύρου (Ανδριωτάκη-Πιτσικάκη)', 'Φαρμακείο Χρήστου Ποντική'],
      'Άλλα': ['Φιλανθρωπικά Ιδρύματα', 'The Green City (ανακύκλωση)']
    }).flatMap(([cat, names]) => names.map((name) => ({ cat, name })))
      .map((p, i) => Object.assign(p, { id: 'b2-' + i, tier: 2, tierStatus: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['alpha-partners', 'alpha-premium'] })));
  /* Κατηγορίες των συνεργατών Alpha: από την περιγραφή της σελίδας τους στο alpha.gr όπου ήταν ασαφής, αλλιώς από τη γνωστή δραστηριότητα της επιχείρησης. */
  const alphaNote = 'Η Alpha δίνει 4 πόντους/€ στους 11 μεγάλους συνεργάτες, 2 πόντους/€ στους άλλους συνεργάτες Bonus (λίστα 100 επιχειρήσεων) και 1 πόντο/€ παντού αλλού. Από τους συνεργάτες Miles+Bonus, στη λίστα Bonus βρέθηκαν μόνο Hertz, attica, bp (4), IKEA, Cellier και Anatolia (2). Οι υπόλοιποι, και η EKO, δεν είναι στη λίστα, άρα 1 πόντος/€ (έλεγχος 23/10/2026). Η κατηγορία 2 πόντων ισχύει για όλους τους «άλλους συνεργάτες» σύμφωνα με τη σελίδα της κάρτας.';

  /* Ροή 3: καύσιμα με πόντους εξωτερικού προγράμματος. */
  const fuel = {
    id: 'bp', name: 'bp (συμμετέχοντα πρατήρια)', program: 'bpme', conv: 'bpme',
    grades: [['95', 'Unleaded 95'], ['diesel', 'Diesel'], ['lpg', 'LPG Autogas'], ['98', 'Super Unleaded 98'], ['udiesel', 'Ultimate Diesel'], ['100', 'Ultimate Unleaded 100']], defGrade: '95',
    pointsPerLitre: { '95': 1, diesel: 1, lpg: 1, '98': 2, udiesel: 2, '100': 3 },
    priceKey: { '95': 'u95', diesel: 'diesel', lpg: 'lpg', '100': 'u100', '98': 'u98', udiesel: 'pdiesel' },
    shop: { pointsPerEuro: 2, status: 'confirmed', source: 'bp-terms',
            cond: 'Μόνο σε ειδικά προσδιορισμένα προϊόντα, σε πρατήρια με σχετική σήμανση. Οι όροι δεν απαριθμούν τα προϊόντα· ρώτα στο ταμείο.' },
    wholeLitresOnly: true,
    pointsStatus: 'confirmed', pointsSource: 'bp-terms',
    promo: { pointsPerLitre: 8, applies: ['98', '100'], days: 'Παρασκευή, Σάββατο, Κυριακή', end: '2026-11-29', status: 'confirmed', sources: ['bp-promo-98-100'], checked: '2026-10-23',
             note: 'Προσφορά bp: 8 πόντοι BPme ανά λίτρο σε Super Unleaded 98 και Ultimate Unleaded 100, κάθε Παρασκευή, Σάββατο και Κυριακή, έως 29/11/2026, με την κάρτα BPme. Οι 8 πόντοι είναι αντί για τους κανονικούς 2 ή 3.' },
    limits: 'Έως 2 συναλλαγές την ημέρα και 8 τον μήνα (όροι BPme).',
    alphaTier: 4, alphaTierStatus: 'confirmed', alphaShop: true, alphaSource: 'alpha-bp',
    alphaNote: 'Alpha: 4 πόντοι/€ σε «όλες τις αγορές μέσα στο πρατήριο» (καύσιμα και κατάστημα), μόνο στα πρατήρια bp με σήμα Bonus. Στους αυτόματους πωλητές 1 πόντος/€.',
    sources: ['ae-bp', 'bp-terms', 'alpha-premium'], check: 'reread', checked: '2026-10-22'
  };

  const eko = {
    id: 'eko', name: 'EKO (πρατήρια Ελλάδας)', program: 'eko', conv: 'eko-gr',
    grades: [['95', 'EKO Unleaded 95'], ['diesel', 'Diesel EKONOMY'], ['lpg', 'LPG Autogas'], ['98', 'EKO Premium 98'], ['avio', 'Diesel Avio'], ['100', 'EKO Racing 100']], defGrade: '95',
    pointsPerLitre: { '95': 1, diesel: 1, lpg: 1, '98': 2, avio: 2, '100': 3 },
    priceKey: { '95': 'u95', diesel: 'diesel', lpg: 'lpg', '100': 'u100', '98': 'u98', avio: 'pdiesel' },
    shop: { pointsPerEuro: 2, status: 'confirmed', source: 'eko-terms',
            cond: 'Μόνο σε ειδικά προσδιορισμένα προϊόντα, σε πρατήρια με σχετική σήμανση (όροι EKO SMILE, άρθρο 4.1). Οι όροι δεν απαριθμούν τα προϊόντα· ρώτα στο ταμείο.' },
    wholeLitresOnly: true, pointsStatus: 'confirmed', pointsSource: 'eko-terms', promo: null,
    limits: 'Έως 2 συναλλαγές την ημέρα και 8 τον μήνα. Επίσης 2 πόντοι/€ σε επιλεγμένα προϊόντα καταστήματος και 0,5 πόντος/kWh στη φόρτιση (όροι EKO SMILE).',
    alphaTier: 1, alphaTierStatus: 'confirmed', alphaTierBasis: 'not-in-list', alphaTierChecked: '2026-10-23',
    sources: ['ae:eko-fuel', 'eko-terms'], check: 'reread', checked: '2026-10-22'
  };
  sources['ae:eko-fuel'] = { t: 'Miles+Bonus – EKO', url: AE + 'fuels/eko/', pub: 'AEGEAN' };
  const fuels = [fuel, eko];

  /* Εξαργύρωση σε πτήσεις AEGEAN / Olympic Air: μίλια ανά πτήση (μονή διαδρομή), επίσημος κανόνας.
   * Εσωτερικού: σταθερά. Εξωτερικού: πολλαπλάσιο της απόστασης με ελάχιστο. Η μονάδα απόστασης δεν ορίζεται στη σελίδα·
   * το παράδειγμα Αθήνα–Μόναχο «944 miles» (upgradedpoints, 01/2026) αντιστοιχεί σε αγγλικά μίλια μεγάλου κύκλου. */
  const awardChart = {
    sources: ['ae-aegean-award', 'ae-terms'], status: 'confirmed', check: 'reread', checked: '2026-10-23',
    cabins: [['eco', 'Economy (Flex / Comfort)'], ['comfort', 'Economy (Comfort Flex / Comfort Plus)'], ['business', 'Business']],
    domestic: { eco: 5000, comfort: 7500, business: 10000 },
    international: { eco: { mult: 8, min: 7000 }, comfort: { mult: 10, min: 9000 }, business: { mult: 15, min: 15000 } },
    taxesNote: 'Τα μίλια καλύπτουν μόνο τον ναύλο. Φόροι, τέλη αεροδρομίου και επιβαρύνσεις πληρώνονται με χρήματα στην έκδοση· η AEGEAN δεν δημοσιεύει ποσά, φαίνονται στην κράτηση.',
    fees: { callCenter: 23, change: 23, noShow: 30 },
    distanceNote: 'Η απόσταση είναι υπολογισμός μας (μεγάλος κύκλος μεταξύ αεροδρομίων, σε αγγλικά μίλια). Η AEGEAN μπορεί να χρησιμοποιεί ελαφρώς διαφορετική απόσταση.'
  };
  /* Αεροδρόμια για τον υπολογισμό. Η λίστα δεν βεβαιώνει ότι υπάρχει απευθείας πτήση· αυτό ελέγχεται στην κράτηση. */
  const airports = [
    ['ATH', 'Αθήνα', 'GR', 37.9364, 23.9445], ['SKG', 'Θεσσαλονίκη', 'GR', 40.5197, 22.9709], ['HER', 'Ηράκλειο', 'GR', 35.3397, 25.1803],
    ['CHQ', 'Χανιά', 'GR', 35.5317, 24.1497], ['RHO', 'Ρόδος', 'GR', 36.4054, 28.0862], ['CFU', 'Κέρκυρα', 'GR', 39.6019, 19.9117],
    ['JTR', 'Σαντορίνη', 'GR', 36.3992, 25.4793], ['JMK', 'Μύκονος', 'GR', 37.4351, 25.3481],
    ['LCA', 'Λάρνακα', 'CY', 34.8751, 33.6249], ['FCO', 'Ρώμη', 'IT', 41.8003, 12.2389], ['MXP', 'Μιλάνο', 'IT', 45.6306, 8.7281],
    ['CDG', 'Παρίσι', 'FR', 49.0097, 2.5479], ['LHR', 'Λονδίνο', 'GB', 51.47, -0.4543], ['FRA', 'Φρανκφούρτη', 'DE', 50.0379, 8.5622],
    ['MUC', 'Μόναχο', 'DE', 48.3538, 11.7861], ['BER', 'Βερολίνο', 'DE', 52.3667, 13.5033], ['AMS', 'Άμστερνταμ', 'NL', 52.3105, 4.7683],
    ['BRU', 'Βρυξέλλες', 'BE', 50.9014, 4.4844], ['VIE', 'Βιέννη', 'AT', 48.1103, 16.5697], ['ZRH', 'Ζυρίχη', 'CH', 47.4582, 8.5555],
    ['MAD', 'Μαδρίτη', 'ES', 40.4983, -3.5676], ['BCN', 'Βαρκελώνη', 'ES', 41.2974, 2.0833], ['IST', 'Κωνσταντινούπολη', 'TR', 41.2753, 28.7519],
    ['TLV', 'Τελ Αβίβ', 'IL', 32.0114, 34.8867], ['CAI', 'Κάιρο', 'EG', 30.1219, 31.4056], ['DXB', 'Ντουμπάι', 'AE', 25.2532, 55.3657], ['NYC', 'Νέα Υόρκη', 'US', 40.6413, -73.7781]
  ].map(([code, city, country, lat, lon]) => ({ code, city, country, lat, lon }));
  /* Κάρτες προορισμών της αρχικής → αεροδρόμιο (null: η AEGEAN δεν πετά εκεί, εξαργύρωση μέσω συνεργάτη Star Alliance). */
  const destAirport = { rome: 'FCO', paris: 'CDG', london: 'LHR', newyork: 'NYC', tokyo: null, sydney: null };
  /* Πραγματικές τιμές εξαργύρωσης που είδαμε στην AEGEAN. Ο σταθερός πίνακας της σελίδας Miles+Bonus ΔΕΝ ταιριάζει
     με την κράτηση (π.χ. Αθήνα–Παρίσι: πίνακας ~10.500, κράτηση 15.000–25.000), άρα δεν χρησιμοποιείται για νούμερα.
     oneWay: [ελάχιστο, μέγιστο] μίλια ανά διαδρομή ανά άτομο, όπως φάνηκαν στο ημερολόγιο. rtTaxes: φόροι πήγαινε-έλα (€).
     Η θέση δεν φαινόταν στα στιγμιότυπα (προεπιλογή αναζήτησης). */
  /* Ετυμηγορία για την «Αξία μιλίων» (€ ανά 1.000 μίλια).
     Επίσημα σημεία αναφοράς: (α) η AEGEAN πουλάει μίλια 25 € / 1.000 (μέχρι 50.000 τον χρόνο) → πάνω από αυτό = εξαιρετική.
     (β) Όροι Miles+Bonus: τα μίλια για πρόσθετες υπηρεσίες εξαργυρώνονται «200 award miles per 1€» = 5 € / 1.000 → κάτω από αυτό
     παίρνεις λιγότερα από όσα θα έπαιρνες σε πρόσθετες υπηρεσίες. Μόνο το όριο 10 € είναι δικός μας πρακτικός κανόνας.
     Όροι, κεφ. 4: «Award Miles do not expire» → τα μίλια εξαργύρωσης δεν λήγουν (έλεγχος 23/10/2026). */
  const valueBands = {
    buyPrice: 25, buySource: 'ae-buy-miles', servicesPrice: 5, servicesSource: 'ae-terms', checked: '2026-10-23',
    bands: [
      { min: -Infinity, key: 'no', label: 'Δεν συμφέρει', text: 'Πληρώνεις περισσότερα με μίλια από ό,τι με χρήματα. Αγόρασε το εισιτήριο με χρήματα.' },
      { min: 0, key: 'low', label: 'Χαμηλή αξία', text: 'Γλιτώνεις λίγα για πολλά μίλια. Τα μίλια εξαργύρωσης δεν λήγουν, οπότε καλύτερα κράτα τα για άλλο ταξίδι.' },
      { min: 5, key: 'mid', label: 'Μέτρια αξία', text: 'Δεν είναι κακή, αλλά ψάξε και άλλες ημερομηνίες· συχνά θέλουν λιγότερα μίλια.' },
      { min: 10, key: 'good', label: 'Καλή εξαργύρωση', text: 'Τα μίλια σου πιάνουν καλή τιμή. Αξίζει να τα χρησιμοποιήσεις.' },
      { min: 25, key: 'top', label: 'Εξαιρετική εξαργύρωση', text: 'Τα μίλια σου αξίζουν εδώ περισσότερο απ’ όσο κοστίζει να τα αγοράσεις από την AEGEAN (25 € τα 1.000). Κλείσ’ το!' }
    ]
  };
  const observedAwards = [
    { a: 'CHQ', b: 'NYC', oneWay: [50000, 50000], rtTaxes: [551.18, 743.70], dates: '22/11 – 1/12/2026', checked: '2026-10-23', sources: ['ae-search-2026-10-23'] },
    { a: 'ATH', b: 'CDG', oneWay: [15000, 25000], rtTaxes: [104.23, 126.83], dates: '31/10 – 8/11/2026', checked: '2026-10-23', sources: ['ae-search-2026-10-23'] }
  ];
  /* Προορισμοί που δεν εξυπηρετεί η AEGEAN: εξαργύρωση σε συνεργάτη Star Alliance, με πίνακα ζωνών (όχι απόσταση).
     United, ζώνη «Ευρώπη & Β. Αφρική → Βόρεια Αμερική», μετ' επιστροφής: Economy 70.000, Business 110.000.
     Η σελίδα λέει ότι η μονή διαδρομή είναι η μισή τιμή, αλλά δείχνει και δεύτερο πίνακα μονής Business 40.000 → αντίφαση, «προς έλεγχο». */
  const partnerDests = [
    { code: 'US', city: 'ΗΠΑ (οποιαδήποτε πόλη)', airline: 'United Airlines', hub: 'ATH', sources: ['ae-united-award'], status: 'confirmed', check: 'reread', checked: '2026-10-23',
      zone: 'Ευρώπη & Β. Αφρική → Βόρεια Αμερική', roundTrip: { eco: 70000, business: 110000 },
      conflict: { business: 'Στην ίδια σελίδα υπάρχει και πίνακας μονής διαδρομής με Business 40.000. Δεν λέει πότε ισχύει ο καθένας.' },
      note: 'Η United πετά από την Αθήνα για ΗΠΑ. Η τιμή είναι ίδια για όλες τις πόλεις των ΗΠΑ (ζώνη). Οι θέσεις με μίλια δίνονται βάσει διαθεσιμότητας.' }
  ];

  /* Πανελλαδικές μέσες τιμές λιανικής (€/λίτρο, με ΦΠΑ), ημερήσιο δελτίο του Παρατηρητηρίου Τιμών Υγρών Καυσίμων.
   * Το δελτίο δεν δίνει τιμές για 98 οκτανίων ή premium diesel· εκεί ο χρήστης βάζει την τιμή της αντλίας. */
  const fuelPrices = {
    date: '2026-10-22', sources: ['fuelprices-daily'], checked: '2026-10-24',
    prices: { u95: 2.168, u100: 2.435, diesel: 2.125, lpg: 1.192 },
    labels: { u95: 'Αμόλυβδη 95', u100: 'Αμόλυβδη 100', diesel: 'Diesel κίνησης', lpg: 'Υγραέριο κίνησης' },
    /* Εκτιμήσεις ΔΙΚΕΣ ΜΑΣ (όχι επίσημες) για καύσιμα που δεν έχει το δελτίο. Απόφαση Νίκου 23/10/2026.
       98: μέσος όρος 95 και 100. Ενισχυμένο diesel: diesel + η μισή διαφορά 95→100. Πάντα «εκτίμηση», ο χρήστης τη διορθώνει. */
    estimates: {
      u98: { label: 'Αμόλυβδη 98', rule: 'avg', of: ['u95', 'u100'], text: 'μέσος όρος της 95 και της 100' },
      pdiesel: { label: 'ενισχυμένο Diesel', rule: 'plusHalfGap', base: 'diesel', gap: ['u95', 'u100'], text: 'τιμή Diesel + η μισή διαφορά 95 → 100' }
    }
  };

  /* Μετατροπές πόντων άλλων προγραμμάτων σε μίλια Miles+Bonus. */
  const conversions = [
    { id: 'alpha-premium', from: 'Alpha Bank Bonus – Aegean Bonus Visa Premium', to: 'mb', basePoints: 4, baseMiles: 5, multipleOf: 4, min: 4, max: null,
      annualCap: '200.000 πόντοι ανά περίοδο 1 Νοε – 31 Οκτ', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['alpha-premium'],
      note: 'Μετατροπή σε πολλαπλάσια των 4 πόντων.' },
    { id: 'alpha-credit', from: 'Alpha Bank Bonus – Aegean Bonus Visa (πιστωτική)', to: 'mb', basePoints: 4, baseMiles: 4, multipleOf: 4, min: 4, max: null,
      annualCap: '100.000 πόντοι ανά περίοδο 1 Νοε – 31 Οκτ', status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-credit'], note: 'Μετατροπή σε πολλαπλάσια των 4 πόντων, μόνο για πόντους των τελευταίων 12 μηνών.' },
    { id: 'alpha-debit', from: 'Alpha Bank Bonus – Aegean Bonus Visa Debit', to: 'mb', basePoints: 4, baseMiles: 2, multipleOf: 4, min: 4, max: null,
      annualCap: '50.000 πόντοι για 1/11/2026 – 31/10/2027 (το παλιό όριο 15.000 ισχύει έως 31/10/2026)', status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-debit'], note: 'Μετατροπή σε πολλαπλάσια των 4 πόντων.' },
    { id: 'bpme', from: 'BPme', to: 'mb', basePoints: 1, baseMiles: 1, multipleOf: 1, packages: [2000, 3000, 5000, 10000], min: 2000, max: null,
      annualCap: 'Δεν αναφέρεται στη σελίδα για αυτή την κατεύθυνση', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae-bp'],
      note: 'Διαθέσιμα πακέτα 2.000 / 3.000 / 5.000 / 10.000 πόντων. Το όριο των 45.000 μιλίων/έτος αφορά τη μετατροπή μιλίων σε κουπόνι.' },
    { id: 'eko-gr', from: 'EKO Smile (Ελλάδα)', to: 'mb', basePoints: 1, baseMiles: 1, multipleOf: 1, packages: [2000, 3000, 5000, 10000], min: 2000, max: null,
      annualCap: 'Δεν αναφέρεται στη σελίδα για αυτή την κατεύθυνση', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae-eko'],
      note: 'Διαθέσιμα πακέτα 2.000 / 3.000 / 5.000 / 10.000 πόντων. Το όριο των 45.000 μιλίων/έτος αφορά την αντίστροφη μετατροπή μιλίων σε πόντους EKO.' },
    { id: 'marriott', from: 'Marriott Bonvoy', to: 'mb', basePoints: 3, baseMiles: 1, multipleOf: 3, min: 3, max: null,
      annualCap: 'Δεν αναφέρεται', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae:marriott'],
      note: 'Επιπλέον 5.000 μίλια για κάθε 60.000 πόντους ανά μεταφορά (δεν περιλαμβάνονται αυτόματα στον υπολογισμό· πρόσθεσέ τα ως bonus αν μεταφέρεις ακριβώς 60.000).' },
    { id: 'accor', from: 'ALL – Accor Live Limitless', to: 'mb', basePoints: 2000, baseMiles: 1000, multipleOf: 2000, min: 2000, max: null,
      annualCap: 'Δεν αναφέρεται', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae:accor'],
      note: 'Μετατροπή ανά 2.000 πόντους. Με αυτόματη μετατροπή από το προφίλ ALL: 2 πόντοι = 1 μίλι.' },
    { id: 'heathrow', from: 'Heathrow Rewards', to: 'mb', basePoints: 250, baseMiles: 250, multipleOf: 250, min: 250, max: 10000,
      annualCap: 'Έως 10.000 πόντοι την ημέρα', status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae:heathrow'],
      note: 'Πολλαπλάσια των 250. Ίδιο όνομα στους δύο λογαριασμούς. Πίστωση έως 15 ημέρες.' }
  ];

  /* Προσφορές. Ληγμένες φεύγουν από την ενεργή προβολή και μένουν στο ιστορικό (βλ. offerStatus στο calc.js).
   * kind: 'earn_bonus' (περισσότερα μίλια) | 'redeem_deal' (καλύτερη εξαργύρωση) */
  const intersportId = (alphaPartners.find((p) => p.name === 'Intersport') || {}).id;
  const offers = [
    { id: 'alpha-new-premium-26', title: 'Νέα Aegean Bonus Visa Premium: 8.000 μίλια με την ενεργοποίηση', partner: 'Alpha Bank · AEGEAN Miles+Bonus', kind: 'card_welcome', cardId: 'premium', miles: 8000,
      desc: 'Αν βγάλεις νέα πιστωτική Aegean Bonus Visa Premium, παίρνεις 8.000 μίλια Miles+Bonus μόλις την ενεργοποιήσεις, και επιπλέον 3.000 πόντους Bonus. Οι 3.000 πόντοι ΔΕΝ μετατρέπονται σε μίλια.',
      start: null, end: '2026-11-30', endNote: 'Αίτηση έως 30/11/2026 · έκδοση κάρτας έως 7/12/2026',
      action: 'Αίτηση online ή σε κατάστημα της Alpha Bank, έκδοση έως 7/12/2026 και ενεργοποίηση.',
      limits: 'Οι 3.000 πόντοι Bonus πιστώνονται έως 20/12/2026 και δεν γίνονται μίλια. Η σελίδα δεν αναφέρει ελάχιστες αγορές.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-new-premium'] },
    { id: 'alpha-new-credit-26', title: 'Νέα Aegean Bonus Visa: 5.000 μίλια με την ενεργοποίηση', partner: 'Alpha Bank · AEGEAN Miles+Bonus', kind: 'card_welcome', cardId: 'credit', miles: 5000,
      desc: 'Αν βγάλεις νέα πιστωτική Aegean Bonus Visa, παίρνεις 5.000 μίλια Miles+Bonus με την ενεργοποίηση, και επιπλέον 3.000 πόντους Bonus. Οι 3.000 πόντοι ΔΕΝ μετατρέπονται σε μίλια.',
      start: null, end: '2026-11-30', endNote: 'Αίτηση έως 30/11/2026 · έκδοση κάρτας έως 7/12/2026',
      action: 'Αίτηση online ή σε κατάστημα της Alpha Bank, έκδοση έως 7/12/2026 και ενεργοποίηση.',
      limits: 'Οι 3.000 πόντοι Bonus πιστώνονται έως 20/12/2026 και δεν γίνονται μίλια.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-new-credit'] },
    { id: 'intersport-x2-oct26', title: 'INTERSPORT: διπλοί πόντοι Bonus στα καταστήματα', partner: 'INTERSPORT · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: intersportId, pointsPerEuro: 4,
      short: 'Μόνο στα φυσικά καταστήματα, έως 31/10/2026.',
      desc: 'Στα φυσικά καταστήματα INTERSPORT οι πόντοι Bonus γίνονται ×2: 2 × 2 = 4 πόντοι ανά €.',
      start: '2026-10-15', end: '2026-10-31', endNote: '15/10 – 31/10/2026',
      action: 'Αγορά σε φυσικό κατάστημα INTERSPORT με κάρτα Bonus. Όχι online.',
      limits: 'Δεν συνδυάζεται με άλλες προσφορές· οι πόντοι δεν πολλαπλασιάζονται περαιτέρω.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-intersport'] },
    { id: 'bp-98-100-weekend', title: 'bp: 8 πόντοι BPme ανά λίτρο σε 98 και 100', partner: 'bp', kind: 'fuel_points', calc: 'fuel:bp',
      desc: 'Κάθε Παρασκευή, Σάββατο και Κυριακή παίρνεις 8 πόντους BPme ανά λίτρο σε bp Super Unleaded 98 ή bp Ultimate Unleaded 100, αντί για 2 ή 3. Οι πόντοι BPme μετατρέπονται σε μίλια Miles+Bonus σε πακέτα.',
      start: null, end: '2026-11-29', endNote: 'Έως 29/11/2026, μόνο Παρ–Σαβ–Κυρ',
      action: 'Πλήρωσε σε συμμετέχον πρατήριο bp και δείξε την κάρτα BPme (ψηφιακή ή φυσική).',
      limits: 'Ισχύουν τα όρια του BPme: έως 2 συναλλαγές την ημέρα και 8 τον μήνα.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['bp-promo-98-100'] },
    { id: 'kotsovolos-x5-airport', title: 'Κωτσόβολος Αεροδρόμιο: πόντοι Bonus ×5 τις Κυριακές', partner: 'Κωτσόβολος · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'kotsovolos', pointsPerEuro: 20,
      short: 'Μόνο Κυριακή, μόνο στο κατάστημα του Αεροδρομίου Ελ. Βενιζέλος, έως 25/10/2026.',
      desc: 'Κάθε Κυριακή, στο κατάστημα Κωτσόβολος του Αεροδρομίου Ελ. Βενιζέλος, οι πόντοι Bonus γίνονται ×5: 4 × 5 = 20 πόντοι ανά €.',
      start: '2026-05-31', end: '2026-10-25', endNote: 'Κάθε Κυριακή έως 25/10/2026',
      action: 'Αγορά στο φυσικό κατάστημα του Αεροδρομίου, Κυριακή, με κάρτα Bonus.',
      limits: 'Οι προσφορές συλλογής «δεν συνδυάζονται με άλλες παράλληλες προσφορές συλλογής πόντων». Η επιχείρηση μπορεί να αλλάξει ή να ανακαλέσει την προσφορά.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-kotsovolos'] },
    { id: 'kotsovolos-x5-thess', title: 'Κωτσόβολος Τσιμισκή 43 (Θεσσαλονίκη): πόντοι Bonus ×5 τις Κυριακές', partner: 'Κωτσόβολος · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'kotsovolos', pointsPerEuro: 20,
      short: 'Μόνο Κυριακή, μόνο στο κατάστημα Τσιμισκή 43, έως 25/10/2026.',
      desc: 'Κάθε Κυριακή, στο κατάστημα Κωτσόβολος Τσιμισκή 43 στη Θεσσαλονίκη, οι πόντοι Bonus γίνονται ×5: 4 × 5 = 20 πόντοι ανά €.',
      start: '2026-05-31', end: '2026-10-25', endNote: 'Κάθε Κυριακή έως 25/10/2026',
      action: 'Αγορά στο φυσικό κατάστημα Τσιμισκή 43, Κυριακή, με κάρτα Bonus.',
      limits: 'Δεν συνδυάζεται με άλλες παράλληλες προσφορές συλλογής πόντων. Η επιχείρηση μπορεί να αλλάξει ή να ανακαλέσει την προσφορά.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-kotsovolos'] },
    { id: 'kotsovolos-neff', title: 'Κωτσόβολος: 1€ = 50 πόντοι σε εντοιχιζόμενες συσκευές NEFF', partner: 'Κωτσόβολος · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'kotsovolos', pointsPerEuro: 50,
      short: 'Μόνο για εντοιχιζόμενες συσκευές NEFF, έως 29/10/2026.',
      desc: 'Αγορά εντοιχιζόμενης συσκευής NEFF στον Κωτσόβολο με κάρτα Bonus της Alpha: 50 πόντοι ανά € αντί για 4.',
      start: null, end: '2026-10-29', endNote: 'Έως 29/10/2026',
      action: 'Αγορά εντοιχιζόμενης συσκευής NEFF με κάρτα Bonus.',
      limits: 'Δεν συνδυάζεται με άλλες παράλληλες προσφορές συλλογής πόντων. Η επιχείρηση μπορεί να αλλάξει ή να ανακαλέσει την προσφορά.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-kotsovolos'] },
    { id: 'generali-health', title: 'Generali: 10.000 πόντοι Bonus με ασφάλεια υγείας', partner: 'Generali · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'generali', fixedPoints: 10000,
      short: 'Online αγορά του προγράμματος Health Care, έως 31/10.',
      desc: 'Αν αγοράσεις online το πρόγραμμα υγείας Health Care της Generali και το πληρώσεις με κάρτα Bonus, παίρνεις 10.000 πόντους Bonus.',
      start: null, end: '2026-10-31', endNote: 'Η σελίδα γράφει «Έως 31.10» χωρίς έτος· η προσφορά εμφανίζεται ενεργή στις 23/10/2026',
      action: 'Online αγορά του Health Care στο generali.gr, εξόφληση με κάρτα Bonus.',
      limits: 'Η σελίδα δεν λέει αν δίνονται και οι κανονικοί 4 πόντοι/€ πάνω από τους 10.000. Μέσω ΚΑΣ μόνο 1 πόντος/€.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-generali'] },
    { id: 'generali-home', title: 'Generali: 15.000 πόντοι Bonus με ασφάλεια σπιτιού', partner: 'Generali · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'generali', fixedPoints: 15000,
      short: 'Home Insurance Superior με κάλυψη περιεχομένου, έως 30/10.',
      desc: 'Με ασφάλεια σπιτιού Home Insurance Superior που καλύπτει και το περιεχόμενο, πληρωμένη με κάρτα Bonus, παίρνεις 15.000 πόντους Bonus.',
      start: null, end: '2026-10-30', endNote: 'Η σελίδα γράφει «Έως 30.10» χωρίς έτος· η προσφορά εμφανίζεται ενεργή στις 23/10/2026',
      action: 'Απόκτηση Home Insurance Superior με κάλυψη περιεχομένου, εξόφληση με κάρτα Bonus.',
      limits: 'Η σελίδα δεν λέει αν δίνονται και οι κανονικοί 4 πόντοι/€ πάνω από τους 15.000.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-generali'] },
    { id: 'kotsovolos-100', title: 'Κωτσόβολος: 1€ = 100 πόντοι Alpha Bonus', partner: 'Κωτσόβολος · Alpha Bank Bonus', kind: 'alpha_points', alphaPartner: 'kotsovolos', pointsPerEuro: 100,
      recurring: true, recurringNote: 'Επαναλαμβάνεται κατά διαστήματα (π.χ. «Weekend Bomb»), συνήθως για λίγες ώρες. Τελευταία φορά που την ελέγξαμε: 13/6/2026 20:01 – 14/6/2026 23:59.',
      desc: 'Για αγορές online στο kotsovolos.gr με οποιαδήποτε κάρτα Bonus, 1 € δίνει 100 πόντους Alpha Bonus αντί για 4. Με κάρτα Aegean Bonus, οι πόντοι μετατρέπονται σε μίλια.',
      start: '2026-06-13', end: '2026-06-14', endNote: 'Τελευταία εμφάνιση',
      action: 'Αγορά μόνο online στο kotsovolos.gr, με κάρτα Bonus, μέσα στις ώρες της προσφοράς.',
      limits: 'Οι πόντοι «δεν πολλαπλασιάζονται περαιτέρω». Η μετατροπή σε μίλια μετράει στο ετήσιο όριο της κάρτας Aegean.',
      status: 'confirmed', check: 'reread', checked: '2026-10-23', sources: ['alpha-kotsovolos-jun26'] },
    { id: 'eko-oct26', title: 'EKO: μίλια σε πόντους Smile με καλύτερη ισοτιμία', partner: 'EKO', kind: 'redeem_deal',
      desc: 'Μετατροπή μιλίων σε πόντους EKO Smile με ειδική ισοτιμία: 2.100 μίλια = 1.250 πόντοι Smile = κουπόνι €10 για καύσιμα, προϊόντα καταστήματος, πλύσιμο και άλλες υπηρεσίες πρατηρίων EKO. Δεν περιλαμβάνει bonus μιλίων.',
      start: '2026-10-01', end: '2026-10-30', endNote: 'Έως 30/10/2026, 17:00 ώρα Ελλάδας',
      action: 'Στον λογαριασμό Miles+Bonus: «Μετατροπή μιλίων» → «Convert Miles to EKO Smile».',
      limits: 'Έως 45.000 μίλια τον χρόνο, ισοδύναμα με κουπόνια αξίας €150.',
      miles: 2100, voucherEur: 10,
      status: 'confirmed', check: 'reread', checked: '2026-10-22', sources: ['ae-eko-promo'] }
  ];

  return { schema: 1, rulesChecked: '2026-10-22', sources, programs, banks, cards, stacking, fuels, partners, partnerCats, hotelAreas, hotelRules, airlinePartners, alphaPartners, alphaNote, fuel, fuelPrices, awardChart, airports, destAirport, partnerDests, observedAwards, valueBands, conversions, offers, alphaRules };
});
