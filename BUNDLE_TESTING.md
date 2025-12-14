# Bundle System - Backend Testing Guide

## Overview
The backend for the mix-and-match essential oil bundles has been fully implemented. This guide will help you test it.

## Prerequisites

### 1. Database Setup (Supabase)

You need a Supabase project. If you don't have one:
1. Go to https://supabase.com
2. Create a new project
3. Get your credentials from Settings → API

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth (for cart sessions)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3001
```

Generate NEXTAUTH_SECRET with:
```bash
openssl rand -base64 32
```

## Database Migration Steps

### Step 1: Run Main Schema (if not already done)
In your Supabase SQL Editor, run:
```sql
-- Copy contents from database/schema.sql
```

### Step 2: Run Bundle Migration
In Supabase SQL Editor, run:
```sql
-- Copy contents from database/migrations/001_add_bundles.sql
```

### Step 3: Seed Bundle Data
In Supabase SQL Editor, run:
```sql
-- Copy contents from database/seeds/002_bundles.sql
```

## Testing the API

### Option A: Using the Development Server

1. Start the dev server:
```bash
npm run dev
```

2. Test endpoints using curl or Postman:

#### Test 1: Get all bundle configurations
```bash
curl http://localhost:3001/api/bundles
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "bundleProductId": "uuid",
      "requiredQuantity": 2,
      "allowedCategory": "essential-oils",
      "discountPercentage": 5.06,
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    },
    // ... more bundles
  ]
}
```

#### Test 2: Get eligible products for a bundle
```bash
# Replace {bundle-product-id} with actual ID from Test 1
curl http://localhost:3001/api/bundles/{bundle-product-id}/eligible-products
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Lavender Essential Oil",
      "price": 89,
      "category": "essential-oils",
      "stock": 25,
      // ... more product fields
    }
  ]
}
```

#### Test 3: Validate bundle selection
```bash
curl -X POST http://localhost:3001/api/bundles/{bundle-product-id}/validate \
  -H "Content-Type: application/json" \
  -d '{
    "selectedProductIds": ["product-id-1", "product-id-2"],
    "quantities": {}
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

#### Test 4: Add bundle to cart
```bash
curl -X POST http://localhost:3001/api/cart \
  -H "Content-Type: application/json" \
  -H "x-session-id: test-session-123" \
  -d '{
    "action": "add-bundle",
    "bundleProductId": "bundle-product-id",
    "selectedProductIds": ["oil-1-id", "oil-2-id"],
    "quantity": 1
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "cart-id",
    "items": [
      {
        "productId": "bundle-product-id",
        "quantity": 1,
        "price": 169,
        "bundleSelection": {
          "bundleProductId": "bundle-product-id",
          "selectedProductIds": ["oil-1-id", "oil-2-id"]
        }
      }
    ],
    "total": 169
  }
}
```

### Option B: Using Browser DevTools

1. Start dev server: `npm run dev`
2. Open http://localhost:3001 in browser
3. Open DevTools → Console
4. Run test code:

```javascript
// Test 1: Get bundles
fetch('/api/bundles')
  .then(r => r.json())
  .then(console.log);

// Test 2: Get eligible products (replace bundle-id)
fetch('/api/bundles/YOUR-BUNDLE-ID/eligible-products')
  .then(r => r.json())
  .then(console.log);

// Test 3: Validate selection
fetch('/api/bundles/YOUR-BUNDLE-ID/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    selectedProductIds: ['product-1', 'product-2']
  })
})
  .then(r => r.json())
  .then(console.log);
```

## Verification Checklist

- [ ] Database migrations completed without errors
- [ ] Bundle products seeded (3 bundles: Duo, Trio, Mini Kit)
- [ ] `/api/bundles` returns bundle configurations
- [ ] `/api/bundles/[id]` returns specific bundle config
- [ ] `/api/bundles/[id]/eligible-products` returns essential oils
- [ ] `/api/bundles/[id]/validate` validates selections correctly
- [ ] `/api/cart` accepts 'add-bundle' action
- [ ] Bundle validation catches errors (wrong quantity, duplicates, etc.)
- [ ] Cart stores bundleSelection metadata

## Common Issues

### Issue: "Bundle configuration not found"
**Solution:** Make sure bundle products were seeded. Check products table for category='bundles'.

### Issue: "No eligible products"
**Solution:** Ensure you have essential oil products in stock. Run database/seed.sql.

### Issue: "Session required"
**Solution:** Include `x-session-id` header in cart requests.

### Issue: Dependency injection errors
**Solution:** Restart dev server after backend changes.

## Next Steps

Once all tests pass:
1. ✅ Backend is validated and working
2. 🎨 Proceed with frontend component implementation
3. 🧪 Add integration tests
4. 🚀 Deploy to staging environment

## Files Created

### Database
- `database/migrations/001_add_bundles.sql` - Bundle table migration
- `database/seeds/002_bundles.sql` - Bundle product seed data
- `database/schema.sql` - Updated with 'bundles' category

### Backend
- `src/types/bundles.ts` - Bundle-specific types
- `src/repositories/bundles/BundleRepository.ts` - Database operations
- `src/services/bundles/BundleService.ts` - Business logic
- `src/app/api/bundles/route.ts` - List bundles endpoint
- `src/app/api/bundles/[id]/route.ts` - Get bundle endpoint
- `src/app/api/bundles/[id]/eligible-products/route.ts` - Get oils endpoint
- `src/app/api/bundles/[id]/validate/route.ts` - Validate selection endpoint

### Extended Files
- `src/types/index.ts` - Added BundleConfiguration, BundleSelection
- `src/interfaces/repositories.ts` - Added IBundleRepository
- `src/interfaces/services.ts` - Added IBundleService
- `src/services/cart/CartService.ts` - Added addBundleToCart() method
- `src/app/api/cart/route.ts` - Added 'add-bundle' action
- `src/config/di-container.ts` - Registered bundle dependencies

## Support

If you encounter issues, check:
1. Server logs in terminal
2. Browser DevTools → Network tab for API responses
3. Supabase dashboard → SQL Editor for database state
