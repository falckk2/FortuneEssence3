// Product Benefits Mapping
// Maps product categories and types to wellness benefits that resonate with young women

export interface Benefit {
  key: string;
  label: {
    sv: string;
    en: string;
  };
  icon: string; // Emoji for visual appeal
  color: string; // Tailwind color class
}

export const benefits: Record<string, Benefit> = {
  sleep: {
    key: 'sleep',
    label: { sv: 'Bättre sömn', en: 'Better Sleep' },
    icon: '😴',
    color: 'bg-lavender-100 text-lavender-700 border-lavender-200',
  },
  calm: {
    key: 'calm',
    label: { sv: 'Lugn & ro', en: 'Calm Mind' },
    icon: '🧘‍♀️',
    color: 'bg-sage-100 text-sage-700 border-sage-200',
  },
  focus: {
    key: 'focus',
    label: { sv: 'Fokus', en: 'Focus' },
    icon: '✨',
    color: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
  },
  energy: {
    key: 'energy',
    label: { sv: 'Energi', en: 'Energy Boost' },
    icon: '⚡',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  relief: {
    key: 'relief',
    label: { sv: 'Lindring', en: 'Relief' },
    icon: '💚',
    color: 'bg-sage-100 text-sage-700 border-sage-200',
  },
  breathe: {
    key: 'breathe',
    label: { sv: 'Andas fritt', en: 'Breathe Easy' },
    icon: '🌿',
    color: 'bg-forest-100 text-forest-700 border-forest-200',
  },
  glow: {
    key: 'glow',
    label: { sv: 'Strålande hy', en: 'Skin Glow' },
    icon: '✨',
    color: 'bg-rose-100 text-rose-700 border-rose-200',
  },
  stress: {
    key: 'stress',
    label: { sv: 'Stresslindring', en: 'Stress Relief' },
    icon: '🌸',
    color: 'bg-lavender-100 text-lavender-700 border-lavender-200',
  },
};

// Map product names/categories to benefits
export const productBenefitsMap: Record<string, string[]> = {
  lavender: ['sleep', 'calm', 'stress'],
  lavendel: ['sleep', 'calm', 'stress'],
  // TODO: Uncomment when we have more oils available
  // eucalyptus: ['breathe', 'focus', 'energy'],
  // eucalypt: ['breathe', 'focus', 'energy'],
  // peppermint: ['focus', 'energy', 'relief'],
  // pepparmint: ['focus', 'energy', 'relief'],
  // 'tea-tree': ['glow', 'relief'],
  // 'rose': ['calm', 'glow', 'sleep'],
  // ros: ['calm', 'glow', 'sleep'],
  // chamomile: ['sleep', 'calm', 'relief'],
  // kamomill: ['sleep', 'calm', 'relief'],
  // ylang: ['stress', 'calm'],
  // bergamot: ['stress', 'energy', 'focus'],
  // lemon: ['energy', 'focus'],
  // citron: ['energy', 'focus'],
  // Default for essential oils
  'essential-oils': ['calm', 'relief'],
  'carrier-oils': ['glow'],
};

/**
 * Get benefits for a product based on name and category
 */
export function getProductBenefits(productName: string, category: string): Benefit[] {
  const productLower = productName.toLowerCase();

  // Check if product name contains any benefit keywords
  for (const [key, benefitKeys] of Object.entries(productBenefitsMap)) {
    if (productLower.includes(key)) {
      return benefitKeys.slice(0, 2).map(bKey => benefits[bKey]).filter(Boolean);
    }
  }

  // Fallback to category-based benefits
  const categoryBenefits = productBenefitsMap[category];
  if (categoryBenefits) {
    return categoryBenefits.slice(0, 2).map(bKey => benefits[bKey]).filter(Boolean);
  }

  return [];
}
