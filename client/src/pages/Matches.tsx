import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Box,
  CircularProgress,
  Avatar,
  Badge,
  Chip,
} from '@mui/material';
import {
  ArrowBackRounded,
  ChatRounded,
  LocationOnRounded,
  WorkRounded,
  SchoolRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface Match {
  _id: string;
  user1: any;
  user2: any;
  matchedAt: string;
  lastMessageAt?: string;
}

const Matches: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches');
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const getOtherUser = (match: Match, currentUserId: string) => {
    return match.user1._id === currentUserId ? match.user2 : match.user1;
  };

  const handleChatClick = (matchId: string) => {
    console.log('🔍 Debug: handleChatClick called with matchId:', matchId);
    console.log('🔍 Debug: matchId type:', typeof matchId);
    console.log('🔍 Debug: matchId value:', matchId);
    
    // Ensure matchId is a string
    const matchIdString = String(matchId);
    console.log('🔍 Debug: matchIdString:', matchIdString);
    
    navigate(`/chat/${matchIdString}`);
  };

  const formatDistance = (distance: number) => {
    if (distance < 1) return 'Less than 1 km away';
    if (distance < 10) return `${Math.round(distance)} km away`;
    return `${Math.round(distance)} km away`;
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
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Your Matches ({matches.length})
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ 
        px: 4, 
        py: 4, 
        maxWidth: '100%',
        display: 'flex',
        justifyContent: 'center'
      }}>
        {matches.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, maxWidth: 600 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              No matches yet! 💔
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Keep swiping to find your perfect match
            </Typography>
            <IconButton
              onClick={() => navigate('/discover')}
              sx={{
                bgcolor: 'primary.main',
                color: 'white',
                width: 64,
                height: 64,
                '&:hover': {
                  bgcolor: 'primary.dark',
                },
              }}
            >
              <ChatRounded fontSize="large" />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ 
            maxWidth: '1400px', 
            width: '100%',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Grid container spacing={3} sx={{ 
              maxWidth: '100%',
              justifyContent: 'center'
            }}>
              {matches.map((match) => {
                console.log('🔍 Debug: Match object:', {
                  _id: match._id,
                  _idType: typeof match._id,
                  user1: match.user1?._id,
                  user2: match.user2?._id,
                  isActive: match.isActive
                });
                const otherUser = getOtherUser(match, currentUser?._id || '');
                const hasRecentMessage = match.lastMessageAt && 
                  new Date(match.lastMessageAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={match._id}>
                    <Card
                      sx={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 280,
                        maxWidth: 350,
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
                        },
                      }}
                      onClick={() => handleChatClick(match._id)}
                    >
                      {/* Profile Image */}
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          height={320}
                          image={getAvatarUrl(otherUser, 400)}
                          alt={otherUser.profile.firstName}
                          sx={{ objectFit: 'cover' }}
                        />
                        
                        {/* Online Status */}
                        {otherUser.activity?.isOnline && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              width: 16,
                              height: 16,
                              bgcolor: '#4caf50',
                              borderRadius: '50%',
                              border: '3px solid white',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                            }}
                          />
                        )}

                        {/* New Message Badge */}
                        {hasRecentMessage && (
                          <Badge
                            color="error"
                            variant="dot"
                            sx={{
                              position: 'absolute',
                              top: 16,
                              left: 16,
                              '& .MuiBadge-badge': {
                                width: 16,
                                height: 16,
                              },
                            }}
                          />
                        )}

                        {/* Age Badge */}
                        <Chip
                          label={`${otherUser.profile.age}`}
                          sx={{
                            position: 'absolute',
                            bottom: 16,
                            left: 16,
                            bgcolor: 'rgba(0,0,0,0.7)',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                          }}
                        />
                      </Box>

                      {/* Content */}
                      <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                            {otherUser.profile.firstName}, {otherUser.profile.age}
                          </Typography>
                          
                          {/* Location */}
                          {otherUser.profile.location && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <LocationOnRounded sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              <Typography variant="body2" color="text.secondary">
                                {otherUser.profile.location.city}, {otherUser.profile.location.state}
                              </Typography>
                            </Box>
                          )}

                          {/* Occupation/Education */}
                          {(otherUser.profile.occupation || otherUser.profile.education) && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              {otherUser.profile.occupation ? (
                                <WorkRounded sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              ) : (
                                <SchoolRounded sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                              )}
                              <Typography variant="body2" color="text.secondary">
                                {otherUser.profile.occupation || otherUser.profile.education}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                        
                        {/* Bio */}
                        {otherUser.profile.bio && (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              lineHeight: 1.4,
                              color: 'text.secondary',
                            }}
                          >
                            {otherUser.profile.bio}
                          </Typography>
                        )}

                        {/* Interests */}
                        {otherUser.profile.interests && otherUser.profile.interests.length > 0 && (
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Interests:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {otherUser.profile.interests.slice(0, 3).map((interest: string, index: number) => (
                                <Chip
                                  key={index}
                                  label={interest}
                                  size="small"
                                  sx={{
                                    bgcolor: 'primary.light',
                                    color: 'primary.contrastText',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              ))}
                              {otherUser.profile.interests.length > 3 && (
                                <Chip
                                  label={`+${otherUser.profile.interests.length - 3}`}
                                  size="small"
                                  sx={{
                                    bgcolor: 'grey.300',
                                    color: 'text.secondary',
                                    fontSize: '0.7rem',
                                  }}
                                />
                              )}
                            </Box>
                          </Box>
                        )}

                        {/* Match Date */}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 'auto', mb: 2 }}>
                          Matched {new Date(match.matchedAt).toLocaleDateString()}
                        </Typography>

                        {/* Chat Button */}
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                          <IconButton
                            onClick={(e) => {
                              e.stopPropagation();
                              handleChatClick(match._id);
                            }}
                            sx={{
                              bgcolor: 'primary.main',
                              color: 'white',
                              width: 48,
                              height: 48,
                              '&:hover': {
                                bgcolor: 'primary.dark',
                                transform: 'scale(1.1)',
                              },
                            }}
                          >
                            <ChatRounded />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Matches;
