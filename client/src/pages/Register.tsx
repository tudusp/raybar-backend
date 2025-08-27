import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Autocomplete,
} from '@mui/material';
import { FavoriteRounded } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { locationData, getCountries, getStates, getCities, validateEmail } from '../data/locationData';
import toast from 'react-hot-toast';
import ImageUpload from '../components/ImageUpload';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    interestedIn: '',
    relationshipGoals: '',
    city: '',
    state: '',
    country: '',
    lat: 0,
    lng: 0,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [countries] = useState(getCountries());
  const [photos, setPhotos] = useState<string[]>([]);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Handle cascading dropdowns
    if (name === 'country') {
      const states = getStates(value);
      setAvailableStates(states);
      setFormData(prev => ({
        ...prev,
        state: '',
        city: ''
      }));
      setAvailableCities([]);
    } else if (name === 'state') {
      const cities = getCities(formData.country, value);
      setAvailableCities(cities);
      setFormData(prev => ({
        ...prev,
        city: ''
      }));
    }

    // Email validation
    if (name === 'email') {
      const validation = validateEmail(value);
      setEmailError(validation.isValid ? '' : validation.message);
    }
  };

  const handleAutocompleteChange = (field: string, value: string | null) => {
    if (value) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));

      // Handle cascading for autocomplete
      if (field === 'country') {
        const states = getStates(value);
        setAvailableStates(states);
        setFormData(prev => ({
          ...prev,
          state: '',
          city: ''
        }));
        setAvailableCities([]);
      } else if (field === 'state') {
        const cities = getCities(formData.country, value);
        setAvailableCities(cities);
        setFormData(prev => ({
          ...prev,
          city: ''
        }));
      }
    }
  };

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }));
          toast.success('Location detected! 📍');
        },
        (error) => {
          console.error('Error getting location:', error);
          // Set default coordinates (e.g., New York City)
          setFormData(prev => ({
            ...prev,
            lat: 40.7128,
            lng: -74.0060,
          }));
          toast.error('Could not get location. Using default.');
        }
      );
    } else {
      // Set default coordinates
      setFormData(prev => ({
        ...prev,
        lat: 40.7128,
        lng: -74.0060,
      }));
      toast.error('Geolocation not supported. Using default location.');
    }
  };

  React.useEffect(() => {
    getLocation();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (parseInt(formData.age) < 18) {
      setError('You must be at least 18 years old');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email).isValid) {
      setError(validateEmail(formData.email).message);
      setLoading(false);
      return;
    }

    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        age: parseInt(formData.age),
        gender: formData.gender,
        interestedIn: formData.interestedIn,
        relationshipGoals: formData.relationshipGoals,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        lat: formData.lat || 40.7128,
        lng: formData.lng || -74.0060,
        photos: photos,
      };

      await register(registrationData);
      toast.success('Welcome to MatchMaker! 🎉');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          py: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: { xs: 2, sm: 3, md: 4 },
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: { xs: 2, sm: 3 },
            width: '100%',
            maxWidth: { xs: '100%', sm: '90%', md: '100%' },
          }}
        >
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FavoriteRounded sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              MatchMaker
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom sx={{ textAlign: 'center' }}>
            Create Your Profile
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Join thousands of people finding love
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="firstName"
                  label="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="lastName"
                  label="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  name="email"
                  label="Email Address"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!emailError}
                  helperText={emailError}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  required
                  fullWidth
                  name="age"
                  label="Age"
                  type="number"
                  inputProps={{ min: 18, max: 100 }}
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                    label="Gender"
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Interested In</InputLabel>
                  <Select
                    name="interestedIn"
                    value={formData.interestedIn}
                    onChange={handleChange}
                    disabled={loading}
                    label="Interested In"
                  >
                    <MenuItem value="male">Men</MenuItem>
                    <MenuItem value="female">Women</MenuItem>
                    <MenuItem value="both">Both</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth required>
                  <InputLabel>Relationship Goals</InputLabel>
                  <Select
                    name="relationshipGoals"
                    value={formData.relationshipGoals}
                    onChange={handleChange}
                    disabled={loading}
                    label="Relationship Goals"
                  >
                    <MenuItem value="long-term">Long-term Relationship</MenuItem>
                    <MenuItem value="marriage">Marriage</MenuItem>
                    <MenuItem value="short-term">Short-term Relationship</MenuItem>
                    <MenuItem value="serious">Serious Relationship</MenuItem>
                    <MenuItem value="friendship">Friendship</MenuItem>
                    <MenuItem value="networking">Networking</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
                            <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={countries}
                  getOptionLabel={(option) => option}
                  value={formData.country || null}
                  onChange={(event, newValue) => handleAutocompleteChange('country', newValue)}
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ mr: 1 }}>{params.InputProps.startAdornment}</Box>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: { xs: 1, sm: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={availableStates}
                  getOptionLabel={(option) => option}
                  value={formData.state || null}
                  onChange={(event, newValue) => handleAutocompleteChange('state', newValue)}
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State/Province"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ mr: 1 }}>{params.InputProps.startAdornment}</Box>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: { xs: 1, sm: 2 } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <Autocomplete
                  options={availableCities}
                  getOptionLabel={(option) => option}
                  value={formData.city || null}
                  onChange={(event, newValue) => handleAutocompleteChange('city', newValue)}
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="City"
                      InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                          <Box sx={{ mr: 1 }}>{params.InputProps.startAdornment}</Box>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: { xs: 1, sm: 2 } }}
                />
              </Grid>
            </Grid>

            {/* Profile Photos */}
            <Box sx={{ mt: 3, mb: 3 }}>
              <ImageUpload
                photos={photos}
                onPhotosChange={setPhotos}
                maxPhotos={6}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: { xs: 2, sm: 3 },
                mb: { xs: 1, sm: 2 },
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '1rem', sm: '1.1rem' },
                fontWeight: 'bold',
                borderRadius: 2,
              }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#ff4458',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
