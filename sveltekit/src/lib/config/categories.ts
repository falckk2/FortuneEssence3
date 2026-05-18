// Product category configuration
// Moving hardcoded business logic to configuration following Open/Closed Principle

export interface CategoryConfig {
  id: string;
  displayName: {
    sv: string;
    en: string;
  };
  description?: {
    sv: string;
    en: string;
  };
}

export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'essential-oils',
    displayName: {
      sv: 'Eteriska oljor',
      en: 'Essential Oils',
    },
    description: {
      sv: 'Rena och naturliga eteriska oljor',
      en: 'Pure and natural essential oils',
    },
  },
  {
    id: 'carrier-oils',
    displayName: {
      sv: 'Bäraroljor',
      en: 'Carrier Oils',
    },
    description: {
      sv: 'Högkvalitativa bäraroljor för blandning',
      en: 'High-quality carrier oils for blending',
    },
  },
  {
    id: 'diffusers',
    displayName: {
      sv: 'Diffusers',
      en: 'Diffusers',
    },
    description: {
      sv: 'Aromaterapi diffusers och utrustning',
      en: 'Aromatherapy diffusers and equipment',
    },
  },
  {
    id: 'accessories',
    displayName: {
      sv: 'Tillbehör',
      en: 'Accessories',
    },
    description: {
      sv: 'Aromaterapi tillbehör och verktyg',
      en: 'Aromatherapy accessories and tools',
    },
  },
  {
    id: 'gift-sets',
    displayName: {
      sv: 'Presentset',
      en: 'Gift Sets',
    },
    description: {
      sv: 'Kurerade presentset och samlingar',
      en: 'Curated gift sets and collections',
    },
  },
];

export class CategoryService {
  private categories: Map<string, CategoryConfig>;

  constructor() {
    this.categories = new Map(
      PRODUCT_CATEGORIES.map(cat => [cat.id, cat])
    );
  }

  getCategoryDisplayName(categoryId: string): { sv: string; en: string } {
    const category = this.categories.get(categoryId);
    return category?.displayName || { sv: categoryId, en: categoryId };
  }

  getAllCategories(): CategoryConfig[] {
    return PRODUCT_CATEGORIES;
  }

  getCategoryById(categoryId: string): CategoryConfig | undefined {
    return this.categories.get(categoryId);
  }

  categoryExists(categoryId: string): boolean {
    return this.categories.has(categoryId);
  }
}
