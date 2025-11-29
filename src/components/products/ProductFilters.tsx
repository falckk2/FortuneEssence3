'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Disclosure } from '@headlessui/react';

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

interface ProductFiltersProps {
  locale?: 'sv' | 'en';
  filters: ActiveFilters;
  options: FilterOptions;
  onFiltersChange: (filters: ActiveFilters) => void;
  className?: string;
}

export const ProductFilters = ({
  locale = 'sv',
  filters,
  options,
  onFiltersChange,
  className = ''
}: ProductFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ActiveFilters>(filters);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof ActiveFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters: ActiveFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.keys(localFilters).length > 0;

  const sortOptions = [
    { value: 'name-asc', label: locale === 'sv' ? 'Namn A-Ö' : 'Name A-Z', sortBy: 'name', sortOrder: 'asc' },
    { value: 'name-desc', label: locale === 'sv' ? 'Namn Ö-A' : 'Name Z-A', sortBy: 'name', sortOrder: 'desc' },
    { value: 'price-asc', label: locale === 'sv' ? 'Pris låg-hög' : 'Price low-high', sortBy: 'price', sortOrder: 'asc' },
    { value: 'price-desc', label: locale === 'sv' ? 'Pris hög-låg' : 'Price high-low', sortBy: 'price', sortOrder: 'desc' },
    { value: 'created-desc', label: locale === 'sv' ? 'Senast tillagda' : 'Newest first', sortBy: 'created', sortOrder: 'desc' },
  ];

  const getCurrentSortValue = () => {
    const sortBy = localFilters.sortBy || 'name';
    const sortOrder = localFilters.sortOrder || 'asc';
    return `${sortBy}-${sortOrder}`;
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-') as ['name' | 'price' | 'created', 'asc' | 'desc'];
    handleFilterChange('sortBy', sortBy);
    handleFilterChange('sortOrder', sortOrder);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 flex items-center justify-between text-sm font-medium text-gray-700"
        >
          <div className="flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            {locale === 'sv' ? 'Filter & Sortering' : 'Filters & Sorting'}
            {hasActiveFilters && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {Object.keys(localFilters).length}
              </span>
            )}
          </div>
          <ChevronDownIcon className={`h-5 w-5 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filter Content */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block p-4 space-y-6`}>
        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {locale === 'sv' ? 'Sortera efter' : 'Sort by'}
          </label>
          <select
            value={getCurrentSortValue()}
            onChange={(e) => handleSortChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Categories */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                <span>{locale === 'sv' ? 'Kategorier' : 'Categories'}</span>
                <ChevronDownIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`} />
              </Disclosure.Button>
              <Disclosure.Panel className="pt-4 pb-2 text-sm">
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category"
                      checked={!localFilters.category}
                      onChange={() => handleFilterChange('category', undefined)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                    />
                    <span className="ml-2 text-gray-700">
                      {locale === 'sv' ? 'Alla kategorier' : 'All categories'}
                    </span>
                  </label>
                  {options.categories.map((category) => (
                    <label key={category.category} className="flex items-center">
                      <input
                        type="radio"
                        name="category"
                        value={category.category}
                        checked={localFilters.category === category.category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                        className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <span className="ml-2 text-gray-700">
                        {category.displayName[locale]} ({category.count})
                      </span>
                    </label>
                  ))}
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Price Range */}
        <Disclosure defaultOpen>
          {({ open }) => (
            <>
              <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-purple-500 focus-visible:ring-opacity-75">
                <span>{locale === 'sv' ? 'Pris' : 'Price'}</span>
                <ChevronDownIcon className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`} />
              </Disclosure.Button>
              <Disclosure.Panel className="pt-4 pb-2 text-sm">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Min' : 'Min'}
                      </label>
                      <input
                        type="number"
                        min={options.priceRange.min}
                        max={options.priceRange.max}
                        value={localFilters.minPrice || ''}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder={`${options.priceRange.min}`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        {locale === 'sv' ? 'Max' : 'Max'}
                      </label>
                      <input
                        type="number"
                        min={options.priceRange.min}
                        max={options.priceRange.max}
                        value={localFilters.maxPrice || ''}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 text-sm"
                        placeholder={`${options.priceRange.max}`}
                      />
                    </div>
                  </div>
                </div>
              </Disclosure.Panel>
            </>
          )}
        </Disclosure>

        {/* Availability */}
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={localFilters.inStock || false}
              onChange={(e) => handleFilterChange('inStock', e.target.checked ? true : undefined)}
              className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">
              {locale === 'sv' ? 'Endast i lager' : 'In stock only'}
            </span>
          </label>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm font-medium text-purple-600 hover:text-purple-700 border border-purple-200 hover:border-purple-300 rounded-md transition-colors"
          >
            {locale === 'sv' ? 'Rensa alla filter' : 'Clear all filters'}
          </button>
        )}
      </div>
    </div>
  );
};