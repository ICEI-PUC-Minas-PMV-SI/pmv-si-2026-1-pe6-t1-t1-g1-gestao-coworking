// ─────────────────────────────────────────────────────────────
//  Axis Work — Design tokens unificados
//  Alinhado com variables.css do front-end web.
//  Inclui aliases para compatibilidade com screens do admin-mobile.
// ─────────────────────────────────────────────────────────────

export const colors = {
  // ── Paleta principal ──────────────────────────────────────
  navy:       '#0A2A44',
  navySoft:   '#1F3A57',
  blue:       '#5B7A99',
  blueLight:  '#8FADC8',
  bluePale:   '#CAD6E2',
  blueGhost:  '#EBF1F6',

  // ── Superfícies ───────────────────────────────────────────
  bg:         '#F4F7FA',
  surface:    '#FFFFFF',
  card:        '#FFFFFF',   // usado por components/ui.tsx (painel admin)

  // ── Texto ─────────────────────────────────────────────────
  ink:        '#111827',
  inkSoft:    '#1F3A57',
  muted:      '#6B7A8A',

  // ── Bordas ────────────────────────────────────────────────
  border:     '#DDE3EA',
  borderStrong: '#B8C6D4',

  // ── Feedback ──────────────────────────────────────────────
  success:    '#4A7A57',
  successBg:  '#EBF4EE',
  warn:       '#B58A3A',
  danger:     '#8A3A3A',
  dangerBg:   '#FAF0F0',

  // ── Admin ─────────────────────────────────────────────────
  admin:      '#5B3A8A',
  adminBg:    '#F3EEFB',

  // ── Aliases de compatibilidade (admin-mobile usa estes nomes) ──
  // blue50 → blueGhost, blue100 → bluePale, blue200 → blueLight, blue300 → blue
  blue50:     '#EBF1F6',   // = blueGhost
  blue100:    '#CAD6E2',   // = bluePale
  blue200:    '#8FADC8',   // = blueLight
  blue300:    '#5B7A99',   // = blue
};

export const spacing = {
  xs:  6,
  sm:  10,
  md:  14,
  lg:  18,
  xl:  24,
  xxl: 36,
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  pill: 9999,
};
