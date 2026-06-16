import { CartService } from '@/services/cart/CartService';
import type { ICartRepository, IProductRepository, IAbandonedCartRepository, IBundleService } from '@/interfaces';
import type { Cart, CartItem, Product } from '@/types';

describe('CartService.updateQuantity (ISSUE-027)', () => {
  let cartService: CartService;
  let mockCartRepository: jest.Mocked<ICartRepository>;
  let mockProductRepository: jest.Mocked<IProductRepository>;
  let mockAbandonedCartRepository: jest.Mocked<IAbandonedCartRepository>;
  let mockBundleService: jest.Mocked<IBundleService>;

  const product: Product = {
    id: 'prod-shared',
    name: 'Lavender Oil',
    description: 'Test product',
    price: 100,
    stock: 50,
    sku: 'LAV-001',
    category: 'oils',
    images: [],
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const regularItem: CartItem = {
    cartItemId: 'line-regular',
    productId: 'prod-shared',
    quantity: 1,
    price: 100,
    name: 'Lavender Oil',
    image: '/lavender.jpg',
  };

  const bundleItem: CartItem = {
    cartItemId: 'line-bundle',
    productId: 'prod-shared',
    quantity: 2,
    price: 90,
    name: 'Bundle Lavender Oil',
    image: '/bundle.jpg',
    bundleId: 'bundle-1',
  };

  const cart: Cart = {
    id: 'cart-1',
    items: [regularItem, bundleItem],
    total: 280,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockCartRepository = {
      findByUserId: jest.fn(),
      findBySessionId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      mergeGuestCartToUser: jest.fn(),
    } as any;

    mockProductRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findByCategory: jest.fn(),
      findBySku: jest.fn(),
      findFeatured: jest.fn(),
      getCategories: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    mockAbandonedCartRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByCartId: jest.fn(),
      findByRecoveryToken: jest.fn(),
      findForReminder: jest.fn(),
      markReminded: jest.fn(),
      markRecovered: jest.fn(),
      markExpired: jest.fn(),
    } as any;

    mockBundleService = {
      getBundleConfiguration: jest.fn(),
      getAllBundleConfigurations: jest.fn(),
      getEligibleProducts: jest.fn(),
      validateBundleSelection: jest.fn(),
      calculateBundlePrice: jest.fn(),
    } as any;

    cartService = new CartService(
      mockCartRepository,
      mockProductRepository,
      mockAbandonedCartRepository,
      mockBundleService
    );

    mockProductRepository.findById.mockResolvedValue({ success: true, data: product });
    mockCartRepository.findById.mockResolvedValue({ success: true, data: cart });
    mockCartRepository.update.mockImplementation(async (_cartId, updates) => ({
      success: true,
      data: { ...cart, ...updates },
    }));
  });

  it('updates only the line item matching cartItemId when duplicate productIds exist', async () => {
    const result = await cartService.updateQuantity('cart-1', 'prod-shared', 5, 'line-regular');

    expect(result.success).toBe(true);
    expect(mockCartRepository.update).toHaveBeenCalledWith('cart-1', {
      items: [
        { ...regularItem, quantity: 5, price: 100 },
        bundleItem,
      ],
      total: expect.any(Number),
    });
  });

  it('falls back to productId matching when cartItemId is omitted', async () => {
    const result = await cartService.updateQuantity('cart-1', 'prod-shared', 4);

    expect(result.success).toBe(true);
    expect(mockCartRepository.update).toHaveBeenCalledWith('cart-1', {
      items: [
        { ...regularItem, quantity: 4, price: 100 },
        { ...bundleItem, quantity: 4, price: 100 },
      ],
      total: expect.any(Number),
    });
  });
});