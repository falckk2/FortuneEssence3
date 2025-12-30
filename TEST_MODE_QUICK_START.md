# 🧪 Test Mode - Quick Start

Enable/disable test endpoints in **3 simple ways**:

---

## 🎨 Option 1: Admin UI (Easiest)

1. Go to: **http://localhost:3000/admin/test-config**
2. Click the big green/red button
3. Restart server: `npm run dev`

✅ **Done!**

---

## 🔧 Option 2: Environment Variable

Add to `.env.local`:
```bash
ENABLE_TEST_ENDPOINTS=true
```

Restart: `npm run dev`

✅ **Done!**

---

## ⚙️ Option 3: Automatic (Default)

**Do nothing!** Test endpoints are:
- ✅ Enabled in development mode (automatic)
- 🔒 Disabled in production mode (automatic)

Just run: `npm run dev`

✅ **Done!**

---

## 🚀 Test Your Setup

Visit: **http://localhost:3000/test-orders**

If you see the test interface = Test mode is **ON** ✅
If you get 403 error = Test mode is **OFF** 🔒

---

## 📚 Full Documentation

- **Toggle Guide**: [TEST_MODE_TOGGLE_GUIDE.md](./TEST_MODE_TOGGLE_GUIDE.md)
- **Test System Guide**: [TEST_SYSTEM_GUIDE.md](./TEST_SYSTEM_GUIDE.md)

---

**Quick toggle command:**
```bash
# Enable
echo "ENABLE_TEST_ENDPOINTS=true" >> .env.local && npm run dev

# Disable
echo "ENABLE_TEST_ENDPOINTS=false" >> .env.local && npm run dev
```
