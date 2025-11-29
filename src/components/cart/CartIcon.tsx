'use client';

import { useState, useEffect } from 'react';
import { ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCartStore } from '@/stores/cartStore';
import { CartSidebar } from './CartSidebar';

interface CartIconProps {
  locale?: 'sv' | 'en';
  className?: string;
}

export const CartIcon = ({ locale = 'sv', className = '' }: CartIconProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const { getItemCount } = useCartStore();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const itemCount = isClient ? getItemCount() : 0;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 transition-colors ${className}`}
        aria-label={locale === 'sv' ? 'Öppna varukorg' : 'Open cart'}
      >
        <ShoppingBagIcon className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-purple-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
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