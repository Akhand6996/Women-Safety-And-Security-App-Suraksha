// src/utils/theme.js

export const COLORS = {
  primary: '#C0153E',
  primaryDark: '#8B0F2C',
  primaryLight: '#FAECE7',
  primaryMid: '#E8173D',

  accent: '#3B6D11',
  accentLight: '#EAF3DE',

  warning: '#BA7517',
  warningLight: '#FAEEDA',

  info: '#185FA5',
  infoLight: '#E6F1FB',

  success: '#0F6E56',
  successLight: '#E1F5EE',

  background: '#FFFFFF',
  surface: '#F8F8F8',
  surfaceAlt: '#F1F0EF',

  text: '#1A1A1A',
  textSecondary: '#5F5E5A',
  textMuted: '#888780',

  border: '#E0DED8',
  borderLight: '#EEECE7',

  white: '#FFFFFF',
  black: '#000000',

  danger: '#C0153E',
  dangerDark: '#8B0F2C',

  // Police / Authority colors
  police: '#0C447C',
  policeLight: '#E6F1FB',
};

export const FONTS = {
  regular: 400,
  medium: 500,
  bold: 700,
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
