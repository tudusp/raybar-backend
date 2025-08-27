import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Box,
  Button,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ArrowBackRounded,
  BlockRounded,
  PersonRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface BlockedUser {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    photos: string[];
  };
  blockedAt: string;
}

const BlockedUsers: React.FC = () => {
  const navigate = useNavigate();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users/blocked');
      setBlockedUsers(response.data.blockedUsers || []);
    } catch (error: any) {
      console.error('Error fetching blocked users:', error);
      toast.error(error.response?.data?.message || 'Failed to load blocked users');
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      setUnblocking(userId);
      await api.delete(`/users/block/${userId}`);
      
      // Remove from local state
      setBlockedUsers(prev => prev.filter(user => user._id !== userId));
      
      toast.success('User unblocked successfully! ✅');
    } catch (error: any) {
      console.error('Error unblocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to unblock user');
    } finally {
      setUnblocking(null);
    }
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
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/settings')}
            sx={{ mr: 2 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Blocked Users
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {blockedUsers.length === 0 ? (
          <Paper elevation={2} sx={{ p: 4, borderRadius: 3, textAlign: 'center' }}>
            <BlockRounded sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No Blocked Users
            </Typography>
            <Typography variant="body1" color="text.secondary">
              You haven't blocked any users yet.
            </Typography>
          </Paper>
        ) : (
          <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid #e0e0e0' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Blocked Users ({blockedUsers.length})
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Users you've blocked won't be able to see your profile or send you messages.
              </Typography>
            </Box>
            
            <List>
              {blockedUsers.map((user, index) => (
                <React.Fragment key={user._id}>
                  <ListItem sx={{ py: 2 }}>
                    <ListItemAvatar>
                      <Avatar
                        src={getAvatarUrl(user, 56)}
                        sx={{ width: 56, height: 56 }}
                      >
                        {user.profile.firstName.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {user.profile.firstName} {user.profile.lastName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Blocked on {new Date(user.blockedAt).toLocaleDateString()}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={() => handleUnblock(user._id)}
                        disabled={unblocking === user._id}
                        startIcon={
                          unblocking === user._id ? (
                            <CircularProgress size={16} />
                          ) : (
                            <PersonRounded />
                          )
                        }
                      >
                        {unblocking === user._id ? 'Unblocking...' : 'Unblock'}
                      </Button>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < blockedUsers.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )}

        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Note:</strong> When you unblock a user, they will be able to see your profile and send you messages again. 
            You can always block them again if needed.
          </Typography>
        </Alert>
      </Container>
    </Box>
  );
};

export default BlockedUsers;
