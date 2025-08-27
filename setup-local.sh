#!/bin/bash

echo "🚀 Setting up Matchmaking App for Local Development with MongoDB Atlas"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.template .env
    echo "✅ .env file created!"
    echo "⚠️  Please edit .env file and add your MongoDB Atlas password and other credentials"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Install dependencies
echo "📦 Installing backend dependencies..."
npm install

echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo ""
echo "🔧 Setup complete! Next steps:"
echo "1. Edit .env file and add your MongoDB Atlas password"
echo "2. Add your Cloudinary credentials (optional for image uploads)"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Run 'cd client && npm run dev' to start the frontend"
echo ""
echo "🌐 Your MongoDB Atlas connection string format:"
echo "mongodb+srv://tudusp:<your_password>@cluster0.jou7c.mongodb.net/matchmaking?retryWrites=true&w=majority&appName=Cluster0"
echo ""
echo "📚 For deployment instructions, see DEPLOYMENT.md"
