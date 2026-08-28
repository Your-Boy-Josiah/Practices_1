const express = require('express');
const router = express.Router(); //

// Import the Product Controller
const ProductController = require('../Controllers/Product_Controlller');


//Define the routes
router.post('/CreateProduct', ProductController.CreateProduct);

router.put('/UpdateProduct/:id', ProductController.UpdateProduct);

//export the router to be used in other files
module.exports = router;
