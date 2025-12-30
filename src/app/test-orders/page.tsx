'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  useTestCheckout,
  useShipmentSimulation,
  useTestOrdersManagement,
} from '@/hooks/useTestOrders';

/**
 * TEST ORDERS UI
 *
 * A simple UI for testing the order and payment simulation system.
 * This page allows you to create test orders, manage shipment statuses,
 * and verify that everything is stored correctly in the database.
 *
 * REFACTORED: Now follows SOLID principles
 * - Single Responsibility: Component only handles UI rendering
 * - Business logic delegated to custom hooks
 * - Each hook has a single responsibility
 */

export default function TestOrdersPage() {
  const { data: session } = useSession();
  const [orderId, setOrderId] = useState('');

  // Custom hooks for different concerns (SRP)
  const testCheckout = useTestCheckout();
  const shipmentSim = useShipmentSimulation();
  const ordersManagement = useTestOrdersManagement();

  // Test data state
  const [testData, setTestData] = useState({
    customerId: session?.user?.id || '',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    street: 'Testgatan 123',
    city: 'Stockholm',
    postalCode: '11122',
    country: 'Sweden',
    productId: '',
    quantity: 1,
    price: 299,
  });

  // Combine results for display
  const displayResult = testCheckout.result || shipmentSim.result || null;
  const isLoading = testCheckout.loading || shipmentSim.loading || ordersManagement.loading;

  const handleCreateTestOrder = async () => {
    // Validate customer ID
    const customerId = testData.customerId || session?.user?.id;
    if (!customerId) {
      alert('Customer ID is required. Please sign in or enter a valid customer UUID.');
      return;
    }

    // Build order data
    const orderData = {
      customerId,
      email: testData.email,
      items: [
        {
          productId: testData.productId,
          quantity: testData.quantity,
          price: testData.price,
        },
      ],
      shippingAddress: {
        firstName: testData.firstName,
        lastName: testData.lastName,
        street: testData.street,
        city: testData.city,
        postalCode: testData.postalCode,
        country: testData.country,
      },
      billingAddress: {
        firstName: testData.firstName,
        lastName: testData.lastName,
        street: testData.street,
        city: testData.city,
        postalCode: testData.postalCode,
        country: testData.country,
      },
      paymentMethod: 'card',
    };

    // Call hook
    const result = await testCheckout.createTestOrder(orderData);

    // Update order ID if successful
    if (result.success && result.data?.order?.id) {
      setOrderId(result.data.order.id);
    }
  };

  const handleProgressStatus = async () => {
    if (!orderId) {
      alert('Please create an order first or enter an order ID');
      return;
    }
    await shipmentSim.progressStatus(orderId);
  };

  const handleSimulateDelivery = async () => {
    if (!orderId) {
      alert('Please create an order first or enter an order ID');
      return;
    }
    await shipmentSim.simulateDelivery(orderId);
  };

  const handleGetTracking = async () => {
    if (!orderId) {
      alert('Please create an order first or enter an order ID');
      return;
    }
    await shipmentSim.getTracking(orderId);
  };

  const handleLoadUserOrders = async () => {
    const userId = testData.customerId || session?.user?.id;
    if (!userId) {
      alert('Please enter a user ID or sign in');
      return;
    }
    await ordersManagement.loadUserOrders(userId);
  };

  const handleCleanupTestOrders = async () => {
    if (!confirm('Are you sure you want to delete all test orders?')) {
      return;
    }
    await ordersManagement.cleanupTestOrders();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-6">
          <h1 className="text-2xl font-bold text-yellow-800 mb-2">
            🧪 Test Order System
          </h1>
          <p className="text-yellow-700">
            This is a testing interface for simulating orders and payments without processing real charges.
            All test orders are marked and can be cleaned up.
          </p>
        </div>

        {/* Test Data Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Order Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer ID</label>
              <input
                type="text"
                value={testData.customerId}
                onChange={(e) => setTestData({ ...testData, customerId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder={session?.user?.id || 'Enter customer ID'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={testData.email}
                onChange={(e) => setTestData({ ...testData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product ID</label>
              <input
                type="text"
                value={testData.productId}
                onChange={(e) => setTestData({ ...testData, productId: e.target.value })}
                className="w-full px-3 py-2 border rounded"
                placeholder="Enter a valid product ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price (SEK)</label>
              <input
                type="number"
                value={testData.price}
                onChange={(e) => setTestData({ ...testData, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>

          <div className="space-y-4">
            {/* Create Order */}
            <div>
              <button
                onClick={handleCreateTestOrder}
                disabled={isLoading || !testData.productId}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
              >
                {isLoading ? 'Processing...' : '1. Create Test Order (Simulated Payment)'}
              </button>
              {!testData.productId && (
                <p className="text-sm text-red-600 mt-1">Please enter a valid product ID</p>
              )}
            </div>

            {/* Order ID */}
            {orderId && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <label className="block text-sm font-medium mb-1">Current Order ID:</label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full px-3 py-2 border rounded font-mono text-sm"
                />
              </div>
            )}

            {/* Shipment Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleProgressStatus}
                disabled={isLoading || !orderId}
                className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                2. Progress Status →
              </button>
              <button
                onClick={handleSimulateDelivery}
                disabled={isLoading || !orderId}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                3. Simulate Delivery
              </button>
              <button
                onClick={handleGetTracking}
                disabled={isLoading || !orderId}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                4. Get Tracking
              </button>
            </div>

            {/* User Orders */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={handleLoadUserOrders}
                disabled={isLoading}
                className="bg-cyan-600 text-white px-4 py-2 rounded hover:bg-cyan-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                5. Load User Orders
              </button>
              <button
                onClick={handleCleanupTestOrders}
                disabled={isLoading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                🗑️ Cleanup All Test Orders
              </button>
            </div>
          </div>
        </div>

        {/* User Orders List */}
        {ordersManagement.orders.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">User Orders ({ordersManagement.orders.length})</h2>
            <div className="space-y-3">
              {ordersManagement.orders.map((order) => (
                <div
                  key={order.id}
                  className="border rounded p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setOrderId(order.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm text-gray-600">{order.id}</p>
                      <p className="font-semibold mt-1">Status: {order.status}</p>
                      <p className="text-sm text-gray-600">Total: {order.total} SEK</p>
                      {order.trackingNumber && (
                        <p className="text-sm text-blue-600">📦 {order.trackingNumber}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{order.paymentMethod}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t">
                      <p className="text-sm font-medium">Items:</p>
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-sm text-gray-600">
                          • {item.productName} × {item.quantity} - {item.price} SEK
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {displayResult && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              {displayResult.success ? '✅ Success' : '❌ Error'}
            </h2>
            {displayResult.message && (
              <p className="text-lg mb-4 font-medium">{displayResult.message}</p>
            )}
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-xs">
              {JSON.stringify(displayResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
