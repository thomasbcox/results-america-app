# 🚀 Vercel Production Seeding Guide

## Quick Start

### After deploying to Vercel:

1. **Set environment variables** in Vercel dashboard:
   ```
   POSTGRES_URL=postgresql://user:pass@host/database?sslmode=require
   ```

2. **Run seeding**:
   ```bash
   npm run seed:vercel
   ```

3. **Verify setup**:
   - Visit `/auth/login`
   - Enter `admin@resultsamerica.org`
   - Check email for magic link
   - Access `/admin` dashboard

## What Gets Seeded

- ✅ **51 States** (50 US + Nation)
- ✅ **7 Categories** (Education, Economy, Health, etc.)
- ✅ **10 Data Sources** (Census, BLS, CDC, etc.)
- ✅ **Admin User** (`admin@resultsamerica.org`)
- ✅ **3 CSV Templates** (Multi-category, Single-category, Multi-year)

## Troubleshooting

**Database connection failed?**
- Check `POSTGRES_URL` environment variable
- Verify Neon database is running
- Ensure SSL is enabled

**Seeding timeout?**
- Script uses single connection with 10s timeout
- Should complete within 30 seconds
- Check Neon connection limits

**Admin login not working?**
- Verify seeding completed successfully
- Check email for magic link
- Ensure email service is configured

## API Endpoint

You can also trigger seeding via API:

```bash
curl -X POST https://your-app.vercel.app/api/admin/seed
```

## Technical Details

### Environment Variables
The script checks for database URL in this order:
1. `POSTGRES_URL` (Vercel default)
2. `DATABASE_URL` (common fallback)
3. `NEON_DATABASE_URL` (explicit Neon)

### Connection Settings
- **Max connections**: 1 (single connection for seeding)
- **Idle timeout**: 20 seconds
- **Connect timeout**: 10 seconds
- **SSL**: Required (Neon requirement)

### Idempotent Operations
- Checks for existing records before inserting
- Safe to run multiple times
- No duplicate data created

### Error Handling
- Clear error messages
- Graceful connection cleanup
- Proper exit codes for CI/CD

## Migration from Old System

If you have the old 2/10 seeding scripts:

1. **Remove old scripts**:
   ```bash
   rm scripts/seed-development.sh
   rm scripts/seed-production.sh
   ```

2. **Update package.json**:
   ```json
   "seed:vercel": "tsx scripts/vercel-seed.ts"
   ```

3. **Use new command**:
   ```bash
   npm run seed:vercel
   ```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Database migrations run
- [ ] Seeding completed successfully
- [ ] Admin user can log in
- [ ] CSV templates available
- [ ] Admin dashboard accessible

## Support

For issues with the seeding system:
1. Check Vercel function logs
2. Verify database connectivity
3. Ensure all environment variables are set
4. Contact development team if problems persist 