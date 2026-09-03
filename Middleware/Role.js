// ===============================================================
//  role.js (Middleware)
//  Handles Role-Based Access Control (RBAC).
//  Must ALWAYS be used sequentially AFTER auth.js in your routes 
//  so that req.user is already populated.
// ===============================================================

// ==============================================================
// AUTHORIZE ROLES FUNCTION
// Accepts a comma-separated list of roles allowed to pass.
// Example: authorizeRoles('Admin', 'Super_Admin')
// ==============================================================

exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    
    // 1. Safety check: Ensure req.user exists (meaning auth.js ran successfully)
    if (!req.user) {
      return res.status(500).json({ 
        message: 'Server Error: Role middleware called without prior authentication.' 
      });
    }

    // 2. Check if the user's role is included in the allowedRoles array
    if (!allowedRoles.includes(req.user.role)) {
      // Return 403 Forbidden because they are logged in, but don't have the right privileges
      return res.status(403).json({ 
        message: `Access forbidden: Your role (${req.user.role}) does not have permission to perform this action.` 
      });
    }

    // 3. The user has the correct role! Let them through to the controller.
    next();
  };
};

