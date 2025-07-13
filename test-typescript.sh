#!/bin/bash

echo "Testing TypeScript compilation..."

cd /Users/upmakaumasai/Documents/claude-folder/securecardr

# Run TypeScript compilation only
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
else
    echo "❌ TypeScript compilation failed!"
    exit 1
fi

# If TypeScript passes, try the full build
echo "Running full build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Full build successful!"
else
    echo "❌ Full build failed!"
    exit 1
fi
