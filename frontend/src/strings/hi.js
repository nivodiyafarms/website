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
  tasksHeading:  'काम',
  noTasks:       'अभी कोई काम नहीं',
  acres:         (n) => `${n} एकड़`,
  totalAcresFull:(n) => `कुल: ${n} एकड़`,
  editCycle:     'बदलो',
  editCycleTitle:'फसल चक्र बदलो',
  saveCycle:     'बदलाव सहेजो',
  savingCycle:   'सहेजा जा रहा है…',
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

// ── Task status labels (raw token → Hindi; NEVER show raw tokens to users) ────
export const TASK_STATUSES = {
  new:         'नया',
  in_progress: 'चल रहा है',
  on_hold:     'रोक पर',
  resolved:    'पूरा हुआ',
  reopened:    'फिर खुला',
  closed:      'बंद',
  cancelled:   'रद्द',
};

export const TASK_STATUS_COLORS = {
  new:         'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  on_hold:     'bg-orange-100 text-orange-800',
  resolved:    'bg-green-100 text-green-800',
  reopened:    'bg-purple-100 text-purple-800',
  closed:      'bg-gray-100 text-gray-700',
  cancelled:   'bg-red-100 text-red-800',
};

// Resource type labels (task detail + WO resources)
export const RESOURCE_TYPES = {
  labor:        'मज़दूरी',
  fuel:         'डीज़ल',
  material:     'सामान',
  machine:      'ट्रैक्टर',
  water:        'पानी',
  service:      'सेवा',
  contract:     'ठेका',
  other:        'अन्य',
  construction: 'निर्माण',
};

// ── Task category labels (backend enum value → Hindi display) ─────────────────
export const TASK_CATEGORY_LABELS = {
  sowing:     'बुआई',
  irrigation: 'सिंचाई',
  fertilizer: 'खाद',
  harvest:    'कटाई',
  fuel:       'ईंधन',
  sale:       'बिक्री',
  storage:    'भंडार',
};

// Subcategory options per category — value must match TaskSubcategory backend enum
export const TASK_SUBCATEGORIES = {
  sowing: [
    { value: 'khurar',    label: 'खरार'     },
    { value: 'rotavator', label: 'रोटावेटर' },
    { value: 'mulching',  label: 'मल्चर'    },
    { value: 'seeding',   label: 'बोइनी'    },
    { value: 'ploughing', label: 'प्लाउ'    },
    { value: 'leveling',  label: 'लेवलिंग'  },
    { value: 'other',     label: 'अन्य'      },
  ],
  irrigation: [
    { value: 'paleva',              label: 'पलेवा (बीज बोने से पहले)' },
    { value: 'first_irrigation',    label: 'पहली पानी'    },
    { value: 'second_irrigation',   label: 'दूसरी पानी'   },
    { value: 'third_irrigation',    label: 'तीसरी पानी'   },
    { value: 'fourth_irrigation',   label: 'चौथी पानी'    },
    { value: 'fifth_irrigation',    label: 'पाँचवीं पानी' },
    { value: 'contract_irrigation', label: 'ठेका सिंचाई'  },
    { value: 'other',               label: 'अन्य'           },
  ],
  fertilizer: [
    { value: 'seed_treatment',  label: 'बीज उपचार'  },
    { value: 'dap',             label: 'डीएपी'        },
    { value: 'urea',            label: 'यूरिया'       },
    { value: 'pesticide',       label: 'दवाई'         },
    { value: 'potash',          label: 'पोटाश'        },
    { value: 'zinc',            label: 'जिंक'          },
    { value: 'sulfur',          label: 'सल्फर'        },
    { value: 'super_phosphate', label: 'सुपर'          },
    { value: 'other',           label: 'अन्य'          },
  ],
  harvest: [
    { value: 'manual_cutting',   label: 'कटाई'           },
    { value: 'thresher',         label: 'थ्रेसर'         },
    { value: 'harvester',        label: 'हार्वेस्टर'     },
    { value: 'winnowing',        label: 'पंखा'           },
    { value: 'contract_harvest', label: 'ठेका कटाई'      },
    { value: 'other',            label: 'अन्य'           },
  ],
  fuel: [
    { value: 'diesel', label: 'डीज़ल'    },
    { value: 'petrol', label: 'पेट्रोल'  },
    { value: 'other',  label: 'अन्य'     },
  ],
  sale: [
    { value: 'mandi_sale',   label: 'मंडी बिक्री'    },
    { value: 'society_sale', label: 'सोसाइटी बिक्री' },
    { value: 'other',        label: 'अन्य'            },
  ],
  storage: [
    { value: 'farm_id',   label: 'खेत क्रमांक'           },
    { value: 'warehouse', label: 'वेयरहाउस'            },
    { value: 'other',     label: 'अन्य (इनपुट परीक्षण)' },
  ],
};

// ── Severity badges (derived from live task cost — NEVER from stored column) ──
// Thresholds match backend/app/utils/severity.py — keep in sync.
export const SEVERITY_BADGES = {
  sev1: { label: 'भारी',    cls: 'bg-red-100 text-red-700 border border-red-200'         }, // >₹15k
  sev2: { label: 'अधिक',   cls: 'bg-orange-100 text-orange-700 border border-orange-200' }, // ₹10–15k
  sev3: { label: 'मध्यम',  cls: 'bg-yellow-100 text-yellow-700 border border-yellow-200' }, // ₹5–10k
  sev4: { label: 'सामान्य', cls: 'bg-green-100 text-green-700 border border-green-200'   }, // <₹5k
};

// ── Crop task + WO CRUD strings (CycleDetailPage) ────────────────────────────
export const TASKS_CRUD = {
  // Task form
  addTask:           '+ काम जोड़ो',
  editTask:          'बदलो',
  deleteTask:        'हटाओ',
  deleteTaskConfirm: 'यह काम हटाना है? (पहले वर्क ऑर्डर हटाने होंगे)',
  deleteTaskYes:     'हाँ, हटाओ',
  deleteNo:          'रहने दो',
  tipanniLabel:      'काम का नाम (टिप्पणी)',
  tipanniPlaceholder:'जैसे: बीज बुवाई, DAP खाद, सिंचाई',
  varnanLabel:       'विवरण (वैकल्पिक)',
  varnanPlaceholder: 'ज़्यादा जानकारी…',
  fieldLabel:        'खेत (एक या ज़्यादा)',
  fieldNone:         'कोई खेत नहीं',
  workerLabel:       'कर्मचारी को सौंपो (वैकल्पिक)',
  workerNone:        '— कोई नहीं —',
  categoryLabel:     'श्रेणी',
  categoryPlaceholder: 'चुनें',
  subcategoryLabel:  'उप-श्रेणी',
  subcategoryPlaceholder: 'चुनें',
  saveTask:          'काम दर्ज करो',
  updateTask:        'बदलाव सहेजो',
  savingTask:        'दर्ज हो रहा है…',
  cancelForm:        'रद्द',
  errors: {
    tipanni:  'काम का नाम भरो',
    field:    'खेत चुनो',
    category: 'श्रेणी चुनो',
  },

  // Task status inline change
  changeStatus:   'स्थिति',
  statusSaving:   'बदल रहा है…',
  statusCancel:   'रद्द',

  // WO form
  addWO:             '+ वर्क ऑर्डर जोड़ो',
  editWO:            'बदलो',
  deleteWO:          'हटाओ',
  deleteWOConfirm:   'यह वर्क ऑर्डर हटाना है?',
  deleteWOYes:       'हाँ, हटाओ',
  saveWO:            'वर्क ऑर्डर दर्ज करो',
  updateWO:          'बदलाव सहेजो',
  savingWO:          'दर्ज हो रहा है…',
  woTipanniLabel:    'वर्क ऑर्डर का नाम',
  woTipanniPlaceholder: 'जैसे: ट्रैक्टर बुवाई, DAP 2 बोरी डाली',
  woErrors: {
    tipanni:    'वर्क ऑर्डर का नाम भरो',
    simpleCost: 'राशि 0 से ज़्यादा होनी चाहिए',
    resource:   'कम से कम एक लागत लाइन चाहिए',
    resCost:    'राशि 0 से ज़्यादा होनी चाहिए',
    resName:    'विवरण भरो',
  },

  // Simple / detail cost toggle
  simpleCostLabel:  'कुल लागत (₹)',
  simpleCostHint:   '₹ राशि',
  expandDetail:     'विस्तार ▾',
  collapseDetail:   'सरल ▴',
  resourcesLabel:   'लागत का ब्यौरा',
  addResource:      '+ लागत जोड़ो',
  resourceName:     'जैसे: 2 मज़दूर, DAP 50kg, डीज़ल 10L',
  resourceCost:     'राशि (₹)',
  liveTotal:        'कुल लागत',

  deleteRes:        'हटाओ',
  deleteResConfirm: 'यह लागत हटानी है?',
  deleteResYes:     'हाँ, हटाओ',

  // WO lifecycle actions
  closeWO:              'बंद करो',
  closingWO:            'बंद हो रहा है…',
  reopenWO:             'वापस भेजो',
  reopeningWO:          'वापस हो रहा है…',
  reopenClosed:         'फिर से खोलो',
  reopeningClosed:      'खुल रहा है…',
  // Send-back reason form (pending_review → open)
  sendBackReasonLabel:  'वापस क्यों भेज रहे हैं?',
  sendBackReasonPlaceholder: 'कारण लिखो — जैसे: फोटो नहीं मिली, मात्रा गलत है…',
  sendBackReasonHint:   'वैकल्पिक — लेकिन लिखना बेहतर ताकि कर्मचारी जाने',
  sendBackSubmit:       'वापस भेजो',
  // Worker completion flow
  submitCompletion:     'काम पूरा हुआ',
  completionLabel:      'क्या काम हुआ?',
  completionPlaceholder:'काम का विवरण — किसने किया, क्या किया…',
  completionRequired:   'काम का विवरण ज़रूर लिखो',
  submitCompletionBtn:  'सबमिट करो',
  submittingCompletion: 'सबमिट हो रहा है…',
  completionNoteLabel:  'कर्मचारी ने लिखा:',
  sendBackNoteLabel:    'वापस क्यों भेजा:',
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
  allocBtn:       'फसलों में बाँटो',
  deleteConfirm:  'यह काम हटाना है?',
  deleteYes:      'हाँ, हटाओ',
  deleteNo:       'रहने दो',
};

// ── Prep cost allocation screen ───────────────────────────────────────────────
export const PREP_ALLOC = {
  back:              'खेत पर वापस',
  heading:           'फसलों में बाँटो',
  subLabel:          (woNo) => `${woNo} — खेत की तैयारी का खर्चा`,
  woCost:            'कुल खर्चा',
  remaining:         'बाकी',
  remainingZero:     'पूरा बाँट दिया',
  overAlloc:         (n) => `₹${n} ज़्यादा हो गया — राशि घटाओ`,
  // existing allocations section
  existingHeading:   'दर्ज किए गए',
  removeBtn:         'हटाओ',
  removing:          'हट रहा है…',
  // new allocation section
  availHeading:      (season, year) => `${season} ${year} की फसलें`,
  amountLabel:       'राशि (₹)',
  amountPlaceholder: 'जैसे: 1500',
  saveBtn:           'दर्ज करो',
  saving:            'दर्ज हो रहा है…',
  perCycleMax:       (n) => `अधिकतम ₹${n}`,
  noCycles:          (season, year) => `${season} ${year} में कोई फसल नहीं`,
  allAllocated:      'सभी फसलों में डाल दिया',
  errors: {
    amount:  'राशि 0 से ज़्यादा होनी चाहिए',
    overMax: (n) => `अधिकतम ₹${n} बाँट सकते हो`,
  },
};

// ── New cycle form ────────────────────────────────────────────────────────────
// ── Seed class + stage options (shared: new-cycle form + cycle edit) ───────────
export const SEED_CLASS_OPTIONS = [
  { value: 'TL',          label: 'TL (Truthfully Labelled)' },
  { value: 'certified',   label: 'Certified' },
  { value: 'foundation',  label: 'Foundation' },
  { value: 'breeder',     label: 'Breeder' },
  { value: 'registered',  label: 'Registered' },
  { value: 'other',       label: 'अन्य' },
];
export const SEED_STAGE_OPTIONS = [
  { value: 'graded',   label: 'Graded (ग्रेडेड)' },
  { value: 'raw',      label: 'Raw (कच्चा)' },
  { value: 'treated',  label: 'Treated (उपचारित)' },
  { value: 'other',    label: 'अन्य' },
];

export const NEW_CYCLE = {
  title:              'नई फसल',
  seasonLocked:       'सीज़न (तय)',
  cropLabel:          'फसल',
  cropPlaceholder:    'जैसे: सोयाबीन, गेहूं, मूंग',
  cropSuggestions:    'पिछली फसलें',
  addNewCrop:         '+ नई फसल जोड़ो',
  newCropPlaceholder: 'फसल का नाम लिखो (जैसे: सोयाबीन)',
  varietyLabel:       'किस्म / बीज',
  varietyPlaceholder: 'जैसे: JS 335, NI 8 — English में लिखें',
  varietyNote:        'किस्म का नाम कभी नहीं बदला जाता',
  seedClassLabel:     'बीज श्रेणी',
  seedClassPlaceholder: 'श्रेणी लिखो',
  seedStageLabel:     'बीज अवस्था (वैकल्पिक)',
  seedStagePlaceholder: 'अवस्था लिखो',
  sowingLabel:        'बुआई की तारीख',
  seedQtyLabel:       'बीज मात्रा (kg) — वैकल्पिक',
  seedQtyPlaceholder: 'जैसे: 40',
  fieldsLabel:        'खेत + रक़बा (कम से कम एक)',
  fieldAcresPlaceholder: 'एकड़',
  totalAcres:         (n) => `कुल: ${n} एकड़`,
  submit:             'फसल दर्ज करो',
  saving:             'दर्ज हो रहा है…',
  errors: {
    crop:       'फसल का नाम भरो',
    seedClass:  'बीज श्रेणी चुनो',
    sowing:     'बुआई की तारीख चुनो',
    noField:    'कम से कम एक खेत चुनो',
    acres:      'रक़बा 0 से ज़्यादा होना चाहिए',
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

// ── General Expense screen ────────────────────────────────────────────────────
export const GE_CATEGORY_LABELS = {
  labor:        'मज़दूर',
  material:     'सामग्री',
  fuel:         'ईंधन',
  machine:      'मशीन',
  service:      'सेवा',
  water:        'पानी / सिंचाई',
  contract:     'ठेका',
  construction: 'निर्माण',
  other:        'अन्य',
};

export const GE_SUBCATEGORIES = {
  fuel:         ['डीजल','पेट्रोल','जनरेटर ईंधन','पंप ईंधन'],
  labor:        ['स्थायी मजदूर','दैनिक मजदूर','कटाई मजदूरी','बुवाई मजदूरी','निराई / गुड़ाई मजदूरी','सिंचाई मजदूरी','लोडिंग / अनलोडिंग'],
  material:     ['बीज','खाद','कीटनाशक','जैविक खाद','सूक्ष्म पोषक तत्व','मल्चिंग शीट','पौध संरक्षण दवा'],
  machine:      ['Tractor – Deutz Fahr 55E','Tractor – John Deere 5105','Tractor – Sonalika DI 734','Trolley – Big Size','Trolley – Medium Size','Thresher – Big Size','Thresher – Medium Size','Ridge Furrow Seed Drill','Normal Seed Drill','Maize Seed Drill','पंजा','सत्ता','Grading Machine','दुनाई वाला पंखा','Alternator (अल्टीनेटर)','Sprayer Tanker','अन्य मशीन / उपकरण'],
  water:        ['सिंचाई पाइप','बोरवेल मरम्मत','मोटर / पंप मरम्मत','बिजली खर्च (पंप)','ड्रिप सिंचाई','स्प्रिंकलर सिस्टम','पानी टंकी','सिंचाई पाइपलाइन'],
  service:      ['मशीन मरम्मत','मोटर मरम्मत','वाहन सर्विस','इलेक्ट्रिकल सर्विस','मशीन मेंटेनेंस'],
  contract:     ['परिवहन','कटाई','सिंचाई','जुताई','रोपाई','फसल ढुलाई'],
  construction: ['सीमेंट','रेत','गिट्टी','ईंट','स्टील / सरिया','बजरी','प्लास्टर सामग्री','पानी टंकी','पाइप फिटिंग','इलेक्ट्रिकल वायर','स्विच / बोर्ड','टिन शेड','दरवाजा','खिड़की','पेंट','वॉटरप्रूफिंग','कंक्रीट मिक्स','टाइल्स','पाइप लाइन','अन्य निर्माण सामग्री'],
};

export const GE_REVIEW_STATUS = {
  unreviewed: { label: 'अपुष्ट',   color: 'bg-yellow-100 text-yellow-800' },
  verified:   { label: 'सत्यापित', color: 'bg-green-100  text-green-800'  },
  void:       { label: 'रद्द',     color: 'bg-red-100    text-red-800'    },
};

// Payment mode: values match backend / DB
export const GE_PAYMENT_MODES = [
  { key: 'firm_account',  label: 'फर्म खाता',        hint: 'online / UPI / NEFT' },
  { key: 'cash',          label: 'नकद',               hint: 'cash'                },
  { key: 'personal_upi',  label: 'personal UPI/बैंक', hint: ''                    },
  { key: 'other',         label: 'अन्य',              hint: ''                    },
];

// Badge appearance per payment mode key
export const GE_PAYMENT_BADGE = {
  firm_account:  { label: 'फर्म खाता',        color: 'bg-green-100 text-green-800'   },
  cash:          { label: 'नकद',               color: 'bg-amber-100 text-amber-800'   },
  personal_upi:  { label: 'personal UPI/बैंक', color: 'bg-orange-100 text-orange-800' },
  other:         { label: 'अन्य',              color: 'bg-gray-100   text-gray-600'   },
};

export const GE_STRINGS = {
  heading:          'सामान्य खर्चे',
  addExpense:       '+ खर्चा जोड़ो',
  empty:            'अभी कोई खर्चा नहीं',
  // form
  formAdd:          'नया खर्चा',
  formEdit:         'खर्चा बदलो',
  categoryLabel:    'श्रेणी',
  subcategoryLabel: 'उप-श्रेणी',
  subcategoryPlaceholder: 'उप-श्रेणी लिखो',
  descLabel:        'विवरण (वैकल्पिक)',
  descPlaceholder:  'और जानकारी…',
  amountLabel:      'राशि (₹)',
  amountPlaceholder:'जैसे: 2500',
  qtyLabel:         'मात्रा (वैकल्पिक)',
  unitLabel:        'इकाई',
  rateLabel:        'दर (₹)',
  dateLabel:        'तारीख',
  submit:           'खर्चा दर्ज करो',
  update:           'बदलाव सहेजो',
  saving:           'दर्ज हो रहा है…',
  cancel:           'रद्द करो',
  // row actions
  verify:           'सत्यापित करो',
  edit:             'बदलो',
  void:             'रद्द करो',
  voidReason:       'रद्द का कारण',
  voidReasonPlaceholder: 'कारण लिखो…',
  voidConfirm:      'रद्द करो',
  voidCancel:       'वापस',
  notes:            'टिप्पणी',
  addNote:          '+ टिप्पणी जोड़ो',
  notePlaceholder:  'टिप्पणी लिखो…',
  noteSave:         'दर्ज',
  // delete
  deleteConfirm:    'यह खर्चा हटाना है?',
  deleteYes:        'हाँ, हटाओ',
  deleteNo:         'रहने दो',
  // form — payment
  paymentLabel:         'भुगतान का तरीका',
  paymentPlaceholder:   '— तरीका चुनो —',
  paymentCustomLabel:   'और बताओ',
  paymentCustomPlaceholder: 'भुगतान का तरीका लिखो…',
  // filters
  filterDate:       'तारीख',
  filterStatus:     'स्थिति',
  filterPayment:    'भुगतान',
  filterAll:        'सब',
  filterThisMonth:  'इस महीने',
  filterLastMonth:  'पिछला महीना',
  filterThisSeason: 'इस सीज़न',
  filterCustom:     'कस्टम',
  filterRangeSep:   '—',
  // errors
  errors: {
    category: 'श्रेणी चुनो',
    amount:   'राशि 0 से ज़्यादा होनी चाहिए',
  },
};
