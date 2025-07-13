# GitHub Actions & Firebase Hosting Deployment Setup

This repository is configured with automated deployment to Firebase Hosting using GitHub Actions. The setup includes production deployments, preview deployments, and comprehensive CI/CD pipelines.

## 🚀 Workflows Overview

### 1. **Production Deployment** (`.github/workflows/deploy.yml`)
- **Triggers**: Push to `prod` branch
- **Actions**: Build, test, and deploy to Firebase Hosting
- **Environment**: Production
- **URL**: Your Firebase Hosting production URL

### 2. **Preview Deployment** (`.github/workflows/preview.yml`)
- **Triggers**: Pull requests to `prod` or `main` branches
- **Actions**: Build and deploy to Firebase Hosting preview channel
- **Environment**: Preview (expires in 7 days)
- **URL**: Temporary preview URL (commented on PR)

### 3. **CI/CD Pipeline** (`.github/workflows/ci.yml`)
- **Triggers**: Push/PR to `main`, `develop`, or `prod` branches
- **Actions**: Lint, type check, build, security audit, dependency review
- **Environment**: Test environment
- **Matrix**: Tests on Node.js 18.x and 20.x

## 📋 Setup Instructions

### Step 1: Firebase Project Setup

1. **Create a Firebase project**:
   ```bash
   # Install Firebase CLI if not already installed
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase in your project
   firebase init hosting
   ```

2. **Update `.firebaserc`**:
   ```json
   {
     "projects": {
       "default": "your-actual-firebase-project-id",
       "production": "your-actual-firebase-project-id"
     }
   }
   ```

### Step 2: GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

#### Required Secrets:
- `FIREBASE_SERVICE_ACCOUNT_KEY`: Firebase service account JSON key
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `VITE_FIREBASE_API_KEY`: Firebase API key
- `VITE_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `VITE_FIREBASE_PROJECT_ID`: Firebase project ID
- `VITE_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `VITE_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `VITE_FIREBASE_APP_ID`: Firebase app ID
- `VITE_GOOGLE_DRIVE_CLIENT_ID`: Google Drive API client ID

#### Getting Firebase Service Account Key:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file content as `FIREBASE_SERVICE_ACCOUNT_KEY` secret

### Step 3: Environment Variables

Create a `.env.example` file (already exists) with all required environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_GOOGLE_DRIVE_CLIENT_ID=your_google_client_id_here
```

## 🔄 Deployment Workflow

### Production Deployment
1. **Develop your feature** on a feature branch
2. **Create a pull request** to `prod` branch
3. **Preview deployment** will be automatically created
4. **Review and merge** the pull request
5. **Automatic deployment** to production Firebase Hosting

### Commands:
```bash
# Create and switch to feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Add: your feature description"

# Push to GitHub
git push origin feature/your-feature-name

# Create pull request to prod branch
# → Preview deployment will be created automatically

# After review and merge to prod
# → Production deployment will be triggered automatically
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Test Firebase deployment locally
firebase serve
```

## 🔒 Security Features

### Automated Security Checks:
- **Dependency Review**: Scans for vulnerable dependencies in PRs
- **CodeQL Analysis**: Static code analysis for security vulnerabilities
- **Security Audit**: NPM audit for high-severity vulnerabilities
- **Environment Secrets**: All sensitive data stored as GitHub secrets

### Security Best Practices:
- No sensitive data in source code
- Environment variables for all configuration
- Automated dependency updates
- Regular security scanning

## 📊 Monitoring & Notifications

### Build Status:
- ✅ **Success**: Deployment successful notification
- ❌ **Failure**: Deployment failed notification with logs
- 📱 **Preview**: PR comments with preview URLs

### Bundle Analysis:
- Bundle size tracking in CI
- Performance monitoring
- Build artifact retention

## 🔧 Troubleshooting

### Common Issues:

1. **Deployment Failed - Firebase Authentication**:
   - Check `FIREBASE_SERVICE_ACCOUNT_KEY` secret
   - Verify Firebase project ID in `.firebaserc`

2. **Build Failed - Environment Variables**:
   - Verify all `VITE_*` secrets are set in GitHub
   - Check `.env.example` for required variables

3. **Preview Not Working**:
   - Check if Firebase Hosting is enabled
   - Verify Firebase service account permissions

4. **Lint Errors**:
   - Run `npm run lint` locally
   - Fix ESLint errors before pushing

### Debug Commands:
```bash
# Check Firebase authentication
firebase login:list

# Test Firebase deployment
firebase deploy --only hosting --debug

# Check build locally
npm run build && npm run preview
```

## 📈 Optimization

### Performance:
- Cache-Control headers configured
- Asset optimization
- Bundle size monitoring

### Deployment Speed:
- Dependency caching
- Build artifact caching
- Parallel job execution

## 🔄 Workflow Customization

### Modify Triggers:
Edit workflow files to change when deployments occur:

```yaml
# Deploy on different branches
on:
  push:
    branches: [ main, staging, prod ]

# Deploy on tags
on:
  push:
    tags: [ 'v*' ]
```

### Add Custom Steps:
```yaml
- name: Run Custom Script
  run: |
    echo "Running custom deployment script"
    ./scripts/deploy-custom.sh
```

## 🆘 Support

### Resources:
- [Firebase Hosting Docs](https://firebase.google.com/docs/hosting)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)

### Getting Help:
1. Check GitHub Actions logs for detailed error messages
2. Review Firebase Console for deployment status
3. Verify all secrets are correctly configured
4. Test builds locally before pushing

---

## 🚀 Quick Start

1. **Set up Firebase project** and get service account key
2. **Add all required secrets** to GitHub repository
3. **Update `.firebaserc`** with your project ID
4. **Push to `prod` branch** to trigger deployment
5. **Your app is live!** 🎉

**That's it!** Your SecureCardr app will now automatically deploy to Firebase Hosting whenever you push to the `prod` branch.