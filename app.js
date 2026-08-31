// ============================================================
//  app.js (This is My Main Server File)
// ============================================================

const express = require('express');
const cors = require('cors'); // Brought in CORS so your frontend can connect
require('dotenv').config();   // Load Environment Variables

// Import Database Configuration
const connectDB = require('../Practices/Config/Database_Config');

// Import Routers
const ProductRoute = require('../Practices/Routes/Product_Routes');
const UserRoute = require('../Practices/Routes/User_Routes');

// Initialize Express App
const app = express();

// ============================================================
//  GLOBAL MIDDLEWARE
// ============================================================
// Allows frontend applications (React, Vue, etc.) to make requests to this API

app.use(cors()); 

// Middleware to parse incoming JSON request bodies (Crucial for req.body)
app.use(express.json());

// ============================================================
//  CONNECT TO MONGODB
// ============================================================
connectDB();

// ============================================================
//  MOUNT ROUTERS
// ============================================================
app.use('/Products', ProductRoute);
app.use('/Users', UserRoute);

// ============================================================
//  START THE SERVER
// ============================================================
// Set a fallback port (5000) just in case the .env file is missing

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    // FIXED: Changed single quotes to backticks (`) so the variable actually evaluates!
    console.log(`🚀 Server is running on port ${PORT}`);
});
