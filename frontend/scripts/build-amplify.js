#!/usr/bin/env node
// AWS Amplify build script that handles environment setup

console.log('🔧 Starting AWS Amplify build process...');

// Set environment variables for build
process.env.NODE_ENV = 'production';
process.env.AWS_BUILD = 'true';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder';

console.log('✅ Environment configured for AWS Amplify');
console.log('📦 NODE_ENV:', process.env.NODE_ENV);
console.log('🏗️  AWS_BUILD:', process.env.AWS_BUILD);
console.log('💾 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

// Import and run the build process
import { execSync } from 'child_process';

try {
  console.log('🔨 Running Vite build...');
  execSync('vite build', { stdio: 'inherit', env: process.env });
  
  console.log('🔨 Running ESBuild for server...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit', 
    env: process.env 
  });
  
  console.log('✅ AWS Amplify build completed successfully!');
  
  // List build artifacts
  console.log('📂 Build artifacts:');
  execSync('find dist -type f | head -10', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}