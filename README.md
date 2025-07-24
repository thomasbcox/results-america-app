This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3050](http://localhost:3050) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Development Workflow

### Pre-commit Validation

Before committing code, run the validation script to catch common issues:

```bash
npm run validate
```

This will check for:
- ✅ Correct UI component import paths
- ✅ Next.js 15 dynamic route types
- ✅ No explicit `any` types in production code
- ✅ TypeScript compilation
- ✅ ESLint compliance

### Building for Production

The build process automatically runs validation:

```bash
npm run build
```

This will:
1. Run pre-build validation
2. Compile the application
3. Generate optimized production build

## Database Management

```bash
# Generate new migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open database studio
npm run db:studio

# Seed database
npm run db:seed
```

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Deployment

### Vercel Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Pre-deployment Checklist

Before deploying to production:

1. ✅ Run validation: `npm run validate`
2. ✅ Run tests: `npm test`
3. ✅ Check build: `npm run build`
4. ✅ Verify database migrations are up to date
5. ✅ Ensure environment variables are configured

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
