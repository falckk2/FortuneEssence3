import { useState } from 'react';

/**
 * Custom Hook for Test Checkout
 *
 * Single Responsibility: Handle test checkout API calls and state
 * Separates API logic from UI rendering
 */
export function useTestCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const createTestOrder = async (orderData: any) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Checkout failed');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      setResult({ success: false, error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
  };

  return {
    createTestOrder,
    loading,
    error,
    result,
    reset,
  };
}

/**
 * Custom Hook for Shipment Simulation
 *
 * Single Responsibility: Handle shipment simulation API calls and state
 */
export function useShipmentSimulation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const progressStatus = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/shipment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'next-status',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Failed to progress status');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const simulateDelivery = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/shipment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'simulate-delivery',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Failed to simulate delivery');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const getTracking = async (orderId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/shipment/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          action: 'generate-tracking',
        }),
      });

      const data = await response.json();
      setResult(data);

      if (!data.success) {
        setError(data.error || 'Failed to get tracking');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    progressStatus,
    simulateDelivery,
    getTracking,
    loading,
    error,
    result,
  };
}

/**
 * Custom Hook for Test Orders Management
 *
 * Single Responsibility: Handle test orders listing and cleanup
 */
export function useTestOrdersManagement() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  const loadUserOrders = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/test/orders?action=list-user-orders&userId=${userId}`);
      const data = await response.json();

      if (data.success && data.data?.orders) {
        setOrders(data.data.orders);
      } else {
        setError(data.error || 'Failed to load orders');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestOrders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/test/orders?action=cleanup-test-orders', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setOrders([]);
      } else {
        setError(data.error || 'Failed to cleanup orders');
      }

      return data;
    } catch (err) {
      const errorMessage = String(err);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    loadUserOrders,
    cleanupTestOrders,
    orders,
    setOrders,
    loading,
    error,
  };
}
