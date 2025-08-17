# AWS Amplify Deployment Troubleshooting

## Common Issues and Solutions

### Build Failures

**Issue 1: Missing Environment Variables**
```bash
# Add these environment variables in Amplify Console:
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production
```

**Issue 2: Build Script Errors**
- Ensure `npm run build` works locally
- Check Node.js version compatibility (use Node 18)
- Verify all dependencies are in package.json

**Issue 3: Missing Files in Artifacts**
- Check `baseDirectory` in amplify.yml
- Verify build output directory structure
- Ensure static files are generated correctly

### Quick Fixes

1. **Local Build Test**:
   ```bash
   npm ci
   npm run build
   ls -la dist/
   ```

2. **Environment Variables Check**:
   - Go to Amplify Console → App Settings → Environment Variables
   - Add DATABASE_URL and NODE_ENV=production
   - Redeploy after adding variables

3. **Build Configuration**:
   - Use Node.js 18 in Amplify settings
   - Ensure amplify.yml is in root directory
   - Check build logs for specific error messages

4. **Database Connection**:
   - Verify database is accessible from AWS IP ranges
   - Test connection string format
   - Consider using AWS RDS for better integration

### Log Analysis

**Build Phase Errors**:
- Check npm install logs for dependency issues
- Verify TypeScript compilation errors
- Look for missing file imports

**Deploy Phase Errors**:
- Check artifact generation
- Verify server startup configuration
- Monitor environment variable access

### Alternative Deployment

If Amplify continues to fail, consider:
- Vercel deployment
- Railway deployment  
- AWS EC2 with Docker
- Manual server deployment

### Support Resources

- AWS Amplify Documentation
- Amplify Discord Community
- GitHub Issues for specific package problems