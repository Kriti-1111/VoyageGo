import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const SECRET_KEY = process.env.JWT_SECRET || 'voyagego_secret';

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
// Converted from Prisma (reference project) → Mongoose (your project)
// Logic is identical — just swapped prisma.user.findUnique → User.findById

export const auth = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, SECRET_KEY);

    // 3. Find user in MongoDB (your project uses MongoDB, not Prisma)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }

    // 4. Attach user to request — available as req.user in all controllers
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

// ─── ADMIN GUARD ──────────────────────────────────────────────────────────────
// Use AFTER auth middleware: router.get('/something', auth, admin, handler)
export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
};

// ─── DRIVER GUARD ─────────────────────────────────────────────────────────────
export const driver = (req, res, next) => {
  if (req.user && req.user.role === 'DRIVER') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Driver access required' });
  }
};

// ─── CUSTOMER GUARD ───────────────────────────────────────────────────────────
export const customer = (req, res, next) => {
  if (req.user && req.user.role === 'CUSTOMER') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Customer access required' });
  }
};
