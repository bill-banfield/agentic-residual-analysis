// Simple build script for AWS Amplify
const { execSync } = require('child_process');
const path = require('path');

console.log('Starting build process...');

// Set environment variables
process.env.NODE_ENV = 'production';
process.env.AWS_BUILD = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

try {
  console.log('Building with Vite and ESBuild...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
  execSync('ls -la dist/', { stdio: 'inherit' });
  
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}