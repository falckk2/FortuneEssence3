import { IGDPRService, UserData, ConsentData, UserPreferences } from '@/interfaces';
import { Customer, Order, ApiResponse } from '@/types';
import { supabase } from '@/lib/supabase/client';

export class GDPRService implements IGDPRService {

  async exportUserData(userId: string): Promise<ApiResponse<UserData>> {
    try {
      // Fetch user's personal information
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', userId)
        .single();

      if (customerError) {
        return {
          success: false,
          error: `Failed to fetch customer data: ${customerError.message}`,
        };
      }

      // Fetch user's orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items!inner(
            id,
            quantity,
            price,
            products!inner(id, name, name_sv, sku)
          )
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        return {
          success: false,
          error: `Failed to fetch order data: ${ordersError.message}`,
        };
      }

      // Fetch user's preferences and consent
      const { data: consent, error: consentError } = await supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: preferences, error: preferencesError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Transform customer data
      const personalInfo: Customer = {
        id: customer.id,
        email: customer.email,
        firstName: customer.first_name,
        lastName: customer.last_name,
        phone: customer.phone,
        dateOfBirth: customer.date_of_birth ? new Date(customer.date_of_birth) : undefined,
        address: customer.address || { street: '', city: '', postalCode: '', country: '' },
        consentGiven: customer.consent_given || false,
        marketingOptIn: customer.marketing_opt_in,
        createdAt: new Date(customer.created_at),
        updatedAt: new Date(customer.updated_at),
      };

      // Transform orders data
      const transformedOrders: Order[] = orders.map((order: any) => ({
        id: order.id,
        customerId: order.customer_id,
        items: order.order_items.map((item: any) => ({
          productId: item.products.id,
          productName: item.products.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        status: order.status,
        tax: order.tax,
        shipping: order.shipping_cost || 0,
        total: order.total_amount,
        paymentMethod: order.payment_method,
        paymentId: order.payment_id,
        shippingAddress: order.shipping_address,
        billingAddress: order.billing_address,
        trackingNumber: order.tracking_number,
        createdAt: new Date(order.created_at),
        updatedAt: new Date(order.updated_at),
      }));

      // Transform preferences
      const userPreferences: UserPreferences = {
        language: preferences?.language || 'sv',
        currency: preferences?.currency || 'SEK',
        newsletter: preferences?.newsletter || false,
      };

      const userData: UserData = {
        personalInfo,
        orders: transformedOrders,
        preferences: userPreferences,
      };

      // Log the data export request
      await this.logGDPRActivity(userId, 'data_export', 'User requested data export');

      return {
        success: true,
        data: userData,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to export user data: ${error}`,
      };
    }
  }

  async deleteUserData(userId: string): Promise<ApiResponse<void>> {
    try {
      // Log the deletion request first
      await this.logGDPRActivity(userId, 'data_deletion', 'User requested account deletion');

      // Delete user data in the correct order to maintain referential integrity

      // 1. Get order IDs for this user
      const { data: userOrders, error: ordersQueryError } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', userId);

      if (ordersQueryError && ordersQueryError.code !== 'PGRST116') {
        throw new Error(`Failed to query orders: ${ordersQueryError.message}`);
      }

      // 2. Delete order items first (if there are any orders)
      if (userOrders && userOrders.length > 0) {
        const orderIds = userOrders.map(o => o.id);
        const { error: orderItemsError } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);

        if (orderItemsError && orderItemsError.code !== 'PGRST116') {
          throw new Error(`Failed to delete order items: ${orderItemsError.message}`);
        }
      }

      // 2. Delete orders
      const { error: ordersError } = await supabase
        .from('orders')
        .delete()
        .eq('customer_id', userId);

      if (ordersError && ordersError.code !== 'PGRST116') {
        throw new Error(`Failed to delete orders: ${ordersError.message}`);
      }

      // 3. Get cart IDs for this user
      const { data: userCarts, error: cartsQueryError } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', userId);

      if (cartsQueryError && cartsQueryError.code !== 'PGRST116') {
        throw new Error(`Failed to query carts: ${cartsQueryError.message}`);
      }

      // 4. Delete cart items (if there are any carts)
      if (userCarts && userCarts.length > 0) {
        const cartIds = userCarts.map(c => c.id);
        const { error: cartItemsError } = await supabase
          .from('cart_items')
          .delete()
          .in('cart_id', cartIds);

        if (cartItemsError && cartItemsError.code !== 'PGRST116') {
          throw new Error(`Failed to delete cart items: ${cartItemsError.message}`);
        }
      }

      // 4. Delete carts
      const { error: cartsError } = await supabase
        .from('carts')
        .delete()
        .eq('customer_id', userId);

      if (cartsError && cartsError.code !== 'PGRST116') {
        throw new Error(`Failed to delete carts: ${cartsError.message}`);
      }

      // 5. Delete user preferences
      const { error: preferencesError } = await supabase
        .from('user_preferences')
        .delete()
        .eq('user_id', userId);

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw new Error(`Failed to delete preferences: ${preferencesError.message}`);
      }

      // 6. Delete user consent records
      const { error: consentError } = await supabase
        .from('user_consent')
        .delete()
        .eq('user_id', userId);

      if (consentError && consentError.code !== 'PGRST116') {
        throw new Error(`Failed to delete consent: ${consentError.message}`);
      }

      // 7. Finally delete the customer record
      const { error: customerError } = await supabase
        .from('customers')
        .delete()
        .eq('id', userId);

      if (customerError) {
        throw new Error(`Failed to delete customer: ${customerError.message}`);
      }

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to delete user data: ${error}`,
      };
    }
  }

  async updateConsent(userId: string, consentData: ConsentData): Promise<ApiResponse<void>> {
    try {
      // Upsert consent data
      const { error } = await supabase
        .from('user_consent')
        .upsert({
          user_id: userId,
          marketing: consentData.marketing,
          analytics: consentData.analytics,
          functional: consentData.functional,
          updated_at: consentData.updatedAt.toISOString(),
        });

      if (error) {
        return {
          success: false,
          error: `Failed to update consent: ${error.message}`,
        };
      }

      // Also update marketing opt-in in customer table
      const { error: customerError } = await supabase
        .from('customers')
        .update({
          marketing_opt_in: consentData.marketing,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (customerError) {
        return {
          success: false,
          error: `Failed to update customer marketing consent: ${customerError.message}`,
        };
      }

      // Log the consent update
      await this.logGDPRActivity(userId, 'consent_update', `Consent updated - Marketing: ${consentData.marketing}, Analytics: ${consentData.analytics}, Functional: ${consentData.functional}`);

      return {
        success: true,
        data: undefined,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to update consent: ${error}`,
      };
    }
  }

  async getConsentStatus(userId: string): Promise<ApiResponse<ConsentData>> {
    try {
      const { data: consent, error } = await supabase
        .from('user_consent')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No consent record found, return default values
          const defaultConsent: ConsentData = {
            marketing: false,
            analytics: false,
            functional: true, // Functional cookies are essential
            updatedAt: new Date(),
          };

          return {
            success: true,
            data: defaultConsent,
          };
        }

        return {
          success: false,
          error: `Failed to get consent status: ${error.message}`,
        };
      }

      const consentData: ConsentData = {
        marketing: consent.marketing,
        analytics: consent.analytics,
        functional: consent.functional,
        updatedAt: new Date(consent.updated_at),
      };

      return {
        success: true,
        data: consentData,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get consent status: ${error}`,
      };
    }
  }

  // Additional GDPR utility methods

  async getDataProcessingPurposes(): Promise<ApiResponse<Array<{
    id: string;
    name: string;
    description: string;
  }>>> {
    const purposes = [
      {
        id: 'order-processing',
        name: 'Order Processing',
        description: 'Processing customer orders and payments (Legal basis: Contract Performance)',
      },
      {
        id: 'customer-service',
        name: 'Customer Service',
        description: 'Providing customer support and handling inquiries (Legal basis: Legitimate Interest)',
      },
      {
        id: 'marketing',
        name: 'Marketing Communications',
        description: 'Sending promotional emails and newsletters (Legal basis: Consent)',
      },
      {
        id: 'analytics',
        name: 'Analytics',
        description: 'Understanding website usage and improving services (Legal basis: Consent)',
      },
      {
        id: 'legal-compliance',
        name: 'Legal Compliance',
        description: 'Meeting tax and regulatory requirements (Legal basis: Legal Obligation)',
      },
    ];

    return {
      success: true,
      data: purposes,
    };
  }

  async getDataRetentionPolicies(): Promise<ApiResponse<Array<{
    dataType: string;
    retentionPeriod: string;
    purpose: string;
  }>>> {
    const policies = [
      {
        dataType: 'Customer Account Data',
        retentionPeriod: 'Until account deletion or 7 years after last activity',
        purpose: 'Customer service and legal compliance',
      },
      {
        dataType: 'Order and Transaction Data',
        retentionPeriod: '7 years',
        purpose: 'Tax compliance and warranty claims',
      },
      {
        dataType: 'Marketing Data',
        retentionPeriod: 'Until consent is withdrawn',
        purpose: 'Marketing communications',
      },
      {
        dataType: 'Analytics Data',
        retentionPeriod: '2 years',
        purpose: 'Website improvement and analysis',
      },
      {
        dataType: 'Support Communications',
        retentionPeriod: '3 years',
        purpose: 'Customer service quality and training',
      },
    ];

    return {
      success: true,
      data: policies,
    };
  }

  async requestDataPortability(userId: string, format: 'json' | 'csv'): Promise<ApiResponse<string>> {
    try {
      const userDataResult = await this.exportUserData(userId);
      
      if (!userDataResult.success) {
        return {
          success: false,
          error: userDataResult.error,
        };
      }

      const userData = userDataResult.data!;
      let exportData: string;

      if (format === 'json') {
        exportData = JSON.stringify(userData, null, 2);
      } else {
        // Convert to CSV format
        exportData = this.convertToCSV(userData);
      }

      // Log the data portability request
      await this.logGDPRActivity(userId, 'data_portability', `Data export in ${format} format`);

      return {
        success: true,
        data: exportData,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to process data portability request: ${error}`,
      };
    }
  }

  async getGDPRActivityLog(userId: string): Promise<ApiResponse<Array<{
    action: string;
    timestamp: string;
    details: string;
  }>>> {
    try {
      const { data: activities, error } = await supabase
        .from('gdpr_activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return {
          success: false,
          error: `Failed to get GDPR activity log: ${error.message}`,
        };
      }

      const transformedActivities = activities.map(activity => ({
        action: activity.activity,
        timestamp: new Date(activity.created_at).toISOString(),
        details: activity.description,
      }));

      return {
        success: true,
        data: transformedActivities,
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to get GDPR activity log: ${error}`,
      };
    }
  }

  // Private helper methods

  private async logGDPRActivity(userId: string, activity: string, description: string): Promise<void> {
    try {
      await supabase
        .from('gdpr_activity_log')
        .insert({
          user_id: userId,
          activity,
          description,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log GDPR activity:', error);
    }
  }

  private convertToCSV(userData: UserData): string {
    let csv = '';

    // Personal Information
    csv += 'Personal Information\n';
    csv += 'Field,Value\n';
    csv += `ID,${userData.personalInfo.id}\n`;
    csv += `Email,${userData.personalInfo.email}\n`;
    csv += `First Name,${userData.personalInfo.firstName}\n`;
    csv += `Last Name,${userData.personalInfo.lastName}\n`;
    csv += `Phone,${userData.personalInfo.phone || ''}\n`;
    csv += `Marketing Opt-in,${userData.personalInfo.marketingOptIn}\n`;
    csv += `Created At,${userData.personalInfo.createdAt}\n`;
    csv += `Updated At,${userData.personalInfo.updatedAt}\n`;
    csv += '\n';

    // Orders
    csv += 'Orders\n';
    csv += 'Order ID,Status,Total Amount,Created At,Items\n';
    userData.orders.forEach(order => {
      const items = order.items.map(item => `${item.productName} (${item.quantity}x)`).join('; ');
      csv += `${order.id},${order.status},${order.total},${order.createdAt},${items}\n`;
    });
    csv += '\n';

    // Preferences
    csv += 'Preferences\n';
    csv += 'Setting,Value\n';
    csv += `Language,${userData.preferences.language}\n`;
    csv += `Currency,${userData.preferences.currency}\n`;
    csv += `Newsletter,${userData.preferences.newsletter}\n`;

    return csv;
  }
}