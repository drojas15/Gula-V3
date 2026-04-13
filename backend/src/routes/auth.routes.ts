/**
 * AUTH ROUTES
 *
 * Handles user authentication (signup, login)
 */

import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { query as dbQuery, queryOne, execute } from '../db/postgres';
import { randomUUID } from 'crypto';

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

    // Check if user already exists
    const existingUser = await queryOne<{ id: string }>(
      'SELECT id FROM users WHERE email = $1',
      [data.email]
    );
    if (existingUser) {
      res.status(400).json({ error: 'El email ya está registrado' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user in database
    const userId = randomUUID();
    const now = new Date().toISOString();

    await execute(
      `INSERT INTO users (id, email, name, password_hash, age, sex, weight, goals, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [userId, data.email, data.name, hashedPassword, data.age, data.sex, data.weight || null, data.goals || null, now, now]
    );

    // Generate JWT token
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

    // Find user in database
    const user = await queryOne<{
      id: string;
      email: string;
      name: string;
      password_hash: string;
      age: number;
      sex: string;
    }>(
      'SELECT id, email, name, password_hash, age, sex FROM users WHERE email = $1',
      [data.email]
    );

    if (!user) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    // Verify password
    const validPassword = await bcrypt.compare(data.password, user.password_hash);
    if (!validPassword) {
      res.status(401).json({ error: 'Email o contraseña incorrectos' });
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    console.log('[Auth] User logged in successfully:', user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        sex: user.sex
      }
    });
  } catch (error: any) {
    console.error('[Auth] Login error:', error);

    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      return;
    }
    res.status(401).json({ error: 'Email o contraseña incorrectos' });
  }
});

export default router;
