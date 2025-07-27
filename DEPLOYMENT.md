# Deployment Guide

## 🚀 Overview

Results America is designed for seamless deployment on Vercel with Neon PostgreSQL. This guide covers the complete deployment process from development to production.

## 🎯 Deployment Strategy

### ✅ **Recommended Stack**
- **Frontend**: Next.js 15 on Vercel
- **Database**: Neon PostgreSQL (serverless)
- **Authentication**: Magic link via Resend
- **Domain**: Custom domain with SSL
- **Monitoring**: Vercel Analytics

### ✅ **Benefits**
- **Zero Configuration**: Automatic deployments from Git
- **Global CDN**: Fast loading worldwide
- **Serverless**: Scales automatically
- **SSL Included**: HTTPS by default
- **Database Integration**: Seamless Neon connection

---

## 📋 Pre-Deployment Checklist

### ✅ **Code Preparation**
- [ ] All tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Seed data prepared

### ✅ **Database Setup**
- [ ] Neon PostgreSQL project created
- [ ] Connection string available
- [ ] Database migrations tested
- [ ] Seed data verified

### ✅ **Environment Variables**
- [ ] `DATABASE_URL` configured
- [ ] `RESEND_API_KEY` for emails
- [ ] `NODE_ENV=production`
- [ ] Custom domain configured (optional)

---

## 🚀 Vercel Deployment

### 1. **Connect Repository**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from project directory
cd results-america-app
vercel
```

### 2. **Configure Environment Variables**

In Vercel Dashboard → Project Settings → Environment Variables:

```env
# Database
DATABASE_URL=postgresql://username:password@host/database?sslmode=require
NODE_ENV=production

# Email (Magic Link Authentication)
RESEND_API_KEY=your_resend_api_key

# Optional: Custom domain
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. **Database Setup**

```bash
# Run migrations on production database
npm run db:setup:prod

# Or manually
NODE_ENV=production npm run db:migrate
NODE_ENV=production npm run deploy:seed
```

### 4. **Verify Deployment**

```bash
# Check deployment status
vercel ls

# View deployment logs
vercel logs

# Test production build
vercel --prod
```

---

## 🗄️ Database Deployment

### **Neon PostgreSQL Setup**

1. **Create Neon Project**
   - Go to [neon.tech](https://neon.tech)
   - Create new project: `results-america-prod`
   - Copy connection string

2. **Configure Environment**
   ```env
   DATABASE_URL=postgresql://neondb_owner:password@ep-project-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```

3. **Run Migrations**
   ```bash
   # Set production environment
   export NODE_ENV=production
   
   # Run migrations
   npm run db:migrate
   
   # Seed production data
   npm run deploy:seed
   ```

### **Database Verification**

```bash
# Test database connection
curl https://your-app.vercel.app/api/states

# Check admin dashboard
curl https://your-app.vercel.app/api/admin/stats
```

---

## 🔐 Authentication Setup

### **Resend Email Configuration**

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)
   - Create account and verify domain
   - Generate API key

2. **Configure Environment**
   ```env
   RESEND_API_KEY=re_your_api_key_here
   ```

3. **Test Magic Links**
   - Visit `/auth/login` on production
   - Request magic link
   - Verify email delivery

### **Admin User Creation**

```bash
# 1. Create user via magic link
# 2. Promote to admin via database
psql $DATABASE_URL -c "
UPDATE users 
SET role = 'admin' 
WHERE email = 'admin@yourdomain.com';
"
```

---

## 🌐 Domain Configuration

### **Custom Domain Setup**

1. **Add Domain in Vercel**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **SSL Certificate**
   - Vercel automatically provisions SSL
   - HTTPS redirect enabled by default

3. **Environment Update**
   ```env
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```

---

## 📊 Monitoring & Analytics

### **Vercel Analytics**

1. **Enable Analytics**
   - Go to Project Settings → Analytics
   - Enable Vercel Analytics
   - Add tracking code to app

2. **Performance Monitoring**
   - View Core Web Vitals
   - Monitor API response times
   - Track user engagement

### **Database Monitoring**

1. **Neon Dashboard**
   - Monitor connection usage
   - View query performance
   - Check storage usage

2. **Application Logs**
   ```bash
   # View Vercel logs
   vercel logs
   
   # Monitor specific functions
   vercel logs --function=api/states
   ```

---

## 🔄 Continuous Deployment

### **GitHub Integration**

1. **Connect Repository**
   - Link GitHub repository to Vercel
   - Enable automatic deployments

2. **Deployment Triggers**
   - **Push to main**: Production deployment
   - **Pull requests**: Preview deployments
   - **Manual**: Trigger via Vercel dashboard

### **Deployment Pipeline**

```yaml
# .vercel/project.json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install"
}
```

---

## 🛠️ Troubleshooting

### **Common Issues**

#### **Build Failures**
```bash
# Check build locally
npm run build

# View build logs
vercel logs --build
```

#### **Database Connection Issues**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT NOW();"

# Check environment variables
vercel env ls
```

#### **Authentication Problems**
```bash
# Verify Resend configuration
curl -X POST https://api.resend.com/emails \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"from": "test@yourdomain.com", "to": "test@example.com", "subject": "Test", "html": "<p>Test</p>"}'
```

### **Performance Optimization**

1. **Database Optimization**
   ```sql
   -- Add indexes for common queries
   CREATE INDEX idx_data_points_state_year ON data_points(state_id, year);
   CREATE INDEX idx_statistics_category ON statistics(category_id);
   ```

2. **Caching Strategy**
   - Implement Redis for session storage
   - Add API response caching
   - Optimize database queries

---

## 🔒 Security Considerations

### **Environment Security**
- **Secrets Management**: Use Vercel environment variables
- **Database Access**: Restrict database connections
- **API Keys**: Rotate keys regularly

### **Application Security**
- **HTTPS Only**: Enforce HTTPS redirects
- **CORS Configuration**: Restrict cross-origin requests
- **Rate Limiting**: Implement API rate limits

### **Data Protection**
- **Backup Strategy**: Neon automatic backups
- **Data Encryption**: SSL for all connections
- **Access Control**: Role-based permissions

---

## 📈 Scaling Considerations

### **Performance Monitoring**
- Monitor API response times
- Track database query performance
- Watch for memory usage

### **Scaling Triggers**
- **Traffic Spikes**: Vercel auto-scales
- **Database Load**: Monitor connection pool
- **Storage Growth**: Track data volume

### **Optimization Strategies**
- **CDN Caching**: Static asset optimization
- **Database Indexing**: Query performance
- **Code Splitting**: Bundle optimization

---

## 🔄 Maintenance

### **Regular Tasks**
- **Security Updates**: Keep dependencies updated
- **Database Maintenance**: Monitor performance
- **Backup Verification**: Test restore procedures

### **Monitoring Alerts**
- **Uptime Monitoring**: Set up alerts
- **Error Tracking**: Monitor application errors
- **Performance Alerts**: Response time thresholds

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Resend Documentation](https://resend.com/docs)

---

**Last Updated**: January 2025  
**Version**: 0.1.0  
**Status**: Production-ready deployment guide 