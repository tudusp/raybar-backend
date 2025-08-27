import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Paper,
  Grid,
  Button,
  Avatar,
  IconButton,
} from '@mui/material';
import {
  FavoriteRounded,
  PersonRounded,
  ChatRounded,
  ExploreRounded,
  SearchRounded,
  LogoutRounded,
  SettingsRounded,
  StarRounded,
  ContactSupportRounded,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import NotificationBadge from '../components/NotificationBadge';
import QuickPhotoUpload from '../components/QuickPhotoUpload';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationCards = [
    {
      title: 'Discover',
      description: 'Find new people to connect with',
      icon: <ExploreRounded sx={{ fontSize: 48, color: 'primary.main' }} />,
      action: () => navigate('/discover'),
      color: '#ff4458'
    },
    {
      title: 'Search',
      description: 'Advanced search with filters',
      icon: <SearchRounded sx={{ fontSize: 48, color: '#9c27b0' }} />,
      action: () => navigate('/search'),
      color: '#9c27b0'
    },
    {
      title: 'Matches',
      description: 'See who likes you back',
      icon: <FavoriteRounded sx={{ fontSize: 48, color: '#4caf50' }} />,
      action: () => navigate('/matches'),
      color: '#4caf50'
    },
    {
      title: 'Chat',
      description: 'Start conversations',
      icon: <ChatRounded sx={{ fontSize: 48, color: '#2196f3' }} />,
      action: () => navigate('/chat'),
      color: '#2196f3'
    },
    {
      title: 'Profile',
      description: 'Edit your profile',
      icon: <PersonRounded sx={{ fontSize: 48, color: '#ff9800' }} />,
      action: () => navigate('/profile'),
      color: '#ff9800'
    },
    {
      title: 'Premium',
      description: 'Upgrade your plan',
      icon: <StarRounded sx={{ fontSize: 48, color: '#ffd700' }} />,
      action: () => navigate('/subscription'),
      color: '#ffd700'
    },
    {
      title: 'Contact Us',
      description: 'Get support & help',
      icon: <ContactSupportRounded sx={{ fontSize: 48, color: '#2196f3' }} />,
      action: () => navigate('/contact'),
      color: '#2196f3'
    },
    {
      title: 'Settings',
      description: 'Privacy and account settings',
      icon: <SettingsRounded sx={{ fontSize: 48, color: '#607d8b' }} />,
      action: () => navigate('/settings'),
      color: '#607d8b'
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <FavoriteRounded sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            MatchMaker
          </Typography>
          <NotificationBadge />
          <IconButton color="inherit" onClick={handleLogout}>
            <LogoutRounded />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Welcome Section */}
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: { xs: 2, sm: 3, md: 4 },
            borderRadius: { xs: 2, sm: 3 },
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                mr: 3,
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '1.5rem',
              }}
            >
              {user?.profile.firstName.charAt(0)}{user?.profile.lastName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Welcome back, {user?.profile.firstName}! 👋
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Ready to find your perfect match?
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Quick Photo Upload */}
        {user && user.profile.photos.length < 3 && (
          <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              📸 Add More Photos to Your Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Profiles with more photos get 3x more matches! Add at least 3 photos to increase your chances.
            </Typography>
            <QuickPhotoUpload
              photos={user.profile.photos}
              onPhotosChange={(newPhotos: string[]) => {
                // Update user state
                // In a real app, you'd want to update the global user state
                console.log('Photos updated:', newPhotos);
              }}
              maxPhotos={6}
            />
          </Paper>
        )}

        {/* Navigation Grid */}
                    <Grid container spacing={{ xs: 2, sm: 3 }}>
          {navigationCards.map((card, index) => (
            <Grid item xs={12} sm={6} md={3} lg={2.4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  p: 3,
                  height: '100%',
                  borderRadius: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
                onClick={card.action}
              >
                <Box sx={{ mb: 2 }}>
                  {card.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {card.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    backgroundColor: card.color,
                    '&:hover': {
                      backgroundColor: card.color,
                      opacity: 0.9,
                    },
                  }}
                >
                  Get Started
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Quick Stats */}
        <Paper elevation={2} sx={{ p: 3, mt: 4, borderRadius: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
            Your Profile Stats
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {user?.profile.photos.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Photos
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {user?.profile.interests.length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Interests
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
                  {user?.profile.location.city}, {user?.profile.location.state}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Location
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Dashboard;
