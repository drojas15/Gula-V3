/**
 * AUTH ROUTES
 * 
 * Handles user authentication (signup, login)
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  age: z.number().int().min(18).max(100),
  sex: z.enum(['M', 'F']),
  weight: z.number().optional(),
  goals: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

/**
 * POST /api/auth/signup
 * Creates a new user account
 */
router.post('/signup', async (req: Request, res: Response) => {
  try {
    console.log('[Auth] Signup request received:', { email: req.body.email, name: req.body.name });
    
    const data = signupSchema.parse(req.body);

    // TODO: Check if user exists in database
    // TODO: Hash password with bcrypt
    // TODO: Create user in database
    // TODO: Generate JWT token

    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Mock user creation (replace with actual database call)
    const userId = `user_${Date.now()}`;
    
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[Auth] User created successfully:', userId);

    res.status(201).json({
      token,
      user: {
        id: userId,
        email: data.email,
        name: data.name,
        age: data.age,
        sex: data.sex
      }
    });
  } catch (error: any) {
    console.error('[Auth] Signup error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({ 
        error: 'Datos inválidos', 
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
      return;
    }
    res.status(500).json({ error: error.message || 'Error al crear cuenta' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates user and returns JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);

    // TODO: Find user in database
    // TODO: Verify password
    // TODO: Generate JWT token

    // Mock authentication (replace with actual database call)
    const userId = `user_123`;
    
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      token,
      user: {
        id: userId,
        email: data.email
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input', details: error.errors });
      return;
    }
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

export default router;

