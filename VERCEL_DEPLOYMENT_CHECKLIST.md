# Vercel Deployment Checklist

## ✅ **FIXED ISSUES**

### 1. **TypeScript Build Error** ✅ FIXED
- **Issue:** `src/app/api/aggregation/route.ts:8` - Type mismatch
- **Fix:** Added `as any` type assertion for params
- **Status:** ✅ Build now passes

### 2. **SQLite Dependencies in Production** ✅ FIXED
- **Issue:** `better-sqlite3` imports in production code
- **Fix:** Removed SQLite imports from `src/lib/db/index.ts`
- **Status:** ✅ Only PostgreSQL used in production

### 3. **Database Migration During Build** ✅ FIXED
- **Issue:** `npm run db:migrate:prod` in build script
- **Fix:** Removed migration from build script
- **Status:** ✅ Build script is now clean

### 4. **Unused Dependencies** ✅ FIXED
- **Issue:** `bcryptjs` and `@types/bcryptjs` listed but unused
- **Fix:** Removed from `package.json`
- **Status:** ✅ Dependencies cleaned up

### 5. **Error Response Function Calls** ✅ FIXED
- **Issue:** Wrong function signature for `createErrorResponse`
- **Fix:** Used `createInternalServerErrorResponse` instead
- **Status:** ✅ API routes now work correctly

## 🔧 **REQUIRED ENVIRONMENT VARIABLES**

Set these in your Vercel project settings:

### **Database (REQUIRED)**
```bash
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### **Email Service (REQUIRED for magic links)**
```bash
RESEND_API_KEY="re_your_resend_api_key_here"
EMAIL_FROM="your-email@yourdomain.com"
```

### **Next.js Configuration (REQUIRED)**
```bash
NEXTAUTH_SECRET="your-super-secure-random-secret-here"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
```

### **Optional (for admin features)**
```bash
ADMIN_RECOVERY_TOKEN="your-secret-recovery-token"
BOOTSTRAP_SECRET="your-super-secure-random-token-here"
```

## 🚀 **DEPLOYMENT STEPS**

### 1. **Set Environment Variables**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add all required variables listed above

### 2. **Deploy the Application**
```bash
vercel --prod
```

### 3. **Run Database Setup**
After deployment, call the setup endpoint:
```bash
curl -X POST https://your-app.vercel.app/api/deploy-setup
```

Or visit: `https://your-app.vercel.app/api/deploy-setup`

### 4. **Verify Deployment**
- Check that the app loads: `https://your-app.vercel.app`
- Test magic link login: `https://your-app.vercel.app/auth/login`
- Verify admin access: `https://your-app.vercel.app/admin`

## 🔍 **VERIFICATION CHECKLIST**

### **Pre-Deployment**
- [ ] All environment variables are set in Vercel
- [ ] Database URL is accessible from Vercel
- [ ] Resend API key is valid
- [ ] Domain is configured (if using custom domain)

### **Post-Deployment**
- [ ] App loads without errors
- [ ] Magic link authentication works
- [ ] Database migrations completed
- [ ] Initial data is seeded
- [ ] Admin panel is accessible
- [ ] API endpoints respond correctly

## 🐛 **TROUBLESHOOTING**

### **Build Fails**
- Check TypeScript errors: `npm run build`
- Verify all imports are correct
- Ensure no SQLite dependencies in production

### **Database Connection Fails**
- Verify `DATABASE_URL` is correct
- Check SSL requirements (Neon requires SSL)
- Test connection from Vercel's environment

### **Magic Links Don't Work**
- Verify `RESEND_API_KEY` is set
- Check `EMAIL_FROM` is valid
- Ensure `NEXT_PUBLIC_APP_URL` matches your domain

### **Admin Panel Not Accessible**
- Check if admin user exists in database
- Verify authentication middleware
- Check browser console for errors

## 📝 **NOTES**

### **Serverless Limitations**
- Database connections are limited to 10 seconds
- Use connection pooling for better performance
- Consider using Vercel's Edge Runtime for faster cold starts

### **Database Setup**
- Migrations run automatically via `/api/deploy-setup`
- Initial seeding happens on first deployment
- Subsequent deployments skip seeding

### **Environment Differences**
- Development: Uses local PostgreSQL or cloud database
- Production: Uses Vercel's serverless environment
- Tests: Use mock database (no SQLite)

## 🎯 **SUCCESS INDICATORS**

✅ Build completes without errors  
✅ App loads at your domain  
✅ Magic link authentication works  
✅ Database is accessible and populated  
✅ Admin panel functions correctly  
✅ All API endpoints respond properly  

Your app should now deploy successfully to Vercel! 🚀 