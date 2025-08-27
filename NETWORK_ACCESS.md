# Network Access Setup Guide

## Problem
The server was only listening on `localhost` (127.0.0.1), making it inaccessible from other devices on the network.

## Solution Applied
1. **Server Configuration**: Modified `src/server.ts` to listen on `0.0.0.0` (all network interfaces)
2. **Client Configuration**: Updated API and Socket services to automatically detect local IP
3. **Vite Configuration**: Updated to allow network access for frontend
4. **CORS Configuration**: Updated to allow local network IPs

## 🚀 Quick Start (Recommended)

### Option 1: Use the Network Script
```bash
npm run network
```

This will:
- Automatically detect your local IP
- Start both backend and frontend servers
- Show you the correct URLs to access from other devices

### Option 2: Manual Start
```bash
# Terminal 1 - Start backend
npm run dev

# Terminal 2 - Start frontend
cd client && npm run dev
```

## 🌐 Access URLs

Your local IP is: **192.168.1.41**

- **Frontend**: `http://192.168.1.41:5173`
- **Backend API**: `http://192.168.1.41:5003`

## 🔧 How It Works

The app now automatically detects the correct IP address and port:
- **IP Detection**: When accessed from `localhost` → uses `localhost`, when accessed from network IP → uses the same IP
- **Port Detection**: Automatically detects backend port based on frontend port:
  - Frontend on 5174 → Backend on 5000
  - Frontend on 5173 → Backend on 5003
  - Can be overridden with `VITE_API_PORT` environment variable
- **No manual configuration needed!**

## Security Notes
- This configuration allows access from your local network only
- For production, use proper firewall rules and HTTPS
- The CORS configuration allows common local network IP ranges

## Troubleshooting
1. **Firewall**: Make sure your firewall allows connections on ports 5003 and 5173
2. **Network**: Ensure all devices are on the same network
3. **Ports**: Verify the ports are not blocked by your router
