import express from 'express';
import mongoose from 'mongoose';
import User from '../models/User';
import Match from '../models/Match';
import { authenticate, AuthRequest } from '../middleware/auth';
import { NotificationService } from '../services/notificationService';

const router = express.Router();

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// @route   GET /api/matches/discover
// @desc    Get potential matches for user
// @access  Private
router.get('/discover', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      preferences,
      profile: { location, age },
      likes,
      dislikes,
      matches,
      blockedUsers
    } = currentUser;

    // Get users to exclude (already liked, disliked, matched, or blocked)
    const excludedUsers = [
      ...likes,
      ...dislikes,
      ...matches,
      ...blockedUsers,
      new mongoose.Types.ObjectId(req.userId!) // Exclude self
    ];

    // Build match query
    const matchQuery: any = {
      _id: { $nin: excludedUsers },
      'profile.age': {
        $gte: preferences.ageRange.min,
        $lte: preferences.ageRange.max
      },
      'activity.lastActive': {
        $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Active in last 30 days
      }
    };

    // Gender preferences
    if (preferences.interestedIn !== 'both') {
      matchQuery['profile.gender'] = preferences.interestedIn;
    }

    // Check if potential matches are interested in current user's gender
    if (currentUser.profile.gender !== 'other') {
      matchQuery.$or = [
        { 'preferences.interestedIn': currentUser.profile.gender },
        { 'preferences.interestedIn': 'both' }
      ];
    }

    // Find potential matches
    let potentialMatches = await User.find(matchQuery)
      .select('-password -email')
      .limit(50)
      .sort({ 'activity.lastActive': -1 });

    // Filter by distance and calculate compatibility score
    const currentCoords = location.coordinates;
    const matchesWithScore = potentialMatches
      .map(match => {
        const matchCoords = match.profile.location.coordinates;
        const distance = calculateDistance(
          currentCoords.lat,
          currentCoords.lng,
          matchCoords.lat,
          matchCoords.lng
        );

        // Skip if outside distance preference
        if (distance > preferences.maxDistance) {
          return null;
        }

        // Calculate compatibility score
        let score = 0;

        // Age compatibility (closer age = higher score)
        const ageDiff = Math.abs(age - match.profile.age);
        score += Math.max(0, 100 - ageDiff * 2);

        // Interest compatibility
        const commonInterests = currentUser.profile.interests.filter(interest =>
          match.profile.interests.includes(interest)
        ).length;
        score += commonInterests * 10;

        // Lifestyle compatibility
        if (currentUser.profile.smoking === match.profile.smoking) score += 20;
        if (currentUser.profile.drinking === match.profile.drinking) score += 20;
        if (currentUser.profile.relationshipGoals === match.profile.relationshipGoals) score += 30;

        // Distance factor (closer = higher score)
        score += Math.max(0, 50 - distance);

        // Activity factor (more recent activity = higher score)
        const daysSinceActive = Math.floor(
          (Date.now() - match.activity.lastActive.getTime()) / (1000 * 60 * 60 * 24)
        );
        score += Math.max(0, 30 - daysSinceActive);

        return {
          ...match.toObject(),
          distance: Math.round(distance),
          compatibilityScore: Math.round(score)
        };
      })
      .filter(match => match !== null)
      .sort((a, b) => b!.compatibilityScore - a!.compatibilityScore)
      .slice(0, 10); // Return top 10 matches

    res.json({
      success: true,
      matches: matchesWithScore,
      total: matchesWithScore.length
    });
  } catch (error) {
    console.error('Discover matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/like/:userId
// @desc    Like a user
// @access  Private
router.post('/like/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot like yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId)
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already liked
    if (currentUser.likes.includes(new mongoose.Types.ObjectId(targetUserId))) {
      return res.status(400).json({ message: 'User already liked' });
    }

    // Add to likes
    currentUser.likes.push(new mongoose.Types.ObjectId(targetUserId));
    await currentUser.save();

    // Check if it's a mutual match
    const isMutualMatch = targetUser.likes.includes(new mongoose.Types.ObjectId(currentUserId));

    console.log('💕 Like action:', {
      currentUserId,
      targetUserId,
      isMutualMatch,
      currentUserLikes: currentUser.likes.map(id => id.toString()),
      targetUserLikes: targetUser.likes.map(id => id.toString())
    });

    if (isMutualMatch) {
      console.log('🎉 Creating match between:', currentUserId, 'and', targetUserId);
      
      // Check if match already exists in either direction
      const existingMatch = await Match.findOne({
        $or: [
          { user1: currentUserId, user2: targetUserId },
          { user1: targetUserId, user2: currentUserId }
        ]
      });

      if (existingMatch) {
        console.log('✅ Match already exists:', existingMatch._id);
        return res.json({
          success: true,
          message: 'It\'s a match!',
          isMatch: true,
          matchId: existingMatch._id?.toString() || ''
        });
      }
      
      // Create new match
      const match = new Match({
        user1: currentUserId,
        user2: targetUserId
      });
      await match.save();
      
      console.log('✅ Match created with ID:', match._id);

      // Add to both users' matches
      await Promise.all([
        User.findByIdAndUpdate(currentUserId, {
          $push: { matches: new mongoose.Types.ObjectId(targetUserId) }
        }),
        User.findByIdAndUpdate(targetUserId, {
          $push: { matches: new mongoose.Types.ObjectId(currentUserId) }
        })
      ]);

      // Create match notifications for both users
      await NotificationService.createMatchNotification(
        match._id?.toString() || '',
        currentUserId,
        targetUserId
      );

      return res.json({
        success: true,
        message: 'It\'s a match!',
        isMatch: true,
        matchId: match._id?.toString() || ''
      });
    }

    // Create like notification
    await NotificationService.createLikeNotification(currentUserId, targetUserId, false);

    res.json({
      success: true,
      message: 'User liked successfully',
      isMatch: false
    });
  } catch (error) {
    console.error('Like user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/dislike/:userId
// @desc    Dislike a user
// @access  Private
router.post('/dislike/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot dislike yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already disliked
    if (currentUser.dislikes.includes(new mongoose.Types.ObjectId(targetUserId))) {
      return res.status(400).json({ message: 'User already disliked' });
    }

    // Add to dislikes
    currentUser.dislikes.push(new mongoose.Types.ObjectId(targetUserId));
    await currentUser.save();

    res.json({
      success: true,
      message: 'User disliked successfully'
    });
  } catch (error) {
    console.error('Dislike user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/matches/super-like/:userId
// @desc    Super like a user
// @access  Private
router.post('/super-like/:userId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId!;

    if (targetUserId === currentUserId) {
      return res.status(400).json({ message: 'Cannot super like yourself' });
    }

    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check super like limits (non-premium users get 1 per day)
    const isPremium = currentUser.subscription?.plan === 'premium' || currentUser.subscription?.plan === 'vip';
    if (!isPremium) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const superLikesToday = currentUser.superLikes.filter(like => {
        // This is a simplified check - in production, you'd store timestamps
        return true; // For now, allow unlimited for demo
      });

      if (superLikesToday.length >= 1) {
        return res.status(400).json({ message: 'Daily super like limit reached' });
      }
    }

    // Add to super likes
    currentUser.superLikes.push(new mongoose.Types.ObjectId(targetUserId));
    currentUser.likes.push(new mongoose.Types.ObjectId(targetUserId));
    await currentUser.save();

    // Create super like notification
    await NotificationService.createLikeNotification(currentUserId, targetUserId, true);

    res.json({
      success: true,
      message: 'User super liked successfully'
    });
  } catch (error) {
    console.error('Super like user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/matches
// @desc    Get user matches
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'matches',
      select: '-password -email'
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get match details with last message info
    const matchDetails = await Promise.all(
      user.matches.map(async (matchUserId) => {
        const match = await Match.findOne({
          $or: [
            { user1: req.userId, user2: matchUserId },
            { user1: matchUserId, user2: req.userId }
          ],
          isActive: true
        }).populate('user1 user2', '-password -email');

        return match;
      })
    );

    const validMatches = matchDetails.filter(match => match !== null);

    console.log('🔍 Debug: Valid matches:', validMatches.map(m => ({
      matchId: m?._id,
      user1: m?.user1?._id,
      user2: m?.user2?._id
    })));

    res.json({
      success: true,
      matches: validMatches,
      total: validMatches.length
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/matches/:matchId
// @desc    Unmatch with a user
// @access  Private
router.delete('/:matchId', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Check if user is part of this match
    if (match.user1.toString() !== req.userId && match.user2.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Deactivate match
    match.isActive = false;
    await match.save();

    // Remove from both users' matches arrays
    const otherUserId = match.user1.toString() === req.userId ? match.user2 : match.user1;
    
    await Promise.all([
      User.findByIdAndUpdate(req.userId, {
        $pull: { matches: otherUserId }
      }),
      User.findByIdAndUpdate(otherUserId, {
        $pull: { matches: new mongoose.Types.ObjectId(req.userId!) }
      })
    ]);

    res.json({
      success: true,
      message: 'Successfully unmatched'
    });
  } catch (error) {
    console.error('Unmatch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
