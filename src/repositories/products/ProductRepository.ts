import { injectable, inject } from 'tsyringe';
import { SupabaseClient } from '@supabase/supabase-js';
import type { IProductRepository } from '@/interfaces';
import { ProductSearchParams } from '@/interfaces';
import { Product, ApiResponse, ProductCategory } from '@/types';
import { TOKENS } from '@/config/di-container';

// Mock data for development
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Lavender Essential Oil',
    description: 'Premium organic lavender essential oil from Provence. Perfect for relaxation and aromatherapy.',
    price: 299,
    category: 'essential-oils' as ProductCategory,
    images: ['/images/products/lavender-oil.jpg'],
    stock: 25,
    sku: 'LAV-001',
    weight: 30,
    dimensions: {
      length: 3,
      width: 3,
      height: 8,
    },
    isActive: true,
    translations: {
      sv: {
        name: 'Lavendel Eterisk Olja',
        description: 'Premium ekologisk lavendel eterisk olja från Provence. Perfekt för avkoppling och aromaterapi.',
      },
      en: {
        name: 'Lavender Essential Oil',
        description: 'Premium organic lavender essential oil from Provence. Perfect for relaxation and aromatherapy.',
      },
    },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
];

@injectable()
export class ProductRepository implements IProductRepository {
  private readonly tableName = 'products';

  constructor(
    @inject(TOKENS.SupabaseClient) private readonly supabase: SupabaseClient
  ) {}

  async findAll(params?: ProductSearchParams): Promise<ApiResponse<Product[]>> {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (params?.category) {
        query = query.eq('category', params.category);
      }

      if (params?.minPrice) {
        query = query.gte('price', params.minPrice);
      }

      if (params?.maxPrice) {
        query = query.lte('price', params.maxPrice);
      }

      if (params?.inStock) {
        query = query.gt('stock', 0);
      }

      if (params?.search) {
        const searchTerm = `%${params.search.toLowerCase()}%`;
        if (params.locale === 'sv') {
          query = query.or(`name_sv.ilike.${searchTerm},description_sv.ilike.${searchTerm}`);
        } else {
          query = query.or(`name_en.ilike.${searchTerm},description_en.ilike.${searchTerm}`);
        }
      }

      // Order by name
      query = query.order('name');

      const { data, error } = await query;

      if (error) {
        // Fallback to mock data for development
        console.warn('Supabase error, using mock data:', error.message);
        return this.getMockData(params);
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      // Fallback to mock data for development
      console.warn('Database connection failed, using mock data:', error);
      return this.getMockData(params);
    }
  }

  async findById(id: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Fallback to mock data
          const product = mockProducts.find(p => p.id === id);
          if (product) {
            return { success: true, data: product };
          }
          return {
            success: false,
            error: 'Product not found',
          };
        }
        // Fallback to mock data for other errors
        const product = mockProducts.find(p => p.id === id);
        if (product) {
          return { success: true, data: product };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      // Fallback to mock data
      const product = mockProducts.find(p => p.id === id);
      if (product) {
        return { success: true, data: product };
      }
      return {
        success: false,
        error: `Failed to find product: ${error}`,
      };
    }
  }

  async findByCategory(category: string): Promise<ApiResponse<Product[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('name');

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to fetch products by category: ${error}`,
      };
    }
  }

  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Product>> {
    try {
      const productData = {
        name: product.name,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        stock: product.stock,
        sku: product.sku,
        weight: product.weight,
        length: product.dimensions.length,
        width: product.dimensions.width,
        height: product.dimensions.height,
        is_active: product.isActive,
        name_sv: product.translations.sv.name,
        description_sv: product.translations.sv.description,
        name_en: product.translations.en.name,
        description_en: product.translations.en.description,
      };

      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(productData)
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Product with this SKU already exists',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create product: ${error}`,
      };
    }
  }

  async update(id: string, product: Partial<Product>): Promise<ApiResponse<Product>> {
    try {
      const updateData: any = {};

      if (product.name) updateData.name = product.name;
      if (product.description) updateData.description = product.description;
      if (product.price !== undefined) updateData.price = product.price;
      if (product.category) updateData.category = product.category;
      if (product.images) updateData.images = product.images;
      if (product.stock !== undefined) updateData.stock = product.stock;
      if (product.sku) updateData.sku = product.sku;
      if (product.weight !== undefined) updateData.weight = product.weight;
      if (product.dimensions) {
        if (product.dimensions.length) updateData.length = product.dimensions.length;
        if (product.dimensions.width) updateData.width = product.dimensions.width;
        if (product.dimensions.height) updateData.height = product.dimensions.height;
      }
      if (product.isActive !== undefined) updateData.is_active = product.isActive;
      if (product.translations) {
        if (product.translations.sv) {
          updateData.name_sv = product.translations.sv.name;
          updateData.description_sv = product.translations.sv.description;
        }
        if (product.translations.en) {
          updateData.name_en = product.translations.en.name;
          updateData.description_en = product.translations.en.description;
        }
      }

      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: false,
          error: 'Product not found',
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to update product: ${error}`,
      };
    }
  }

  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      // Soft delete by setting is_active to false
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to delete product: ${error}`,
      };
    }
  }

  private transformDbRecord(record: any): Product {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      price: record.price,
      category: record.category as ProductCategory,
      images: record.images || [],
      stock: record.stock,
      sku: record.sku,
      weight: record.weight,
      dimensions: {
        length: record.length,
        width: record.width,
        height: record.height,
      },
      isActive: record.is_active,
      translations: {
        sv: {
          name: record.name_sv,
          description: record.description_sv,
        },
        en: {
          name: record.name_en,
          description: record.description_en,
        },
      },
      createdAt: new Date(record.created_at),
      updatedAt: new Date(record.updated_at),
    };
  }

  // Additional methods for specific product queries
  async findFeatured(limit: number = 8): Promise<ApiResponse<Product[]>> {
    try {
      // Get featured products (you could add a featured flag to the schema)
      // For now, get the most recently added products
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .gt('stock', 0)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        // Fallback to mock data
        return {
          success: true,
          data: mockProducts.slice(0, limit),
        };
      }

      return {
        success: true,
        data: data.map(record => this.transformDbRecord(record)),
      };
    } catch (error) {
      // Fallback to mock data
      return {
        success: true,
        data: mockProducts.slice(0, limit),
      };
    }
  }

  async findBySku(sku: string): Promise<ApiResponse<Product>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('sku', sku)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return {
            success: false,
            error: 'Product not found',
          };
        }
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data: this.transformDbRecord(data),
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to find product by SKU: ${error}`,
      };
    }
  }

  async getCategories(): Promise<ApiResponse<{ category: string; count: number }[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('category')
        .eq('is_active', true);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Count products by category
      const categoryCounts: { [key: string]: number } = {};
      data.forEach(item => {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
      });

      const categories = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
      }));

      return {
        success: true,
        data: categories,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get categories: ${error}`,
      };
    }
  }

  // Helper method to filter mock data based on search parameters
  private getMockData(params?: ProductSearchParams): ApiResponse<Product[]> {
    let filteredProducts = mockProducts.filter(p => p.isActive);

    // Apply filters
    if (params?.category) {
      filteredProducts = filteredProducts.filter(p => p.category === params.category);
    }

    if (params?.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price >= params.minPrice!);
    }

    if (params?.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(p => p.price <= params.maxPrice!);
    }

    if (params?.inStock) {
      filteredProducts = filteredProducts.filter(p => p.stock > 0);
    }

    if (params?.search) {
      const searchTerm = params.search.toLowerCase();
      filteredProducts = filteredProducts.filter(p => {
        if (params.locale === 'sv') {
          return (
            p.translations.sv.name.toLowerCase().includes(searchTerm) ||
            p.translations.sv.description.toLowerCase().includes(searchTerm)
          );
        } else {
          return (
            p.translations.en.name.toLowerCase().includes(searchTerm) ||
            p.translations.en.description.toLowerCase().includes(searchTerm)
          );
        }
      });
    }

    // Sort by name
    filteredProducts.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: filteredProducts,
    };
  }
}