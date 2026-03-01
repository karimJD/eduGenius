const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * authenticate - Verify JWT and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found.' });
    }
    if (!user.isActive) {
      return res
        .status(401)
        .json({ error: 'Account is deactivated. Contact administration.' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token has expired.' });
    }
    next(error);
  }
};

/**
 * authorize - Role-based access control factory
 * @param {string[]} roles - Allowed roles
 */
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }
    next();
  };
};

/**
 * adminAuth - Shorthand for super_admin and admin roles
 */
const adminAuth = authorize(['super_admin', 'admin']);

module.exports = { authenticate, authorize, adminAuth };
