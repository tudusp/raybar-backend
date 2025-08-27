import React, { useState } from 'react';
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
  Switch,
  FormControlLabel,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ArrowBackRounded,
  NotificationsRounded,
  SecurityRounded,
  AccountCircleRounded,
  DeleteForeverRounded,
  BlockRounded,
  ReportRounded,
  VisibilityRounded,
  VisibilityOffRounded,
  ShieldRounded,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    newMatches: true,
    newMessages: true,
    likes: true,
    superLikes: true,
    profileViews: false,
    emailNotifications: true,
    pushNotifications: true,
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    showOnlineStatus: true,
    showLastSeen: true,
    showDistance: true,
    showAge: true,
    allowProfileViews: true,
    allowMessages: true,
  });

  // Account Settings
  const [accountSettings, setAccountSettings] = useState({
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleNotificationChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handlePrivacyChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: event.target.checked
    }));
  };

  const handleAccountChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setAccountSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const saveNotificationSettings = async () => {
    try {
      setLoading(true);
      await api.put('/users/settings/notifications', notificationSettings);
      toast.success('Notification settings saved! ✅');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    try {
      setLoading(true);
      await api.put('/users/settings/privacy', privacySettings);
      toast.success('Privacy settings saved! ✅');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.put('/users/change-password', {
        currentPassword: accountSettings.currentPassword,
        newPassword: accountSettings.newPassword
      });
      toast.success('Password changed successfully! ✅');
      setAccountSettings(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setLoading(true);
      await api.delete('/users/account');
      toast.success('Account deleted successfully');
      logout();
      navigate('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

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
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Notification Settings */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <NotificationsRounded sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Notification Settings
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.newMatches}
                        onChange={handleNotificationChange('newMatches')}
                        color="primary"
                      />
                    }
                    label="New Matches"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.newMessages}
                        onChange={handleNotificationChange('newMessages')}
                        color="primary"
                      />
                    }
                    label="New Messages"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.likes}
                        onChange={handleNotificationChange('likes')}
                        color="primary"
                      />
                    }
                    label="Likes"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.superLikes}
                        onChange={handleNotificationChange('superLikes')}
                        color="primary"
                      />
                    }
                    label="Super Likes"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.profileViews}
                        onChange={handleNotificationChange('profileViews')}
                        color="primary"
                      />
                    }
                    label="Profile Views"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notificationSettings.emailNotifications}
                        onChange={handleNotificationChange('emailNotifications')}
                        color="primary"
                      />
                    }
                    label="Email Notifications"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={saveNotificationSettings}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  Save Notification Settings
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Privacy Settings */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityRounded sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Privacy Settings
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showOnlineStatus}
                        onChange={handlePrivacyChange('showOnlineStatus')}
                        color="primary"
                      />
                    }
                    label="Show Online Status"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showLastSeen}
                        onChange={handlePrivacyChange('showLastSeen')}
                        color="primary"
                      />
                    }
                    label="Show Last Seen"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showDistance}
                        onChange={handlePrivacyChange('showDistance')}
                        color="primary"
                      />
                    }
                    label="Show Distance"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.showAge}
                        onChange={handlePrivacyChange('showAge')}
                        color="primary"
                      />
                    }
                    label="Show Age"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.allowProfileViews}
                        onChange={handlePrivacyChange('allowProfileViews')}
                        color="primary"
                      />
                    }
                    label="Allow Profile Views"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={privacySettings.allowMessages}
                        onChange={handlePrivacyChange('allowMessages')}
                        color="primary"
                      />
                    }
                    label="Allow Messages"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={savePrivacySettings}
                  disabled={loading}
                  sx={{ mr: 2 }}
                >
                  Save Privacy Settings
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Account Settings */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <AccountCircleRounded sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Account Settings
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    value={accountSettings.email}
                    disabled
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={accountSettings.currentPassword}
                    onChange={handleAccountChange('currentPassword')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={accountSettings.newPassword}
                    onChange={handleAccountChange('newPassword')}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={accountSettings.confirmPassword}
                    onChange={handleAccountChange('confirmPassword')}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  onClick={changePassword}
                  disabled={loading || !accountSettings.currentPassword || !accountSettings.newPassword}
                  sx={{ mr: 2 }}
                >
                  Change Password
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Safety & Security */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ShieldRounded sx={{ mr: 2, color: 'error.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Safety & Security
                </Typography>
              </Box>
              
              <List>
                <ListItem button onClick={() => navigate('/blocked-users')}>
                  <ListItemText
                    primary="Blocked Users"
                    secondary="Manage users you've blocked"
                  />
                  <ListItemSecondaryAction>
                    <BlockRounded color="action" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem button onClick={() => navigate('/reports')}>
                  <ListItemText
                    primary="Report History"
                    secondary="View your reports and their status"
                  />
                  <ListItemSecondaryAction>
                    <ReportRounded color="action" />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem button onClick={() => setDeleteDialogOpen(true)}>
                  <ListItemText
                    primary="Delete Account"
                    secondary="Permanently delete your account and all data"
                    primaryTypographyProps={{ color: 'error' }}
                  />
                  <ListItemSecondaryAction>
                    <DeleteForeverRounded color="error" />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      {/* Delete Account Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action cannot be undone. All your data, matches, and messages will be permanently deleted.
          </Alert>
          <Typography>
            Are you sure you want to delete your account? This action is irreversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={deleteAccount} 
            color="error" 
            variant="contained"
            disabled={loading}
          >
            Delete Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settings;
