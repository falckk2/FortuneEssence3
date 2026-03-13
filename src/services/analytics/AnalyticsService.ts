import { injectable, inject } from 'tsyringe';
import type { IAnalyticsService, IAnalyticsRepository, AnalyticsRange, AnalyticsData } from '@/interfaces';
import { ApiResponse, Order } from '@/types';
import { TOKENS } from '@/config/di-container';

@injectable()
export class AnalyticsService implements IAnalyticsService {
  constructor(
    @inject(TOKENS.IAnalyticsRepository) private readonly analyticsRepository: IAnalyticsRepository
  ) {}

  async getAnalytics(range: AnalyticsRange): Promise<ApiResponse<AnalyticsData>> {
    try {
      const now = new Date();
      const { startDate, previousStartDate } = this.getDateRange(range, now);

      // Fetch current and previous period data in a single parallel batch
      const [ordersResult, orderItemsResult, newCustomersResult, totalCustomersResult, prevOrdersResult, prevCustomersResult] = await Promise.all([
        this.analyticsRepository.getOrdersInRange(startDate, now),
        this.analyticsRepository.getOrderItemsInRange(startDate, now),
        this.analyticsRepository.getCustomerCountInRange(startDate, now),
        this.analyticsRepository.getTotalCustomerCount(),
        this.analyticsRepository.getOrdersInRange(previousStartDate, startDate),
        this.analyticsRepository.getCustomerCountInRange(previousStartDate, startDate),
      ]);

      const orders = ordersResult.data ?? [];
      const prevOrders = prevOrdersResult.data ?? [];
      const orderItems = orderItemsResult.data ?? [];
      const newCustomers = newCustomersResult.data ?? 0;
      const totalCustomers = totalCustomersResult.data ?? 0;
      const prevNewCustomers = prevCustomersResult.data ?? 0;

      // Revenue metrics
      const revenue = this.calculateRevenueMetrics(orders, prevOrders, now, range);

      // Order metrics
      const orderMetrics = this.calculateOrderMetrics(orders, prevOrders, now, range);

      // Customer metrics
      const returningCustomerIds = this.getReturningCustomerIds(orders);
      const customerChange = this.calculatePercentageChange(newCustomers, prevNewCustomers);
      const customers = {
        total: totalCustomers,
        new: newCustomers,
        returning: returningCustomerIds.size,
        change: customerChange,
      };

      // Product metrics from order_items
      const products = this.calculateProductMetrics(orderItems);

      // Revenue by category
      const revenueByCategory = this.calculateRevenueByCategory(orderItems);

      // Recent sales time series
      const recentSales = this.calculateRecentSales(orders, range);

      return {
        success: true,
        data: {
          revenue,
          orders: orderMetrics,
          customers,
          products,
          revenueByCategory,
          recentSales,
        },
      };
    } catch (error) {
      return { success: false, error: `Failed to get analytics: ${error}` };
    }
  }

  private getDateRange(range: AnalyticsRange, now: Date): { startDate: Date; previousStartDate: Date } {
    const startDate = new Date(now);
    const previousStartDate = new Date(now);

    switch (range) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case 'month':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case 'year':
        startDate.setDate(now.getDate() - 365);
        previousStartDate.setDate(now.getDate() - 730);
        break;
    }

    return { startDate, previousStartDate };
  }

  private calculateRevenueMetrics(orders: Order[], prevOrders: Order[], now: Date, range: AnalyticsRange) {
    const total = orders.reduce((sum, o) => sum + o.total, 0);
    const prevTotal = prevOrders.reduce((sum, o) => sum + o.total, 0);

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const today = orders
      .filter(o => new Date(o.createdAt) >= todayStart)
      .reduce((sum, o) => sum + o.total, 0);

    // thisWeek is only a meaningful sub-window when range is month or year;
    // for week range the fetched orders already cover exactly this window.
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const thisWeek = range !== 'week'
      ? orders.filter(o => new Date(o.createdAt) >= weekStart).reduce((sum, o) => sum + o.total, 0)
      : total;

    // thisMonth is only a meaningful sub-window when range is year.
    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    const thisMonth = range === 'year'
      ? orders.filter(o => new Date(o.createdAt) >= monthStart).reduce((sum, o) => sum + o.total, 0)
      : total;

    return {
      total: Math.round(total * 100) / 100,
      today: Math.round(today * 100) / 100,
      thisWeek: Math.round(thisWeek * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      change: this.calculatePercentageChange(total, prevTotal),
    };
  }

  private calculateOrderMetrics(orders: Order[], prevOrders: Order[], now: Date, range: AnalyticsRange) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayOrders = orders.filter(o => new Date(o.createdAt) >= todayStart).length;

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const weekOrders = range !== 'week'
      ? orders.filter(o => new Date(o.createdAt) >= weekStart).length
      : orders.length;

    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 30);
    const monthOrders = range === 'year'
      ? orders.filter(o => new Date(o.createdAt) >= monthStart).length
      : orders.length;

    return {
      total: orders.length,
      today: todayOrders,
      thisWeek: weekOrders,
      thisMonth: monthOrders,
      change: this.calculatePercentageChange(orders.length, prevOrders.length),
    };
  }

  private getReturningCustomerIds(orders: Order[]): Set<string> {
    const customerOrderCounts = new Map<string, number>();
    for (const order of orders) {
      if (!order.customerId) continue; // skip guest orders — null keys would collapse all guests into one
      customerOrderCounts.set(order.customerId, (customerOrderCounts.get(order.customerId) || 0) + 1);
    }
    const returning = new Set<string>();
    for (const [id, count] of customerOrderCounts) {
      if (count > 1) returning.add(id);
    }
    return returning;
  }

  private calculateProductMetrics(orderItems: Array<{ productId: string; productName: string; category: string; quantity: number; price: number }>) {
    const productStats = new Map<string, { id: string; name: string; quantity: number; revenue: number }>();

    for (const item of orderItems) {
      const existing = productStats.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += item.price * item.quantity;
      } else {
        productStats.set(item.productId, {
          id: item.productId,
          name: item.productName,
          quantity: item.quantity,
          revenue: item.price * item.quantity,
        });
      }
    }

    const totalSold = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const topSelling = Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
      }));

    return { totalSold, topSelling };
  }

  private calculateRevenueByCategory(orderItems: Array<{ productId: string; productName: string; category: string; quantity: number; price: number }>) {
    const categoryRevenue = new Map<string, number>();

    for (const item of orderItems) {
      const revenue = item.price * item.quantity;
      categoryRevenue.set(item.category, (categoryRevenue.get(item.category) || 0) + revenue);
    }

    const totalRevenue = Array.from(categoryRevenue.values()).reduce((sum, r) => sum + r, 0);

    return Array.from(categoryRevenue.entries())
      .map(([category, revenue]) => ({
        category,
        revenue: Math.round(revenue * 100) / 100,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }

  private calculateRecentSales(orders: Order[], range: AnalyticsRange) {
    const buckets = new Map<string, { revenue: number; orders: number }>();

    for (const order of orders) {
      const date = new Date(order.createdAt);
      const key = range === 'year'
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

      const existing = buckets.get(key) || { revenue: 0, orders: 0 };
      existing.revenue += order.total;
      existing.orders += 1;
      buckets.set(key, existing);
    }

    return Array.from(buckets.entries())
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        orders: data.orders,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 1000) / 10;
  }
}
