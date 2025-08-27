import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  Box,
  Avatar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
} from '@mui/material';
import {
  ArrowBackRounded,
  EditRounded,
  PhotoCameraRounded,
  SaveRounded,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.profile.firstName || '',
    lastName: user?.profile.lastName || '',
    bio: user?.profile.bio || '',
    age: user?.profile.age || 18,
    occupation: user?.profile.occupation || '',
    education: user?.profile.education || '',
    interests: user?.profile.interests || [],
    height: user?.profile.height || 170,
    bodyType: user?.profile.bodyType || 'average',
    smoking: user?.profile.smoking || 'never',
    drinking: user?.profile.drinking || 'sometimes',
    relationshipStatus: (user as any)?.profile?.relationshipStatus || 'single',
    relationshipGoals: user?.profile.relationshipGoals || 'serious',
  });

  const [preferences, setPreferences] = useState({
    ageRange: user?.preferences?.ageRange || { min: 18, max: 50 },
    maxDistance: user?.preferences?.maxDistance || 50,
    interestedIn: user?.preferences?.interestedIn || 'both',
  });

  const [newInterest, setNewInterest] = useState('');

  const handleProfileChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !profileData.interests.includes(newInterest.trim())) {
      setProfileData(prev => ({
        ...prev,
        interests: [...prev.interests, newInterest.trim()]
      }));
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setProfileData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Update profile
      await api.put('/users/profile', profileData);
      
      // Update preferences
      await api.put('/users/preferences', preferences);

      // Update local state
      updateUser({
        ...user!,
        profile: { ...user!.profile, ...profileData },
        preferences
      } as any);

      toast.success('Profile updated successfully! ✅');
      setEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const bodyTypes = ['slim', 'average', 'athletic', 'curvy', 'heavy'];
  const smokingOptions = ['never', 'sometimes', 'regularly'];
  const drinkingOptions = ['never', 'sometimes', 'regularly'];
  const relationshipStatusOptions = ['single', 'married', 'divorced', 'widow'];
  const relationshipGoalsOptions = ['long-term', 'marriage', 'short-term', 'serious', 'friendship', 'networking'];

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
            My Profile
          </Typography>
          {!editing ? (
            <IconButton color="inherit" onClick={() => setEditing(true)}>
              <EditRounded />
            </IconButton>
          ) : (
            <IconButton color="inherit" onClick={handleSave} disabled={loading}>
              <SaveRounded />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        {/* Profile Header */}
        <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                mr: 3,
                fontSize: '2rem',
                bgcolor: 'primary.main',
              }}
              src={getAvatarUrl(user, 100)}
            >
              {user?.profile.firstName?.charAt(0)}{user?.profile.lastName?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user?.profile.firstName} {user?.profile.lastName}
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {user?.profile.age} years old
              </Typography>
              <IconButton sx={{ bgcolor: 'primary.main', color: 'white' }}>
                <PhotoCameraRounded />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Bio"
                    placeholder="Tell people about yourself..."
                    value={profileData.bio}
                    onChange={(e) => handleProfileChange('bio', e.target.value)}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Occupation"
                    value={profileData.occupation}
                    onChange={(e) => handleProfileChange('occupation', e.target.value)}
                    disabled={!editing}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Education"
                    value={profileData.education}
                    onChange={(e) => handleProfileChange('education', e.target.value)}
                    disabled={!editing}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Physical Attributes */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Physical Attributes
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography gutterBottom>Height: {profileData.height} cm</Typography>
                  <Slider
                    value={profileData.height}
                    onChange={(_, value) => handleProfileChange('height', value)}
                    min={120}
                    max={220}
                    disabled={!editing}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Body Type</InputLabel>
                    <Select
                      value={profileData.bodyType}
                      onChange={(e) => handleProfileChange('bodyType', e.target.value)}
                      disabled={!editing}
                      label="Body Type"
                    >
                      {bodyTypes.map(type => (
                        <MenuItem key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Lifestyle */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Lifestyle
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Smoking</InputLabel>
                    <Select
                      value={profileData.smoking}
                      onChange={(e) => handleProfileChange('smoking', e.target.value)}
                      disabled={!editing}
                      label="Smoking"
                    >
                      {smokingOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Drinking</InputLabel>
                    <Select
                      value={profileData.drinking}
                      onChange={(e) => handleProfileChange('drinking', e.target.value)}
                      disabled={!editing}
                      label="Drinking"
                    >
                      {drinkingOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Relationship Status</InputLabel>
                    <Select
                      value={profileData.relationshipStatus}
                      onChange={(e) => handleProfileChange('relationshipStatus', e.target.value)}
                      disabled={!editing}
                      label="Relationship Status"
                    >
                      {relationshipStatusOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Relationship Goals</InputLabel>
                    <Select
                      value={profileData.relationshipGoals}
                      onChange={(e) => handleProfileChange('relationshipGoals', e.target.value)}
                      disabled={!editing}
                      label="Relationship Goals"
                    >
                      {relationshipGoalsOptions.map(option => (
                        <MenuItem key={option} value={option}>
                          {option.charAt(0).toUpperCase() + option.slice(1)}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Interests */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Interests
              </Typography>
              {editing && (
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    size="small"
                    placeholder="Add an interest"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                  />
                  <Button variant="contained" onClick={addInterest}>
                    Add
                  </Button>
                </Box>
              )}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {profileData.interests.map((interest, index) => (
                  <Chip
                    key={index}
                    label={interest}
                    onDelete={editing ? () => removeInterest(interest) : undefined}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Profile Photos */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <ImageUpload
                photos={user?.profile.photos || []}
                onPhotosChange={(newPhotos) => {
                  if (user) {
                    updateUser({
                      ...user,
                      profile: { ...user.profile, photos: newPhotos }
                    } as any);
                  }
                }}
                maxPhotos={6}
              />
            </Paper>
          </Grid>

          {/* Preferences */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                Matching Preferences
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Age Range: {preferences.ageRange.min} - {preferences.ageRange.max}
                  </Typography>
                  <Slider
                    value={[preferences.ageRange.min, preferences.ageRange.max]}
                    onChange={(_, value) => handlePreferenceChange('ageRange', {
                      min: (value as number[])[0],
                      max: (value as number[])[1]
                    })}
                    min={18}
                    max={100}
                    disabled={!editing}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography gutterBottom>
                    Max Distance: {preferences.maxDistance} km
                  </Typography>
                  <Slider
                    value={preferences.maxDistance}
                    onChange={(_, value) => handlePreferenceChange('maxDistance', value)}
                    min={1}
                    max={500}
                    disabled={!editing}
                    valueLabelDisplay="auto"
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Interested In</InputLabel>
                    <Select
                      value={preferences.interestedIn}
                      onChange={(e) => handlePreferenceChange('interestedIn', e.target.value)}
                      disabled={!editing}
                      label="Interested In"
                    >
                      <MenuItem value="male">Men</MenuItem>
                      <MenuItem value="female">Women</MenuItem>
                      <MenuItem value="both">Both</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
