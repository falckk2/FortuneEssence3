'use client';

import { useState, useEffect } from 'react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/stores/cartStore';
import { CartSidebar } from './CartSidebar';
import { useLocale } from '@/contexts/LocaleContext';

interface CartIconProps {
  className?: string;
}

export const CartIcon = ({ className = '' }: CartIconProps) => {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { getItemCount, refreshCart } = useCartStore();

  useEffect(() => {
    setIsClient(true);
    // Load cart from backend after hydration
    const timer = setTimeout(() => {
      refreshCart();
    }, 0);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemCount = isClient ? getItemCount() : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-forest-600 dark:text-[#B8C5B8] hover:text-forest-900 dark:hover:text-[#E8EDE8] transition-colors ${className}`}
        aria-label={locale === 'sv' ? 'Öppna varukorg' : 'Open cart'}
      >
        <ShoppingBagIcon className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-sage-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </button>

      <CartSidebar
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        locale={locale}
      />
    </>
  );
};