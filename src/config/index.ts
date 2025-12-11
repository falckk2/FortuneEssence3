export const config = {
  app: {
    name: 'Fortune Essence',
    description: 'Premium essential oils and aromatherapy products',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    version: '1.0.0',
  },
  
  database: {
    url: process.env.DATABASE_URL || '',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xxxxxxxxxxxxxxxxxxx.supabase.co',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MjAwMDAwMDAsImV4cCI6MTkzNTU3NjAwMH0.placeholder',
  },
  
  auth: {
    nextAuthSecret: process.env.NEXTAUTH_SECRET || '',
    nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  },
  
  payments: {
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    swish: {
      merchantId: process.env.SWISH_MERCHANT_ID || '',
      certificatePath: process.env.SWISH_CERTIFICATE_PATH || '',
      privateKeyPath: process.env.SWISH_PRIVATE_KEY_PATH || '',
      testMode: process.env.NODE_ENV !== 'production',
    },
    klarna: {
      username: process.env.KLARNA_USERNAME || '',
      password: process.env.KLARNA_PASSWORD || '',
      baseUrl: process.env.NODE_ENV === 'production' 
        ? 'https://api.klarna.com' 
        : 'https://api.playground.klarna.com',
    },
  },
  
  shipping: {
    postnord: {
      apiKey: process.env.POSTNORD_API_KEY || '',
      baseUrl: 'https://atapi2.postnord.com/rest',
    },
    dhl: {
      apiKey: process.env.DHL_API_KEY || '',
      baseUrl: 'https://api-eu.dhl.com',
    },
  },

  email: {
    resendApiKey: process.env.RESEND_API_KEY || '',
    fromEmail: process.env.EMAIL_FROM || 'noreply@fortuneessence.se',
    fromName: process.env.EMAIL_FROM_NAME || 'Fortune Essence',
    supportEmail: process.env.EMAIL_SUPPORT || 'support@fortuneessence.se',
  },

  features: {
    multiLanguage: true,
    gdprCompliance: true,
    inventoryTracking: true,
    emailNotifications: true,
  },
  
  locales: {
    default: 'sv' as const,
    supported: ['sv', 'en'] as const,
  },
  
  theme: {
    colors: {
      primary: '#FFD700', // Golden
      secondary: '#9370DB', // Lavender purple for lavender oil
      background: '#FFF8DC', // Light golden background
      text: '#2D3748',
      accent: '#805AD5',
    },
  },
  
  limits: {
    maxCartItems: 50,
    maxOrderValue: 100000, // SEK
    maxImageSize: 5 * 1024 * 1024, // 5MB
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  
  seo: {
    defaultTitle: 'Fortune Essence - Premium Essential Oils',
    defaultDescription: 'Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced.',
    keywords: 'essential oils, aromatherapy, lavender, organic oils, natural wellness',
  },
} as const;

export type Config = typeof config;