import 'reflect-metadata';
import { OrderService } from '@/services/orders/OrderService';
import {
  IOrderRepository,
  ICartService,
  IPaymentService,
  IShippingService,
  IInventoryService,
  IProductService,
  CreateOrderData,
} from '@/interfaces';
import { Order, CartItem, OrderItem, ApiResponse, ShippingRate } from '@/types';

describe('OrderService', () => {
  let orderService: OrderService;
  let mockOrderRepository: jest.Mocked<IOrderRepository>;
  let mockCartService: jest.Mocked<ICartService>;
  let mockPaymentService: jest.Mocked<IPaymentService>;
  let mockShippingService: jest.Mocked<IShippingService>;
  let mockInventoryService: jest.Mocked<IInventoryService>;
  let mockProductService: jest.Mocked<IProductService>;

  const mockCartItems: CartItem[] = [
    {
      productId: 'prod-1',
      quantity: 2,
      price: 299.99,
    },
    {
      productId: 'prod-2',
      quantity: 1,
      price: 149.99,
    },
  ];

  const mockOrderData: CreateOrderData = {
    customerId: 'cust-1',
    items: mockCartItems,
    shippingAddress: {
      street: 'Test Street 1',
      city: 'Stockholm',
      postalCode: '11122',
      country: 'Sweden',
    },
    billingAddress: {
      street: 'Test Street 1',
      city: 'Stockholm',
      postalCode: '11122',
      country: 'Sweden',
    },
    paymentMethod: 'stripe',
    shippingRateId: 'rate-1',
  };

  const mockOrder: Order = {
    id: 'order-1',
    customerId: 'cust-1',
    items: [
      {
        productId: 'prod-1',
        productName: 'Product 1',
        quantity: 2,
        price: 299.99,
        total: 599.98,
      },
    ],
    status: 'confirmed',
    tax: 187.48,
    shipping: 50,
    total: 987.46,
    paymentMethod: 'stripe',
    paymentId: 'pay-1',
    shippingAddress: mockOrderData.shippingAddress,
    billingAddress: mockOrderData.billingAddress,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOrderRepository = {
      findAll: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      findByCustomerId: jest.fn(),
      findByStatus: jest.fn(),
      findByTrackingNumber: jest.fn(),
      update: jest.fn(),
      updateStatus: jest.fn(),
      delete: jest.fn(),
      getOrderStatistics: jest.fn(),
      getRecentOrders: jest.fn(),
    } as jest.Mocked<IOrderRepository>;

    mockCartService = {
      getCart: jest.fn(),
      addItem: jest.fn(),
      removeItem: jest.fn(),
      updateQuantity: jest.fn(),
      clearCart: jest.fn(),
      calculateTotal: jest.fn(),
      validateCartItems: jest.fn(),
      syncCartPrices: jest.fn(),
      mergeGuestCart: jest.fn(),
      getCartSummary: jest.fn(),
    } as any;

    mockPaymentService = {
      processPayment: jest.fn(),
      verifyPayment: jest.fn(),
      refundPayment: jest.fn(),
      cancelPayment: jest.fn(),
    } as any;

    mockShippingService = {
      getShippingRates: jest.fn(),
      calculateShipping: jest.fn(),
      createShipment: jest.fn(),
      trackShipment: jest.fn(),
      validateDeliveryAddress: jest.fn(),
      estimateDeliveryDate: jest.fn(),
      getSupportedCountries: jest.fn(),
      getShippingCosts: jest.fn(),
    } as any;

    mockInventoryService = {
      checkAvailability: jest.fn(),
      reserveStock: jest.fn(),
      releaseReservation: jest.fn(),
      updateStock: jest.fn(),
      completeReservation: jest.fn(),
      getLowStockAlerts: jest.fn(),
    } as any;

    mockProductService = {
      getProduct: jest.fn(),
      getProducts: jest.fn(),
      searchProducts: jest.fn(),
      getProductsByCategory: jest.fn(),
      getFeaturedProducts: jest.fn(),
    } as any;

    orderService = new OrderService(
      mockOrderRepository,
      mockCartService,
      mockPaymentService,
      mockShippingService,
      mockInventoryService,
      mockProductService
    );
  });

  describe('createOrder', () => {
    beforeEach(() => {
      // Setup default happy path mocks
      mockInventoryService.checkAvailability.mockResolvedValue({
        success: true,
        data: true,
      });

      const shippingRate: ShippingRate = {
        id: 'rate-1',
        name: 'Standard Shipping',
        description: 'Standard delivery',
        price: 50,
        estimatedDays: 3,
        country: 'SE',
        carrierCode: 'postnord',
        maxWeight: 10,
      };

      mockShippingService.calculateShipping.mockResolvedValue({
        success: true,
        data: shippingRate,
      });

      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        data: {
          paymentId: 'pay-1',
          status: 'success',
        },
      });

      mockInventoryService.reserveStock.mockResolvedValue({
        success: true,
        data: 'reservation-1',
      });

      mockProductService.getProduct.mockResolvedValue({
        success: true,
        data: {
          id: 'prod-1',
          name: 'Product 1',
          price: 299.99,
        } as any,
      });

      mockOrderRepository.create.mockResolvedValue({
        success: true,
        data: mockOrder,
      });

      mockInventoryService.completeReservation.mockResolvedValue({
        success: true,
      });

      mockShippingService.createShipment.mockResolvedValue({
        success: true,
        data: {
          id: 'shipment-1',
          orderId: 'order-1',
          trackingNumber: 'TRACK-123',
          carrier: 'PostNord',
          status: 'pending',
          estimatedDelivery: new Date(),
        },
      });

      mockCartService.getCart.mockResolvedValue({
        success: true,
        data: {
          id: 'cart-1',
          userId: 'cust-1',
          items: mockCartItems,
          total: 749.97,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      mockCartService.clearCart.mockResolvedValue({
        success: true,
      });
    });

    it('should create an order successfully', async () => {
      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
      expect(mockInventoryService.checkAvailability).toHaveBeenCalled();
      expect(mockShippingService.calculateShipping).toHaveBeenCalled();
      expect(mockPaymentService.processPayment).toHaveBeenCalled();
      expect(mockInventoryService.reserveStock).toHaveBeenCalled();
      expect(mockOrderRepository.create).toHaveBeenCalled();
    });

    it('should validate stock before creating order', async () => {
      // Arrange
      mockInventoryService.checkAvailability.mockResolvedValue({
        success: false,
        error: 'Product not available',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Product not available');
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should calculate correct totals with tax and shipping', async () => {
      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      const paymentCall = mockPaymentService.processPayment.mock.calls[0][0];
      // Subtotal: 299.99 * 2 + 149.99 * 1 = 749.97
      // Tax: 749.97 * 0.25 = 187.4925
      // Shipping: 50
      // Total: 987.4625
      expect(paymentCall.amount).toBeCloseTo(987.46, 2);
    });

    it('should handle shipping calculation failure', async () => {
      // Arrange
      mockShippingService.calculateShipping.mockResolvedValue({
        success: false,
        error: 'Shipping not available',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Shipping calculation failed');
    });

    it('should handle payment failure', async () => {
      // Arrange
      mockPaymentService.processPayment.mockResolvedValue({
        success: false,
        error: 'Payment declined',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Payment processing failed');
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should handle stock reservation failure', async () => {
      // Arrange
      mockInventoryService.reserveStock.mockResolvedValue({
        success: false,
        error: 'Cannot reserve stock',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Stock reservation failed');
      expect(mockOrderRepository.create).not.toHaveBeenCalled();
    });

    it('should release stock reservation if order creation fails', async () => {
      // Arrange
      mockOrderRepository.create.mockResolvedValue({
        success: false,
        error: 'Database error',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith('reservation-1');
    });

    it('should create shipment for successful payment', async () => {
      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      expect(mockShippingService.createShipment).toHaveBeenCalledWith('order-1', 'rate-1');
    });

    it('should clear cart after successful order', async () => {
      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      expect(mockCartService.clearCart).toHaveBeenCalledWith('cart-1');
    });

    it('should transform cart items to order items', async () => {
      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      const createCall = mockOrderRepository.create.mock.calls[0][0];
      expect(createCall.items).toBeInstanceOf(Array);
      expect(createCall.items[0]).toHaveProperty('productName');
      expect(createCall.items[0]).toHaveProperty('total');
    });

    it('should handle product not found during cart item transformation', async () => {
      // Arrange
      mockProductService.getProduct.mockResolvedValue({
        success: false,
        error: 'Product not found',
      });

      // Act
      const result = await orderService.createOrder(mockOrderData);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Product with ID prod-1 not found');
    });

    it('should set order status to confirmed for successful payment', async () => {
      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      const createCall = mockOrderRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe('confirmed');
    });

    it('should set order status to pending for pending payment', async () => {
      // Arrange
      mockPaymentService.processPayment.mockResolvedValue({
        success: true,
        data: {
          paymentId: 'pay-1',
          status: 'pending',
        },
      });

      // Act
      await orderService.createOrder(mockOrderData);

      // Assert
      const createCall = mockOrderRepository.create.mock.calls[0][0];
      expect(createCall.status).toBe('pending');
    });
  });

  describe('getOrder', () => {
    it('should return order by ID', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: mockOrder,
      });

      // Act
      const result = await orderService.getOrder('order-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockOrder);
      expect(mockOrderRepository.findById).toHaveBeenCalledWith('order-1');
    });

    it('should handle order not found', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      // Act
      const result = await orderService.getOrder('non-existent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('getUserOrders', () => {
    it('should return all orders for a user', async () => {
      // Arrange
      const orders = [mockOrder, { ...mockOrder, id: 'order-2' }];
      mockOrderRepository.findByCustomerId.mockResolvedValue({
        success: true,
        data: orders,
      });

      // Act
      const result = await orderService.getUserOrders('cust-1');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(orders);
      expect(mockOrderRepository.findByCustomerId).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      // Arrange
      mockOrderRepository.updateStatus.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'shipped' },
      });

      // Act
      const result = await orderService.updateOrderStatus('order-1', 'shipped');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('shipped');
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'shipped');
    });

    it('should handle status update to confirmed', async () => {
      // Arrange
      const unconfirmedOrder = { ...mockOrder, status: 'pending' as any, trackingNumber: undefined };
      mockOrderRepository.updateStatus.mockResolvedValue({
        success: true,
        data: unconfirmedOrder,
      });
      mockShippingService.getShippingRates.mockResolvedValue({
        success: true,
        data: [{ id: 'rate-1', name: 'Standard', description: 'Standard delivery', price: 50, estimatedDays: 3, country: 'SE', carrierCode: 'postnord', maxWeight: 10 }],
      });
      mockShippingService.createShipment.mockResolvedValue({
        success: true,
        data: {
          id: 'shipment-1',
          orderId: 'order-1',
          trackingNumber: 'TRACK-123',
          carrier: 'PostNord',
          status: 'pending',
          estimatedDelivery: new Date(),
        },
      });

      // Act
      await orderService.updateOrderStatus('order-1', 'confirmed');

      // Assert
      // Should create shipment if none exists
      expect(mockShippingService.getShippingRates).toHaveBeenCalled();
    });

    it('should handle status update to cancelled', async () => {
      // Arrange
      mockOrderRepository.updateStatus.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'cancelled' },
      });
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: mockOrder,
      });
      mockInventoryService.releaseReservation.mockResolvedValue({
        success: true,
      });

      // Act
      await orderService.updateOrderStatus('order-1', 'cancelled');

      // Assert
      expect(mockInventoryService.releaseReservation).toHaveBeenCalledWith('order-1');
    });

    it('should handle status update to delivered', async () => {
      // Arrange
      mockOrderRepository.updateStatus.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'delivered' },
      });
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: mockOrder,
      });
      mockInventoryService.updateStock.mockResolvedValue({
        success: true,
      });

      // Act
      await orderService.updateOrderStatus('order-1', 'delivered');

      // Assert
      expect(mockInventoryService.updateStock).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should cancel an order successfully', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'pending' },
      });
      mockOrderRepository.updateStatus.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'cancelled' },
      });
      mockInventoryService.releaseReservation.mockResolvedValue({
        success: true,
      });

      // Act
      const result = await orderService.cancelOrder('order-1');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrderRepository.updateStatus).toHaveBeenCalledWith('order-1', 'cancelled');
    });

    it('should not cancel delivered order', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'delivered' },
      });

      // Act
      const result = await orderService.cancelOrder('order-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be cancelled after shipping');
      expect(mockOrderRepository.updateStatus).not.toHaveBeenCalled();
    });

    it('should not cancel shipped order', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: true,
        data: { ...mockOrder, status: 'shipped' },
      });

      // Act
      const result = await orderService.cancelOrder('order-1');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot be cancelled after shipping');
    });

    it('should handle order not found', async () => {
      // Arrange
      mockOrderRepository.findById.mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      // Act
      const result = await orderService.cancelOrder('non-existent');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('getOrdersByStatus', () => {
    it('should return orders by status', async () => {
      // Arrange
      const orders = [mockOrder, { ...mockOrder, id: 'order-2' }];
      mockOrderRepository.findByStatus.mockResolvedValue({
        success: true,
        data: orders,
      });

      // Act
      const result = await orderService.getOrdersByStatus('confirmed');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(orders);
      expect(mockOrderRepository.findByStatus).toHaveBeenCalledWith('confirmed');
    });
  });

  describe('getOrderStatistics', () => {
    it('should return order statistics', async () => {
      // Arrange
      const stats = {
        total: 100,
        pending: 10,
        confirmed: 50,
        shipped: 30,
        delivered: 8,
        cancelled: 2,
      };
      mockOrderRepository.getOrderStatistics.mockResolvedValue({
        success: true,
        data: stats,
      });

      // Act
      const result = await orderService.getOrderStatistics();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(stats);
    });

    it('should return statistics for specific customer', async () => {
      // Arrange
      const stats = {
        total: 10,
        pending: 1,
        confirmed: 5,
        shipped: 3,
        delivered: 1,
        cancelled: 0,
      };
      mockOrderRepository.getOrderStatistics.mockResolvedValue({
        success: true,
        data: stats,
      });

      // Act
      const result = await orderService.getOrderStatistics('cust-1');

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrderRepository.getOrderStatistics).toHaveBeenCalledWith('cust-1');
    });
  });

  describe('trackOrder', () => {
    it('should track order by tracking number', async () => {
      // Arrange
      mockOrderRepository.findByTrackingNumber.mockResolvedValue({
        success: true,
        data: mockOrder,
      });
      mockShippingService.trackShipment.mockResolvedValue({
        success: true,
        data: {
          trackingNumber: 'TRACK-123',
          status: 'Under transport',
          location: 'Stockholm',
          estimatedDelivery: new Date(),
          history: [],
        },
      });

      // Act
      const result = await orderService.trackOrder('TRACK-123');

      // Assert
      expect(result.success).toBe(true);
      expect(result.data?.order).toEqual(mockOrder);
      expect(result.data?.tracking).toBeDefined();
    });

    it('should handle tracking not found', async () => {
      // Arrange
      mockOrderRepository.findByTrackingNumber.mockResolvedValue({
        success: false,
        error: 'Order not found',
      });

      // Act
      const result = await orderService.trackOrder('INVALID');

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Order not found');
    });
  });

  describe('getRecentOrders', () => {
    it('should return recent orders with default parameters', async () => {
      // Arrange
      const orders = [mockOrder, { ...mockOrder, id: 'order-2' }];
      mockOrderRepository.getRecentOrders.mockResolvedValue({
        success: true,
        data: orders,
      });

      // Act
      const result = await orderService.getRecentOrders();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toEqual(orders);
      expect(mockOrderRepository.getRecentOrders).toHaveBeenCalledWith(30, 50);
    });

    it('should return recent orders with custom parameters', async () => {
      // Arrange
      const orders = [mockOrder];
      mockOrderRepository.getRecentOrders.mockResolvedValue({
        success: true,
        data: orders,
      });

      // Act
      const result = await orderService.getRecentOrders(7, 10);

      // Assert
      expect(result.success).toBe(true);
      expect(mockOrderRepository.getRecentOrders).toHaveBeenCalledWith(7, 10);
    });
  });
});
