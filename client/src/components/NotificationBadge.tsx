import React, { useState, useEffect } from 'react';
import { Badge, IconButton, Menu, MenuItem, Typography, Box, Divider } from '@mui/material';
import { NotificationsRounded, ChatRounded, FavoriteRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Notification {
  _id: string;
  type: 'message' | 'match' | 'like' | 'super-like';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: {
    matchId?: string;
    userId?: string;
  };
}

const NotificationBadge: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time updates
    const handleNewNotification = (event: CustomEvent) => {
      console.log('🔔 Received notification event:', event.detail);
      fetchNotifications();
    };

    // Set up periodic refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    window.addEventListener('matchNotification', handleNewNotification);
    window.addEventListener('messageNotification', handleNewNotification);

    return () => {
      window.removeEventListener('matchNotification', handleNewNotification);
      window.removeEventListener('messageNotification', handleNewNotification);
      clearInterval(intervalId);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      // Prevent too frequent requests
      const now = Date.now();
      if (now - lastFetch < 2000) { // Only fetch every 2 seconds
        return;
      }
      setLastFetch(now);
      
      console.log('🔔 Fetching notifications...');
      setLoading(true);
      const response = await api.get('/users/notifications');
      const notificationsData = response.data.notifications || [];
      console.log('🔔 Notifications received:', notificationsData.length, notificationsData);
      setNotifications(notificationsData);
      const unread = notificationsData.filter((n: Notification) => !n.read).length;
      setUnreadCount(unread);
      console.log('🔔 Unread count:', unread);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      
      // Handle rate limiting
      if (error.response?.status === 429) {
        console.log('Notifications rate limited - will retry later');
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationSelect = async (notification: Notification) => {
    try {
      // Mark as read
      await api.put(`/users/notifications/${notification._id}/read`);
      
      // Navigate based on notification type
      if (notification.type === 'message' && notification.data?.matchId) {
        navigate(`/chat/${notification.data.matchId}`);
      } else if (notification.type === 'match' && notification.data?.matchId) {
        navigate(`/chat/${notification.data.matchId}`);
      } else if (notification.type === 'like' || notification.type === 'super-like') {
        navigate('/matches');
      }
      
      // Refresh notifications
      fetchNotifications();
      handleClose();
    } catch (error) {
      console.error('Error handling notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/users/notifications/read-all');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <ChatRounded fontSize="small" />;
      case 'match':
      case 'like':
      case 'super-like':
        return <FavoriteRounded fontSize="small" />;
      default:
        return <NotificationsRounded fontSize="small" />;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        sx={{ ml: 1 }}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsRounded />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            maxHeight: 400,
          }
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Typography
                variant="body2"
                color="primary"
                sx={{ cursor: 'pointer' }}
                onClick={markAllAsRead}
              >
                Mark all read
              </Typography>
            )}
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </MenuItem>
        ) : (
          notifications.slice(0, 10).map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNotificationSelect(notification)}
              sx={{
                py: 2,
                px: 2,
                backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.12)',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
                <Box sx={{ mr: 2, mt: 0.5 }}>
                  {getNotificationIcon(notification.type)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                    {notification.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatTime(notification.createdAt)}
                  </Typography>
                </Box>
                {!notification.read && (
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: 'primary.main',
                      ml: 1,
                      mt: 0.5,
                    }}
                  />
                )}
              </Box>
            </MenuItem>
          ))
        )}

        {notifications.length > 10 && (
          <>
            <Divider />
            <MenuItem onClick={() => navigate('/notifications')}>
              <Typography variant="body2" color="primary" sx={{ textAlign: 'center', width: '100%' }}>
                View all notifications
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBadge;
