export const config = {
	app: {
		name: 'Fortune Essence',
		description: 'Premium essential oils and aromatherapy products',
		url: process.env.PUBLIC_APP_URL || 'http://localhost:3000',
		version: '1.0.0',
	},

	database: {
		supabaseUrl: process.env.PUBLIC_SUPABASE_URL || '',
		supabasePublishableKey: process.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY || '',
		supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || '',
	},

	auth: {
		secret: process.env.AUTH_SECRET || '',
	},

	payments: {
		stripe: {
			publishableKey: process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
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
			baseUrl:
				process.env.NODE_ENV === 'production'
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

	limits: {
		maxCartItems: 50,
		maxOrderValue: 100000,
		maxImageSize: 5 * 1024 * 1024,
		sessionTimeout: 30 * 60 * 1000,
	},

	seo: {
		defaultTitle: 'Fortune Essence - Premium Essential Oils',
		defaultDescription:
			'Discover premium essential oils and aromatherapy products. Natural, organic, and ethically sourced.',
		keywords: 'essential oils, aromatherapy, lavender, organic oils, natural wellness',
	},
} as const;

export type Config = typeof config;
