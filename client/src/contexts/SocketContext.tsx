import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinMatch: (matchId: string) => void;
  leaveMatch: (matchId: string) => void;
  sendMessage: (data: { matchId: string; content: string; messageType?: string }) => void;
  startTyping: (matchId: string) => void;
  stopTyping: (matchId: string) => void;
  markMessagesRead: (matchId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Get the socket URL from environment variable
      const getSocketURL = (): string => {
        const envURL = import.meta.env.VITE_API_URL?.replace('/api', '');
        if (envURL) return envURL;
        
        // Use the same dynamic IP detection as the API service
        const getLocalIP = (): string => {
          if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
              return hostname;
            }
          }
          return 'localhost';
        };
        
        const host = getLocalIP();
        const port = import.meta.env.VITE_API_PORT || '5000';
        return `http://${host}:${port}`;
      };

      const socketURL = getSocketURL();
      console.log('🔌 Connecting to WebSocket at:', socketURL);
      
      const socketInstance = io(socketURL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      socketInstance.on('connect', () => {
        console.log('💬 Connected to chat server');
        setIsConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('💬 Disconnected from chat server');
        setIsConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('💬 Socket connection error:', error);
        setIsConnected(false);
      });

      // Listen for new messages
      socketInstance.on('new_message', (data) => {
        console.log('📨 New message received:', data);
        // Emit custom event for components to listen to
        window.dispatchEvent(new CustomEvent('newMessage', { detail: data }));
      });

      // Listen for typing indicators
      socketInstance.on('user_typing', (data) => {
        console.log('✍️ User typing:', data);
        window.dispatchEvent(new CustomEvent('userTyping', { detail: data }));
      });

      // Listen for read receipts
      socketInstance.on('messages_read', (data) => {
        console.log('👁️ Messages read:', data);
        window.dispatchEvent(new CustomEvent('messagesRead', { detail: data }));
      });

      // Listen for match notifications
      socketInstance.on('matchNotification', (data) => {
        console.log('💕 Match notification:', data);
        window.dispatchEvent(new CustomEvent('matchNotification', { detail: data }));
      });

      // Listen for message notifications
      socketInstance.on('messageNotification', (data) => {
        console.log('🔔 Message notification:', data);
        window.dispatchEvent(new CustomEvent('messageNotification', { detail: data }));
      });

      setSocket(socketInstance);

      return () => {
        socketInstance.disconnect();
        setSocket(null);
        setIsConnected(false);
      };
    }
  }, [token, user]);

  const joinMatch = (matchId: string) => {
    if (socket && isConnected) {
      socket.emit('join_match', matchId);
      console.log(`📱 Joining match: ${matchId}`);
    }
  };

  const leaveMatch = (matchId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_match', matchId);
      console.log(`📱 Leaving match: ${matchId}`);
    }
  };

  const sendMessage = (data: { matchId: string; content: string; messageType?: string }) => {
    if (socket && isConnected) {
      socket.emit('send_message', data);
      console.log(`💬 Sending message to match: ${data.matchId}`);
    }
  };

  const startTyping = (matchId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { matchId });
    }
  };

  const stopTyping = (matchId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { matchId });
    }
  };

  const markMessagesRead = (matchId: string) => {
    if (socket && isConnected) {
      socket.emit('mark_messages_read', { matchId });
    }
  };

  const value = {
    socket,
    isConnected,
    joinMatch,
    leaveMatch,
    sendMessage,
    startTyping,
    stopTyping,
    markMessagesRead,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
