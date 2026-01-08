/**
 * USER ROUTES
 * 
 * Handles user profile operations
 */

import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

const router = Router();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  age: z.number().int().min(18).max(100).optional(),
  sex: z.enum(['M', 'F']).optional(),
  weight: z.number().optional(),
  goals: z.string().optional()
});

/**
 * GET /api/users/me
 * Gets current user profile
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // TODO: Fetch user from database
    // For now, return mock user data based on userId
    // In production, this should query the database

    res.status(200).json({
      id: req.userId,
      email: 'user@example.com', // TODO: Get from database
      name: 'Usuario', // TODO: Get from database
      age: 35, // TODO: Get from database
      sex: 'M' as 'M' | 'F' // TODO: Get from database
    });
  } catch (error: any) {
    console.error('[User] Error getting user profile:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve user' });
  }
});

/**
 * PATCH /api/users/me
 * Updates current user profile
 */
router.patch('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const data = updateUserSchema.parse(req.body);

    // TODO: Update user in database

    res.status(200).json({
      id: req.userId,
      ...data,
      message: 'User update endpoint - to be implemented with database'
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to update user' });
  }
});

export default router;

