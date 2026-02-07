/**
 * Test Order Flow Script
 *
 * This script demonstrates the complete order and payment testing flow.
 * Run with: node scripts/test-order-flow.js
 *
 * Prerequisites:
 * 1. Server must be running (npm run dev)
 * 2. You need a valid product ID and user ID
 * 3. Test endpoints must be enabled
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// CONFIGURATION - Update these values
const CONFIG = {
  customerId: '30af9020-f974-49d3-90eb-bead11fcaa3c', // Change this to a valid user ID
  productId: '854d58e3-ea8f-4c83-be07-ac7ab655b9b3', // Change this to a valid product ID (Lavendel Eterisk Olja)
  email: 'rehan.chiu.falck@gmail.com',
  price: 89,
  quantity: 1,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60) + '\n');
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createTestOrder() {
  logSection('📦 Step 1: Creating Test Order');

  const orderData = {
    customerId: CONFIG.customerId,
    email: CONFIG.email,
    items: [
      {
        productId: CONFIG.productId,
        quantity: CONFIG.quantity,
        price: CONFIG.price,
      }
    ],
    shippingAddress: {
      firstName: 'Test',
      lastName: 'User',
      street: 'Testgatan 123',
      city: 'Stockholm',
      postalCode: '11122',
      country: 'Sweden',
    },
    billingAddress: {
      firstName: 'Test',
      lastName: 'User',
      street: 'Testgatan 123',
      city: 'Stockholm',
      postalCode: '11122',
      country: 'Sweden',
    },
    paymentMethod: 'card',
  };

  try {
    const response = await fetch(`${BASE_URL}/api/test/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-session-id': CONFIG.customerId,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();

    if (result.success) {
      log('✅ Order created successfully!', 'green');
      log(`Order ID: ${result.data.order.id}`, 'blue');
      log(`Payment ID: ${result.data.payment.paymentId}`, 'blue');
      log(`Tracking Number: ${result.data.shippingLabel?.trackingNumber}`, 'blue');
      log(`Total: ${result.data.order.total} SEK`, 'blue');
      return result.data.order.id;
    } else {
      log(`❌ Failed to create order: ${result.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function progressShipmentStatus(orderId) {
  logSection('🚚 Step 2: Progressing Shipment Status');

  try {
    const response = await fetch(`${BASE_URL}/api/test/shipment/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        action: 'next-status',
      }),
    });

    const result = await response.json();

    if (result.success) {
      log('✅ Status updated!', 'green');
      log(`${result.data.previousStatus} → ${result.data.currentStatus}`, 'blue');
      return result.data.currentStatus;
    } else {
      log(`❌ Failed to update status: ${result.error}`, 'red');
      return null;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return null;
  }
}

async function getTrackingInfo(orderId) {
  logSection('📍 Step 3: Getting Tracking Information');

  try {
    const response = await fetch(`${BASE_URL}/api/test/shipment/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        action: 'generate-tracking',
      }),
    });

    const result = await response.json();

    if (result.success) {
      log('✅ Tracking info retrieved!', 'green');
      log(`Tracking Number: ${result.data.trackingNumber}`, 'blue');
      log(`Status: ${result.data.tracking.status}`, 'blue');
      log(`Location: ${result.data.tracking.location}`, 'blue');

      if (result.data.tracking.history) {
        log('\nTracking History:', 'yellow');
        result.data.tracking.history.forEach((event, idx) => {
          log(`  ${idx + 1}. ${event.status} - ${event.location}`, 'blue');
          log(`     ${new Date(event.date).toLocaleString()}`, 'blue');
        });
      }
      return true;
    } else {
      log(`❌ Failed to get tracking: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function simulateCompleteDelivery(orderId) {
  logSection('🎯 Step 4: Simulating Complete Delivery');

  try {
    const response = await fetch(`${BASE_URL}/api/test/shipment/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        action: 'simulate-delivery',
      }),
    });

    const result = await response.json();

    if (result.success) {
      log('✅ Delivery simulation completed!', 'green');
      log(`Final Status: ${result.data.finalStatus}`, 'blue');

      log('\nStatus Progression:', 'yellow');
      result.data.progression.forEach((step, idx) => {
        const status = step.success ? '✅' : '❌';
        log(`  ${status} ${step.status}`, step.success ? 'green' : 'red');
      });
      return true;
    } else {
      log(`❌ Failed to simulate delivery: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function getUserOrders() {
  logSection('📋 Step 5: Getting User Order History');

  try {
    const response = await fetch(
      `${BASE_URL}/api/test/orders?action=list-user-orders&userId=${CONFIG.customerId}`
    );

    const result = await response.json();

    if (result.success) {
      log(`✅ Found ${result.data.orderCount} orders for user`, 'green');

      result.data.orders.forEach((order, idx) => {
        log(`\n  Order ${idx + 1}:`, 'yellow');
        log(`    ID: ${order.id}`, 'blue');
        log(`    Status: ${order.status}`, 'blue');
        log(`    Total: ${order.total} SEK`, 'blue');
        log(`    Created: ${new Date(order.createdAt).toLocaleString()}`, 'blue');
      });
      return true;
    } else {
      log(`❌ Failed to get orders: ${result.error}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🧪 Starting Test Order Flow\n', 'cyan');

  // Check configuration
  if (CONFIG.customerId === 'your-user-id-here' || CONFIG.productId === 'your-product-id-here') {
    log('⚠️  WARNING: Please update CONFIG values in the script!', 'yellow');
    log('   Edit scripts/test-order-flow.js and set customerId and productId\n', 'yellow');
    return;
  }

  log(`Configuration:`, 'yellow');
  log(`  Customer ID: ${CONFIG.customerId}`, 'blue');
  log(`  Product ID: ${CONFIG.productId}`, 'blue');
  log(`  Base URL: ${BASE_URL}\n`, 'blue');

  try {
    // Step 1: Create order
    const orderId = await createTestOrder();
    if (!orderId) {
      log('\n❌ Test failed: Could not create order', 'red');
      return;
    }

    await delay(1000);

    // Step 2: Progress status a few times
    let currentStatus = null;
    for (let i = 0; i < 3; i++) {
      currentStatus = await progressShipmentStatus(orderId);
      if (!currentStatus) break;
      await delay(500);
    }

    await delay(1000);

    // Step 3: Get tracking
    await getTrackingInfo(orderId);

    await delay(1000);

    // Step 4: Complete delivery
    await simulateCompleteDelivery(orderId);

    await delay(1000);

    // Step 5: Check order history
    await getUserOrders();

    logSection('✅ Test Flow Completed Successfully!');
    log(`\nTest Order ID: ${orderId}`, 'green');
    log(`\nYou can now:`, 'yellow');
    log(`  1. Check the database for order data`, 'blue');
    log(`  2. View order in the UI at /test-orders`, 'blue');
    log(`  3. Clean up test orders when done`, 'blue');

  } catch (error) {
    log(`\n❌ Test failed with error: ${error.message}`, 'red');
  }
}

// Run the test flow
main().catch(console.error);
