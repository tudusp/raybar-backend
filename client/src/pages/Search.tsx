import React, { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Slider,
  Card,
  CardMedia,
  CardContent,
  CircularProgress,
  Pagination,
  Autocomplete,
} from '@mui/material';
import {
  ArrowBackRounded,
  SearchRounded,
  FilterListRounded,
  ClearRounded,
  PersonRounded,
} from '@mui/icons-material';
import { api } from '../services/api';
import { getCountries, getStates, getCities } from '../data/locationData';
import toast from 'react-hot-toast';
import { getPhotoUrl } from '../utils/photoUtils';
import { getAvatarUrl } from '../utils/avatarUtils';

interface SearchFilters {
  firstName: string;
  lastName: string;
  ageMin: number;
  ageMax: number;
  gender: string;
  city: string;
  state: string;
  country: string;
  maxDistance: number;
  interests: string[];
  occupation: string;
  education: string;
  relationshipGoals: string;
  bodyType: string;
  smoking: string;
  drinking: string;
  sortBy: string;
  sortOrder: string;
}

interface SearchResult {
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
  };
  distance?: number;
  relevanceScore?: number;
  activity: {
    isOnline: boolean;
    lastActive: string;
  };
}

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SearchFilters>({
    firstName: '',
    lastName: '',
    ageMin: 18,
    ageMax: 80,
    gender: '',
    city: '',
    state: '',
    country: '',
    maxDistance: 100,
    interests: [],
    occupation: '',
    education: '',
    relationshipGoals: '',
    bodyType: '',
    smoking: '',
    drinking: '',
    sortBy: 'relevance',
    sortOrder: 'desc',
  });

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [countries] = useState(getCountries());
  
  const [suggestions, setSuggestions] = useState<{
    cities: string[];
    states: string[];
    countries: string[];
    occupations: string[];
    education: string[];
    interests: string[];
  }>({
    cities: [],
    states: [],
    countries: [],
    occupations: [],
    education: [],
    interests: [],
  });

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await api.get('/search/suggestions');
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));

    // Handle cascading dropdowns
    if (field === 'country') {
      const states = getStates(value);
      setAvailableStates(states);
      setFilters(prev => ({
        ...prev,
        state: '',
        city: ''
      }));
      setAvailableCities([]);
    } else if (field === 'state') {
      const cities = getCities(filters.country, value);
      setAvailableCities(cities);
      setFilters(prev => ({
        ...prev,
        city: ''
      }));
    }
  };

  const handleAutocompleteChange = (field: string, value: string | null) => {
    if (value !== null) {
      handleFilterChange(field, value);
    }
  };

  const handleSearch = async (pageNum = 1) => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== 0 && (Array.isArray(value) ? value.length > 0 : true)) {
          if (Array.isArray(value)) {
            params.append(key, value.join(','));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      params.append('page', pageNum.toString());
      params.append('limit', '12');

      const response = await api.get(`/search/users?${params.toString()}`);
      
      setSearchResults(response.data.users || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setPage(pageNum);
      
      toast.success(`Found ${response.data.users?.length || 0} users`);
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      firstName: '',
      lastName: '',
      ageMin: 18,
      ageMax: 80,
      gender: '',
      city: '',
      state: '',
      country: '',
      maxDistance: 100,
      interests: [],
      occupation: '',
      education: '',
      relationshipGoals: '',
      bodyType: '',
      smoking: '',
      drinking: '',
      sortBy: 'relevance',
      sortOrder: 'desc',
    });
    setSearchResults([]);
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
            Search People
          </Typography>
          <IconButton
            color="inherit"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterListRounded />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3 }}>
        {/* Search Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 3 }}>
          {/* Basic Search */}
          <Grid container spacing={2} sx={{ mb: showFilters ? 2 : 0 }}>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="First Name"
                value={filters.firstName}
                onChange={(e) => handleFilterChange('firstName', e.target.value)}
                size="small"
                placeholder="Search by first name"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Last Name"
                value={filters.lastName}
                onChange={(e) => handleFilterChange('lastName', e.target.value)}
                size="small"
                placeholder="Search by last name"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select
                  value={filters.gender}
                  onChange={(e) => handleFilterChange('gender', e.target.value)}
                  label="Gender"
                >
                  <MenuItem value="">Any Gender</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Relationship Goals</InputLabel>
                <Select
                  value={filters.relationshipGoals}
                  onChange={(e) => handleFilterChange('relationshipGoals', e.target.value)}
                  label="Relationship Goals"
                >
                  <MenuItem value="">Any Goals</MenuItem>
                  <MenuItem value="long-term">Long-term Relationship</MenuItem>
                  <MenuItem value="marriage">Marriage</MenuItem>
                  <MenuItem value="short-term">Short-term Relationship</MenuItem>
                  <MenuItem value="serious">Serious Relationship</MenuItem>
                  <MenuItem value="friendship">Friendship</MenuItem>
                  <MenuItem value="networking">Networking</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Search Button */}
          <Box sx={{ display: 'flex', gap: 2, mb: showFilters ? 2 : 0 }}>
            <Button
              variant="contained"
              startIcon={<SearchRounded />}
              onClick={() => handleSearch(1)}
              disabled={loading}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<ClearRounded />}
              onClick={clearFilters}
              disabled={loading}
            >
              Clear
            </Button>
          </Box>

          {/* Advanced Filters */}
          {showFilters && (
            <>
              {/* Age Range */}
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Age Range: {filters.ageMin} - {filters.ageMax}
                </Typography>
                <Slider
                  value={[filters.ageMin, filters.ageMax]}
                  onChange={(_, value) => {
                    const [min, max] = value as number[];
                    handleFilterChange('ageMin', min);
                    handleFilterChange('ageMax', max);
                  }}
                  min={18}
                  max={100}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Location */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    size="small"
                    options={suggestions.cities}
                    value={filters.city}
                    onChange={(_, value) => handleAutocompleteChange('city', value)}
                    renderInput={(params) => <TextField {...params} label="City" />}
                    freeSolo
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    size="small"
                    options={availableStates}
                    value={filters.state}
                    onChange={(_, value) => handleAutocompleteChange('state', value)}
                    renderInput={(params) => <TextField {...params} label="State/Province" />}
                    freeSolo
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    size="small"
                    options={countries}
                    value={filters.country}
                    onChange={(_, value) => handleAutocompleteChange('country', value)}
                    renderInput={(params) => <TextField {...params} label="Country" />}
                    freeSolo
                  />
                </Grid>
              </Grid>

              {/* Distance */}
              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Max Distance: {filters.maxDistance} km
                </Typography>
                <Slider
                  value={filters.maxDistance}
                  onChange={(_, value) => handleFilterChange('maxDistance', value)}
                  min={1}
                  max={1000}
                  valueLabelDisplay="auto"
                />
              </Box>

              {/* Work & Education */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    size="small"
                    options={suggestions.occupations}
                    value={filters.occupation}
                    onChange={(_, value) => handleFilterChange('occupation', value || '')}
                    renderInput={(params) => <TextField {...params} label="Occupation" />}
                    freeSolo
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    size="small"
                    options={suggestions.education}
                    value={filters.education}
                    onChange={(_, value) => handleFilterChange('education', value || '')}
                    renderInput={(params) => <TextField {...params} label="Education" />}
                    freeSolo
                  />
                </Grid>
              </Grid>

              {/* Interests */}
              <Box sx={{ mb: 2 }}>
                <Autocomplete
                  multiple
                  size="small"
                  options={suggestions.interests}
                  value={filters.interests}
                  onChange={(_, value) => handleFilterChange('interests', value)}
                  renderInput={(params) => <TextField {...params} label="Interests" />}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                    ))
                  }
                  freeSolo
                />
              </Box>

              {/* Lifestyle & Preferences */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Body Type</InputLabel>
                    <Select
                      value={filters.bodyType}
                      onChange={(e) => handleFilterChange('bodyType', e.target.value)}
                      label="Body Type"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="slim">Slim</MenuItem>
                      <MenuItem value="average">Average</MenuItem>
                      <MenuItem value="athletic">Athletic</MenuItem>
                      <MenuItem value="curvy">Curvy</MenuItem>
                      <MenuItem value="heavy">Heavy</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Smoking</InputLabel>
                    <Select
                      value={filters.smoking}
                      onChange={(e) => handleFilterChange('smoking', e.target.value)}
                      label="Smoking"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="never">Never</MenuItem>
                      <MenuItem value="sometimes">Sometimes</MenuItem>
                      <MenuItem value="regularly">Regularly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Drinking</InputLabel>
                    <Select
                      value={filters.drinking}
                      onChange={(e) => handleFilterChange('drinking', e.target.value)}
                      label="Drinking"
                    >
                      <MenuItem value="">Any</MenuItem>
                      <MenuItem value="never">Never</MenuItem>
                      <MenuItem value="sometimes">Sometimes</MenuItem>
                      <MenuItem value="regularly">Regularly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {/* Sort Options */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy}
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                      label="Sort By"
                    >
                      <MenuItem value="relevance">Relevance</MenuItem>
                      <MenuItem value="age">Age</MenuItem>
                      <MenuItem value="distance">Distance</MenuItem>
                      <MenuItem value="lastActive">Last Active</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Order</InputLabel>
                    <Select
                      value={filters.sortOrder}
                      onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      label="Order"
                    >
                      <MenuItem value="desc">Descending</MenuItem>
                      <MenuItem value="asc">Ascending</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </>
          )}
        </Paper>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Search Results ({searchResults.length} users found)
            </Typography>
            
            <Grid container spacing={3}>
              {searchResults.map((user) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={user._id}>
                  <Card
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      },
                    }}
                    onClick={() => navigate(`/user/${user._id}`)}
                  >
                    {/* Profile Image */}
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={200}
                        image={getAvatarUrl(user, 200)}
                        alt={user.profile.firstName}
                        sx={{ objectFit: 'cover' }}
                      />
                      
                      {/* Online Status */}
                      {user.activity.isOnline && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            width: 12,
                            height: 12,
                            bgcolor: '#4caf50',
                            borderRadius: '50%',
                            border: '2px solid white',
                          }}
                        />
                      )}

                      {/* Distance Badge */}
                      <Chip
                        label={`${user.distance}km away`}
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: 12,
                          left: 12,
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                          color: 'white',
                        }}
                      />

                      {/* Relevance Score */}
                      <Chip
                        label={`${user.relevanceScore}% match`}
                        size="small"
                        color="primary"
                        sx={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                        }}
                      />
                    </Box>

                    {/* Content */}
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                        {user.profile.firstName} {user.profile.lastName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.profile.age} years old • {user.profile.gender}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {user.profile.location.city}, {user.profile.location.state}
                      </Typography>

                      {user.profile.occupation && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {user.profile.occupation}
                        </Typography>
                      )}

                      {user.profile.bio && (
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            mb: 1,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {user.profile.bio}
                        </Typography>
                      )}

                      {/* Interests */}
                      {user.profile.interests.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                          {user.profile.interests.slice(0, 2).map((interest, index) => (
                            <Chip
                              key={index}
                              label={interest}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {user.profile.interests.length > 2 && (
                            <Chip
                              label={`+${user.profile.interests.length - 2}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}

                      {/* Last Active */}
                      <Typography variant="caption" color="text.secondary">
                        {user.activity.isOnline 
                          ? 'Online now' 
                          : `Active ${formatLastSeen(user.activity.lastActive)}`
                        }
                      </Typography>

                      {/* Action Button */}
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <IconButton
                          sx={{
                            bgcolor: 'primary.main',
                            color: 'white',
                            '&:hover': {
                              bgcolor: 'primary.dark',
                            },
                          }}
                        >
                          <PersonRounded />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(_, value) => handleSearch(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}

        {/* No Results */}
        {!loading && searchResults.length === 0 && (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <SearchRounded sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No users found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your search criteria or clear filters to see more results
            </Typography>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default Search;
