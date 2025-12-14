'use client';

import { useState, useEffect, useCallback } from 'react';
import { Product, BundleConfiguration } from '@/types';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { BundleCard } from '@/components/bundles';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebounce } from '@/hooks/useDebounce';

interface FilterOptions {
  categories: { category: string; count: number; displayName: { sv: string; en: string } }[];
  priceRange: { min: number; max: number };
}

interface ActiveFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'name' | 'price' | 'created';
  sortOrder?: 'asc' | 'desc';
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [bundles, setBundles] = useState<Product[]>([]);
  const [bundleConfigs, setBundleConfigs] = useState<Record<string, BundleConfiguration>>({});
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    categories: [],
    priceRange: { min: 0, max: 1000 }
  });
  const locale = 'sv'; // This would come from context or props in real app

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch products and filter options
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch products
        const productsResponse = await fetch(`/api/products?locale=${locale}`);
        const productsData = await productsResponse.json();

        if (productsData.success) {
          // Separate bundles from regular products
          const bundleProducts = productsData.data.filter((p: Product) => p.category === 'bundles');
          const regularProducts = productsData.data.filter((p: Product) => p.category !== 'bundles');

          setBundles(bundleProducts);
          setProducts(regularProducts);

          // Fetch bundle configurations
          if (bundleProducts.length > 0) {
            const bundlesResponse = await fetch('/api/bundles');
            const bundlesData = await bundlesResponse.json();

            if (bundlesData.success) {
              const configs: Record<string, BundleConfiguration> = {};
              bundlesData.data.forEach((config: BundleConfiguration) => {
                configs[config.bundleProductId] = config;
              });
              setBundleConfigs(configs);
            }
          }
        }

        // Fetch categories
        const categoriesResponse = await fetch('/api/products/categories');
        const categoriesData = await categoriesResponse.json();

        if (categoriesData.success && productsData.success) {
          const prices = productsData.data.map((p: Product) => p.price);
          setFilterOptions({
            categories: categoriesData.data,
            priceRange: {
              min: Math.floor(Math.min(...prices)),
              max: Math.ceil(Math.max(...prices))
            }
          });
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  // Apply filters and search
  const applyFilters = useCallback(() => {
    let filtered = [...products];

    // Apply search
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(product => {
        const name = locale === 'sv' ? product.translations.sv.name : product.translations.en.name;
        const description = locale === 'sv' ? product.translations.sv.description : product.translations.en.description;
        return (
          name.toLowerCase().includes(query) ||
          description.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query)
        );
      });
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply price filters
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice!);
    }

    // Apply stock filter
    if (filters.inStock) {
      filtered = filtered.filter(product => product.stock > 0);
    }

    // Apply sorting
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        let valueA: any;
        let valueB: any;

        switch (filters.sortBy) {
          case 'name':
            valueA = locale === 'sv' ? a.translations.sv.name : a.translations.en.name;
            valueB = locale === 'sv' ? b.translations.sv.name : b.translations.en.name;
            break;
          case 'price':
            valueA = a.price;
            valueB = b.price;
            break;
          case 'created':
            valueA = a.createdAt;
            valueB = b.createdAt;
            break;
          default:
            valueA = a.name;
            valueB = b.name;
        }

        if (filters.sortOrder === 'desc') {
          return valueA > valueB ? -1 : valueA < valueB ? 1 : 0;
        } else {
          return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        }
      });
    }

    setFilteredProducts(filtered);
  }, [products, debouncedSearchQuery, filters, locale]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the debounced effect
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-96 bg-gray-300 rounded"></div>
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-yellow-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {locale === 'sv' ? 'Alla Produkter' : 'All Products'}
          </h1>
          <p className="text-gray-600">
            {locale === 'sv' 
              ? 'Upptäck vårt fullständiga sortiment av premium eteriska oljor och aromaterapi-produkter.'
              : 'Discover our complete range of premium essential oils and aromatherapy products.'
            }
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={locale === 'sv' ? 'Sök produkter...' : 'Search products...'}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
            />
          </form>
        </div>

        {/* Bundles Section */}
        {bundles.length > 0 && (
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-forest-800 mb-2">
                {locale === 'sv' ? 'Spara med våra paket' : 'Save with our bundles'}
              </h2>
              <p className="text-gray-600">
                {locale === 'sv'
                  ? 'Välj dina favoritoljor och spara upp till 16% jämfört med att köpa dem separat'
                  : 'Choose your favorite oils and save up to 16% compared to buying them separately'}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bundles.map((bundle) => {
                const config = bundleConfigs[bundle.id];
                if (!config) return null;
                return (
                  <BundleCard
                    key={bundle.id}
                    product={bundle}
                    requiredQuantity={config.requiredQuantity}
                    discountPercentage={config.discountPercentage}
                    locale={locale}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-gray-700">
            {locale === 'sv' 
              ? `Visar ${filteredProducts.length} av ${products.length} produkter`
              : `Showing ${filteredProducts.length} of ${products.length} products`
            }
            {debouncedSearchQuery && (
              <span className="font-medium">
                {locale === 'sv' ? ' för "' : ' for "'}
                {debouncedSearchQuery}"
              </span>
            )}
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <ProductFilters
              locale={locale}
              filters={filters}
              options={filterOptions}
              onFiltersChange={setFilters}
              className="sticky top-4"
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <ProductGrid
              products={filteredProducts}
              locale={locale}
              emptyMessage={
                debouncedSearchQuery
                  ? (locale === 'sv' 
                      ? `Inga produkter hittades för "${debouncedSearchQuery}"`
                      : `No products found for "${debouncedSearchQuery}"`)
                  : (locale === 'sv' 
                      ? 'Inga produkter matchar dina filter'
                      : 'No products match your filters')
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}