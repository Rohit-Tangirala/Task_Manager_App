import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { verifyToken, AuthenticatedRequest } from '../middleware/verifyToken.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const [existingUsers]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const [result]: any = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash]
    );

    const userId = result.insertId;

    // Create JWT token
    const token = jwt.sign(
      { id: userId },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        email,
        bio: null,
        role_title: null,
        profile_pic: null,
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter all fields' });
    }

    // Get user
    const [users]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '24h' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        role_title: user.role_title,
        profile_pic: user.profile_pic,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { name, bio, role_title, profile_pic } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    await pool.query(
      'UPDATE users SET name = ?, bio = ?, role_title = ?, profile_pic = ? WHERE id = ?',
      [name, bio !== undefined ? bio : null, role_title !== undefined ? role_title : null, profile_pic !== undefined ? profile_pic : null, userId]
    );

    const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    const updatedUser = users[0];

    return res.status(200).json({
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      role_title: updatedUser.role_title,
      profile_pic: updatedUser.profile_pic,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Server error. Failed to update profile.' });
  }
});

export default router;
