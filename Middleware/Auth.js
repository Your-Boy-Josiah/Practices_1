// ===============================================================
//  auth.js (Middleware)
//  Verifies the JSON Web Token (JWT) sent by the client.
//  Ensures the user is securely logged in before they can 
//  access any protected API routes.
// ===============================================================

const jwt = require('jsonwebtoken');

// ==============================================================
// VERIFY TOKEN FUNCTION
// ==============================================================

exports.verifyToken = (req, res, next) => {
  try {
    // 1. Look for the token in the HTTP Authorization header
    // Standard format is: "Bearer eyJhbGciOiJIUzI1NiIsInR5c..."
    const authHeader = req.headers.authorization;
    
    // 2. Check if the header exists and is formatted correctly
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // 3. Extract just the token string (remove the word "Bearer ")
    const token = authHeader.split(' ')[1];

    // 4. Verify the token using the secret key in your .env file
    // If the token was tampered with or is fake, this will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Attach the decoded payload to the request object
    // Now, EVERY controller that runs after this has access to req.user.id and req.user.role!
    req.user = decoded;

    // 6. Token is valid! Move on to the next function (the controller or the role checker)
    next();

  } catch (error) {
    // Handle specific JWT errors gracefully
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    
    // Handle fake, altered, or malformed tokens
    return res.status(403).json({ message: 'Invalid or malformed token.' });
  }
};
