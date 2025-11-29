# FortuneEssence Architecture

## Before Refactoring (Tightly Coupled)

```
┌──────────────────────────────────────────────────────────┐
│                     API Routes                           │
│                                                          │
│  const productService = new ProductService(); ❌         │
│  const cartService = new CartService(); ❌               │
└─────────────────────┬────────────────────────────────────┘
                      │ creates directly
                      ↓
┌──────────────────────────────────────────────────────────┐
│                    Services                              │
│                                                          │
│  constructor() {                                         │
│    this.repo = new ProductRepository(); ❌               │
│    this.otherService = new OtherService(); ❌            │
│  }                                                       │
└─────────────────────┬────────────────────────────────────┘
                      │ creates directly
                      ↓
┌──────────────────────────────────────────────────────────┐
│                 Repositories                             │
│                                                          │
│  - Hardcoded Supabase client ❌                          │
│  - Mixed with business logic ❌                          │
└──────────────────────────────────────────────────────────┘

Problems:
❌ Tight coupling - hard to test
❌ Cannot swap implementations
❌ Hard to mock dependencies
❌ Violation of DIP principle
```

---

## After Refactoring (Loose Coupling via DI)

```
┌──────────────────────────────────────────────────────────┐
│                     API Routes                           │
│                                                          │
│  import '@/config/di-init'; ✅                           │
│  const service = container.resolve(TOKENS.IService); ✅  │
└─────────────────────┬────────────────────────────────────┘
                      │ resolves from
                      ↓
┌──────────────────────────────────────────────────────────┐
│                  DI Container                            │
│                                                          │
│  - Manages all dependencies ✅                           │
│  - Handles lifecycle ✅                                  │
│  - Enables testing ✅                                    │
└──────┬──────────────────────────────┬────────────────────┘
       │                              │
       ↓                              ↓
┌─────────────────┐          ┌──────────────────┐
│    Services     │          │   Repositories   │
│                 │          │                  │
│  @injectable()  │          │  @injectable()   │
│  constructor(   │          │  constructor(    │
│    @inject(...) │          │    @inject(DB)   │
│  ) {} ✅        │          │  ) {} ✅         │
└─────────────────┘          └──────────────────┘

Benefits:
✅ Loose coupling via interfaces
✅ Easy to test with mocks
✅ Can swap implementations
✅ Follows all SOLID principles
```

---

## Service Organization

### Before: God Service 😰
```
ProductService (300 lines)
├─ CRUD operations
├─ Search & filtering
├─ Recommendations
├─ Validation
├─ Localization
├─ Category management
└─ Price calculations
```

### After: Focused Services 😊
```
┌─────────────────────────────────────┐
│      ProductService (80 lines)     │
│      - Core CRUD only              │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│   ProductSearchService (60 lines)  │
│   - Search & filtering             │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ ProductRecommendationService       │
│   - Recommendations & trending      │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  ProductValidationService          │
│   - Data validation                │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│      CategoryService               │
│   - Category management            │
└─────────────────────────────────────┘
```

---

## Payment Provider Factory Pattern

### Extensible Architecture

```
                ┌──────────────────────┐
                │  IPaymentProvider    │
                │    (Interface)       │
                └──────────┬───────────┘
                          │ implements
         ┌────────────────┼────────────────┐
         │                │                │
         ↓                ↓                ↓
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Stripe    │  │    Swish    │  │   Klarna    │
│  Provider   │  │  Provider   │  │  Provider   │
└─────────────┘  └─────────────┘  └─────────────┘
         ↑                ↑                ↑
         └────────────────┼────────────────┘
                          │ managed by
                ┌──────────────────────┐
                │ PaymentProvider      │
                │    Factory           │
                │                      │
                │ - getProvider()      │
                │ - registerProvider() │
                │ - getSupportedFor... │
                └──────────────────────┘

Adding new provider:
1. Implement IPaymentProvider ✅
2. Register in factory ✅
3. Done! No other changes needed ✅
```

---

## Dependency Graph

### ProductService Dependencies

```
                  ProductService
                        │
        ┌───────────────┼───────────────┐
        │                               │
        ↓                               ↓
  IProductRepository              CategoryService
        │                               │
        ↓                               ↓
  SupabaseClient              PRODUCT_CATEGORIES
                                   (config)
```

### OrderService Dependencies (Complex Orchestration)

```
                    OrderService
                        │
        ┌───────────────┼───────────────┬─────────────┬─────────────┐
        │               │               │             │             │
        ↓               ↓               ↓             ↓             ↓
  IOrderRepo    ICartService   IPaymentService  IShipping   IInventory
        │               │               │             │             │
        ↓               ↓               ↓             ↓             ↓
   Supabase      CartRepo +      PaymentProvider  ShippingRepo  InventoryRepo
                 ProductRepo        Factory

All dependencies injected via DI ✅
Easy to test with mocks ✅
Clear separation of concerns ✅
```

---

## Configuration-Driven Design

### Category Configuration

```typescript
// src/config/categories.ts
export const PRODUCT_CATEGORIES: CategoryConfig[] = [
  {
    id: 'essential-oils',
    displayName: { sv: 'Eteriska oljor', en: 'Essential Oils' },
    description: { sv: '...', en: '...' }
  },
  // Add new categories here - no code changes! ✅
];
```

### Payment Configuration

```typescript
// src/config/payment.config.ts
export const PAYMENT_PROVIDERS: Record<string, PaymentProviderConfig> = {
  stripe: {
    name: 'Stripe',
    enabled: true,
    currencies: ['SEK', 'EUR', 'USD'],
    countries: ['SE', 'NO', 'DK', 'FI']
  },
  // Add new providers here ✅
};

export const TAX_RATES: Record<string, number> = {
  SE: 0.25, // Sweden
  NO: 0.25, // Norway
  // Add new countries here ✅
};
```

---

## Testing Strategy

### Unit Testing (Easy with DI)

```typescript
describe('ProductService', () => {
  let service: ProductService;
  let mockRepo: jest.Mocked<IProductRepository>;

  beforeEach(() => {
    // Create mocks
    mockRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      // ...
    };

    // Inject mocks
    container.register(TOKENS.IProductRepository, {
      useValue: mockRepo
    });

    // Resolve service with mocked dependencies
    service = container.resolve(ProductService);
  });

  it('should return products', async () => {
    mockRepo.findAll.mockResolvedValue({
      success: true,
      data: [/* test data */]
    });

    const result = await service.getProducts();

    expect(result.success).toBe(true);
    expect(mockRepo.findAll).toHaveBeenCalled();
  });
});
```

### Integration Testing

```typescript
describe('Order Creation Flow', () => {
  it('should create order with payment and shipping', async () => {
    // Use real implementations but mock external APIs
    const mockStripeAPI = jest.fn();
    const mockShippingAPI = jest.fn();

    // Services orchestrate correctly
    const orderService = container.resolve<IOrderService>(
      TOKENS.IOrderService
    );

    const result = await orderService.createOrder({
      customerId: '123',
      items: [/* cart items */],
      // ...
    });

    expect(result.success).toBe(true);
    expect(result.data?.status).toBe('confirmed');
  });
});
```

---

## Performance Characteristics

### DI Container

- **Resolution Time:** <1ms (cached after first resolution)
- **Memory Overhead:** Minimal (services created on-demand)
- **Build Impact:** None (decorators processed at compile time)

### Service Lifecycle

```
First Request:
┌─────────────────────────────────────┐
│ 1. API Route called                │
│ 2. Resolve service from container  │  <1ms
│ 3. Container creates service        │  <1ms
│ 4. Container injects dependencies   │  <1ms
│ 5. Service method executed          │  Depends on logic
│ 6. Service cached for next request  │  0ms
└─────────────────────────────────────┘

Subsequent Requests:
┌─────────────────────────────────────┐
│ 1. API Route called                │
│ 2. Resolve service from container  │  <1ms (cached)
│ 3. Service method executed          │  Depends on logic
└─────────────────────────────────────┘
```

---

## Deployment Considerations

### Environment Configuration

```typescript
// Different configs per environment
if (process.env.NODE_ENV === 'production') {
  // Use production payment providers
  container.register(TOKENS.IPaymentService, {
    useClass: ProductionPaymentService
  });
} else {
  // Use mock payment providers for development
  container.register(TOKENS.IPaymentService, {
    useClass: MockPaymentService
  });
}
```

### Feature Flags

```typescript
// Enable/disable features via configuration
if (config.features.recommendations) {
  container.register(TOKENS.IRecommendationService, {
    useClass: ProductRecommendationService
  });
} else {
  container.register(TOKENS.IRecommendationService, {
    useClass: NoOpRecommendationService
  });
}
```

---

## Scalability

The new architecture supports:

1. **Horizontal Scaling** - Stateless services
2. **Microservices Migration** - Clear service boundaries
3. **Team Scaling** - Services can be owned by different teams
4. **Technology Migration** - Easy to swap implementations
5. **A/B Testing** - Different implementations for different users

---

## Conclusion

The refactored architecture provides:

✅ **SOLID Principles** - All five principles followed
✅ **Dependency Injection** - Full DI implementation
✅ **Testability** - Easy to write unit and integration tests
✅ **Extensibility** - Add features without modifying existing code
✅ **Maintainability** - Clear separation of concerns
✅ **Scalability** - Ready for growth

**Production-Ready Architecture** 🚀
