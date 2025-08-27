import express from 'express';
import { query, validationResult } from 'express-validator';
import User from '../models/User';
import { authenticate, AuthRequest } from '../middleware/auth';

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

// Helper function to calculate relevance score
const calculateRelevanceScore = (currentUser: any, user: any, distance: number): number => {
  let relevanceScore = 0;

  // Base score
  relevanceScore += 10;

  // Recent activity bonus
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(user.activity.lastActive).getTime()) / (1000 * 60 * 60 * 24)
  );
  relevanceScore += Math.max(0, 30 - daysSinceActive);

  // Age compatibility
  const currentUserAge = currentUser.profile.age;
  const ageDiff = Math.abs(currentUserAge - user.profile.age);
  relevanceScore += Math.max(0, 20 - ageDiff);

  // Interest overlap
  const commonInterests = currentUser.profile.interests.filter((interest: string) =>
    user.profile.interests.includes(interest)
  ).length;
  relevanceScore += commonInterests * 5;

  // Distance factor
  relevanceScore += Math.max(0, 20 - distance / 10);

  // Lifestyle compatibility
  if (currentUser.profile.smoking === user.profile.smoking) relevanceScore += 5;
  if (currentUser.profile.drinking === user.profile.drinking) relevanceScore += 5;
  if (currentUser.profile.relationshipGoals === user.profile.relationshipGoals) relevanceScore += 10;

  return relevanceScore;
};

// @route   GET /api/search/users
// @desc    Search users by various criteria
// @access  Private
router.get('/users', authenticate, [
  query('firstName').optional().trim(),
  query('lastName').optional().trim(),
  query('ageMin').optional().isInt({ min: 18, max: 100 }),
  query('ageMax').optional().isInt({ min: 18, max: 100 }),
  query('gender').optional().isIn(['male', 'female', 'other']),
  query('city').optional().trim(),
  query('state').optional().trim(),
  query('country').optional().trim(),
  query('maxDistance').optional().isInt({ min: 1, max: 10000 }),
  query('interests').optional().trim(),
  query('occupation').optional().trim(),
  query('education').optional().trim(),
      query('relationshipGoals').optional().isIn(['long-term', 'marriage', 'short-term', 'friendship', 'networking', 'serious']),
  query('bodyType').optional().isIn(['slim', 'average', 'athletic', 'curvy', 'heavy']),
  query('smoking').optional().isIn(['never', 'sometimes', 'regularly']),
  query('drinking').optional().isIn(['never', 'sometimes', 'regularly']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }),
  query('sortBy').optional().isIn(['age', 'distance', 'lastActive', 'relevance']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: AuthRequest, res: express.Response) => {
  try {
    console.log('🔍 Search request received:', req.query);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const currentUser = await User.findById(req.userId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const {
      firstName,
      lastName,
      ageMin,
      ageMax,
      gender,
      city,
      state,
      country,
      maxDistance,
      interests,
      occupation,
      education,
      relationshipGoals,
      bodyType,
      smoking,
      drinking,
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      sortOrder = 'desc'
    } = req.query;

    // Build search query
    const searchQuery: any = {
      _id: { $ne: req.userId }, // Exclude current user
      // Exclude blocked users and users who blocked current user
      $and: [
        { _id: { $nin: currentUser.blockedUsers } },
        { blockedUsers: { $ne: req.userId } }
      ]
    };

    // Add gender preference filtering (same as suggestions)
    if (currentUser.profile.interestedIn !== 'both') {
      searchQuery['profile.gender'] = currentUser.profile.interestedIn;
    }
    
    // Check if potential matches are interested in current user's gender
    if (currentUser.profile.gender !== 'other') {
      searchQuery.$or = [
        { 'profile.interestedIn': currentUser.profile.gender },
        { 'profile.interestedIn': 'both' }
      ];
    }

    // Name search (case-insensitive partial match)
    if (firstName) {
      searchQuery['profile.firstName'] = { $regex: firstName, $options: 'i' };
    }
    if (lastName) {
      searchQuery['profile.lastName'] = { $regex: lastName, $options: 'i' };
    }

    // Age range search
    if (ageMin || ageMax) {
      searchQuery['profile.age'] = {};
      if (ageMin) searchQuery['profile.age'].$gte = parseInt(ageMin as string);
      if (ageMax) searchQuery['profile.age'].$lte = parseInt(ageMax as string);
    }

    // Gender search
    if (gender) {
      searchQuery['profile.gender'] = gender;
    }

    // Location search
    if (city) {
      searchQuery['profile.location.city'] = { $regex: city, $options: 'i' };
    }
    if (state) {
      searchQuery['profile.location.state'] = { $regex: state, $options: 'i' };
    }
    if (country) {
      searchQuery['profile.location.country'] = { $regex: country, $options: 'i' };
    }

    // Work & Education search
    if (occupation) {
      searchQuery['profile.occupation'] = { $regex: occupation, $options: 'i' };
    }
    if (education) {
      searchQuery['profile.education'] = { $regex: education, $options: 'i' };
    }

    // Relationship Goals search
    if (relationshipGoals) {
      searchQuery['profile.relationshipGoals'] = relationshipGoals;
    }

    // Lifestyle search
    if (bodyType) {
      searchQuery['profile.bodyType'] = bodyType;
    }
    if (smoking) {
      searchQuery['profile.smoking'] = smoking;
    }
    if (drinking) {
      searchQuery['profile.drinking'] = drinking;
    }

    // Interests search
    if (interests) {
      const interestArray = (interests as string).split(',').map((interest: string) => interest.trim());
      searchQuery['profile.interests'] = { $in: interestArray.map((interest: string) => new RegExp(interest, 'i')) };
    }

    console.log('🔍 Final search query:', JSON.stringify(searchQuery, null, 2));

    // Execute search
    const users = await User.find(searchQuery)
      .populate('profile')
      .limit(parseInt(limit as string))
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .lean();

    // Calculate distance and relevance score for each user
    const usersWithDistance = users.map((user: any) => {
      let distance = 0;
      let relevanceScore = 0;

      // Calculate distance if location data is available
      if (currentUser.profile.location && user.profile.location) {
        distance = calculateDistance(
          currentUser.profile.location.coordinates.lat,
          currentUser.profile.location.coordinates.lng,
          user.profile.location.coordinates.lat,
          user.profile.location.coordinates.lng
        );

        // Filter by max distance if specified
        if (maxDistance && distance > parseInt(maxDistance as string)) {
          return null;
        }
      } else {
        // If no location data, set a default distance
        distance = 999; // Default high distance for users without location
      }

      // Calculate relevance score based on various factors
      relevanceScore = calculateRelevanceScore(currentUser, user, distance);

      return {
        ...user,
        distance: Math.round(distance * 10) / 10,
        relevanceScore: Math.round(relevanceScore * 10) / 10
      };
    }).filter(Boolean); // Remove null entries (filtered by distance)

    // Sort results
    usersWithDistance.sort((a, b) => {
      let sortValue = 0;
      
      switch (sortBy) {
        case 'age':
          sortValue = a.profile.age - b.profile.age;
          break;
        case 'distance':
          sortValue = a.distance - b.distance;
          break;
        case 'lastActive':
          sortValue = new Date(b.activity.lastActive).getTime() - new Date(a.activity.lastActive).getTime();
          break;
        case 'relevance':
        default:
          sortValue = b.relevanceScore - a.relevanceScore;
          break;
      }

      return sortOrder === 'asc' ? sortValue : -sortValue;
    });

    // Get total count for pagination
    const totalUsers = await User.countDocuments(searchQuery);

    res.json({
      success: true,
      users: usersWithDistance,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit as string))
      },
      searchCriteria: req.query
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// @route   GET /api/search/suggestions
// @desc    Get search suggestions based on existing data
// @access  Private
router.get('/suggestions', authenticate, async (req: AuthRequest, res: express.Response) => {
  try {
    const { type } = req.query;

    let suggestions: any = {};

    // If no type specified, return all suggestions
    if (!type) {
      const [cities, states, countries, occupations, educations, allInterests] = await Promise.all([
        User.distinct('profile.location.city'),
        User.distinct('profile.location.state'),
        User.distinct('profile.location.country'),
        User.distinct('profile.occupation'),
        User.distinct('profile.education'),
        User.find().select('profile.interests')
      ]);

      const interestSet = new Set<string>();
      allInterests.forEach(user => {
        user.profile.interests.forEach(interest => {
          if (interest && interest.length > 0) {
            interestSet.add(interest);
          }
        });
      });

      suggestions = {
        cities: cities.filter((city: any) => city && typeof city === 'string' && city.length > 0).sort(),
        states: states.filter((state: any) => state && typeof state === 'string' && state.length > 0).sort(),
        countries: countries.filter((country: any) => country && typeof country === 'string' && country.length > 0).sort(),
        occupations: occupations.filter((occ: any) => occ && typeof occ === 'string' && occ.length > 0).sort(),
        education: educations.filter((edu: any) => edu && typeof edu === 'string' && edu.length > 0).sort(),
        interests: Array.from(interestSet).sort()
      };
    } else {
      // If type is specified, return only that type
      let typeSuggestions: string[] = [];

      switch (type) {
        case 'cities':
          const cities = await User.distinct('profile.location.city');
          typeSuggestions = cities.filter((city: any) => city && typeof city === 'string' && city.length > 0) as string[];
          break;
        
        case 'states':
          const states = await User.distinct('profile.location.state');
          typeSuggestions = states.filter((state: any) => state && typeof state === 'string' && state.length > 0) as string[];
          break;
        
        case 'countries':
          const countries = await User.distinct('profile.location.country');
          typeSuggestions = countries.filter((country: any) => country && typeof country === 'string' && country.length > 0) as string[];
          break;
        
        case 'occupations':
          const occupations = await User.distinct('profile.occupation');
          typeSuggestions = occupations.filter((occ: any) => occ && typeof occ === 'string' && occ.length > 0) as string[];
          break;
        
        case 'education':
          const educations = await User.distinct('profile.education');
          typeSuggestions = educations.filter((edu: any) => edu && typeof edu === 'string' && edu.length > 0) as string[];
          break;
        
        case 'interests':
          const allInterests = await User.find().select('profile.interests');
          const interestSet = new Set<string>();
          allInterests.forEach(user => {
            user.profile.interests.forEach(interest => {
              if (interest && interest.length > 0) {
                interestSet.add(interest);
              }
            });
          });
          typeSuggestions = Array.from(interestSet);
          break;
        
        default:
          return res.status(400).json({ message: 'Invalid suggestion type' });
      }

      suggestions = typeSuggestions.sort();
    }

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Get suggestions error:', error);
    res.status(500).json({ message: 'Server error getting suggestions' });
  }
});

export default router;
