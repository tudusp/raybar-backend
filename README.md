# 💕 Matchmaking Web App

A modern, full-stack matchmaking/dating web application built with React, Node.js, and MongoDB. Features real-time chat, advanced matching algorithms, and a beautiful user interface.

## 🚀 Features

### Core Features
- ✅ **User Authentication** - Secure registration and login with JWT
- ✅ **User Profiles** - Comprehensive profile management with photos and preferences
- ✅ **Smart Matching Algorithm** - Compatible matching based on multiple factors
- ✅ **Real-time Chat** - Socket.io powered messaging system
- ✅ **Location-based Matching** - Distance-based user discovery
- ✅ **Swipe Actions** - Like, dislike, and super like functionality
- ✅ **Match Management** - View and manage your matches

### Advanced Features
- 🔄 **Compatibility Scoring** - Algorithm considers age, interests, lifestyle, distance
- 📱 **Real-time Notifications** - Instant match and message notifications
- 🔒 **Privacy Controls** - Block users, manage preferences
- ⚡ **Performance Optimized** - Efficient database queries and caching
- 🌍 **Geospatial Queries** - MongoDB geospatial indexing for location features

## 🛠 Tech Stack

### Backend
- **Node.js** with TypeScript
- **Express.js** - Web framework
- **MongoDB** with Mongoose - Database and ODM
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation

### Frontend (Ready for your React setup)
- **React 18** with TypeScript
- **Vite** - Build tool and dev server
- **Modern UI** - Ready for styling with your preferred library

### Development Tools
- **TypeScript** - Type safety
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
matchmaking/
├── src/
│   ├── config/
│   │   └── database.ts          # MongoDB connection
│   ├── models/
│   │   ├── User.ts              # User model with profiles & preferences
│   │   ├── Match.ts             # Match model
│   │   └── Message.ts           # Message model
│   ├── routes/
│   │   ├── auth.ts              # Authentication routes
│   │   ├── users.ts             # User profile routes
│   │   ├── matches.ts           # Matching & discovery routes
│   │   └── chat.ts              # Chat & messaging routes
│   ├── middleware/
│   │   ├── auth.ts              # JWT authentication middleware
│   │   └── errorHandler.ts     # Global error handling
│   ├── socket/
│   │   └── socketHandlers.ts    # Socket.io event handlers
│   └── server.ts                # Main server file
├── client/                      # React frontend (setup manually)
├── package.json
├── tsconfig.json
└── env.example                  # Environment variables template
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/matchmaking
   JWT_SECRET=your_super_secret_jwt_key
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start MongoDB**
   - Local: `mongod`
   - Or use MongoDB Atlas connection string

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

### Frontend Setup (React + Vite)

1. **Navigate to client directory and setup**
   ```bash
   cd client
   npm install
   npm run dev
   ```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### User Profile Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/preferences` - Update matching preferences
- `POST /api/users/photos` - Add photo
- `DELETE /api/users/photos/:index` - Remove photo
- `PUT /api/users/location` - Update location

### Matching Endpoints
- `GET /api/matches/discover` - Get potential matches
- `POST /api/matches/like/:userId` - Like a user
- `POST /api/matches/dislike/:userId` - Dislike a user
- `POST /api/matches/super-like/:userId` - Super like a user
- `GET /api/matches` - Get user's matches
- `DELETE /api/matches/:matchId` - Unmatch

### Chat Endpoints
- `GET /api/chat/conversations` - Get conversations
- `GET /api/chat/matches/:matchId/messages` - Get messages
- `POST /api/chat/matches/:matchId/messages` - Send message
- `PUT /api/chat/messages/:messageId` - Edit message
- `DELETE /api/chat/messages/:messageId` - Delete message
- `POST /api/chat/messages/:messageId/read` - Mark as read

### Socket.io Events
- `join_match` - Join chat room
- `leave_match` - Leave chat room
- `send_message` - Send message
- `typing_start/stop` - Typing indicators
- `mark_messages_read` - Read receipts
- `new_match` - Match notifications

## 🎯 Matching Algorithm

The app uses a sophisticated matching algorithm that considers:

1. **Age Compatibility** (closer age = higher score)
2. **Interest Overlap** (common interests boost score)
3. **Lifestyle Compatibility** (smoking, drinking, relationship goals)
4. **Distance Factor** (closer users get higher scores)
5. **Activity Level** (recently active users prioritized)
6. **Mutual Interest** (both users must match preference criteria)

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- User authorization checks
- Protected routes

## 📱 Mobile-Ready Architecture

The backend is designed to support both web and mobile clients:
- RESTful API design
- Real-time Socket.io support
- Optimized for React Native integration
- Stateless authentication with JWT
- Efficient data structures for mobile performance

## 🛡 Privacy & Safety

- Block user functionality
- Report system ready (implement frontend)
- Age verification (18+ only)
- Location privacy controls
- Message encryption ready
- User verification system

## 📊 Database Schema

### User Model
- Profile information (name, age, photos, bio)
- Location with geospatial indexing
- Preferences and matching criteria
- Activity tracking
- Match/like/dislike arrays

### Match Model
- User pair relationships
- Match timestamps and status
- Activity tracking

### Message Model
- Real-time messaging
- Read receipts
- Message types (text, image, emoji)
- Edit/delete functionality

## 🚀 Deployment

### Backend Deployment
- Build TypeScript: `npm run build`
- Set production environment variables
- Use PM2 for process management
- Deploy to services like Heroku, AWS, or DigitalOcean

### Database
- MongoDB Atlas for production
- Proper indexing for performance
- Regular backups

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💡 Future Enhancements

- [ ] Video chat integration
- [ ] AI-powered compatibility scoring
- [ ] Social media integration
- [ ] Premium subscription features
- [ ] Push notifications (mobile)
- [ ] Advanced photo verification
- [ ] Dating event planning
- [ ] Icebreaker suggestions

## 📞 Support

For support, email your-email@example.com or open an issue on GitHub.

---

**Ready to build something amazing?** 🚀

This backend provides a solid foundation for your matchmaking app. The architecture is scalable, secure, and ready for both web and mobile clients. Just set up your React frontend and connect to these APIs!
