#!/bin/bash

# 🚀 SecureCardr Quick Deployment Script
# This script provides a quick way to deploy to Firebase Hosting

set -e

echo "🚀 SecureCardr Deployment Script"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    print_error "Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    print_error "Not authenticated with Firebase. Please login:"
    firebase login
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the right directory?"
    exit 1
fi

if [ ! -f "firebase.json" ]; then
    print_error "firebase.json not found. Please run setup first:"
    echo "npm run setup"
    exit 1
fi

# Parse command line arguments
DEPLOYMENT_TYPE="production"
SKIP_BUILD=false
SKIP_LINT=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--preview)
            DEPLOYMENT_TYPE="preview"
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -l|--skip-lint)
            SKIP_LINT=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -p, --preview      Deploy to preview channel"
            echo "  -s, --skip-build   Skip build step"
            echo "  -l, --skip-lint    Skip linting step"
            echo "  -h, --help         Show this help message"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo ""
print_status "Deployment Type: $DEPLOYMENT_TYPE"
echo ""

# Step 1: Install dependencies
print_status "Installing dependencies..."
npm ci

# Step 2: Run linter (optional)
if [ "$SKIP_LINT" = false ]; then
    print_status "Running ESLint..."
    npm run lint
    print_success "Linting passed"
fi

# Step 3: Type check
print_status "Running TypeScript type check..."
npm run type-check
print_success "Type checking passed"

# Step 4: Build the project (optional)
if [ "$SKIP_BUILD" = false ]; then
    print_status "Building project..."
    npm run build
    print_success "Build completed"
fi

# Step 5: Deploy to Firebase
print_status "Deploying to Firebase Hosting..."

if [ "$DEPLOYMENT_TYPE" = "preview" ]; then
    print_status "Deploying to preview channel..."
    firebase hosting:channel:deploy preview --expires 7d
    print_success "Preview deployment completed!"
    echo ""
    print_status "Your preview URL will be displayed above."
else
    print_status "Deploying to production..."
    firebase deploy --only hosting
    print_success "Production deployment completed!"
    echo ""
    print_status "Your app is now live at your Firebase Hosting URL!"
fi

echo ""
print_success "🎉 Deployment completed successfully!"
print_status "Check your Firebase Console for deployment details."

# Optional: Open Firebase Console
read -p "Would you like to open Firebase Console? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    firebase open hosting
fi

echo ""
print_success "✨ All done!"