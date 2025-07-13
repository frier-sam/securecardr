#!/usr/bin/env node

/**
 * Setup script for SecureCardr Firebase deployment
 * This script helps configure the Firebase project and GitHub secrets
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { createInterface } from 'readline';

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 SecureCardr Firebase Deployment Setup\n');
  
  try {
    // Check if Firebase CLI is installed
    console.log('📦 Checking Firebase CLI...');
    try {
      execSync('firebase --version', { stdio: 'ignore' });
      console.log('✅ Firebase CLI is installed\n');
    } catch (error) {
      console.log('❌ Firebase CLI not found. Installing...');
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI installed\n');
    }
    
    // Check if user is logged in to Firebase
    console.log('🔐 Checking Firebase authentication...');
    try {
      execSync('firebase projects:list', { stdio: 'ignore' });
      console.log('✅ Firebase authentication verified\n');
    } catch (error) {
      console.log('❌ Not authenticated with Firebase. Please login:');
      execSync('firebase login', { stdio: 'inherit' });
      console.log('✅ Firebase authentication completed\n');
    }
    
    // Get Firebase project ID
    console.log('📋 Firebase Project Configuration:');
    const projectId = await question('Enter your Firebase project ID: ');
    
    if (!projectId) {
      console.log('❌ Firebase project ID is required');
      process.exit(1);
    }
    
    // Update .firebaserc
    console.log('📝 Updating .firebaserc...');
    const firebaserc = {
      projects: {
        default: projectId,
        production: projectId
      }
    };
    
    writeFileSync('.firebaserc', JSON.stringify(firebaserc, null, 2));
    console.log('✅ .firebaserc updated\n');
    
    // Create environment template
    console.log('🔧 Environment Configuration:');
    console.log('Please configure the following environment variables in your GitHub repository secrets:');
    console.log('(Settings > Secrets and variables > Actions)\n');
    
    const secrets = [
      'FIREBASE_SERVICE_ACCOUNT_KEY',
      'FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
      'VITE_GOOGLE_DRIVE_CLIENT_ID'
    ];
    
    secrets.forEach((secret, index) => {
      console.log(`${index + 1}. ${secret}`);
    });
    
    console.log('\\n📖 For detailed instructions, see DEPLOYMENT.md');
    
    // Generate service account key instructions
    console.log('\\n🔑 To get your Firebase Service Account Key:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click \"Generate new private key\"');
    console.log('3. Save the JSON content as FIREBASE_SERVICE_ACCOUNT_KEY secret');
    
    // Test Firebase deployment
    const testDeploy = await question('\\nWould you like to test Firebase deployment now? (y/n): ');
    
    if (testDeploy.toLowerCase() === 'y') {
      console.log('\\n🔨 Building project...');
      execSync('npm run build', { stdio: 'inherit' });
      
      console.log('\\n🚀 Testing Firebase deployment...');
      execSync('firebase deploy --only hosting --debug', { stdio: 'inherit' });
      
      console.log('\\n✅ Test deployment successful!');
    }
    
    console.log('\\n🎉 Setup completed successfully!');
    console.log('\\nNext steps:');
    console.log('1. Add all required secrets to your GitHub repository');
    console.log('2. Push to the \"prod\" branch to trigger deployment');
    console.log('3. Your app will be automatically deployed to Firebase Hosting!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main().catch(console.error);