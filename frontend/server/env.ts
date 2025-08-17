// Environment configuration for build and runtime
export function getEnvironmentConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isBuild = process.env.AWS_APP_ID || process.env.AMPLIFY_BUILD || process.env.CI;
  
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000'),
    DATABASE_URL: process.env.DATABASE_URL || undefined,
    REDIS_URL: process.env.REDIS_URL || undefined,
    isProduction,
    isBuild: !!isBuild,
    isDevelopment: !isProduction && !isBuild
  };
}

// Safe database URL that doesn't throw during builds
export function getDatabaseUrl(): string | undefined {
  const config = getEnvironmentConfig();
  
  // During build process, don't require database
  if (config.isBuild) {
    return undefined;
  }
  
  // In runtime, require database URL
  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for runtime operations");
  }
  
  return config.DATABASE_URL;
}