'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cartStore';
import { Address, PaymentMethod, ShippingRate, Product, BundleSelection } from '@/types';
import { PriceCalculator } from '@/utils/helpers';
import Image from 'next/image';
import {
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import CarrierOption from './CarrierOption';

interface CartItemWithProduct {
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
  bundleSelection?: BundleSelection;
  selectedProducts?: Product[];
}

const checkoutSchema = z.object({
  email: z.string().email('Invalid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  shippingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().regex(/^\d{3}\s?\d{2}$/, 'Invalid Swedish postal code'),
    country: z.string().min(1, 'Country is required'),
  }),
  billingAddress: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    postalCode: z.string().regex(/^\d{3}\s?\d{2}$/, 'Invalid Swedish postal code'),
    country: z.string().min(1, 'Country is required'),
  }),
  paymentMethod: z.enum(['card', 'swish', 'klarna']),
  sameAddress: z.boolean(),
  marketingOptIn: z.boolean(),
  termsAccepted: z.literal(true, { message: 'You must accept the terms and conditions' }),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

interface CheckoutFormProps {
  locale?: 'sv' | 'en';
  onSuccess?: (orderId: string) => void;
}

export const CheckoutForm = ({ locale = 'sv', onSuccess }: CheckoutFormProps) => {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { items, total, clearCart } = useCartStore();

  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([]);
  const [allShippingRates, setAllShippingRates] = useState<ShippingRate[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRate | null>(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{ id: PaymentMethod; name: string; enabled: boolean }>>([]);
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(500);
  const [filterType, setFilterType] = useState<'all' | 'fastest' | 'cheapest' | 'eco'>('all');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: user?.email || '',
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      shippingAddress: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        postalCode: user?.address?.postalCode || '',
        country: 'Sweden',
      },
      billingAddress: {
        street: user?.address?.street || '',
        city: user?.address?.city || '',
        postalCode: user?.address?.postalCode || '',
        country: 'Sweden',
      },
      sameAddress: true,
      marketingOptIn: false,
      paymentMethod: 'card',
    },
  });

  const watchedFields = watch(['shippingAddress', 'sameAddress']);

  // Fetch product details for cart items
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (items.length === 0) {
        setCartItems([]);
        return;
      }

      setLoadingProducts(true);
      try {
        const itemsWithProducts: CartItemWithProduct[] = [];

        for (const item of items) {
          try {
            const response = await fetch(`/api/products/${item.productId}?locale=${locale}`);

            // Check if response is OK before parsing JSON
            if (!response.ok) {
              console.warn(`Product ${item.productId} not found (${response.status})`);
              itemsWithProducts.push({ ...item });
              continue;
            }

            const result = await response.json();

            const cartItem: CartItemWithProduct = {
              ...item,
              product: result.success ? result.data : undefined,
            };

            // If this is a bundle with selected products, fetch those products too
            if (item.bundleSelection && item.bundleSelection.selectedProductIds) {
              const selectedProducts: Product[] = [];

              for (const selectedProductId of item.bundleSelection.selectedProductIds) {
                try {
                  const prodResponse = await fetch(`/api/products/${selectedProductId}?locale=${locale}`);

                  if (!prodResponse.ok) {
                    console.warn(`Selected product ${selectedProductId} not found (${prodResponse.status})`);
                    continue;
                  }

                  const prodResult = await prodResponse.json();

                  if (prodResult.success) {
                    selectedProducts.push(prodResult.data);
                  }
                } catch (err) {
                  console.error(`Error fetching selected product ${selectedProductId}:`, err);
                }
              }

              cartItem.selectedProducts = selectedProducts;
            }

            itemsWithProducts.push(cartItem);
          } catch (err) {
            console.error(`Error fetching product ${item.productId}:`, err);
            itemsWithProducts.push({ ...item });
          }
        }

        setCartItems(itemsWithProducts);
      } catch (error) {
        console.error('Failed to fetch product details:', error);
        setCartItems(items.map(item => ({ ...item })));
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProductDetails();
  }, [items, locale]);

  // Auto-fill billing address when "same address" is checked
  useEffect(() => {
    if (watchedFields[1]) { // sameAddress
      const shippingAddr = watchedFields[0]; // shippingAddress
      setValue('billingAddress', shippingAddr);
    }
  }, [watchedFields, setValue]);

  // Fetch shipping rates when shipping address changes
  useEffect(() => {
    const fetchShippingRates = async () => {
      if (watchedFields[0]?.country && items.length > 0) {
        try {
          const response = await fetch('/api/shipping/calculate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items,
              country: watchedFields[0].country,
              postalCode: watchedFields[0].postalCode,
              orderValue: total,
            }),
          });

          const result = await response.json();
          if (result.success && result.data) {
            setAllShippingRates(result.data.options);
            setShippingRates(result.data.options);
            setSelectedShipping(result.data.recommended);
            setFreeShippingThreshold(result.data.freeShippingThreshold || 500);
          }
        } catch (error) {
          console.error('Failed to fetch shipping rates:', error);
        }
      }
    };

    fetchShippingRates();
  }, [watchedFields[0]?.country, watchedFields[0]?.postalCode, items, total]);

  // Fetch available payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch('/api/checkout?action=payment-methods');
        const result = await response.json();
        
        if (result.success) {
          setAvailablePaymentMethods(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch payment methods:', error);
      }
    };

    fetchPaymentMethods();
  }, []);

  const onSubmit = async (data: CheckoutFormData) => {
    if (!selectedShipping) {
      alert(locale === 'sv' ? 'Välj ett leveransalternativ' : 'Please select a shipping option');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate a UUID for guest users (required by validation schema)
      const customerId = user?.id || crypto.randomUUID();

      const orderData = {
        customerId,
        items,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        paymentMethod: data.paymentMethod,
        shippingRateId: selectedShipping.id,
      };

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process-payment',
          ...orderData,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Clear cart after successful order
        await clearCart();
        
        // Redirect based on payment method
        if (result.data.payment.redirectUrl) {
          window.location.href = result.data.payment.redirectUrl;
        } else {
          onSuccess?.(result.data.order.id);
          router.push('/checkout/success');
        }
      } else {
        alert(result.error || (locale === 'sv' ? 'Betalning misslyckades' : 'Payment failed'));
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(locale === 'sv' ? 'Ett fel uppstod' : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'stripe':
        return CreditCardIcon;
      case 'card':
        return CreditCardIcon;
      case 'swish':
        return DevicePhoneMobileIcon;
      case 'klarna':
        return BanknotesIcon;
      default:
        return CreditCardIcon;
    }
  };

  const getPaymentMethodName = (method: PaymentMethod) => {
    const names: Record<PaymentMethod, string> = {
      stripe: locale === 'sv' ? 'Kort (Stripe)' : 'Card (Stripe)',
      card: locale === 'sv' ? 'Kort' : 'Card',
      swish: 'Swish',
      klarna: 'Klarna',
      'bank-transfer': locale === 'sv' ? 'Banköverföring' : 'Bank Transfer',
    };
    return names[method];
  };

  const getProductImage = (product?: Product) => {
    if (!product || !product.images || product.images.length === 0) {
      return '/images/placeholder-product.jpg';
    }
    return product.images[0];
  };

  const getProductName = (product?: Product) => {
    if (!product) return locale === 'sv' ? 'Okänd produkt' : 'Unknown Product';
    return locale === 'sv' ? product.translations.sv.name : product.translations.en.name;
  };

  // Apply filters to shipping rates
  useEffect(() => {
    let filtered = [...allShippingRates];

    switch (filterType) {
      case 'fastest':
        filtered.sort((a, b) => a.estimatedDays - b.estimatedDays);
        break;
      case 'cheapest':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'eco':
        filtered = filtered.filter(rate => rate.isEcoFriendly);
        break;
      default:
        // 'all' - no filtering
        break;
    }

    setShippingRates(filtered);
  }, [filterType, allShippingRates]);

  const isFreeShipping = total >= freeShippingThreshold;

  const subtotal = total;
  const tax = PriceCalculator.calculateVAT(subtotal);
  const shipping = selectedShipping?.price || 0;
  const totalAmount = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {locale === 'sv' ? 'Din varukorg är tom' : 'Your cart is empty'}
        </h2>
        <p className="text-gray-600 mb-6">
          {locale === 'sv' 
            ? 'Lägg till produkter innan du går till kassan'
            : 'Add products before proceeding to checkout'
          }
        </p>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          {locale === 'sv' ? 'Handla produkter' : 'Shop products'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Contact Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {locale === 'sv' ? 'Kontaktuppgifter' : 'Contact Information'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'sv' ? 'E-post' : 'Email'}
                </label>
                <input
                  {...register('email')}
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={locale === 'sv' ? 'din@epost.se' : 'your@email.com'}
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'sv' ? 'Förnamn' : 'First Name'}
                  </label>
                  <input
                    {...register('firstName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600 mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'sv' ? 'Efternamn' : 'Last Name'}
                  </label>
                  <input
                    {...register('lastName')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'sv' ? 'Telefon (valfritt)' : 'Phone (optional)'}
                </label>
                <input
                  {...register('phone')}
                  type="tel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="+46 70 123 45 67"
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {locale === 'sv' ? 'Leveransadress' : 'Shipping Address'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'sv' ? 'Gatuadress' : 'Street Address'}
                </label>
                <input
                  {...register('shippingAddress.street')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Storgatan 1"
                />
                {errors.shippingAddress?.street && (
                  <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.street.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'sv' ? 'Stad' : 'City'}
                  </label>
                  <input
                    {...register('shippingAddress.city')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Stockholm"
                  />
                  {errors.shippingAddress?.city && (
                    <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.city.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'sv' ? 'Postnummer' : 'Postal Code'}
                  </label>
                  <input
                    {...register('shippingAddress.postalCode')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="123 45"
                  />
                  {errors.shippingAddress?.postalCode && (
                    <p className="text-sm text-red-600 mt-1">{errors.shippingAddress.postalCode.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {locale === 'sv' ? 'Fakturaadress' : 'Billing Address'}
              </h3>
              <label className="flex items-center">
                <input
                  {...register('sameAddress')}
                  type="checkbox"
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {locale === 'sv' ? 'Samma som leveransadress' : 'Same as shipping'}
                </span>
              </label>
            </div>
            
            {!watch('sameAddress') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'sv' ? 'Gatuadress' : 'Street Address'}
                  </label>
                  <input
                    {...register('billingAddress.street')}
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Storgatan 1"
                  />
                  {errors.billingAddress?.street && (
                    <p className="text-sm text-red-600 mt-1">{errors.billingAddress.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Stad' : 'City'}
                    </label>
                    <input
                      {...register('billingAddress.city')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Stockholm"
                    />
                    {errors.billingAddress?.city && (
                      <p className="text-sm text-red-600 mt-1">{errors.billingAddress.city.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {locale === 'sv' ? 'Postnummer' : 'Postal Code'}
                    </label>
                    <input
                      {...register('billingAddress.postalCode')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="123 45"
                    />
                    {errors.billingAddress?.postalCode && (
                      <p className="text-sm text-red-600 mt-1">{errors.billingAddress.postalCode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shipping Options */}
          {shippingRates.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {locale === 'sv' ? 'Leveransalternativ' : 'Shipping Options'}
                </h3>
                {isFreeShipping && (
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    {locale === 'sv' ? '✓ Fri frakt!' : '✓ Free shipping!'}
                  </span>
                )}
              </div>

              {/* Filter buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === 'all'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {locale === 'sv' ? 'Alla' : 'All'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('fastest')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === 'fastest'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⚡ {locale === 'sv' ? 'Snabbast' : 'Fastest'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('cheapest')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === 'cheapest'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  💰 {locale === 'sv' ? 'Billigast' : 'Cheapest'}
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('eco')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    filterType === 'eco'
                      ? 'bg-sage-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🌿 {locale === 'sv' ? 'Miljövänligt' : 'Eco-friendly'}
                </button>
              </div>

              <div className="space-y-3">
                {shippingRates.map((rate) => (
                  <CarrierOption
                    key={rate.id}
                    rate={rate}
                    selected={selectedShipping?.id === rate.id}
                    onClick={() => setSelectedShipping(rate)}
                    locale={locale}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {locale === 'sv' ? 'Betalningsmetod' : 'Payment Method'}
            </h3>
            
            <div className="grid grid-cols-2 gap-3">
              {availablePaymentMethods.filter(m => m.enabled).map((method) => {
                const IconComponent = getPaymentIcon(method.id);
                return (
                  <label key={method.id} className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      {...register('paymentMethod')}
                      type="radio"
                      value={method.id}
                      className="text-purple-600 focus:ring-purple-500"
                    />
                    <IconComponent className="h-5 w-5 ml-3 text-gray-600" />
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {getPaymentMethodName(method.id)}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Terms and Marketing */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="space-y-4">
              <label className="flex items-start">
                <input
                  {...register('termsAccepted')}
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {locale === 'sv' 
                    ? 'Jag accepterar villkoren och GDPR-policyn'
                    : 'I accept the terms and conditions and GDPR policy'
                  }
                </span>
              </label>
              {errors.termsAccepted && (
                <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
              )}

              <label className="flex items-start">
                <input
                  {...register('marketingOptIn')}
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  {locale === 'sv' 
                    ? 'Jag vill få marknadsföring och erbjudanden via e-post'
                    : 'I would like to receive marketing and offers via email'
                  }
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:sticky lg:top-4 lg:h-fit">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              {locale === 'sv' ? 'Ordersammanfattning' : 'Order Summary'}
            </h3>

            <div className="space-y-4 mb-6">
              {loadingProducts ? (
                <div className="space-y-4">
                  {items.map((item, i) => (
                    <div key={i} className="animate-pulse flex space-x-3">
                      <div className="rounded bg-gray-300 h-16 w-16"></div>
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.productId} className="flex gap-3">
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                      <Image
                        src={getProductImage(item.product)}
                        alt={getProductName(item.product)}
                        width={64}
                        height={64}
                        className="h-full w-full object-cover object-center"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        {getProductName(item.product)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {PriceCalculator.formatPrice(item.price, locale)} {locale === 'sv' ? 'st' : 'each'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {locale === 'sv' ? 'Antal' : 'Qty'}: {item.quantity}
                      </p>

                      {/* Bundle Contents */}
                      {item.bundleSelection && item.selectedProducts && item.selectedProducts.length > 0 && (
                        <div className="mt-1">
                          <p className="text-xs font-medium text-sage-700 uppercase tracking-wide">
                            {locale === 'sv' ? 'Innehåller:' : 'Contains:'}
                          </p>
                          <ul className="space-y-0.5">
                            {item.selectedProducts.map((selectedProduct, idx) => (
                              <li key={`${item.productId}-${selectedProduct.id}-${idx}`} className="flex items-center text-xs text-gray-600">
                                <span className="inline-block w-1 h-1 rounded-full bg-sage-500 mr-1.5"></span>
                                {locale === 'sv' ? selectedProduct.translations.sv.name : selectedProduct.translations.en.name}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 text-sm">
                        {PriceCalculator.formatPrice(item.price * item.quantity, locale)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>{locale === 'sv' ? 'Subtotal' : 'Subtotal'}</span>
                <span>{PriceCalculator.formatPrice(subtotal, locale)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>{locale === 'sv' ? 'Moms (25%)' : 'VAT (25%)'}</span>
                <span>{PriceCalculator.formatPrice(tax, locale)}</span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span>{locale === 'sv' ? 'Frakt' : 'Shipping'}</span>
                <span>
                  {shipping === 0 
                    ? (locale === 'sv' ? 'Gratis' : 'Free')
                    : PriceCalculator.formatPrice(shipping, locale)
                  }
                </span>
              </div>
              
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>{locale === 'sv' ? 'Totalt' : 'Total'}</span>
                <span>{PriceCalculator.formatPrice(totalAmount, locale)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !selectedShipping}
              className="w-full mt-6 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing 
                ? (locale === 'sv' ? 'Bearbetar...' : 'Processing...')
                : (locale === 'sv' ? 'Slutför beställning' : 'Complete Order')
              }
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};