const express = require('express');
const router = express.Router(); //

// Import the Product Controller
const UserController = require('../Controllers/User_Controller');


//Define the routes
router.post('/CreateUser', UserController.CreateUser);

router.put('/LoginUser/:id', UserController.LoginUser);

// Export the router to be used in other files
module.exports = router;
