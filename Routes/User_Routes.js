const express = require('express');
const router = express.Router(); 

// Import the User Controller
const UserController = require('../Controllers/User_Controller');

// Define the routes
// Both of these need to be POST requests because they send sensitive data in the request body!
router.post('/CreateUser', UserController.CreateUser);

router.post('/LoginUser', UserController.LoginUser);

// Export the router to be used in other files
module.exports = router;
