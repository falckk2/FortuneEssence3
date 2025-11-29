# Fortune Essence - Deployment Guide

## Prerequisites

- Node.js 18+ installed
- Vercel CLI installed (`npm i -g vercel`)
- Supabase project set up
- Stripe account configured
- Domain name (optional)

## Environment Variables

Create the following environment variables in your Vercel dashboard:

### Authentication
```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-key
```

### Database (Supabase)
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### Payment Processing
```
# Stripe
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Swish (Sweden)
SWISH_CERTIFICATE_PATH=/path/to/swish/certificate.p12
SWISH_MERCHANT_ID=your-swish-merchant-id
SWISH_ENVIRONMENT=production

# Klarna
KLARNA_USERNAME=your-klarna-username
KLARNA_PASSWORD=your-klarna-password
KLARNA_ENVIRONMENT=production
```

## Deployment Steps

### 1. Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd FortuneEssence3

# Install dependencies
npm install

# Test locally
npm run dev
```

### 2. Database Setup

Run the SQL schema in your Supabase project:

```sql
-- Run the contents of database/schema.sql
-- This includes all tables, indexes, RLS policies, and sample data
```

### 3. Configure Authentication

In your Supabase project:
1. Go to Authentication → Settings
2. Add your Vercel domain to "Site URL"
3. Add redirect URLs:
   - `https://your-domain.vercel.app/api/auth/callback/google`
   - `https://your-domain.vercel.app/api/auth/callback/credentials`

### 4. Deploy to Vercel

```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or use the Vercel dashboard:
1. Connect your Git repository
2. Configure environment variables
3. Deploy

### 5. Post-Deployment Configuration

#### Configure Webhooks

**Stripe Webhooks:**
- Endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
- Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

**Supabase Webhooks (optional):**
- For real-time order updates
- Endpoint: `https://your-domain.vercel.app/api/webhooks/supabase`

#### Domain Configuration (Optional)

```bash
# Add custom domain
vercel domains add your-domain.com
vercel domains add www.your-domain.com

# Configure DNS
# Add CNAME record: www -> cname.vercel-dns.com
# Add A record: @ -> 76.76.19.61
```

## Production Checklist

### Security
- [ ] Enable HTTPS (automatic with Vercel)
- [ ] Configure CSP headers
- [ ] Enable rate limiting for API routes
- [ ] Validate all environment variables
- [ ] Enable Supabase RLS policies
- [ ] Configure CORS policies

### Performance
- [ ] Enable Edge Functions for geo-distributed APIs
- [ ] Configure ISR for product pages
- [ ] Set up CDN for images
- [ ] Enable compression
- [ ] Configure caching headers

### Monitoring
- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry)
- [ ] Set up uptime monitoring
- [ ] Enable log aggregation
- [ ] Configure alerts for critical errors

### Swedish Market Specifics
- [ ] Verify Swish integration in production
- [ ] Test Klarna payments
- [ ] Validate PostNord shipping rates
- [ ] Confirm Swedish postal code validation
- [ ] Test GDPR compliance features
- [ ] Verify Swedish translations

## Environment-Specific Configurations

### Development
```bash
# .env.local
NEXTAUTH_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
KLARNA_ENVIRONMENT=sandbox
SWISH_ENVIRONMENT=test
```

### Staging
```bash
# Vercel environment variables (staging)
NEXTAUTH_URL=https://staging-fortune-essence.vercel.app
STRIPE_SECRET_KEY=sk_test_...
KLARNA_ENVIRONMENT=playground
SWISH_ENVIRONMENT=test
```

### Production
```bash
# Vercel environment variables (production)
NEXTAUTH_URL=https://fortune-essence.vercel.app
STRIPE_SECRET_KEY=sk_live_...
KLARNA_ENVIRONMENT=production
SWISH_ENVIRONMENT=production
```

## Database Migrations

For future schema changes:

```sql
-- Example migration
ALTER TABLE products ADD COLUMN new_field VARCHAR(255);

-- Update RLS policies if needed
CREATE POLICY new_policy ON products FOR SELECT TO authenticated;

-- Add indexes for performance
CREATE INDEX idx_products_new_field ON products(new_field);
```

## Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Check build logs
vercel logs

# Local build test
npm run build
```

**Environment Variable Issues:**
```bash
# List current variables
vercel env ls

# Update variables
vercel env add VARIABLE_NAME production
```

**Database Connection Issues:**
- Verify Supabase URL and keys
- Check RLS policies
- Confirm network connectivity

**Payment Integration Issues:**
- Validate webhook endpoints
- Check API keys and secrets
- Verify merchant configurations

### Support Contacts

- **Vercel Support:** support@vercel.com
- **Supabase Support:** support@supabase.com  
- **Stripe Support:** support@stripe.com
- **Swish Technical:** developer@swish.nu
- **Klarna Developer:** developer@klarna.com

## Maintenance

### Regular Tasks
- Monitor error rates and performance metrics
- Update dependencies monthly
- Review and rotate API keys quarterly
- Backup database regularly
- Test payment integrations monthly

### Scaling Considerations
- Consider database read replicas for high traffic
- Implement caching for frequently accessed data
- Use Edge Functions for geo-distributed API responses
- Consider CDN for static assets
- Monitor and optimize database queries

This deployment guide ensures a robust, secure, and scalable deployment of Fortune Essence on Vercel with full Swedish market integration.