import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  Slider,
  Checkbox,
  FormGroup,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Badge,
  Tooltip,
  Menu,
  MenuItem as MenuItemComponent,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  MonetizationOn as MonetizationIcon,
  Report as ReportIcon,
  Settings as SettingsIcon,
  ContactSupport as ContactIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Edit as EditIcon,
  Block as BlockIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Logout as LogoutIcon,
  ExpandMore as ExpandMoreIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Verified as VerifiedIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  bannedUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

interface SystemAnalytics {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  activeUsers: number;
  premiumUsers: number;
  subscriptionRevenue: number;
  userGrowthRate: string;
}

interface User {
  _id: string;
  email: string;
  profile: {
    firstName: string;
    lastName: string;
    age: number;
    gender: 'male' | 'female' | 'other';
    bio: string;
    photos: string[];
    location: {
      city: string;
      state: string;
      country: string;
    };
    relationshipStatus: 'single' | 'married' | 'divorced' | 'widow';
  };
  subscription: {
    plan: 'free' | 'premium' | 'vip';
    status: 'active' | 'inactive' | 'cancelled' | 'expired';
    endDate?: string;
  };
  isBanned: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  banReason?: string;
  banExpiry?: string;
  createdAt: string;
  activity: {
    lastActive: string;
    isOnline: boolean;
  };
}

interface UserDetails extends User {
  stats: {
    totalLikes: number;
    totalMatches: number;
    totalMessages: number;
    lastLogin: string;
  };
}

interface UserActivity {
  lastLogin: string;
  isOnline: boolean;
  loginCount: number;
  profileViews: number;
  messagesSent: number;
  likesGiven: number;
  matchesCount: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [userStats, setUserStats] = useState<AdminStats | null>(null);
  const [systemAnalytics, setSystemAnalytics] = useState<SystemAnalytics | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserDetails | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  
  // User management state
  const [searchFilters, setSearchFilters] = useState({
    search: '',
    plan: '',
    status: '',
    gender: '',
    ageMin: '',
    ageMax: '',
    location: '',
    isOnline: '',
    hasPhotos: '',
    isVerified: ''
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Dialog states
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState(30);
  const [userDetailsDialogOpen, setUserDetailsDialogOpen] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [profileEditDialogOpen, setProfileEditDialogOpen] = useState(false);
  const [profileUpdates, setProfileUpdates] = useState<any>({});
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkReason, setBulkReason] = useState('');

  // Check admin authentication
  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminInfo = localStorage.getItem('adminInfo');
    
    if (!adminToken || !adminInfo) {
      toast.error('Please login as admin first');
      navigate('/admin/login');
      return;
    }

    // Set admin token for API calls
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    
    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setUserStats(response.data.userStats);
      setSystemAnalytics(response.data.systemAnalytics);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...searchFilters
      });

      console.log('🔍 Fetching users with params:', params.toString());
      const response = await api.get(`/admin/users/search?${params}`);
      console.log('🔍 Users response:', response.data);
      
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('❌ Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      await api.patch(`/admin/users/${userId}/ban`, {
        isBanned,
        reason: banReason,
        duration: banDuration
      });

      toast.success(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      setBanDialogOpen(false);
      setBanReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error banning user:', error);
      toast.error('Failed to ban user');
    }
  };

  const handleResetPassword = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/reset-password`, {
        newPassword
      });

      toast.success('Password reset successfully');
      setPasswordResetDialogOpen(false);
      setNewPassword('');
    } catch (error) {
      console.error('Error resetting password:', error);
      toast.error('Failed to reset password');
    }
  };

  const handleUpdateProfile = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/profile`, {
        updates: profileUpdates
      });

      toast.success('Profile updated successfully');
      setProfileEditDialogOpen(false);
      setProfileUpdates({});
      fetchUsers();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handleBulkAction = async () => {
    try {
      const response = await api.post('/admin/users/bulk-action', {
        userIds: selectedUserIds,
        action: bulkAction,
        reason: bulkReason
      });

      toast.success(`Bulk action completed: ${response.data.summary.successful} successful, ${response.data.summary.failed} failed`);
      setBulkActionDialogOpen(false);
      setSelectedUserIds([]);
      setBulkAction('');
      setBulkReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform bulk action');
    }
  };

  const handleUserDetails = async (userId: string) => {
    try {
      const [detailsResponse, activityResponse] = await Promise.all([
        api.get(`/admin/users/${userId}/details`),
        api.get(`/admin/users/${userId}/activity`)
      ]);

      setSelectedUser(detailsResponse.data);
      setUserActivity(activityResponse.data.activity);
      setUserDetailsDialogOpen(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login');
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1);
  };

  const handleClearFilters = () => {
    setSearchFilters({
      search: '',
      plan: '',
      status: '',
      gender: '',
      ageMin: '',
      ageMax: '',
      location: '',
      isOnline: '',
      hasPhotos: '',
      isVerified: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers(1);
  };

  const handleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(user => user._id));
    }
  };

  if (loading && !userStats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<DashboardIcon />} label="Dashboard" />
          <Tab icon={<PeopleIcon />} label="User Management" />
          <Tab icon={<MonetizationIcon />} label="Analytics" />
        </Tabs>

        {/* Dashboard Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Stats Cards */}
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats?.totalUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    +{userStats?.newUsersThisWeek} this week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Active Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats?.activeUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Last 7 days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Premium Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats?.premiumUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    ${systemAnalytics?.subscriptionRevenue.toFixed(2)} revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Banned Users
                  </Typography>
                  <Typography variant="h4">
                    {userStats?.bannedUsers.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    {((userStats?.bannedUsers || 0) / (userStats?.totalUsers || 1) * 100).toFixed(1)}%
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Analytics Chart */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Growth
                  </Typography>
                  <Typography variant="h3" color="primary">
                    {systemAnalytics?.userGrowthRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Growth rate this week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* User Management Tab */}
        <TabPanel value={tabValue} index={1}>
          <Paper sx={{ p: 3 }}>
            {/* Search and Filters */}
            <Box sx={{ mb: 3 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Search users"
                    value={searchFilters.search}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, search: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Plan</InputLabel>
                    <Select
                      value={searchFilters.plan}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, plan: e.target.value }))}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="free">Free</MenuItem>
                      <MenuItem value="premium">Premium</MenuItem>
                      <MenuItem value="vip">VIP</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={searchFilters.status}
                      onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="banned">Banned</MenuItem>
                      <MenuItem value="unverified">Unverified</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="outlined"
                    startIcon={<FilterIcon />}
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  >
                    Filters
                  </Button>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleSearch}
                    sx={{ mr: 1 }}
                  >
                    Search
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                </Grid>
              </Grid>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography>Advanced Filters</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={searchFilters.gender}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, gender: e.target.value }))}
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="male">Male</MenuItem>
                            <MenuItem value="female">Female</MenuItem>
                            <MenuItem value="other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Age Min"
                          type="number"
                          value={searchFilters.ageMin}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, ageMin: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Age Max"
                          type="number"
                          value={searchFilters.ageMax}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, ageMax: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <TextField
                          fullWidth
                          label="Location"
                          value={searchFilters.location}
                          onChange={(e) => setSearchFilters(prev => ({ ...prev, location: e.target.value }))}
                        />
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Online Status</InputLabel>
                          <Select
                            value={searchFilters.isOnline}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, isOnline: e.target.value }))}
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Online</MenuItem>
                            <MenuItem value="false">Offline</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Has Photos</InputLabel>
                          <Select
                            value={searchFilters.hasPhotos}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, hasPhotos: e.target.value }))}
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Yes</MenuItem>
                            <MenuItem value="false">No</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <FormControl fullWidth>
                          <InputLabel>Verified</InputLabel>
                          <Select
                            value={searchFilters.isVerified}
                            onChange={(e) => setSearchFilters(prev => ({ ...prev, isVerified: e.target.value }))}
                          >
                            <MenuItem value="">All</MenuItem>
                            <MenuItem value="true">Verified</MenuItem>
                            <MenuItem value="false">Unverified</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>

            {/* Bulk Actions */}
            {selectedUserIds.length > 0 && (
              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="subtitle1" gutterBottom>
                  {selectedUserIds.length} users selected
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setBulkActionDialogOpen(true)}
                  sx={{ mr: 1 }}
                >
                  Bulk Actions
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setSelectedUserIds([])}
                >
                  Clear Selection
                </Button>
              </Box>
            )}

            {/* Users Table */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < users.length}
                        onChange={handleSelectAllUsers}
                      />
                    </TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Age/Gender</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Active</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedUserIds.includes(user._id)}
                          onChange={() => handleSelectUser(user._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <AccountCircleIcon sx={{ mr: 1 }} />
                          <Box>
                            <Typography variant="body2">
                              {user.profile.firstName} {user.profile.lastName}
                            </Typography>
                            {user.isVerified && (
                              <Chip
                                icon={<VerifiedIcon />}
                                label="Verified"
                                size="small"
                                color="success"
                                sx={{ mt: 0.5 }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.profile.age} / {user.profile.gender}
                      </TableCell>
                      <TableCell>
                        {user.profile.location.city}, {user.profile.location.country}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.subscription.plan}
                          color={user.subscription.plan === 'free' ? 'default' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {user.isBanned ? (
                            <Chip
                              icon={<BlockIcon />}
                              label="Banned"
                              color="error"
                              size="small"
                            />
                          ) : (
                            <Chip
                              icon={<CheckCircleIcon />}
                              label="Active"
                              color="success"
                              size="small"
                            />
                          )}
                          {user.activity.isOnline && (
                            <Chip
                              label="Online"
                              color="info"
                              size="small"
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(user.activity.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => handleUserDetails(user._id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={user.isBanned ? 'Unban User' : 'Ban User'}>
                            <IconButton
                              size="small"
                              color={user.isBanned ? 'success' : 'error'}
                              onClick={() => {
                                setSelectedUser(user as any);
                                setBanDialogOpen(true);
                              }}
                            >
                              {user.isBanned ? <LockOpenIcon /> : <BlockIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reset Password">
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedUser(user as any);
                                setPasswordResetDialogOpen(true);
                              }}
                            >
                              <LockIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination */}
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                disabled={pagination.page === 1}
                onClick={() => fetchUsers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Typography sx={{ mx: 2, alignSelf: 'center' }}>
                Page {pagination.page} of {pagination.pages}
              </Typography>
              <Button
                disabled={pagination.page === pagination.pages}
                onClick={() => fetchUsers(pagination.page + 1)}
              >
                Next
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    User Growth Analytics
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {systemAnalytics?.userGrowthRate}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Weekly growth rate
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Analytics
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ${systemAnalytics?.subscriptionRevenue.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Monthly subscription revenue
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Container>

      {/* Ban/Unban Dialog */}
      <Dialog open={banDialogOpen} onClose={() => setBanDialogOpen(false)}>
        <DialogTitle>
          {selectedUser?.isBanned ? 'Unban User' : 'Ban User'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason"
            multiline
            rows={3}
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            sx={{ mt: 2 }}
          />
          {!selectedUser?.isBanned && (
            <TextField
              fullWidth
              label="Duration (days)"
              type="number"
              value={banDuration}
              onChange={(e) => setBanDuration(parseInt(e.target.value))}
              sx={{ mt: 2 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBanDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleBanUser(selectedUser!._id, !selectedUser!.isBanned)}
            color={selectedUser?.isBanned ? 'success' : 'error'}
          >
            {selectedUser?.isBanned ? 'Unban' : 'Ban'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordResetDialogOpen} onClose={() => setPasswordResetDialogOpen(false)}>
        <DialogTitle>Reset User Password</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordResetDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => handleResetPassword(selectedUser!._id)}
            disabled={!newPassword}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* User Details Dialog */}
      <Dialog 
        open={userDetailsDialogOpen} 
        onClose={() => setUserDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Profile Information</Typography>
                <List>
                  <ListItem>
                    <ListItemText
                      primary="Name"
                      secondary={`${selectedUser.profile.firstName} ${selectedUser.profile.lastName}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Email"
                      secondary={selectedUser.email}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Age & Gender"
                      secondary={`${selectedUser.profile.age} / ${selectedUser.profile.gender}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Location"
                      secondary={`${selectedUser.profile.location.city}, ${selectedUser.profile.location.country}`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText
                      primary="Relationship Status"
                      secondary={selectedUser.profile.relationshipStatus}
                    />
                  </ListItem>
                </List>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6">Activity & Stats</Typography>
                {userActivity && (
                  <List>
                    <ListItem>
                      <ListItemText
                        primary="Total Likes"
                        secondary={selectedUser.stats.totalLikes}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Matches"
                        secondary={selectedUser.stats.totalMatches}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Total Messages"
                        secondary={selectedUser.stats.totalMessages}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Last Login"
                        secondary={new Date(selectedUser.stats.lastLogin).toLocaleString()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Online Status"
                        secondary={userActivity.isOnline ? 'Online' : 'Offline'}
                      />
                    </ListItem>
                  </List>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUserDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={bulkActionDialogOpen} onClose={() => setBulkActionDialogOpen(false)}>
        <DialogTitle>Bulk Action</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <MenuItem value="ban">Ban Users</MenuItem>
              <MenuItem value="unban">Unban Users</MenuItem>
              <MenuItem value="delete">Delete Users</MenuItem>
              <MenuItem value="verify">Verify Users</MenuItem>
              <MenuItem value="unverify">Unverify Users</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Reason (optional)"
            multiline
            rows={3}
            value={bulkReason}
            onChange={(e) => setBulkReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleBulkAction}
            disabled={!bulkAction}
            color="error"
          >
            Execute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPanel;
