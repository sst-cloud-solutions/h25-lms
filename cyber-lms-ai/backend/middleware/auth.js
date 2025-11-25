// backend/middleware/auth.js

const jwt = require('jsonwebtoken');

/**
 * Auth + RBAC middleware
 *
 * Usage:
 *  - auth()                    -> any logged-in user
 *  - auth(['learner'])         -> only learners
 *  - auth(['admin'])           -> only admins
 *  - auth(['learner','admin']) -> both
 */
const auth = (allowedRoles = []) => {
  return (req, res, next) => {
    const header = req.headers.authorization;

    // No token
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = header.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to request
      req.user = {
        id: decoded.userId,
        role: decoded.role
      };

      // If allowedRoles is non-empty, enforce RBAC
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: role not allowed' });
      }

      next();
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  };
};

module.exports = { auth };
