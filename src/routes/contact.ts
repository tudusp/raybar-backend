import express from 'express';
import { body, query, validationResult } from 'express-validator';
import Contact from '../models/Contact';
import { AuthRequest, AdminAuthRequest, adminAuth } from '../middleware/auth';

const router = express.Router();

// Submit contact form (public)
router.post('/', [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('subject').trim().isLength({ min: 5, max: 200 }),
  body('category').isIn(['general', 'technical', 'billing', 'account', 'safety', 'feedback', 'other']),
  body('message').trim().isLength({ min: 10, max: 2000 })
], async (req: express.Request, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, subject, category, message } = req.body;

    const contact = new Contact({
      name,
      email,
      subject,
      category,
      message
    });

    await contact.save();

    res.status(201).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.',
      contactId: contact._id
    });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

// Get all contact messages (admin only)
router.get('/', adminAuth, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('status').optional().isIn(['new', 'in_progress', 'resolved', 'closed']),
  query('category').optional().isIn(['general', 'technical', 'billing', 'account', 'safety', 'feedback', 'other']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent'])
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    let filter: any = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    if (req.query.priority) {
      filter.priority = req.query.priority;
    }

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('assignedTo', 'firstName lastName email');

    const total = await Contact.countDocuments(filter);

    // Get counts for different statuses
    const statusCounts = await Contact.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      new: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    };

    statusCounts.forEach(item => {
      counts[item._id as keyof typeof counts] = item.count;
    });

    res.json({
      contacts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      counts
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single contact message (admin only)
router.get('/:contactId', adminAuth, async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const contact = await Contact.findById(req.params.contactId)
      .populate('assignedTo', 'firstName lastName email');

    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update contact status (admin only)
router.patch('/:contactId/status', adminAuth, [
  body('status').isIn(['new', 'in_progress', 'resolved', 'closed']),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('adminNotes').optional().trim(),
  body('responseMessage').optional().trim()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, priority, adminNotes, responseMessage } = req.body;
    const contact = await Contact.findById(req.params.contactId);

    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    contact.status = status;
    if (priority) contact.priority = priority;
    if (adminNotes) contact.adminNotes = adminNotes;
    if (responseMessage) {
      contact.responseMessage = responseMessage;
      contact.respondedAt = new Date();
    }

    await contact.save();

    res.json({
      success: true,
      message: 'Contact message updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign contact to admin (admin only)
router.patch('/:contactId/assign', adminAuth, [
  body('assignedTo').optional().isMongoId()
], async (req: AdminAuthRequest, res: express.Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { assignedTo } = req.body;
    const contact = await Contact.findById(req.params.contactId);

    if (!contact) {
      return res.status(404).json({ message: 'Contact message not found' });
    }

    contact.assignedTo = assignedTo || undefined;
    await contact.save();

    res.json({
      success: true,
      message: 'Contact message assigned successfully',
      contact
    });
  } catch (error) {
    console.error('Assign contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
