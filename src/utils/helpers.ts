import { CartItem, Product } from '@/types';

export class PriceCalculator {
  private static readonly VAT_RATE = 0.25; // 25% VAT for Sweden
  private static readonly CURRENCY = 'SEK';

  static formatPrice(price: number, locale: 'sv' | 'en' = 'sv'): string {
    return new Intl.NumberFormat(locale === 'sv' ? 'sv-SE' : 'en-US', {
      style: 'currency',
      currency: this.CURRENCY,
    }).format(price);
  }

  static calculateVAT(price: number): number {
    return Math.round(price * this.VAT_RATE * 100) / 100;
  }

  static calculatePriceWithVAT(price: number): number {
    return Math.round(price * (1 + this.VAT_RATE) * 100) / 100;
  }

  static calculateCartTotal(items: CartItem[]): number {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  }

  static calculateShippingWeight(items: CartItem[], products: Product[]): number {
    return items.reduce((totalWeight, item) => {
      const product = products.find(p => p.id === item.productId);
      return totalWeight + (product?.weight || 0) * item.quantity;
    }, 0);
  }
}

export class DateHelper {
  static formatDate(date: Date, locale: 'sv' | 'en' = 'sv'): string {
    return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  static formatDateTime(date: Date, locale: 'sv' | 'en' = 'sv'): string {
    return new Intl.DateTimeFormat(locale === 'sv' ? 'sv-SE' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isValidDate(date: string): boolean {
    return !isNaN(Date.parse(date));
  }
}

export class StringHelper {
  static generateSKU(name: string, category: string): string {
    const nameCode = name.substring(0, 3).toUpperCase();
    const categoryCode = category.substring(0, 2).toUpperCase();
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${nameCode}-${categoryCode}-${randomCode}`;
  }

  static generateOrderNumber(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `FE-${timestamp.slice(-6)}-${random}`;
  }

  static slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  }

  static truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  static capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }
}

export class ValidationHelper {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidSwedishPostalCode(postalCode: string): boolean {
    const postalCodeRegex = /^\d{3}\s?\d{2}$/;
    return postalCodeRegex.test(postalCode);
  }

  static isValidSwedishPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^(\+46|0)[1-9]\d{8,9}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }
}

export class ImageHelper {
  static generateImageUrl(filename: string, size: 'thumb' | 'medium' | 'large' = 'medium'): string {
    const baseUrl = process.env.NEXT_PUBLIC_STORAGE_URL || '/images';
    return `${baseUrl}/${size}/${filename}`;
  }

  static optimizeImageForWeb(file: File, maxWidth: number, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const optimizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(optimizedFile);
          }
        }, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export class LocalStorageHelper {
  private static readonly SESSION_ID_KEY = 'fortune-essence-session-id';

  static setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return null;
    }
  }

  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }

  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  static getSessionId(): string {
    try {
      let sessionId = localStorage.getItem(this.SESSION_ID_KEY);

      if (!sessionId) {
        sessionId = SessionHelper.generateSessionId();
        localStorage.setItem(this.SESSION_ID_KEY, sessionId);
      }

      return sessionId;
    } catch (error) {
      console.error('Failed to get session ID:', error);
      // Return a temporary session ID if localStorage fails
      return SessionHelper.generateSessionId();
    }
  }

  static clearSessionId(): void {
    try {
      localStorage.removeItem(this.SESSION_ID_KEY);
    } catch (error) {
      console.error('Failed to clear session ID:', error);
    }
  }
}

export class SessionHelper {
  static generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  static isExpired(timestamp: number, maxAge: number = 30 * 60 * 1000): boolean {
    return Date.now() - timestamp > maxAge;
  }
}

export class ErrorHelper {
  static createApiError(message: string, code: number = 500): Error {
    const error = new Error(message);
    (error as any).statusCode = code;
    return error;
  }

  static isApiError(error: unknown): error is Error & { statusCode: number } {
    return error instanceof Error && 'statusCode' in error;
  }

  static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}