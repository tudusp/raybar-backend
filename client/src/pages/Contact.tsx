import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  ArrowBackRounded,
  ContactSupportRounded,
  EmailRounded,
  PhoneRounded,
  LocationOnRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const Contact: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name as string]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/contact', formData);
      toast.success('Message sent successfully! We\'ll get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: '',
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      setError(error.response?.data?.message || 'Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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
            Contact Us
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3 } }}>
        <Grid container spacing={4}>
          {/* Contact Information */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: 'fit-content' }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
                Get in Touch
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <EmailRounded sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Email</Typography>
                    <Typography variant="body2" color="text.secondary">
                      support@matchmaker.com
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PhoneRounded sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Phone</Typography>
                    <Typography variant="body2" color="text.secondary">
                      +1 (555) 123-4567
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnRounded sx={{ mr: 2, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">Address</Typography>
                    <Typography variant="body2" color="text.secondary">
                      123 Match Street<br />
                      Love City, LC 12345
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Typography variant="body2" color="text.secondary">
                We're here to help! Send us a message and we'll respond as soon as possible.
              </Typography>
            </Paper>
          </Grid>

          {/* Contact Form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ContactSupportRounded sx={{ fontSize: 48, color: 'primary.main', mr: 2 }} />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  Send us a Message
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Your Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        label="Category"
                      >
                        <MenuItem value="general">General Inquiry</MenuItem>
                        <MenuItem value="technical">Technical Support</MenuItem>
                        <MenuItem value="billing">Billing & Payment</MenuItem>
                        <MenuItem value="account">Account Issues</MenuItem>
                        <MenuItem value="safety">Safety & Security</MenuItem>
                        <MenuItem value="feedback">Feedback & Suggestions</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Message"
                      name="message"
                      multiline
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      placeholder="Tell us how we can help you..."
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Send Message'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Contact;
