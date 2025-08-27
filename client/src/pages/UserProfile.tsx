import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Box,
  Button,
  IconButton,
  Avatar,
  Chip,
  CircularProgress,
  Card,
  CardMedia,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  ArrowBackRounded,
  FavoriteRounded,
  ChatRounded,
  CloseRounded,
  StarRounded,
  LocationOnRounded,
  WorkRounded,
  SchoolRounded,
  CakeRounded,
  BlockRounded,
  ReportRounded,
  MoreVertRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface UserProfileData {
  _id: string;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    bio: string;
    photos: string[];
    interests: string[];
    occupation: string;
    education: string;
    location: {
      city: string;
      state: string;
      country: string;
    };
    relationshipGoals: string;
    bodyType: string;
    smoking: string;
    drinking: string;
    height: number;
  };
  distance?: number;
  relevanceScore?: number;
  activity: {
    isOnline: boolean;
    lastActive: string;
  };
}

const UserProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [reportDialog, setReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  const reportReasons = [
    'Inappropriate behavior',
    'Fake profile',
    'Harassment',
    'Spam',
    'Underage user',
    'Inappropriate photos',
    'Other'
  ];

  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId]);

  const fetchUserProfile = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/users/${id}`);
      setUserProfile(response.data.user);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      if (error.response?.status === 404) {
        toast.error('User not found');
      } else {
        toast.error('Failed to load user profile');
      }
      navigate('/discover');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'like' | 'dislike' | 'super-like') => {
    if (!userId) return;
    
    try {
      setActionLoading(action);
      const endpoint = action === 'super-like' ? 'super-like' : action;
      const response = await api.post(`/matches/${endpoint}/${userId}`);
      
      if (response.data.isMatch) {
        toast.success("It's a match! 🎉", {
          duration: 3000,
          icon: '💕',
        });
        // Navigate to chat
        setTimeout(() => {
          navigate('/matches');
        }, 2000);
      } else if (action === 'like') {
        toast.success('Liked! 👍');
        navigate('/discover');
      } else if (action === 'super-like') {
        toast.success('Super liked! ⭐');
        navigate('/discover');
      } else {
        navigate('/discover');
      }
    } catch (error: any) {
      console.error('Error performing action:', error);
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartChat = async () => {
    try {
      // Check if there's already a match
      const matchesResponse = await api.get('/matches');
      const existingMatch = matchesResponse.data.matches.find((match: any) => 
        (match.user1._id === user?._id && match.user2._id === userId) ||
        (match.user2._id === user?._id && match.user1._id === userId)
      );

      if (existingMatch) {
        navigate(`/chat/${existingMatch._id}`);
      } else {
        toast.error('You need to match with this user first to start chatting');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Unable to start chat');
    }
  };

  const handleBlockUser = async () => {
    if (!userId) return;
    
    try {
      setActionLoading('block');
      await api.post(`/users/block/${userId}`);
      toast.success('User blocked successfully');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error blocking user:', error);
      toast.error(error.response?.data?.message || 'Failed to block user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReportUser = async () => {
    if (!userId || !reportReason || !reportDescription) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSubmittingReport(true);
      await api.post('/users/report', {
        userId,
        reason: reportReason,
        description: reportDescription
      });
      
      toast.success('Report submitted successfully! ✅');
      setReportDialog(false);
      setReportReason('');
      setReportDescription('');
    } catch (error: any) {
      console.error('Error submitting report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
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

  if (!userProfile) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <Typography variant="h6">User not found</Typography>
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
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {userProfile.profile.firstName}'s Profile
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 3 }}>
        {/* Main Profile Card */}
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
          {/* Header with Photo */}
          <Box sx={{ position: 'relative', height: 400 }}>
            <CardMedia
              component="img"
              height="400"
                             image={getAvatarUrl(userProfile, 400)}
              alt={userProfile.profile.firstName}
              sx={{ objectFit: 'cover' }}
            />
            
            {/* Online Status */}
            {userProfile.activity.isOnline && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  bgcolor: '#4caf50',
                  color: 'white',
                  px: 2,
                  py: 0.5,
                  borderRadius: 2,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                }}
              >
                Online
              </Box>
            )}

            {/* Distance */}
            {userProfile.distance && (
              <Chip
                label={`${userProfile.distance}km away`}
                sx={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                }}
              />
            )}

            {/* Match Score */}
            {userProfile.relevanceScore && (
              <Chip
                label={`${userProfile.relevanceScore}% match`}
                color="primary"
                sx={{
                  position: 'absolute',
                  bottom: 16,
                  right: 16,
                }}
              />
            )}
          </Box>

          {/* Profile Info */}
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                             <Avatar
                 sx={{ width: 64, height: 64, mr: 2, fontSize: '1.5rem' }}
                                         src={getAvatarUrl(userProfile, 150)}
               >
                {userProfile.profile.firstName.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {userProfile.profile.firstName} {userProfile.profile.lastName}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  {userProfile.profile.age} years old
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userProfile.activity.isOnline 
                    ? 'Online now' 
                    : `Active ${formatLastSeen(userProfile.activity.lastActive)}`
                  }
                </Typography>
              </Box>
            </Box>

            {/* Bio */}
            {userProfile.profile.bio && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  About
                </Typography>
                <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                  {userProfile.profile.bio}
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            {/* Details Grid */}
            <Grid container spacing={3}>
              {/* Location */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <LocationOnRounded sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {userProfile.profile.location.city}, {userProfile.profile.location.state}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              {/* Occupation */}
              {userProfile.profile.occupation && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <WorkRounded sx={{ color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Work
                      </Typography>
                      <Typography variant="body1">
                        {userProfile.profile.occupation}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Education */}
              {userProfile.profile.education && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <SchoolRounded sx={{ color: 'primary.main', mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Education
                      </Typography>
                      <Typography variant="body1">
                        {userProfile.profile.education}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              )}

              {/* Relationship Goals */}
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CakeRounded sx={{ color: 'primary.main', mr: 2 }} />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Looking for
                    </Typography>
                    <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                      {userProfile.profile.relationshipGoals}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* Interests */}
            {userProfile.profile.interests.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Interests
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {userProfile.profile.interests.map((interest, index) => (
                    <Chip
                      key={index}
                      label={interest}
                      variant="outlined"
                      color="primary"
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Photo Gallery */}
            {userProfile.profile.photos.length > 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Photos ({userProfile.profile.photos.length})
                </Typography>
                <Grid container spacing={2}>
                  {userProfile.profile.photos.slice(1).map((photo, index) => (
                    <Grid item xs={6} sm={4} md={3} key={index}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.05)',
                          },
                        }}
                        onClick={() => {
                          // Open photo in full screen
                                                     window.open(getPhotoUrl(photo), '_blank');
                        }}
                      >
                        <CardMedia
                          component="img"
                          height="150"
                                                     image={getPhotoUrl(photo)}
                          alt={`Photo ${index + 2}`}
                          sx={{ objectFit: 'cover' }}
                        />
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </Paper>

        {/* Action Buttons */}
        <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<ChatRounded />}
                onClick={handleStartChat}
                sx={{
                  py: 1.5,
                  borderRadius: 3,
                }}
              >
                Start Chat
              </Button>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<CloseRounded />}
                  onClick={() => handleAction('dislike')}
                  disabled={actionLoading !== null}
                  sx={{ flex: 1, borderRadius: 3 }}
                >
                  {actionLoading === 'dislike' ? <CircularProgress size={20} /> : 'Pass'}
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<StarRounded />}
                  onClick={() => handleAction('super-like')}
                  disabled={actionLoading !== null}
                  sx={{ flex: 1, borderRadius: 3 }}
                >
                  {actionLoading === 'super-like' ? <CircularProgress size={20} /> : 'Super'}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<FavoriteRounded />}
                  onClick={() => handleAction('like')}
                  disabled={actionLoading !== null}
                  sx={{ flex: 1, borderRadius: 3 }}
                >
                  {actionLoading === 'like' ? <CircularProgress size={20} /> : 'Like'}
                </Button>
              </Box>
            </Grid>
            
            {/* More Options */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="text"
                  startIcon={<MoreVertRounded />}
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  sx={{ color: 'text.secondary' }}
                >
                  More Options
                </Button>
              </Box>
              
              {showMoreOptions && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<BlockRounded />}
                    onClick={handleBlockUser}
                    disabled={actionLoading !== null}
                    sx={{ borderRadius: 3 }}
                  >
                    {actionLoading === 'block' ? <CircularProgress size={20} /> : 'Block User'}
                  </Button>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ReportRounded />}
                    onClick={() => setReportDialog(true)}
                    sx={{ borderRadius: 3 }}
                  >
                    Report User
                  </Button>
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Container>

      {/* Report Dialog */}
      <Dialog 
        open={reportDialog} 
        onClose={() => setReportDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Report User</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Reason for Report</InputLabel>
                <Select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  label="Reason for Report"
                >
                  {reportReasons.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Please provide details about the issue..."
                multiline
                rows={4}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReportDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleReportUser} 
            variant="contained"
            color="warning"
            disabled={submittingReport || !reportReason || !reportDescription}
          >
            {submittingReport ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
