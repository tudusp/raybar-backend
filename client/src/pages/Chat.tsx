import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  ArrowBackRounded,
  SendRounded,
  MoreVertRounded,
  MenuRounded,
  ChevronLeftRounded,
  ChevronRightRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface Message {
  _id: string;
  content: string;
  sender: {
    _id: string;
    profile: {
      firstName: string;
      photos: string[];
    };
  };
  createdAt: string;
  isRead: boolean;
}

interface Conversation {
  matchId: string;
  user: {
    _id: string;
    profile: {
      firstName: string;
      lastName: string;
      photos: string[];
      age: number;
    };
    activity: {
      isOnline: boolean;
      lastActive: string;
    };
  };
  lastMessage?: Message;
  unreadCount: number;
}

const Chat: React.FC = () => {
  const { matchId } = useParams<{ matchId: string }>();
  console.log('🔍 Debug: useParams matchId:', matchId);
  console.log('🔍 Debug: useParams matchId type:', typeof matchId);
  console.log('🔍 Debug: useParams matchId JSON:', JSON.stringify(matchId));
  const { user } = useAuth();
  const { socket, isConnected, joinMatch, leaveMatch, sendMessage: socketSendMessage, startTyping, stopTyping, markMessagesRead } = useSocket();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [lastConversationUpdate, setLastConversationUpdate] = useState(0);
  const [retryTimeout, setRetryTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    console.log('🔍 Debug: useEffect triggered with matchId:', matchId);
    console.log('🔍 Debug: matchId type:', typeof matchId);
    console.log('🔍 Debug: matchId value:', matchId);
    console.log('🔍 Debug: matchId JSON:', JSON.stringify(matchId));
    
    if (matchId) {
      // Check if matchId is valid before proceeding
      if (!matchId || matchId === 'sample-match-id' || matchId.length < 10) {
        console.log('⚠️ Invalid matchId:', matchId);
        toast.error('Invalid match ID');
        navigate('/matches');
        return;
      }
      
      console.log('🔍 Debug: matchId type and value:', typeof matchId, matchId);
      console.log('🔍 Debug: matchId JSON:', JSON.stringify(matchId));
      
      fetchMessages(matchId);
      // Join socket room for this match
      if (isConnected) {
        joinMatch(String(matchId));
      }
      
      // Auto-collapse sidebar on mobile when conversation is selected
      if (window.innerWidth < 960) { // md breakpoint
        setSidebarOpen(false);
      }
    }
    
    return () => {
      if (matchId && isConnected) {
        leaveMatch(String(matchId));
      }
      // Clean up retry timeout
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [matchId, isConnected]);

  // Listen for real-time messages
  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const { message, matchId: messageMatchId } = event.detail;
      if (String(messageMatchId) === String(matchId)) {
        setMessages(prev => [...prev, message]);
        // Mark as read if user is viewing this conversation
        if (isConnected) {
          markMessagesRead(String(matchId));
        }
      }
      
      // Update conversations list but limit frequency to prevent rate limiting
      const now = Date.now();
      if (now - lastConversationUpdate > 2000) { // Only update every 2 seconds
        setLastConversationUpdate(now);
        fetchConversations();
      }
    };

    const handleTyping = (event: CustomEvent) => {
      const { userId, matchId: typingMatchId, isTyping } = event.detail;
      if (String(typingMatchId) === String(matchId) && userId !== user?._id) {
        // Handle typing indicator (could add UI state here)
        console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
      }
    };

    window.addEventListener('newMessage', handleNewMessage as EventListener);
    window.addEventListener('userTyping', handleTyping as EventListener);

    return () => {
      window.removeEventListener('newMessage', handleNewMessage as EventListener);
      window.removeEventListener('userTyping', handleTyping as EventListener);
    };
  }, [matchId, isConnected, user?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, [retryTimeout]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      console.log('🔍 Frontend: Fetching conversations...');
      const response = await api.get('/chat/conversations');
      console.log('✅ Frontend: Conversations response:', response.data);
      setConversations(response.data.conversations || []);
      
      if (!matchId && response.data.conversations.length > 0) {
        const firstConversation = response.data.conversations[0];
        console.log('🔍 Debug: firstConversation:', firstConversation);
        console.log('🔍 Debug: firstConversation.matchId:', firstConversation.matchId);
        console.log('🔍 Debug: firstConversation.matchId type:', typeof firstConversation.matchId);
        
        // Ensure matchId is a string
        const matchIdString = String(firstConversation.matchId);
        console.log('🔍 Debug: matchIdString:', matchIdString);
        
        setSelectedConversation(firstConversation);
        navigate(`/chat/${matchIdString}`);
      }
    } catch (error: any) {
      console.error('Error fetching conversations:', error);
      
      // Handle rate limiting specifically
      if (error.response?.status === 429) {
        console.log('Rate limited - will retry later');
        // Clear any existing retry timeout
        if (retryTimeout) {
          clearTimeout(retryTimeout);
        }
        // Retry after 5 seconds
        const timeout = setTimeout(() => {
          fetchConversations();
        }, 5000);
        setRetryTimeout(timeout);
        return;
      }
      
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const testChatConnection = async () => {
    try {
      console.log('🧪 Testing chat connection...');
      const response = await api.get('/chat/test');
      console.log('✅ Chat test response:', response.data);
      toast.success(`Chat test: ${response.data.matchesCount} matches found`);
    } catch (error) {
      console.error('❌ Chat test error:', error);
      toast.error('Chat test failed');
    }
  };

  const fetchMessages = async (matchId: string) => {
    try {
      // Ensure matchId is a string
      const matchIdString = String(matchId);
      console.log('🔍 Frontend: Fetching messages for matchId:', matchIdString);
      console.log('🔍 Frontend: matchId type in fetchMessages:', typeof matchIdString);
      console.log('🔍 Frontend: matchId value in fetchMessages:', matchIdString);
      const response = await api.get(`/chat/matches/${matchIdString}/messages`);
      console.log('✅ Frontend: Messages response:', response.data);
      setMessages(response.data.messages || []);
      
      // Find and set selected conversation from current conversations state
      const conversation = conversations.find(c => String(c.matchId) === String(matchId));
      if (conversation) {
        console.log('✅ Found conversation for matchId:', matchId, 'User:', conversation.user.profile.firstName);
        setSelectedConversation(conversation);
      } else {
        console.log('⚠️ No conversation found for matchId:', matchId, 'Available conversations:', conversations.map(c => ({ matchId: c.matchId, userName: c.user.profile.firstName })));
      }
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      if (error.response?.status === 404) {
        toast.error('Match not found');
        navigate('/matches');
      } else if (error.response?.status === 403) {
        toast.error('Not authorized to view these messages');
        navigate('/matches');
      } else {
        toast.error('Failed to load messages');
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !matchId || sendingMessage) return;

    try {
      setSendingMessage(true);
      const matchIdString = String(matchId);
      
      if (isConnected && socket) {
        // Send via Socket.io for real-time delivery
        socketSendMessage({
          matchId: matchIdString,
          content: newMessage.trim(),
          messageType: 'text'
        });
      } else {
        // Fallback to HTTP API
        const response = await api.post(`/chat/matches/${matchIdString}/messages`, {
          content: newMessage.trim(),
          messageType: 'text',
        });
        setMessages(prev => [...prev, response.data.message]);
      }

      setNewMessage('');
      
      // Update conversation list but with delay to prevent rate limiting
      setTimeout(() => {
        fetchConversations();
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Tooltip title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}>
            <IconButton
              color="inherit"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 1 }}
            >
              {sidebarOpen ? <ChevronLeftRounded /> : <MenuRounded />}
            </IconButton>
          </Tooltip>
          {selectedConversation ? (
            <>
              <Avatar
                                      src={getAvatarUrl(selectedConversation.user, 40)}
                sx={{ width: 32, height: 32, mr: 2 }}
              >
                {selectedConversation.user.profile.firstName.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {selectedConversation.user.profile.firstName}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {selectedConversation.user.activity.isOnline 
                    ? 'Online' 
                    : `Last seen ${formatLastSeen(selectedConversation.user.activity.lastActive)}`
                  }
                </Typography>
              </Box>
            </>
          ) : (
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
              Messages
            </Typography>
          )}
                     <IconButton color="inherit" onClick={testChatConnection}>
             <MoreVertRounded />
           </IconButton>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        display: 'flex', 
        flex: 1, 
        overflow: 'hidden',
        maxWidth: '1400px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Conversations Sidebar */}
        <Paper
          elevation={1}
          sx={{
            width: sidebarOpen 
              ? { xs: '100%', sm: 280, md: 300, lg: 320 }
              : { xs: 0, sm: 50, md: 55, lg: 60 },
            minWidth: sidebarOpen ? 'auto' : { xs: 0, sm: 50, md: 55, lg: 60 },
            display: { xs: !matchId ? 'block' : 'none', md: 'block' },
            borderRadius: 0,
            overflow: 'hidden',
            borderRight: '1px solid #e0e0e0',
            transition: 'width 0.3s ease-in-out, min-width 0.3s ease-in-out',
            position: 'relative',
            bgcolor: sidebarOpen ? 'white' : '#f8f9fa',
          }}
        >
          <List sx={{ p: 0 }}>
            {conversations.map((conversation) => (
              <React.Fragment key={conversation.matchId}>
                <Tooltip
                  title={sidebarOpen ? '' : `${conversation.user.profile.firstName}${conversation.unreadCount > 0 ? ` (${conversation.unreadCount} unread)` : ''}`}
                  placement="right"
                  disableHoverListener={sidebarOpen}
                >
                  <ListItem
                    button
                                         selected={String(conversation.matchId) === String(matchId)}
                                         onClick={() => {
                       setSelectedConversation(conversation);
                       // Ensure matchId is a string
                       const matchIdString = String(conversation.matchId);
                       navigate(`/chat/${matchIdString}`);
                     }}
                                      sx={{
                      py: 2,
                      px: sidebarOpen ? 3 : 1,
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      '&.Mui-selected': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'primary.dark',
                        },
                      },
                      '&:hover': {
                        bgcolor: 'rgba(0,0,0,0.04)',
                      },
                    }}
                >
                  <ListItemAvatar sx={{ position: 'relative' }}>
                    <Avatar
                      src={getAvatarUrl(conversation.user, sidebarOpen ? 56 : 36)}
                      sx={{ 
                        width: sidebarOpen ? 56 : 36, 
                        height: sidebarOpen ? 56 : 36, 
                        mr: sidebarOpen ? 2 : 0 
                      }}
                    >
                      {conversation.user.profile.firstName.charAt(0)}
                    </Avatar>
                    {!sidebarOpen && conversation.unreadCount > 0 && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          bgcolor: 'error.main',
                          color: 'white',
                          borderRadius: '50%',
                          width: 16,
                          height: 16,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          border: '2px solid white',
                        }}
                      >
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </Box>
                    )}
                  </ListItemAvatar>
                  {sidebarOpen && (
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                            {conversation.user.profile.firstName}
                          </Typography>
                          {conversation.unreadCount > 0 && (
                            <Box
                              sx={{
                                bgcolor: 'error.main',
                                color: 'white',
                                borderRadius: '50%',
                                width: 24,
                                height: 24,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                              }}
                            >
                              {conversation.unreadCount}
                            </Box>
                          )}
                        </Box>
                      }
                      secondary={
                        conversation.lastMessage ? (
                          <Typography
                            variant="body2"
                            sx={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              opacity: 0.7,
                              fontSize: '0.9rem',
                              mt: 0.5,
                            }}
                          >
                            {conversation.lastMessage.content}
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ opacity: 0.7, fontSize: '0.9rem', mt: 0.5 }}>
                            Start a conversation
                          </Typography>
                        )
                      }
                    />
                  )}
                </ListItem>
                </Tooltip>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>

        {/* Chat Area */}
        {selectedConversation ? (
          <Box sx={{ 
            flex: 1, 
            flexDirection: 'column',
            display: { xs: matchId ? 'flex' : 'none', md: 'flex' },
            maxWidth: '100%',
            transition: 'margin-left 0.3s ease-in-out',
          }}>
            {/* Messages */}
            <Box
              sx={{
                flex: 1,
                overflow: 'auto',
                p: 3,
                bgcolor: '#f8f9fa',
                maxWidth: '100%',
              }}
            >
                          <Box sx={{ 
              maxWidth: sidebarOpen ? '800px' : '1000px', 
              margin: '0 auto',
              width: '100%',
              transition: 'max-width 0.3s ease-in-out',
            }}>
                {messages.map((message) => {
                  // Handle both populated and unpopulated sender objects
                  const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                  const isOwn = senderId === user?._id;
                  
                  console.log('Message debug:', {
                    messageId: message._id,
                    senderId: senderId,
                    senderType: typeof senderId,
                    userId: user?._id,
                    userIdType: typeof user?._id,
                    isOwn: isOwn,
                    content: message.content,
                    senderObject: message.sender
                  });
                  return (
                    <Box
                      key={message._id}
                      sx={{
                        display: 'flex',
                        justifyContent: isOwn ? 'flex-end' : 'flex-start',
                        mb: 3,
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                                               {!isOwn && (
                           <Typography variant="caption" sx={{ mb: 0.5, opacity: 0.7, ml: 1, fontSize: '0.8rem' }}>
                             {selectedConversation?.user.profile.firstName || 'Unknown'}
                           </Typography>
                         )}
                          
                        <Paper
                          elevation={2}
                          sx={{
                            p: 2.5,
                            maxWidth: '100%',
                            bgcolor: isOwn ? 'primary.main' : 'white',
                            color: isOwn ? 'white' : 'text.primary',
                            borderRadius: 3,
                            borderTopRightRadius: isOwn ? 1 : 3,
                            borderTopLeftRadius: isOwn ? 3 : 1,
                            border: isOwn ? 'none' : '1px solid #e0e0e0',
                            boxShadow: isOwn ? '0 2px 8px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: 1.4 }}>
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              mt: 1,
                              opacity: 0.7,
                              fontSize: '0.75rem',
                            }}
                          >
                            {formatTime(message.createdAt)}
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  );
                })}
                <div ref={messagesEndRef} />
              </Box>
            </Box>

            {/* Message Input */}
            <Paper
              elevation={3}
              sx={{
                p: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                borderRadius: 0,
                borderTop: '1px solid #e0e0e0',
                bgcolor: 'white',
              }}
            >
              <Box sx={{ 
                maxWidth: sidebarOpen ? '800px' : '1000px', 
                margin: '0 auto',
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                transition: 'max-width 0.3s ease-in-out',
              }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={3}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                                         // Handle typing indicators
                     if (e.target.value.length > 0 && matchId && isConnected) {
                       startTyping(String(matchId));
                     } else if (e.target.value.length === 0 && matchId && isConnected) {
                       stopTyping(String(matchId));
                     }
                  }}
                  onKeyPress={handleKeyPress}
                                     onBlur={() => {
                     // Stop typing when input loses focus
                     if (matchId && isConnected) {
                       stopTyping(String(matchId));
                     }
                   }}
                  disabled={sendingMessage}
                  variant="outlined"
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      fontSize: '1rem',
                    },
                  }}
                />
                <IconButton
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    width: 56,
                    height: 56,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'scale(1.05)',
                    },
                    '&:disabled': {
                      bgcolor: 'grey.300',
                    },
                  }}
                >
                  {sendingMessage ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <SendRounded fontSize="large" />
                  )}
                </IconButton>
              </Box>
            </Paper>
          </Box>
        ) : (
          <Box
            sx={{
              flex: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: '#f8f9fa',
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 400 }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                Select a conversation to start chatting
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Choose from your matches to begin a conversation
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;
