/**
 * ALL user-facing Hindi strings live here.
 * ─────────────────────────────────────────────────────────────────────────────
 * FAMILY: edit this file to correct Bundelkhandi words / local phrasing.
 * Nothing is scattered inline — change here, it updates everywhere.
 * ─────────────────────────────────────────────────────────────────────────────
 */

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
