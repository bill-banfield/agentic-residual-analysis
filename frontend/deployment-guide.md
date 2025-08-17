# AWS Amplify Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the AMI Asset Management Application to AWS Amplify.

## Prerequisites
- AWS Account with Amplify access
- GitHub repository with this code
- Database (PostgreSQL) - can be AWS RDS or Neon Database

## Deployment Steps

### 1. Connect Repository to AWS Amplify

1. Log into AWS Console and navigate to AWS Amplify
2. Click "New app" → "Host web app"
3. Connect your GitHub repository: `skylersaucedo/ami-agentic-residual-calculation`
4. Select the main branch

### 2. Configure Build Settings

Use the included `amplify.yml` configuration file, or manually configure:

**Frontend Settings:**
- Build command: `npm run build`
- Build output directory: `dist/public`
- Node.js version: `18`

**Backend Settings:**
- Build command: `npm run build:server`
- Artifacts location: `dist`

### 3. Environment Variables

Configure the following environment variables in Amplify Console:

**Required:**
```
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

**Optional:**
```
REDIS_URL=redis://host:port (for caching)
```

### 4. Database Setup

**Option A: AWS RDS PostgreSQL**
1. Create RDS PostgreSQL instance
2. Update security groups to allow Amplify access
3. Use RDS connection details in DATABASE_URL

**Option B: Continue with Neon Database**
1. Keep existing Neon Database connection
2. Ensure Neon allows connections from AWS IP ranges
3. Use existing DATABASE_URL

### 5. Build Configuration

The application is configured with:
- **Frontend**: React + Vite builds to `dist/public`
- **Backend**: Express.js bundles to `dist/index.js`
- **Static serving**: Express serves frontend in production

### 6. Custom Domain (Optional)

1. In Amplify Console, go to "Domain management"
2. Add your custom domain
3. Configure DNS records as instructed

## Post-Deployment

### Database Migrations
Run database migrations after first deployment:
```bash
npm run db:generate
npm run db:migrate
```

### Testing
1. Test form submission to n8n webhook
2. Verify Redis caching (if configured)
3. Test interactive dashboard features

### Monitoring
- Monitor CloudWatch logs for errors
- Check Amplify build logs for issues
- Monitor database connections

## Configuration Files

### amplify.yml
Defines build process for both frontend and backend.

### .env.example
Template for required environment variables.

## Troubleshooting

### Common Issues

**Build Failures:**
- **Error**: "npm run build:server" command not found
  - Solution: Use updated amplify.yml with only "npm run build"
- **Error**: Missing environment variables during build
  - Solution: Add DATABASE_URL and NODE_ENV in Amplify Console
- **Error**: TypeScript compilation errors
  - Solution: Ensure all imports and types are correctly defined
- **Node.js Version**: Set to 18 in Amplify Console → App Settings → Build Settings
- **Dependencies**: Verify package-lock.json is committed to repository

**Database Connection:**
- Verify DATABASE_URL format
- Check firewall/security group settings
- Ensure database accepts external connections

**n8n Webhook Issues:**
- Update webhook URL if needed for production
- Verify CORS configuration
- Check network connectivity

### Support
- AWS Amplify Documentation: https://docs.amplify.aws/
- Check CloudWatch logs for runtime errors
- Review Amplify Console build logs

## Performance Optimization

### Caching
- Redis configured for response caching
- Fallback to in-memory cache if Redis unavailable

### CDN
- Amplify automatically provides CloudFront CDN
- Static assets cached globally

### Database
- Connection pooling via Drizzle ORM
- Optimized queries for dashboard data

## Security

### Environment Variables
- All sensitive data in environment variables
- No secrets committed to repository

### Database
- Encrypted connections via SSL
- Limited connection permissions

### API Security
- Input validation via Zod schemas
- CORS configured for production domains