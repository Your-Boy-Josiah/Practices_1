// ===============================================================
//  app.js (Main Server Entry Point)
//  Initializes Express, connects to MongoDB, mounts all global 
//  middlewares, and registers the API route handlers.
// ===============================================================

const express = require('express');
const cors = require('cors'); 
const helmet = require('helmet'); // Security Headers
const rateLimit = require('express-rate-limit'); // Brute-force protection
const mongoSanitize = require('express-mongo-sanitize'); // NoSQL Injection protection
const path = require('path');
require('dotenv').config(); 

const connectDB = require('./Config/Database_Config');

// Import Routers
const ProductRoute = require('./Routes/Product_Routes');
const UserRoute    = require('./Routes/User_Routes');
const SalesRoute   = require('./Routes/Sales_Routes');
const RestockRoute = require('./Routes/Restock_Routes');
const ReportRoute  = require('./Routes/Report_Routes'); // Dashboard

// Import Custom Middlewares
const { systemLogger } = require('./Middleware/Loggers');
const { errorHandler } = require('./Middleware/Errors'); // Global Error Handler

const app = express();

// ==============================================================
// GLOBAL SECURITY & MIDDLEWARE
// ==============================================================

// 1. Helmet: Secures HTTP headers and allows cross-origin resource loading for static assets
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// 2. Rate Limiting: Max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter); // Apply to all /api routes

// 3. CORS: Allows frontend connections
app.use(cors()); 

// 4. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Data Sanitization: Mutates inputs in place to prevent NoSQL injection
// Avoids overwriting req.query directly, which throws an error on read-only getters
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// 6. System Logger (CCTV)
app.use(systemLogger);

// 7. Serve uploaded files statically so they can be viewed via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==============================================================
// CONNECT TO MONGODB
// ==============================================================
connectDB();

// ==============================================================
// MOUNT API ROUTERS
// ==============================================================
app.use('/api/users', UserRoute);
app.use('/api/products', ProductRoute);
app.use('/api/sales', SalesRoute);
app.use('/api/restock', RestockRoute);
app.use('/api/reports', ReportRoute); 

// ==============================================================
// 404 FALLBACK ROUTE
// ==============================================================
app.use((req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl} does not exist.`);
  res.status(404);
  next(error); // Passes the error down to the Global Error Handler
});

// ==============================================================
// GLOBAL ERROR HANDLER (MUST BE LAST!)
// ==============================================================
app.use(errorHandler);

// ==============================================================
// START THE SERVER
// ==============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Supermarket API is running securely on port ${PORT}`);
});
