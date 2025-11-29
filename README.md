# Fortune Essence - Swedish Essential Oils E-commerce Platform

Fortune Essence is a modern, full-stack e-commerce platform specifically designed for the Swedish essential oils market. Built with Next.js 15, TypeScript, and Supabase, it provides a complete solution for selling essential oils, carrier oils, diffusers, and accessories online.

## 🌟 Features

### 🛒 E-commerce Core
- **Product Catalog** with Swedish/English localization
- **Shopping Cart** with persistent storage
- **Secure Checkout** with multiple payment options
- **Order Management** with real-time tracking
- **Inventory Management** with low-stock alerts
- **Customer Accounts** with order history

### 🇸🇪 Swedish Market Focus
- **Swish Integration** - Sweden's most popular mobile payment
- **Klarna Payments** - Buy now, pay later option
- **PostNord Shipping** - Swedish postal service integration
- **Swedish Postal Code Validation** with delivery zones
- **VAT Calculation** (25% Swedish VAT)
- **GDPR Compliance** with full data export/deletion
- **Swedish/English Localization** throughout

### 🏗️ Technical Excellence
- **SOLID Principles** - Clean, maintainable architecture
- **TypeScript** - Full type safety
- **Server-Side Rendering** - Optimal performance
- **Real-time Updates** with Supabase
- **Security First** - JWT, RLS, encryption
- **Mobile Responsive** design

## 🚀 Tech Stack

- **Frontend:** Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase PostgreSQL
- **Authentication:** NextAuth.js with Supabase adapter
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Payments:** Stripe, Swish, Klarna
- **State Management:** Zustand
- **Deployment:** Vercel
- **Image Optimization:** Next.js Image component
- **Validation:** Zod schemas

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (via Supabase)
- Stripe account
- Swish merchant account (for Swedish payments)
- Klarna developer account

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd FortuneEssence3
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. **Set up the database:**
```bash
# Run the SQL schema in your Supabase project
# File: database/schema.sql
```

5. **Run the development server:**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

6. **Open in browser:**
```
http://localhost:3000
```

### Environment Variables

```env
# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
SWISH_MERCHANT_ID=your-merchant-id
KLARNA_USERNAME=your-username
KLARNA_PASSWORD=your-password
```

## 📁 Project Structure

```
FortuneEssence3/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── (auth)/            # Authentication pages
│   │   ├── account/           # Customer account pages
│   │   ├── api/               # API routes
│   │   ├── checkout/          # Checkout process
│   │   ├── orders/            # Order tracking
│   │   └── products/          # Product catalog
│   ├── components/            # Reusable React components
│   │   ├── auth/             # Authentication components
│   │   ├── cart/             # Shopping cart components
│   │   ├── checkout/         # Checkout components
│   │   ├── gdpr/             # GDPR compliance components
│   │   ├── orders/           # Order management components
│   │   ├── products/         # Product display components
│   │   ├── shipping/         # Shipping components
│   │   └── ui/               # Base UI components
│   ├── interfaces/           # TypeScript interfaces
│   ├── repositories/         # Data access layer
│   ├── services/             # Business logic layer
│   ├── stores/               # Zustand state management
│   ├── types/                # TypeScript type definitions
│   └── utils/                # Utility functions
├── database/
│   └── schema.sql            # PostgreSQL database schema
├── public/                   # Static assets
├── DEPLOYMENT.md             # Deployment guide
└── vercel.json              # Vercel configuration
```

## 🛡️ Security Features

### Authentication & Authorization
- JWT-based authentication with NextAuth.js
- Row Level Security (RLS) in PostgreSQL
- Session management with secure cookies
- API route protection with middleware

### Data Protection
- GDPR-compliant data handling
- User data export and deletion
- Consent management system
- Secure payment processing
- SSL/TLS encryption

## 🏪 E-commerce Features

### Product Management
- **Categories:** Essential oils, Carrier oils, Diffusers, Accessories, Gift sets
- **Attributes:** Weight, dimensions, stock levels, pricing
- **Images:** Optimized product photography
- **SEO:** Meta tags, structured data, sitemap

### Payment Processing
- **Stripe:** International card payments
- **Swish:** Swedish mobile payments (QR code + deep link)
- **Klarna:** Buy now, pay later
- **VAT:** Automatic 25% Swedish VAT calculation

### Shipping & Logistics
- **PostNord Integration:** Standard and express delivery
- **Zone-based Pricing:** Stockholm, Göteborg, Malmö, etc.
- **Free Shipping:** Orders over 500 SEK
- **Delivery Estimation:** Including Swedish holidays
- **Carbon Neutral Options:** Eco-friendly shipping

## 📦 Deployment

The application is optimized for deployment on Vercel. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo/FortuneEssence3)

## 💼 Business Features

### Swedish Market Compliance
- ✅ GDPR compliance with data export/deletion
- ✅ Swedish VAT calculation (25%)
- ✅ PostNord shipping integration
- ✅ Swish payment integration
- ✅ Klarna buy-now-pay-later
- ✅ Swedish postal code validation
- ✅ Holiday delivery adjustments
- ✅ Swedish/English localization

### E-commerce Essentials
- ✅ Product catalog management
- ✅ Shopping cart with persistence
- ✅ Multi-step checkout process
- ✅ Order management system
- ✅ Customer account portal
- ✅ Inventory tracking
- ✅ Payment processing
- ✅ Shipping calculations
- ✅ Email notifications

## 📞 Support

For support, please contact:
- **Technical Issues:** developer@fortune-essence.se
- **Business Inquiries:** info@fortune-essence.se
- **GDPR Requests:** privacy@fortune-essence.se

---

**Built with ❤️ for the Swedish essential oils market**
