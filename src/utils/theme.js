// src/utils/theme.js

export const COLORS = {
  primary: '#E91E63',
  primaryDark: '#AD1457',
  primaryLight: '#FCE4EC',
  primaryMid: '#E8173D',

  accent: '#4CAF50',
  accentLight: '#E8F5E8',

  warning: '#FF9800',
  warningLight: '#FFF3E0',

  info: '#2196F3',
  infoLight: '#E3F2FD',

  success: '#4CAF50',
  successLight: '#E8F5E8',

  background: '#FFF5F7',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F0EF',

  text: '#2E2E2E',
  textSecondary: '#757575',
  textMuted: '#888780',

  border: '#FCE4EC',
  borderLight: '#FCE4EC',

  white: '#FFFFFF',
  black: '#000000',

  danger: '#F44336',
  dangerDark: '#D32F2F',

  // Police / Authority colors
  police: '#0C447C',
  policeLight: '#E6F1FB',
};

export const FONTS = {
  regular: 400,
  medium: 500,
  bold: 700,
};

export const FONT_FAMILY = {
  robotoRegular: 'Roboto-Regular',
  robotoBold: 'Roboto-Bold',
};

export const SIZES = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 36,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  danger: {
    shadowColor: '#C0153E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
};
