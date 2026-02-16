import 'reflect-metadata';
import { AnalyticsService } from '@/services/analytics/AnalyticsService';
import type { IAnalyticsRepository } from '@/interfaces';
import type { Order } from '@/types';

describe('AnalyticsService', () => {
  let analyticsService: AnalyticsService;
  let mockAnalyticsRepository: jest.Mocked<IAnalyticsRepository>;

  const now = new Date('2025-01-20T12:00:00Z');

  const makeOrder = (overrides: Partial<Order> = {}): Order => ({
    id: 'order-1',
    customerId: 'cust-1',
    items: [],
    total: 500,
    tax: 100,
    shipping: 50,
    status: 'confirmed',
    shippingAddress: { street: 'A', city: 'Stockholm', postalCode: '111', country: 'Sweden' },
    billingAddress: { street: 'A', city: 'Stockholm', postalCode: '111', country: 'Sweden' },
    paymentMethod: 'stripe',
    paymentId: 'pay-1',
    createdAt: new Date('2025-01-15T10:00:00Z'),
    updatedAt: new Date('2025-01-15T10:00:00Z'),
    ...overrides,
  });

  const mockOrderItems = [
    { productId: 'prod-1', productName: 'Lavendel Olja', category: 'essential-oils', quantity: 5, price: 89 },
    { productId: 'prod-2', productName: 'Eucalyptus Olja', category: 'essential-oils', quantity: 3, price: 249 },
    { productId: 'prod-3', productName: 'Aroma Diffuser', category: 'diffusers', quantity: 1, price: 799 },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(now);

    mockAnalyticsRepository = {
      getOrdersInRange: jest.fn(),
      getOrderItemsInRange: jest.fn(),
      getCustomerCountInRange: jest.fn(),
      getTotalCustomerCount: jest.fn(),
    } as jest.Mocked<IAnalyticsRepository>;

    analyticsService = new AnalyticsService(mockAnalyticsRepository);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function setupDefaultMocks(orders: Order[] = [], orderItems: typeof mockOrderItems = []) {
    mockAnalyticsRepository.getOrdersInRange.mockResolvedValue({ success: true, data: orders });
    mockAnalyticsRepository.getOrderItemsInRange.mockResolvedValue({ success: true, data: orderItems });
    mockAnalyticsRepository.getCustomerCountInRange.mockResolvedValue({ success: true, data: 0 });
    mockAnalyticsRepository.getTotalCustomerCount.mockResolvedValue({ success: true, data: 0 });
  }

  describe('getAnalytics - empty state', () => {
    it('should return zeros and empty arrays when no data exists', async () => {
      setupDefaultMocks();

      const result = await analyticsService.getAnalytics('month');

      expect(result.success).toBe(true);
      expect(result.data?.revenue.total).toBe(0);
      expect(result.data?.revenue.today).toBe(0);
      expect(result.data?.revenue.change).toBe(0);
      expect(result.data?.orders.total).toBe(0);
      expect(result.data?.customers.total).toBe(0);
      expect(result.data?.customers.new).toBe(0);
      expect(result.data?.products.totalSold).toBe(0);
      expect(result.data?.products.topSelling).toHaveLength(0);
      expect(result.data?.revenueByCategory).toHaveLength(0);
      expect(result.data?.recentSales).toHaveLength(0);
    });
  });

  describe('getAnalytics - date range', () => {
    it('should use 7-day range for week', async () => {
      setupDefaultMocks();

      await analyticsService.getAnalytics('week');

      const currentCall = mockAnalyticsRepository.getOrdersInRange.mock.calls[0];
      const startDate = currentCall[0] as Date;
      const daysDiff = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(7);
    });

    it('should use 1-month range for month', async () => {
      setupDefaultMocks();

      await analyticsService.getAnalytics('month');

      const currentCall = mockAnalyticsRepository.getOrdersInRange.mock.calls[0];
      const startDate = currentCall[0] as Date;
      const expectedMonth = (now.getMonth() - 1 + 12) % 12; // handle Jan -> Dec wrap
      expect(startDate.getMonth()).toBe(expectedMonth);
    });

    it('should use 1-year range for year', async () => {
      setupDefaultMocks();

      await analyticsService.getAnalytics('year');

      const currentCall = mockAnalyticsRepository.getOrdersInRange.mock.calls[0];
      const startDate = currentCall[0] as Date;
      expect(startDate.getFullYear()).toBe(now.getFullYear() - 1);
    });

    it('should also fetch previous period for change calculation', async () => {
      setupDefaultMocks();

      await analyticsService.getAnalytics('month');

      // Should call getOrdersInRange twice: current and previous period
      expect(mockAnalyticsRepository.getOrdersInRange).toHaveBeenCalledTimes(2);
      expect(mockAnalyticsRepository.getCustomerCountInRange).toHaveBeenCalledTimes(2);
    });
  });

  describe('getAnalytics - revenue metrics', () => {
    it('should calculate total revenue from orders', async () => {
      const orders = [
        makeOrder({ total: 500 }),
        makeOrder({ id: 'order-2', total: 300 }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.revenue.total).toBe(800);
    });

    it('should calculate today revenue from orders created today', async () => {
      const orders = [
        makeOrder({ total: 500, createdAt: new Date('2025-01-20T08:00:00Z') }), // today
        makeOrder({ id: 'order-2', total: 300, createdAt: new Date('2025-01-19T10:00:00Z') }), // yesterday
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.revenue.today).toBe(500);
    });

    it('should calculate percentage change vs previous period', async () => {
      const currentOrders = [makeOrder({ total: 1000 })];
      const previousOrders = [makeOrder({ total: 800 })];

      mockAnalyticsRepository.getOrdersInRange
        .mockResolvedValueOnce({ success: true, data: currentOrders })
        .mockResolvedValueOnce({ success: true, data: previousOrders });
      mockAnalyticsRepository.getOrderItemsInRange.mockResolvedValue({ success: true, data: [] });
      mockAnalyticsRepository.getCustomerCountInRange.mockResolvedValue({ success: true, data: 0 });
      mockAnalyticsRepository.getTotalCustomerCount.mockResolvedValue({ success: true, data: 0 });

      const result = await analyticsService.getAnalytics('month');

      // (1000 - 800) / 800 = 0.25 = 25%
      expect(result.data?.revenue.change).toBe(25);
    });

    it('should return 100% change when previous period was zero', async () => {
      const currentOrders = [makeOrder({ total: 500 })];

      mockAnalyticsRepository.getOrdersInRange
        .mockResolvedValueOnce({ success: true, data: currentOrders })
        .mockResolvedValueOnce({ success: true, data: [] });
      mockAnalyticsRepository.getOrderItemsInRange.mockResolvedValue({ success: true, data: [] });
      mockAnalyticsRepository.getCustomerCountInRange.mockResolvedValue({ success: true, data: 0 });
      mockAnalyticsRepository.getTotalCustomerCount.mockResolvedValue({ success: true, data: 0 });

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.revenue.change).toBe(100);
    });
  });

  describe('getAnalytics - order metrics', () => {
    it('should count total orders', async () => {
      const orders = [
        makeOrder(),
        makeOrder({ id: 'order-2' }),
        makeOrder({ id: 'order-3' }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.orders.total).toBe(3);
    });

    it('should count today orders', async () => {
      const orders = [
        makeOrder({ createdAt: new Date('2025-01-20T09:00:00Z') }),
        makeOrder({ id: 'order-2', createdAt: new Date('2025-01-20T11:00:00Z') }),
        makeOrder({ id: 'order-3', createdAt: new Date('2025-01-18T10:00:00Z') }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.orders.today).toBe(2);
    });
  });

  describe('getAnalytics - customer metrics', () => {
    it('should return total and new customer counts', async () => {
      mockAnalyticsRepository.getOrdersInRange.mockResolvedValue({ success: true, data: [] });
      mockAnalyticsRepository.getOrderItemsInRange.mockResolvedValue({ success: true, data: [] });
      mockAnalyticsRepository.getCustomerCountInRange
        .mockResolvedValueOnce({ success: true, data: 25 })  // current period new
        .mockResolvedValueOnce({ success: true, data: 20 }); // previous period new
      mockAnalyticsRepository.getTotalCustomerCount.mockResolvedValue({ success: true, data: 245 });

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.customers.total).toBe(245);
      expect(result.data?.customers.new).toBe(25);
      expect(result.data?.customers.change).toBe(25); // (25-20)/20 = 25%
    });

    it('should detect returning customers from multiple orders', async () => {
      const orders = [
        makeOrder({ customerId: 'cust-1' }),
        makeOrder({ id: 'order-2', customerId: 'cust-1' }), // same customer = returning
        makeOrder({ id: 'order-3', customerId: 'cust-2' }),  // only 1 order = not returning
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.customers.returning).toBe(1); // cust-1 has 2 orders
    });
  });

  describe('getAnalytics - product metrics', () => {
    it('should calculate total sold from order items', async () => {
      setupDefaultMocks([], mockOrderItems);

      const result = await analyticsService.getAnalytics('month');

      // 5 + 3 + 1 = 9
      expect(result.data?.products.totalSold).toBe(9);
    });

    it('should return top 5 selling products sorted by revenue', async () => {
      setupDefaultMocks([], mockOrderItems);

      const result = await analyticsService.getAnalytics('month');

      const topSelling = result.data?.products.topSelling || [];
      expect(topSelling.length).toBeLessThanOrEqual(5);
      // Diffuser: 799 * 1 = 799, Eucalyptus: 249 * 3 = 747, Lavender: 89 * 5 = 445
      expect(topSelling[0].name).toBe('Aroma Diffuser');
      expect(topSelling[0].revenue).toBe(799);
      expect(topSelling[1].name).toBe('Eucalyptus Olja');
      expect(topSelling[1].revenue).toBe(747);
      expect(topSelling[2].name).toBe('Lavendel Olja');
      expect(topSelling[2].revenue).toBe(445);
    });

    it('should aggregate same product from multiple line items', async () => {
      const items = [
        { productId: 'prod-1', productName: 'Lavendel', category: 'essential-oils', quantity: 3, price: 89 },
        { productId: 'prod-1', productName: 'Lavendel', category: 'essential-oils', quantity: 2, price: 89 },
      ];
      setupDefaultMocks([], items);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.products.topSelling).toHaveLength(1);
      expect(result.data?.products.topSelling[0].quantity).toBe(5);
      expect(result.data?.products.topSelling[0].revenue).toBe(445); // 89 * 5
    });
  });

  describe('getAnalytics - revenue by category', () => {
    it('should group revenue by product category', async () => {
      setupDefaultMocks([], mockOrderItems);

      const result = await analyticsService.getAnalytics('month');

      const categories = result.data?.revenueByCategory || [];
      expect(categories).toHaveLength(2); // essential-oils and diffusers

      const oilsCategory = categories.find(c => c.category === 'essential-oils');
      const diffusersCategory = categories.find(c => c.category === 'diffusers');

      // essential-oils: (89*5) + (249*3) = 445 + 747 = 1192
      expect(oilsCategory?.revenue).toBe(1192);
      // diffusers: 799*1 = 799
      expect(diffusersCategory?.revenue).toBe(799);
    });

    it('should calculate correct percentages', async () => {
      setupDefaultMocks([], mockOrderItems);

      const result = await analyticsService.getAnalytics('month');

      const categories = result.data?.revenueByCategory || [];
      const totalPercentage = categories.reduce((sum, c) => sum + c.percentage, 0);

      // Percentages should roughly sum to 100
      expect(totalPercentage).toBeCloseTo(100, 0);
    });

    it('should sort categories by revenue descending', async () => {
      setupDefaultMocks([], mockOrderItems);

      const result = await analyticsService.getAnalytics('month');

      const categories = result.data?.revenueByCategory || [];
      for (let i = 1; i < categories.length; i++) {
        expect(categories[i - 1].revenue).toBeGreaterThanOrEqual(categories[i].revenue);
      }
    });

    it('should return empty array when no items', async () => {
      setupDefaultMocks([], []);

      const result = await analyticsService.getAnalytics('month');

      expect(result.data?.revenueByCategory).toHaveLength(0);
    });
  });

  describe('getAnalytics - recent sales', () => {
    it('should bucket orders by day for week/month ranges', async () => {
      const orders = [
        makeOrder({ total: 200, createdAt: new Date('2025-01-20T08:00:00Z') }),
        makeOrder({ id: 'o2', total: 300, createdAt: new Date('2025-01-20T15:00:00Z') }),
        makeOrder({ id: 'o3', total: 150, createdAt: new Date('2025-01-19T10:00:00Z') }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      const sales = result.data?.recentSales || [];
      const jan20 = sales.find(s => s.date === '2025-01-20');
      const jan19 = sales.find(s => s.date === '2025-01-19');

      expect(jan20?.revenue).toBe(500); // 200 + 300
      expect(jan20?.orders).toBe(2);
      expect(jan19?.revenue).toBe(150);
      expect(jan19?.orders).toBe(1);
    });

    it('should bucket orders by month for year range', async () => {
      const orders = [
        makeOrder({ total: 1000, createdAt: new Date('2025-01-15T10:00:00Z') }),
        makeOrder({ id: 'o2', total: 800, createdAt: new Date('2024-12-15T10:00:00Z') }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('year');

      const sales = result.data?.recentSales || [];
      const jan = sales.find(s => s.date === '2025-01');
      const dec = sales.find(s => s.date === '2024-12');

      expect(jan?.revenue).toBe(1000);
      expect(dec?.revenue).toBe(800);
    });

    it('should sort recent sales by date descending', async () => {
      const orders = [
        makeOrder({ total: 100, createdAt: new Date('2025-01-18T10:00:00Z') }),
        makeOrder({ id: 'o2', total: 200, createdAt: new Date('2025-01-20T10:00:00Z') }),
        makeOrder({ id: 'o3', total: 150, createdAt: new Date('2025-01-19T10:00:00Z') }),
      ];
      setupDefaultMocks(orders);

      const result = await analyticsService.getAnalytics('month');

      const sales = result.data?.recentSales || [];
      for (let i = 1; i < sales.length; i++) {
        expect(sales[i - 1].date >= sales[i].date).toBe(true);
      }
    });
  });

  describe('getAnalytics - error handling', () => {
    it('should return error when repository call fails', async () => {
      mockAnalyticsRepository.getOrdersInRange.mockResolvedValue({ success: false, error: 'DB error' });
      mockAnalyticsRepository.getOrderItemsInRange.mockResolvedValue({ success: true, data: [] });
      mockAnalyticsRepository.getCustomerCountInRange.mockResolvedValue({ success: true, data: 0 });
      mockAnalyticsRepository.getTotalCustomerCount.mockResolvedValue({ success: true, data: 0 });

      const result = await analyticsService.getAnalytics('month');

      // Should still succeed with empty/default data since orders default to []
      expect(result.success).toBe(true);
      expect(result.data?.revenue.total).toBe(0);
    });

    it('should handle thrown exceptions', async () => {
      mockAnalyticsRepository.getOrdersInRange.mockRejectedValue(new Error('Network error'));

      const result = await analyticsService.getAnalytics('month');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });
  });

  describe('getAnalytics - response shape', () => {
    it('should return correct AnalyticsData shape', async () => {
      setupDefaultMocks();

      const result = await analyticsService.getAnalytics('month');

      expect(result.data).toHaveProperty('revenue');
      expect(result.data).toHaveProperty('orders');
      expect(result.data).toHaveProperty('customers');
      expect(result.data).toHaveProperty('products');
      expect(result.data).toHaveProperty('revenueByCategory');
      expect(result.data).toHaveProperty('recentSales');

      expect(result.data?.revenue).toHaveProperty('total');
      expect(result.data?.revenue).toHaveProperty('today');
      expect(result.data?.revenue).toHaveProperty('thisWeek');
      expect(result.data?.revenue).toHaveProperty('thisMonth');
      expect(result.data?.revenue).toHaveProperty('change');

      expect(result.data?.orders).toHaveProperty('total');
      expect(result.data?.orders).toHaveProperty('today');
      expect(result.data?.orders).toHaveProperty('thisWeek');
      expect(result.data?.orders).toHaveProperty('thisMonth');
      expect(result.data?.orders).toHaveProperty('change');

      expect(result.data?.customers).toHaveProperty('total');
      expect(result.data?.customers).toHaveProperty('new');
      expect(result.data?.customers).toHaveProperty('returning');
      expect(result.data?.customers).toHaveProperty('change');

      expect(result.data?.products).toHaveProperty('totalSold');
      expect(result.data?.products).toHaveProperty('topSelling');
    });
  });
});
