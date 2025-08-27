import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  ArrowBackRounded,
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as PayPalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import toast from 'react-hot-toast';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

interface UserSubscription {
  plan: 'free' | 'premium' | 'vip';
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
}

const Subscription: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscribeDialogOpen, setSubscribeDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const [plansResponse, subscriptionResponse] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/subscriptions/me')
      ]);

      setPlans(plansResponse.data.plans);
      setUserSubscription(subscriptionResponse.data.subscription);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      setSubscribing(true);
      
      const paymentData = {
        type: paymentMethod,
        ...(paymentMethod === 'card' && {
          last4: cardNumber.slice(-4),
          brand: 'visa' // Mock brand detection
        })
      };

      await api.post('/subscriptions/subscribe', {
        planId: selectedPlan.id,
        paymentMethod: paymentData,
        autoRenew: true
      });

      toast.success('Subscription activated successfully! 🎉');
      setSubscribeDialogOpen(false);
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to activate subscription');
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription cancelled successfully');
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      await api.post('/subscriptions/reactivate');
      toast.success('Subscription reactivated successfully!');
      fetchSubscriptionData();
    } catch (error) {
      console.error('Error reactivating subscription:', error);
      toast.error('Failed to reactivate subscription');
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'vip':
        return <DiamondIcon sx={{ color: '#ffd700' }} />;
      case 'premium':
        return <StarIcon sx={{ color: '#ff6b35' }} />;
      default:
        return null;
    }
  };

  const getPlanColor = (planId: string) => {
    switch (planId) {
      case 'vip':
        return 'error';
      case 'premium':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

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
            Subscription Plans
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Current Subscription Status */}
        {userSubscription && (
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Current Subscription
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Chip
                label={userSubscription.plan.toUpperCase()}
                color={getPlanColor(userSubscription.plan)}
                icon={getPlanIcon(userSubscription.plan)}
              />
              <Chip
                label={userSubscription.status}
                color={userSubscription.status === 'active' ? 'success' : 'error'}
              />
            </Box>
            {userSubscription.endDate && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Expires: {new Date(userSubscription.endDate).toLocaleDateString()}
              </Typography>
            )}
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              {userSubscription.status === 'active' && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleCancelSubscription}
                  startIcon={<CancelIcon />}
                >
                  Cancel Subscription
                </Button>
              )}
              {userSubscription.status === 'cancelled' && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleReactivateSubscription}
                >
                  Reactivate
                </Button>
              )}
            </Box>
          </Paper>
        )}

        {/* Available Plans */}
        <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Choose Your Plan
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={4} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  ...(plan.popular && {
                    border: '2px solid #ff6b35',
                    transform: 'scale(1.05)',
                  }),
                }}
              >
                {plan.popular && (
                  <Chip
                    label="Most Popular"
                    color="warning"
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      zIndex: 1,
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                    {getPlanIcon(plan.id)}
                    <Typography variant="h5" component="h2" sx={{ ml: 1 }}>
                      {plan.name}
                    </Typography>
                  </Box>

                  <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                    ${plan.price}
                    <Typography component="span" variant="body2" color="text.secondary">
                      /{plan.interval}
                    </Typography>
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <List dense>
                    {plan.features.map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>

                  {plan.limitations && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Limitations:
                      </Typography>
                      <List dense>
                        {plan.limitations.map((limitation, index) => (
                          <ListItem key={index} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <CancelIcon color="error" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={limitation} />
                          </ListItem>
                        ))}
                      </List>
                    </>
                  )}
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant={plan.popular ? 'contained' : 'outlined'}
                    color={getPlanColor(plan.id)}
                    onClick={() => {
                      setSelectedPlan(plan);
                      setSubscribeDialogOpen(true);
                    }}
                    disabled={userSubscription?.plan === plan.id && userSubscription?.status === 'active'}
                  >
                    {userSubscription?.plan === plan.id && userSubscription?.status === 'active'
                      ? 'Current Plan'
                      : plan.price === 0
                      ? 'Current Plan'
                      : 'Subscribe'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Subscribe Dialog */}
        <Dialog
          open={subscribeDialogOpen}
          onClose={() => setSubscribeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Subscribe to {selectedPlan?.name}
          </DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              ${selectedPlan?.price}/{selectedPlan?.interval}
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="card">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon />
                    Credit/Debit Card
                  </Box>
                </MenuItem>
                <MenuItem value="paypal">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PayPalIcon />
                    Bank Transfer
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            {paymentMethod === 'card' && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Card Number"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Expiry Date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    placeholder="MM/YY"
                  />
                  <TextField
                    fullWidth
                    label="CVV"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                  />
                </Box>
              </Box>
            )}

            <Alert severity="info" sx={{ mt: 2 }}>
              This is a demo. No actual payment will be processed.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setSubscribeDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              variant="contained"
              disabled={subscribing}
            >
              {subscribing ? <CircularProgress size={20} /> : 'Subscribe'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Subscription;
