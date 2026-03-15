import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ── Base auth middleware ───────────────────────────────────────────────────────
// Verifies the JWT and attaches req.user
export const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'Alish');

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// ── Role-specific middleware ───────────────────────────────────────────────────

export const admin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'ADMIN') return res.status(403).json({ message: 'Admin access required' });
  next();
};

export const owner = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'OWNER') return res.status(403).json({ message: 'Owner access required' });
  next();
};

export const staff = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'STAFF') return res.status(403).json({ message: 'Staff access required' });
  next();
};

export const driver = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'DRIVER') return res.status(403).json({ message: 'Driver access required' });
  next();
};

export const customer = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (req.user.role !== 'CUSTOMER') return res.status(403).json({ message: 'Customer access required' });
  next();
};

// ── Management middleware ──────────────────────────────────────────────────────
// Allows OWNER + ADMIN + STAFF (any management role)
export const management = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  const managementRoles = ['OWNER', 'ADMIN', 'STAFF'];
  if (!managementRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Management access required' });
  }
  next();
};

// ── Elevated management middleware ────────────────────────────────────────────
// Allows only OWNER + ADMIN (not STAFF)
export const adminOrOwner = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
  if (!['OWNER', 'ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Admin or Owner access required' });
  }
  next();
};

export default auth;
