import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User';
import Subscription from '../models/Subscription';
import { AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get user's subscription details
router.get('/me', async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId).select('subscription');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if subscription is expired
    if (user.subscription.endDate && new Date() > user.subscription.endDate) {
      user.subscription.status = 'expired';
      user.subscription.plan = 'free';
      await user.save();
    }

    res.json({ subscription: user.subscription });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get available subscription plans
router.get('/plans', async (req: express.Request, res: express.Response) => {
  try {
    const plans = [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        currency: 'USD',
        interval: 'month',
        features: [
          '5 likes per day',
          '1 super like per day',
          'Basic filters',
          'Standard profile visibility'
        ],
        limitations: [
          'Limited likes per day',
          'No rewind feature',
          'No priority profile',
          'No advanced filters'
        ]
      },
      {
        id: 'premium',
        name: 'Premium',
        price: 9.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'Unlimited likes',
          'Unlimited super likes',
          'Rewind last swipe',
          'See who liked you',
          'Priority profile',
          'Advanced filters',
          'No ads'
        ],
        popular: true
      },
      {
        id: 'vip',
        name: 'VIP',
        price: 19.99,
        currency: 'USD',
        interval: 'month',
        features: [
          'All Premium features',
          'Read receipts',
          'Incognito mode',
          'Profile boost',
          'Passport (change location)',
          'Priority customer support'
        ]
      }
    ];

    res.json({ plans });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Subscribe to a plan (mock payment processing)
router.post('/subscribe', [
  body('planId').isIn(['premium', 'vip']),
  body('paymentMethod').isObject(),
  body('autoRenew').optional().isBoolean()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { planId, paymentMethod, autoRenew = true } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Mock payment processing
    // In a real app, you would integrate with Stripe, PayPal, etc.
    const paymentSuccess = true; // Mock successful payment

    if (!paymentSuccess) {
      return res.status(400).json({ message: 'Payment failed.' });
    }

    // Update user subscription
    user.subscription.plan = planId;
    user.subscription.status = 'active';
    user.subscription.startDate = new Date();
    user.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    user.subscription.autoRenew = autoRenew;
    user.subscription.paymentMethod = paymentMethod;

    await user.save();

    // Create subscription record
    const subscription = new Subscription({
      userId: user._id,
      plan: planId,
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      autoRenew,
      paymentMethod,
      paymentHistory: [{
        amount: planId === 'premium' ? 9.99 : 19.99,
        currency: 'USD',
        date: new Date(),
        status: 'success',
        transactionId: `txn_${Date.now()}`
      }]
    });

    await subscription.save();

    res.json({
      message: 'Subscription activated successfully!',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Cancel subscription
router.post('/cancel', async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.subscription.autoRenew = false;
    user.subscription.status = 'cancelled';
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { userId: user._id, status: 'active' },
      { 
        autoRenew: false,
        status: 'cancelled'
      }
    );

    res.json({
      message: 'Subscription cancelled successfully. You can continue using premium features until the end of your billing period.',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reactivate subscription
router.post('/reactivate', async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.subscription.plan === 'free') {
      return res.status(400).json({ message: 'No active subscription to reactivate.' });
    }

    user.subscription.autoRenew = true;
    user.subscription.status = 'active';
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { 
        autoRenew: true,
        status: 'active'
      }
    );

    res.json({
      message: 'Subscription reactivated successfully!',
      subscription: user.subscription
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get subscription features
router.get('/features', async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const features = {
      unlimitedLikes: user.subscription.plan !== 'free',
      unlimitedSuperLikes: user.subscription.plan !== 'free',
      rewindLastSwipe: user.subscription.plan !== 'free',
      seeWhoLikedYou: user.subscription.plan !== 'free',
      priorityProfile: user.subscription.plan !== 'free',
      advancedFilters: user.subscription.plan !== 'free',
      readReceipts: user.subscription.plan === 'vip',
      incognitoMode: user.subscription.plan === 'vip',
      boostProfile: user.subscription.plan === 'vip',
      passport: user.subscription.plan === 'vip'
    };

    res.json({ features, plan: user.subscription.plan });
  } catch (error) {
    console.error('Get features error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Update payment method
router.patch('/payment-method', [
  body('paymentMethod').isObject()
], async (req: AuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { paymentMethod } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    user.subscription.paymentMethod = paymentMethod;
    await user.save();

    // Update subscription record
    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { paymentMethod }
    );

    res.json({
      message: 'Payment method updated successfully.',
      paymentMethod: user.subscription.paymentMethod
    });
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

export default router;
