// FortuneEssence Color System
// Nature-inspired palette designed to appeal to young women aged 18-24
// Optimized for wellness/essential oil brand aesthetic

export const colors = {
  // Primary: Sage Green - calming, natural, organic
  sage: {
    50: '#F7F9F7',
    100: '#EEF2ED',
    200: '#DCE5DA',
    300: '#C1D4BC',
    400: '#A8B5A0',
    500: '#8FAB87', // Primary brand color
    600: '#7A9172',
    700: '#5F7259',
    800: '#4A5240',
    900: '#363D30',
  },

  // Accent: Terracotta - warm, earthy, inviting
  terracotta: {
    50: '#FBF5F2',
    100: '#F7EBE5',
    200: '#EFD7CB',
    300: '#E4BAA4',
    400: '#D49D80',
    500: '#C17B6B', // Accent color
    600: '#A15A4A',
    700: '#7E4538',
    800: '#5D3329',
    900: '#3F231E',
  },

  // Neutral: Warm Creams - soft, sophisticated
  cream: {
    50: '#FDFCFB',
    100: '#FAF8F5',
    200: '#F5F1E8', // Background cream
    300: '#EDE7DB',
    400: '#E3DACB',
    500: '#D4C7B5',
    600: '#B8A791',
    700: '#9A8771',
    800: '#75685A',
    900: '#524A40',
  },

  // Dark: Deep Forest - grounding, sophisticated
  forest: {
    50: '#F4F5F4',
    100: '#E8EAE8',
    200: '#CDD1CC',
    300: '#A9B0A6',
    400: '#788276',
    500: '#556256',
    600: '#3E4E42', // Dark text/accents
    700: '#2C4A3E',
    800: '#1E3330',
    900: '#142621',
  },

  // Supporting: Dusty Rose - feminine, modern
  rose: {
    50: '#FAF7F7',
    100: '#F5EFEF',
    200: '#EBDFDF',
    300: '#DCC5C5',
    400: '#C9A8A8',
    500: '#D4A5A5',
    600: '#B88787',
    700: '#9B6B6B',
    800: '#7A5252',
    900: '#5A3C3C',
  },

  // Supporting: Soft Lavender - calming (not bright purple!)
  lavender: {
    50: '#F9F8FB',
    100: '#F3F1F7',
    200: '#E7E3EF',
    300: '#D4CCE3',
    400: '#BDB0D4',
    500: '#A598C0',
    600: '#8876A5',
    700: '#6B5985',
    800: '#504363',
    900: '#382F45',
  },
};

// Brand color tokens for easy reference
export const brandColors = {
  primary: colors.sage[500],
  primaryDark: colors.sage[700],
  primaryLight: colors.sage[300],

  accent: colors.terracotta[500],
  accentDark: colors.terracotta[600],
  accentLight: colors.terracotta[300],

  background: colors.cream[200],
  backgroundLight: colors.cream[50],
  backgroundDark: colors.cream[300],

  text: colors.forest[600],
  textLight: colors.forest[400],
  textDark: colors.forest[800],

  border: colors.cream[400],
  borderDark: colors.sage[300],
};

// Semantic color names for specific use cases
export const semanticColors = {
  success: colors.sage[500],
  warning: colors.terracotta[400],
  error: colors.rose[500],
  info: colors.lavender[500],

  // Product benefit categories
  calming: colors.lavender[400],
  energizing: colors.terracotta[400],
  focus: colors.sage[600],
  sleep: colors.lavender[600],
  relief: colors.rose[400],
};
