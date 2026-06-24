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
  voiceComingSoon: 'आवाज़ से जोड़ना — जल्द आ रहा है',
};
