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
  yieldsHeading: 'पैदावार',
  noSales:       'अभी कोई बिक्री नहीं',
  noYields:      'अभी कोई पैदावार दर्ज नहीं',
  acres:         (n) => `${n} एकड़`,
};
