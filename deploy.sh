#!/bin/bash

echo "🚀 Starting deployment process..."

# Build the backend
echo "📦 Building backend..."
npm run build

# Build the frontend
echo "📦 Building frontend..."
cd client
npm run build
cd ..

echo "✅ Build completed!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub:"
echo "   git add ."
echo "   git commit -m 'Prepare for deployment'"
echo "   git push"
echo ""
echo "2. Deploy to Railway:"
echo "   - Go to railway.app"
echo "   - Create new project"
echo "   - Connect your GitHub repository"
echo "   - Add environment variables"
echo "   - Deploy!"
echo ""
echo "3. Or follow the detailed guide in DEPLOYMENT.md"
