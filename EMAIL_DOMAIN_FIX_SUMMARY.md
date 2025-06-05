# Email Domain Fix Summary

## 🔧 Issue Resolved

**Problem**: Email links in production were showing `localhost:5173` instead of the actual domain due to improper environment variable handling.

**Root Cause**: The code was defaulting to `process.env.BASE_URL || "http://localhost:5173"` but `BASE_URL` wasn't being set in production environments.

## ✅ Solution Implemented

### 1. **Updated Environment Variable Priority**

Modified all email service and authentication code to use this priority order:
1. `ORIGIN_URL` (production domain)
2. `VITE_APP_URL` (fallback)
3. `BASE_URL` (legacy support)
4. `http://localhost:5173` (development fallback)

### 2. **Files Modified**

#### **Server Files:**
- `server/services/email-service.ts` - Fixed logo URLs and dashboard links
- `server/config/auth.ts` - Fixed all email verification and password reset links
- `server/src/routes/contact-routes.ts` - Fixed contact form email templates
- `server/src/routes/admin/smtp-routes.ts` - Fixed SMTP test emails

#### **Docker Configuration:**
- `docker-compose.yml` - Added `BASE_URL: ${ORIGIN_URL}`
- `docker-compose.prod.yml` - Added `BASE_URL: ${ORIGIN_URL}`

#### **Environment Files:**
- `.env` - Added `BASE_URL=http://localhost:3000`
- `.env.example` - Added `BASE_URL=http://localhost:3000`
- `.env.docker` - Added `BASE_URL=http://localhost:3000`
- `.env.cleaned` - Added `BASE_URL=http://localhost:3000`

#### **Documentation:**
- `docs/deployment/PORTAINER_GIT_DEPLOYMENT.md` - Updated with `BASE_URL` examples

### 3. **Environment Variable Structure**

#### **Development (.env):**
```env
VITE_API_URL=http://localhost:3000
VITE_APP_URL=http://localhost:3000
ORIGIN_URL=http://localhost:3000
BASE_URL=http://localhost:3000
```

#### **Production (.env or Docker):**
```env
VITE_API_URL=https://yourdomain.com/api
VITE_APP_URL=https://yourdomain.com
ORIGIN_URL=https://yourdomain.com
BASE_URL=https://yourdomain.com
```

## 🧪 How to Test

### **1. Development Testing:**
```bash
# 1. Ensure your .env has the correct URLs
grep -E "(ORIGIN_URL|BASE_URL|VITE_APP_URL)" .env

# 2. Restart your development server
npm run dev

# 3. Test email functions:
# - Register a new user (check email verification link)
# - Use "Forgot Password" (check reset link)
# - Contact form (check email templates)
```

### **2. Production Testing:**
```bash
# 1. Update your production environment variables
# Set ORIGIN_URL=https://yourdomain.com
# Set BASE_URL=https://yourdomain.com
# Set VITE_APP_URL=https://yourdomain.com

# 2. Deploy/restart your application

# 3. Test emails in production:
# - Register test user
# - Check received emails for correct domain links
```

### **3. Docker Testing:**
```bash
# 1. Update docker-compose environment variables
# 2. Rebuild and restart containers
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build

# 3. Check email links in production deployment
```

## 📋 Verification Checklist

### **Email Link Domains Should Show:**
- ✅ `https://yourdomain.com/verify-email?token=...` (NOT localhost:5173)
- ✅ `https://yourdomain.com/reset-password?token=...` (NOT localhost:5173)
- ✅ `https://yourdomain.com/dashboard` (NOT localhost:5173)
- ✅ Logo URLs: `https://yourdomain.com/logo.png` (NOT localhost:5173)

### **Functions to Test:**
1. **User Registration** → Email verification link
2. **Forgot Password** → Password reset link
3. **Contact Form** → Logo URLs in admin notification
4. **Login Alerts** → Reset links in security emails
5. **Password Changes** → Notification emails
6. **SMTP Test** → Admin test emails

## 🔍 Debugging

### **Check Environment Variables:**
```bash
# In development
node -e "console.log('ORIGIN_URL:', process.env.ORIGIN_URL)"
node -e "console.log('BASE_URL:', process.env.BASE_URL)"

# In Docker
docker compose exec app printenv | grep -E "(ORIGIN_URL|BASE_URL|VITE_APP_URL)"
```

### **Common Issues:**

1. **Still seeing localhost:5173?**
   - Check if `ORIGIN_URL` is set correctly
   - Restart server after environment changes
   - Verify Docker environment variables

2. **Empty environment variables?**
   - Ensure `.env` file is in root directory
   - Check Docker compose file has variables mapped
   - Verify production deployment has environment configured

3. **Wrong domain in emails?**
   - Check email templates are using the updated code
   - Clear any email caches
   - Test with fresh email registration

## 🚀 Production Deployment Notes

### **For VPS/Direct Deployment:**
1. Set environment variables in your `.env.production` file
2. Ensure web server (nginx) is configured for your domain
3. Test email functionality after deployment

### **For Docker/Portainer:**
1. Update environment variables in Portainer stack
2. Redeploy stack to apply changes
3. Monitor container logs for any issues

### **For Cloud Platforms:**
1. Set environment variables in platform settings
2. Ensure domain DNS is correctly configured
3. Test email delivery in production environment

## ⚡ Benefits of This Fix

1. **Professional Appearance**: Emails now show your actual domain
2. **Security**: No localhost references in production emails
3. **User Trust**: Professional-looking email links
4. **SEO/Branding**: Consistent domain usage across all communications
5. **Debugging**: Clear environment variable hierarchy for easier troubleshooting

---

**Status**: ✅ **RESOLVED** - Email domain links now correctly use production domain instead of localhost:5173 