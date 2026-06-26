/**
 * ALL user-facing Hindi strings live here.
 * ─────────────────────────────────────────────────────────────────────────────
 * FAMILY: edit this file to correct Bundelkhandi words / local phrasing.
 * Nothing is scattered inline — change here, it updates everywhere.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Work-order status labels (raw token → Hindi; NEVER show raw tokens to users) ──
export const WO_STATUSES = {
  open:           'खुला',
  in_progress:    'चल रहा है',
  on_hold:        'रोक पर',
  completed:      'पूरा हुआ',
  pending_review: 'समीक्षा बाकी',   // worker submitted; awaiting supervisor
  partial:        'आंशिक',
  closed:         'बंद',
  cancelled:      'रद्द',
};

// Color classes per WO status (Tailwind)
export const WO_STATUS_COLORS = {
  open:           'bg-green-100 text-green-800',
  in_progress:    'bg-yellow-100 text-yellow-800',
  on_hold:        'bg-orange-100 text-orange-800',
  completed:      'bg-blue-100 text-blue-800',
  pending_review: 'bg-amber-100 text-amber-800',
  partial:        'bg-purple-100 text-purple-800',
  closed:         'bg-gray-100 text-gray-700',
  cancelled:      'bg-red-100 text-red-800',
};

// WO assignment / completion flow
export const WO_ACTIONS = {
  assign:             'सौंपो',
  assignTo:           'किसे सौंपें?',
  changeAssign:       'बदलो',
  assignedTo:         'सौंपा:',
  submitCompletion:   'काम पूरा हुआ',
  submitting:         'सबमिट हो रहा है…',
  closeWO:            'बंद करो',
  closing:            'बंद हो रहा है…',
  reopenWO:           'वापस भेजो',
  reopening:          'वापस हो रहा है…',
  cancelAssign:       'रद्द',
  pendingReviewNote:  'समीक्षा बाकी — सुपरवाइज़र बंद करेगा',
};

// ── App shell ─────────────────────────────────────────────────────────────────
export const APP_NAME        = 'निवोदिया फ़ार्म्स';
export const APP_TAGLINE     = 'Farm Management';

// ── Bottom nav / sidebar labels ───────────────────────────────────────────────
export const NAV = {
  crops:    'फसल',
  fields:   'खेत',
  expense:  'खर्चा',
  map:      'नक्शा',
};

// ── Season landing (फसल tab) ──────────────────────────────────────────────────
export const SEASONS = {
  prompt:          'कौन सी फसल देखनी है?',
  loading:         'लोड हो रहा है…',
  error:           'कुछ गड़बड़ हो गई।\nइंटरनेट चेक करो और दोबारा खोलो।',
  empty:           'कोई फसल नहीं मिली।',
  retry:           'फिर से कोशिश करो',
  cycleCount:      (n) => `${n} फसलें`,

  // Season display names (shown in cards)
  kharif:          'खरीफ',
  rabi:            'रबी',
  zaid:            'जायद',

  // Sub-labels for each season
  kharifSub:       'बरसात की फसल',
  rabiSub:         'जाड़े की फसल',
  zaidSub:         'गरमी की फसल',
};

// ── Season detail (stub for now) ──────────────────────────────────────────────
export const SEASON_DETAIL = {
  comingSoon:      'जल्द आ रहा है',
  back:            'वापस जाओ',
};

// ── Coming soon (stub screens) ────────────────────────────────────────────────
export const COMING_SOON = {
  heading:         'जल्द आ रहा है',
  body:            'यह हिस्सा अभी बन रहा है।',
};

// ── General / shared ──────────────────────────────────────────────────────────
export const GENERAL = {
  logout:          'बाहर निकलो',
  loading:         'लोड हो रहा है…',
  error:           'कुछ गड़बड़ हो गई।',
  salePending:     'बिक्री बाकी',
  voiceComingSoon: 'आवाज़ से जोड़ना — जल्द आ रहा है',
};

// ── Season detail — crops list ─────────────────────────────────────────────────
export const SEASON_DETAIL_CROPS = {
  back:            'सभी मौसम',
  cycleCount:      (n) => `${n} ${n === 1 ? 'किस्म' : 'किस्में'}`,
  prepHeading:     'खेत की तैयारी का खर्चा',
  prepTotal:       'कुल खर्चा',
  prepAllocated:   'फसलों में डाला',
  prepUnallocated: 'बिना फसल के',
  addCycle:        '+ नई फसल',
};

// ── Variety list (crop has >1 cycle) ──────────────────────────────────────────
export const VARIETY_LIST_STRINGS = {
  back:  'वापस',
  acres: (n) => `${n} एकड़`,
};

// ── Cycle detail (P&L screen) ─────────────────────────────────────────────────
export const CYCLE_DETAIL_STRINGS = {
  back:          'वापस',
  pnlTitle:      'मुनाफ़ा / नुकसान',
  revenue:       'आमदनी',
  cropCost:      'फसल का खर्चा',
  prepCost:      'तैयारी का खर्चा',
  profit:        'मुनाफ़ा',
  loss:          'नुकसान',
  noSaleYet:     'अभी बिक्री नहीं हुई',
  fieldsHeading: 'खेत',
  salesHeading:  'बिक्री',
  addSale:       '+ बिक्री जोड़ो',
  editSale:      'बदलो',
  deleteSale:    'हटाओ',
  deleteConfirm: 'यह बिक्री हटानी है?',
  deleteYes:     'हाँ, हटाओ',
  deleteNo:      'रहने दो',
  yieldsHeading: 'पैदावार',
  noSales:       'अभी कोई बिक्री नहीं',
  noYields:      'अभी कोई पैदावार दर्ज नहीं',
  acres:         (n) => `${n} एकड़`,
};

// ── Sales channel labels (shared: cycle detail list + new-sale form) ──────────
export const SALE_CHANNELS = {
  mandi:    'मंडी',
  society:  'सोसायटी',
  private:  'प्राइवेट',
  seed_lot: 'बीज लॉट',
};

// ── Sale units (tap-to-pick list, in display order) ───────────────────────────
export const SALE_UNITS = [
  { value: 'quintal', label: 'क्विंटल' },
  { value: 'kg',      label: 'किलो'    },
  { value: 'bag',     label: 'बोरी'    },
];

// ── Fields list + field detail ───────────────────────────────────────────────
export const FIELDS_PAGE = {
  heading:        'खेत',
  loading:        'लोड हो रहा है…',
  error:          'कुछ गड़बड़ हो गई।',
  empty:          'कोई खेत नहीं मिला।',
  prepCostLabel:  'तैयारी का खर्चा',
  acres:          (n) => `${n} एकड़`,
};

export const FIELD_DETAIL = {
  back:             'सभी खेत',
  prepHeading:      'खेत की तैयारी का खर्चा',
  prepSubLabel:     'जमीन पर लगी लागत — किसी फसल से नहीं जोड़ी अभी',
  totalPrepCost:    'कुल खर्चा',
  untagged:         'किसी सीज़न में नहीं डाला',
  emptyState:       'अभी कोई खेत की तैयारी का काम नहीं',
  acres:            (n) => `${n} एकड़`,
};

// ── Quality grade options (shared: yield form + display) ─────────────────────
export const QUALITY_GRADES = [
  { value: 'A',      label: 'अच्छा'   },
  { value: 'B',      label: 'मध्यम'   },
  { value: 'C',      label: 'कमज़ोर'  },
];

// ── New yield form ────────────────────────────────────────────────────────────
export const NEW_YIELD = {
  title:            'नई पैदावार',
  editTitle:        'पैदावार बदलो',
  qty:              'मात्रा',
  qtyPlaceholder:   'जैसे: 80',
  unit:             'इकाई',
  field:            'कौन सा खेत',
  fieldAll:         'पूरी फसल',
  grade:            'दर्जा (वैकल्पिक)',
  date:             'कटाई की तारीख',
  addNotes:         'टिप्पणी जोड़ो',
  notesPlaceholder: 'कोई और जानकारी…',
  submit:           'पैदावार दर्ज करो',
  saving:           'दर्ज हो रहा है…',
  success:          'पैदावार दर्ज हो गई!',
  errors: {
    qty: 'मात्रा सही भरो (0 से ज़्यादा)',
  },
};

// ── Cycle detail — yield list strings ────────────────────────────────────────
export const YIELD_LIST = {
  addYield:       '+ पैदावार जोड़ो',
  editYield:      'बदलो',
  deleteYield:    'हटाओ',
  deleteConfirm:  'यह पैदावार हटानी है?',
  deleteYes:      'हाँ, हटाओ',
  deleteNo:       'रहने दो',
};

// ── Workers admin ─────────────────────────────────────────────────────────────
export const WORKERS_PAGE = {
  heading:           'कर्मचारी',
  addBtn:            '+ कर्मचारी जोड़ो',
  empty:             'अभी कोई कर्मचारी नहीं — ऊपर जोड़ो।',
  loading:           'लोड हो रहा है…',
  error:             'कुछ गड़बड़ हो गई।',
  active:            'सक्रिय',
  inactive:          'निष्क्रिय',
  editBtn:           'बदलो',
  deactivateBtn:     'बंद करो',
  activateBtn:       'चालू करो',
  deactivateConfirm: 'इस कर्मचारी को निष्क्रिय करना है?',
  deactivateYes:     'हाँ, बंद करो',
  deactivateNo:      'रहने दो',
  roles: {
    worker:     'मज़दूर',
    supervisor: 'सुपरवाइज़र',
    owner:      'मालिक',
  },
  roleBadgeColors: {
    worker:     'bg-gray-100 text-gray-600',
    supervisor: 'bg-blue-50 text-blue-700',
    owner:      'bg-orange-50 text-orange-700',
  },
};

export const NEW_WORKER = {
  title:               'नया कर्मचारी',
  editTitle:           'कर्मचारी बदलो',
  nameLabel:           'नाम',
  namePlaceholder:     'जैसे: रामलाल वर्मा',
  phoneLabel:          'WhatsApp नंबर',
  countryCodeLabel:    'देश कोड',
  localNumPlaceholder: 'मोबाइल नंबर',
  phoneHint:           'देश कोड सहित — +91 (भारत), +1 (USA), +44 (UK)',
  roleLabel:           'भूमिका',
  submit:              'दर्ज करो',
  saving:              'दर्ज हो रहा है…',
  success:             'कर्मचारी दर्ज हो गया!',
  errors: {
    name:      'नाम ज़रूरी है',
    phone:     'नंबर सही नहीं — देश कोड (+91/+1) सहित पूरा नंबर डालो',
    duplicate: 'यह WhatsApp नंबर पहले से दर्ज है',
  },
};

// ── Prep-WO form ──────────────────────────────────────────────────────────────
export const PREP_RESOURCE_TYPES = [
  { value: 'labor',    label: 'मज़दूरी'  },
  { value: 'machine',  label: 'ट्रैक्टर' },
  { value: 'fuel',     label: 'डीज़ल'   },
  { value: 'material', label: 'सामान'   },
  { value: 'other',    label: 'अन्य'    },
];

export const NEW_PREP_WO = {
  title:             'खेत तैयारी का काम',
  editTitle:         'काम बदलो',
  descLabel:         'काम का विवरण',
  descPlaceholder:   'जैसे: जुताई, लेवलिंग, खाद डाली…',
  seasonLabel:       'सीज़न',
  yearLabel:         'साल',
  resourcesLabel:    'लागत (कम से कम एक)',
  addResource:       '+ लागत जोड़ो',
  resourceName:      'विवरण (जैसे: 2 मज़दूर, डीज़ल 10L)',
  resourceCost:      'राशि (₹)',
  removeResource:    '✕',
  liveTotal:         'कुल लागत',
  submit:            'दर्ज करो',
  saving:            'दर्ज हो रहा है…',
  success:           'काम दर्ज हो गया!',
  errors: {
    desc:      'काम का विवरण भरो',
    noRes:     'कम से कम एक लागत लाइन चाहिए',
    resCost:   'राशि 0 से ज़्यादा होनी चाहिए',
    resName:   'विवरण भरो',
  },
};

export const FIELD_DETAIL_PREP = {
  addBtn:         '+ खेत की तैयारी का काम जोड़ो',
  editBtn:        'बदलो',
  deleteBtn:      'हटाओ',
  deleteConfirm:  'यह काम हटाना है?',
  deleteYes:      'हाँ, हटाओ',
  deleteNo:       'रहने दो',
};

// ── New cycle form ────────────────────────────────────────────────────────────
export const NEW_CYCLE = {
  title:              'नई फसल',
  seasonLocked:       'सीज़न (तय)',
  cropLabel:          'फसल',
  cropPlaceholder:    'जैसे: सोयाबीन, गेहूं, मूंग',
  cropSuggestions:    'पिछली फसलें',
  varietyLabel:       'किस्म / बीज',
  varietyPlaceholder: 'जैसे: JS 335, NI 8 — English में लिखें',
  varietyNote:        'किस्म का नाम कभी नहीं बदला जाता',
  sowingLabel:        'बुआई की तारीख',
  seedQtyLabel:       'बीज मात्रा (kg) — वैकल्पिक',
  seedQtyPlaceholder: 'जैसे: 40',
  fieldsLabel:        'खेत + रक़बा (कम से कम एक)',
  fieldAcresPlaceholder: 'एकड़',
  totalAcres:         (n) => `कुल: ${n} एकड़`,
  submit:             'फसल दर्ज करो',
  saving:             'दर्ज हो रहा है…',
  errors: {
    crop:    'फसल का नाम भरो',
    sowing:  'बुआई की तारीख चुनो',
    noField: 'कम से कम एक खेत चुनो',
    acres:   'रक़बा 0 से ज़्यादा होना चाहिए',
  },
};

// ── New sale form ─────────────────────────────────────────────────────────────
export const NEW_SALE = {
  title:           'नई बिक्री',
  editTitle:       'बिक्री बदलो',
  qty:             'मात्रा',
  qtyPlaceholder:  'जैसे: 25',
  unit:            'इकाई',
  rate:            'भाव (₹ प्रति इकाई)',
  ratePlaceholder: 'जैसे: 4200',
  liveTotal:       'कुल रकम',
  buyer:           'खरीदार',
  buyerPlaceholder:'खरीदार का नाम',
  recentBuyers:    'पिछले खरीदार',
  channel:         'किसको बेचा',
  date:            'तारीख',
  notes:           'टिप्पणी',
  notesPlaceholder:'कोई और जानकारी…',
  addNotes:        'टिप्पणी जोड़ो',
  submit:          'बिक्री दर्ज करो',
  saving:          'दर्ज हो रहा है…',
  success:         'बिक्री दर्ज हो गई!',
  errors: {
    qty:     'मात्रा सही भरो (0 से ज़्यादा)',
    rate:    'भाव सही भरो (0 से ज़्यादा)',
    channel: 'किसको बेचा — चुनो',
  },
};
