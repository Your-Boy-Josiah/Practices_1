// ===============================================================
//  User_Routes.js
//  Handles all routing for User-related API endpoints.
//  Mounted in the main server file (e.g., app.js or server.js) 
//  typically under the /api/users base path.
// ===============================================================

const express = require('express');
const router = express.Router(); 

// Import the User Controller which contains the actual business logic
const UserController = require('../Controllers/User_Controller');

// ===============================================================
// ARCHITECTURE NOTE:
// Both of these endpoints are strictly POST requests because they 
// transmit highly sensitive data (passwords, personal emails). 
// Using POST ensures this data is securely enclosed in the request body 
// and remains hidden from server URL logs and browser history.
// ===============================================================

// ============================================================
// REGISTER A NEW USER
// Route  : POST /api/users/CreateUser
// Access : Public
// ============================================================

router.post('/CreateUser', UserController.CreateUser);

// ============================================================
// LOGIN USER
// Route  : POST /api/users/LoginUser
// Access : Public
// ============================================================

router.post('/LoginUser', UserController.LoginUser);

// ============================================================
// EXPORT ROUTER
// Export the configured router so it can be registered 
// into the main Express application pipeline.
// ============================================================

module.exports = router;
