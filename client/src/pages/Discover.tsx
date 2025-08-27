import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TinderCard from 'react-tinder-card';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Chip,
  AppBar,
  Toolbar,
  CircularProgress,
} from '@mui/material';
import {
  FavoriteRounded,
  CloseRounded,
  StarRounded,
  ArrowBackRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface User {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    bio: string;
    photos: string[];
    interests: string[];
    occupation: string;
    education: string;
  };
  distance: number;
  compatibilityScore: number;
}

const Discover: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPotentialMatches();
  }, []);

  const fetchPotentialMatches = async () => {
    try {
      setLoading(true);
      const response = await api.get('/matches/discover');
      setUsers(response.data.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast.error('Failed to load potential matches');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (userId: string, action: 'like' | 'dislike' | 'super-like') => {
    try {
      const endpoint = action === 'super-like' ? 'super-like' : action;
      const response = await api.post(`/matches/${endpoint}/${userId}`);
      
      if (response.data.isMatch) {
        toast.success("It's a match! 🎉", {
          duration: 3000,
          icon: '💕',
        });
      } else if (action === 'like') {
        toast.success('Liked! 👍');
      } else if (action === 'super-like') {
        toast.success('Super liked! ⭐');
      }

      // Move to next user
      if (currentIndex < users.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Reload more users
        fetchPotentialMatches();
        setCurrentIndex(0);
      }
    } catch (error: any) {
      console.error('Error performing action:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    }
  };

  const onSwipe = async (direction: string, swipedUserId: string) => {
    let action: 'like' | 'dislike' | 'super-like';
    
    switch (direction) {
      case 'left':
        action = 'dislike';
        break;
      case 'right':
        action = 'like';
        break;
      case 'up':
        action = 'super-like';
        break;
      default:
        return;
    }
    
    await handleAction(swipedUserId, action);
  };

  const currentUser = users[currentIndex];

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
            Discover
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        {!currentUser ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              No more people to discover! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Check back later for more potential matches
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', height: { xs: '60vh', sm: '65vh', md: '70vh' } }}>
            {/* Main Card */}
            <TinderCard
              onSwipe={(direction) => onSwipe(direction, currentUser._id)}
              preventSwipe={['down']}
              swipeRequirementType="position"
              swipeThreshold={50}
            >
                              <Card
                  sx={{
                    height: '100%',
                    borderRadius: { xs: 3, sm: 4 },
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    cursor: 'pointer',
                  }}
                  onClick={() => navigate(`/user/${currentUser._id}`)}
                >
              {/* Image */}
              <CardMedia
                component="img"
                height="60%"
                image={getAvatarUrl(currentUser, 400)}
                alt={currentUser.profile.firstName}
                sx={{ objectFit: 'cover' }}
              />

              {/* Content */}
              <CardContent sx={{ height: '40%', p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {currentUser.profile.firstName} {currentUser.profile.lastName}
                  </Typography>
                  <Chip 
                    label={`${currentUser.distance}km away`} 
                    size="small" 
                    color="primary" 
                  />
                </Box>

                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {currentUser.profile.age} years old
                </Typography>

                {currentUser.profile.bio && (
                  <Typography variant="body2" sx={{ mb: 2, lineHeight: 1.5 }}>
                    {currentUser.profile.bio}
                  </Typography>
                )}

                {currentUser.profile.occupation && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    <strong>Work:</strong> {currentUser.profile.occupation}
                  </Typography>
                )}

                {currentUser.profile.education && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    <strong>Education:</strong> {currentUser.profile.education}
                  </Typography>
                )}

                {/* Interests */}
                {currentUser.profile.interests.length > 0 && (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {currentUser.profile.interests.slice(0, 3).map((interest, index) => (
                      <Chip
                        key={index}
                        label={interest}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                    {currentUser.profile.interests.length > 3 && (
                      <Chip
                        label={`+${currentUser.profile.interests.length - 3} more`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                )}

                {/* Compatibility Score */}
                <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                  <Chip
                    label={`${currentUser.compatibilityScore}% match`}
                    sx={{
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
            </TinderCard>

            {/* Action Buttons */}
            <Box
              sx={{
                position: 'absolute',
                bottom: { xs: -25, sm: -30 },
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              {/* Dislike */}
                              <IconButton
                  onClick={() => handleAction(currentUser._id, 'dislike')}
                  sx={{
                    width: { xs: 48, sm: 56 },
                    height: { xs: 48, sm: 56 },
                    bgcolor: 'white',
                    color: '#757575',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      bgcolor: '#f5f5f5',
                      transform: 'scale(1.1)',
                    },
                  }}
                >
                  <CloseRounded fontSize={window.innerWidth < 600 ? "medium" : "large"} />
                </IconButton>

              {/* Super Like */}
              <IconButton
                onClick={() => handleAction(currentUser._id, 'super-like')}
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  bgcolor: 'white',
                  color: '#2196f3',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <StarRounded fontSize={window.innerWidth < 600 ? "medium" : "large"} />
              </IconButton>

              {/* Like */}
              <IconButton
                onClick={() => handleAction(currentUser._id, 'like')}
                sx={{
                  width: { xs: 48, sm: 56 },
                  height: { xs: 48, sm: 56 },
                  bgcolor: 'white',
                  color: '#4caf50',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  '&:hover': {
                    bgcolor: '#f5f5f5',
                    transform: 'scale(1.1)',
                  },
                }}
              >
                <FavoriteRounded fontSize={window.innerWidth < 600 ? "medium" : "large"} />
              </IconButton>
            </Box>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default Discover;
