'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/types';
import { PriceCalculator } from '@/utils/helpers';
import { getProductBenefits } from '@/utils/productBenefits';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductReviews } from '@/components/products/ProductReviews';
import {
  ShoppingCartIcon,
  HeartIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  TruckIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [imageError, setImageError] = useState(false);
  const locale = 'sv'; // Would come from context in real app

  const { addItem, isLoading: cartLoading } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist } = useWishlistStore();

  const isInWishlist = wishlistItems.some(item => item.id === productId);

  useEffect(() => {
    const fetchProductData = async () => {
      setLoading(true);
      try {
        // Fetch product details
        const productResponse = await fetch(`/api/products/${productId}`);
        const productData = await productResponse.json();

        if (productData.success && productData.data) {
          setProduct(productData.data);

          // Fetch related products
          const relatedResponse = await fetch(`/api/products?category=${productData.data.category}&limit=4`);
          const relatedData = await relatedResponse.json();

          if (relatedData.success) {
            // Filter out current product and limit to 4
            const filtered = relatedData.data
              .filter((p: Product) => p.id !== productId)
              .slice(0, 4);
            setRelatedProducts(filtered);
          }
        } else {
          toast.error(locale === 'sv' ? 'Produkten hittades inte' : 'Product not found');
          router.push('/products');
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error(locale === 'sv' ? 'Kunde inte ladda produkten' : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [productId, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-sage-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const localizedName = product.translations[locale].name;
  const localizedDescription = product.translations[locale].description;
  const formattedPrice = PriceCalculator.formatPrice(product.price, locale);
  const isOutOfStock = product.stock === 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;
  const productBenefits = getProductBenefits(product.name, product.category);

  const getProductImages = () => {
    if (imageError || !product.images || product.images.length === 0) {
      return ['/images/placeholder-product.jpg'];
    }
    return product.images;
  };

  const images = getProductImages();

  const handleAddToCart = async () => {
    if (isOutOfStock || quantity <= 0) return;

    try {
      await addItem({
        productId: product.id,
        quantity,
        price: product.price
      });
      toast.success(
        locale === 'sv'
          ? `${quantity} st ${localizedName} tillagd i varukorgen`
          : `${quantity} ${localizedName} added to cart`
      );
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte lägga till i varukorgen' : 'Failed to add to cart');
    }
  };

  const handleToggleWishlist = () => {
    if (isInWishlist) {
      removeFromWishlist(productId);
      toast.success(locale === 'sv' ? 'Borttagen från önskelista' : 'Removed from wishlist');
    } else {
      addToWishlist(product);
      toast.success(locale === 'sv' ? 'Tillagd i önskelista' : 'Added to wishlist');
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'essential-oils': 'bg-sage-100 text-sage-700 border-sage-200',
      'carrier-oils': 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
      'diffusers': 'bg-cream-300 text-forest-700 border-cream-400',
      'accessories': 'bg-forest-100 text-forest-700 border-forest-200',
      'gift-sets': 'bg-rose-100 text-rose-700 border-rose-200',
    };
    return colors[category] || 'bg-cream-200 text-forest-700 border-cream-300';
  };

  const getCategoryName = (category: string) => {
    const names: { [key: string]: { sv: string; en: string } } = {
      'essential-oils': { sv: 'Eteriska oljor', en: 'Essential Oils' },
      'carrier-oils': { sv: 'Bäraroljor', en: 'Carrier Oils' },
      'diffusers': { sv: 'Diffusers', en: 'Diffusers' },
      'accessories': { sv: 'Tillbehör', en: 'Accessories' },
      'gift-sets': { sv: 'Presentset', en: 'Gift Sets' },
    };
    return names[category]?.[locale] || category;
  };

  const handleAddToCartFromRelated = async (relatedProductId: string) => {
    try {
      const relatedProduct = relatedProducts.find(p => p.id === relatedProductId);
      if (!relatedProduct) return;

      await addItem({
        productId: relatedProductId,
        quantity: 1,
        price: relatedProduct.price
      });
      toast.success(
        locale === 'sv'
          ? 'Produkt tillagd i varukorgen'
          : 'Product added to cart'
      );
    } catch (error) {
      toast.error(locale === 'sv' ? 'Kunde inte lägga till i varukorgen' : 'Failed to add to cart');
    }
  };

  const handleToggleWishlistFromRelated = (relatedProductId: string) => {
    const relatedProduct = relatedProducts.find(p => p.id === relatedProductId);
    if (!relatedProduct) return;

    const inWishlist = wishlistItems.some(item => item.id === relatedProductId);
    if (inWishlist) {
      removeFromWishlist(relatedProductId);
      toast.success(locale === 'sv' ? 'Borttagen från önskelista' : 'Removed from wishlist');
    } else {
      addToWishlist(relatedProduct);
      toast.success(locale === 'sv' ? 'Tillagd i önskelista' : 'Added to wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Back Button */}
      <div className="bg-white border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/products"
            className="inline-flex items-center text-forest-600 hover:text-sage-700 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            <span className="font-medium">
              {locale === 'sv' ? 'Tillbaka till produkter' : 'Back to products'}
            </span>
          </Link>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-soft">
              <Image
                src={images[selectedImage]}
                alt={localizedName}
                fill
                className="object-cover object-center"
                onError={() => setImageError(true)}
                priority
              />

              {/* Benefit Badges on Image */}
              {productBenefits.length > 0 && (
                <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10">
                  {productBenefits.map((benefit) => (
                    <span
                      key={benefit.key}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium backdrop-blur-sm border ${benefit.color} shadow-md`}
                    >
                      <span>{benefit.icon}</span>
                      <span>{benefit.label[locale]}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square overflow-hidden rounded-2xl transition-all ${
                      selectedImage === index
                        ? 'ring-4 ring-sage-600 shadow-lg scale-105'
                        : 'ring-2 ring-cream-200 hover:ring-sage-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${localizedName} - ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Category Badge */}
            <div>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${getCategoryColor(product.category)}`}>
                {getCategoryName(product.category)}
              </span>
            </div>

            {/* Product Name */}
            <div>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-forest-800 leading-tight mb-2">
                {localizedName}
              </h1>
              <p className="text-forest-600 text-sm">
                {locale === 'sv' ? 'Art.nr' : 'SKU'}: {product.sku}
              </p>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-forest-800">
                {formattedPrice}
              </span>
              <span className="text-forest-500">
                {locale === 'sv' ? 'Inkl. 25% moms' : 'Incl. 25% VAT'}
              </span>
            </div>

            {/* Stock Status */}
            <div>
              {isOutOfStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="font-medium">
                    {locale === 'sv' ? 'Slut i lager' : 'Out of stock'}
                  </span>
                </div>
              ) : isLowStock ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-terracotta-100 text-terracotta-800 border border-terracotta-200">
                  <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
                  <span className="font-medium">
                    {locale === 'sv' ? `Bara ${product.stock} kvar!` : `Only ${product.stock} left!`}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-sage-100 text-sage-800 border border-sage-200">
                  <CheckCircleIcon className="h-5 w-5" />
                  <span className="font-medium">
                    {locale === 'sv' ? 'I lager' : 'In stock'}
                  </span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="prose prose-forest max-w-none">
              <p className="text-forest-700 leading-relaxed text-lg">
                {localizedDescription}
              </p>
            </div>

            {/* Quantity Selector & Add to Cart */}
            <div className="space-y-4 pt-4">
              {!isOutOfStock && (
                <div>
                  <label className="block text-sm font-medium text-forest-700 mb-2">
                    {locale === 'sv' ? 'Antal' : 'Quantity'}
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={decrementQuantity}
                      disabled={quantity <= 1}
                      className="w-12 h-12 rounded-full bg-white border-2 border-cream-300 text-forest-700 font-bold hover:border-sage-600 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      -
                    </button>
                    <span className="text-2xl font-bold text-forest-800 w-16 text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={incrementQuantity}
                      disabled={quantity >= product.stock}
                      className="w-12 h-12 rounded-full bg-white border-2 border-cream-300 text-forest-700 font-bold hover:border-sage-600 hover:bg-sage-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || cartLoading}
                  className={`flex-1 flex items-center justify-center px-8 py-4 rounded-full text-lg font-semibold transition-all shadow-lg ${
                    isOutOfStock
                      ? 'bg-cream-200 text-forest-400 cursor-not-allowed'
                      : 'bg-sage-600 text-white hover:bg-sage-700 hover:shadow-xl hover:-translate-y-0.5 transform active:translate-y-0'
                  } ${cartLoading ? 'opacity-75 cursor-wait' : ''}`}
                >
                  {cartLoading ? (
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin mr-3" />
                  ) : (
                    !isOutOfStock && <ShoppingCartIcon className="h-6 w-6 mr-3" />
                  )}
                  {isOutOfStock
                    ? (locale === 'sv' ? 'Slutsåld' : 'Sold Out')
                    : (locale === 'sv' ? 'Lägg i varukorg' : 'Add to Cart')
                  }
                </button>

                <button
                  onClick={handleToggleWishlist}
                  className="w-16 h-16 flex items-center justify-center rounded-full bg-white border-2 border-cream-300 hover:border-rose-500 hover:bg-rose-50 transition-all shadow-lg hover:shadow-xl"
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isInWishlist ? (
                    <HeartSolidIcon className="h-7 w-7 text-rose-500" />
                  ) : (
                    <HeartIcon className="h-7 w-7 text-forest-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-cream-200">
              <div className="flex items-start gap-3">
                <TruckIcon className="h-6 w-6 text-sage-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-forest-800">
                    {locale === 'sv' ? 'Snabb leverans' : 'Fast delivery'}
                  </p>
                  <p className="text-sm text-forest-600">
                    {locale === 'sv' ? '2-4 arbetsdagar' : '2-4 business days'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheckIcon className="h-6 w-6 text-sage-600 flex-shrink-0 mt-1" />
                <div>
                  <p className="font-medium text-forest-800">
                    {locale === 'sv' ? 'Säker betalning' : 'Secure payment'}
                  </p>
                  <p className="text-sm text-forest-600">
                    {locale === 'sv' ? 'Krypterad transaktion' : 'Encrypted transaction'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <div className="mt-16 lg:mt-24">
          <ProductReviews
            productId={productId}
            userId={undefined} // TODO: Get from session/auth context
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <div className="text-center mb-8">
              <h2 className="text-3xl lg:text-4xl font-serif font-bold text-forest-800 mb-3">
                {locale === 'sv' ? 'Liknande produkter' : 'Related Products'}
              </h2>
              <p className="text-forest-600 max-w-2xl mx-auto">
                {locale === 'sv'
                  ? 'Upptäck fler produkter du kanske gillar'
                  : 'Discover more products you might like'
                }
              </p>
            </div>
            <ProductGrid
              products={relatedProducts}
              locale={locale}
              onAddToCart={handleAddToCartFromRelated}
              onToggleWishlist={handleToggleWishlistFromRelated}
              wishlistItems={wishlistItems}
            />
          </div>
        )}
      </div>
    </div>
  );
}
