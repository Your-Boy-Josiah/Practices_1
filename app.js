const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { randomUUID } = require('crypto');

const ProductRoute = require('./Routes/Product_Routes');
const UserRoute = require('./Routes/User_Routes');
const SalesRoute = require('./Routes/Sales_Routes');
const RestockRoute = require('./Routes/Restock_Routes');
const ReportRoute = require('./Routes/Report_Routes');

const { systemLogger } = require('./Middleware/Loggers');
const { errorHandler } = require('./Middleware/Errors');

const parseAllowedOrigins = () => {
  if (!process.env.CORS_ORIGINS) {
    return ['http://localhost:3000', 'http://127.0.0.1:3000'];
  }

  return process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean);
};

const createApp = () => {
  const app = express();

  app.disable('x-powered-by');

  app.use((req, res, next) => {
    req.requestId = randomUUID();
    next();
  });

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    },
  });
  app.use('/api', limiter);

  const corsOptions = {
    origin: parseAllowedOrigins(),
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  };
  app.use(cors(corsOptions));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((req, res, next) => {
    if (req.body) mongoSanitize.sanitize(req.body);
    if (req.params) mongoSanitize.sanitize(req.params);
    if (req.query) mongoSanitize.sanitize(req.query);
    next();
  });

  app.use(systemLogger);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
    });
  });

  app.use('/api/users', UserRoute);
  app.use('/api/products', ProductRoute);
  app.use('/api/sales', SalesRoute);
  app.use('/api/restock', RestockRoute);
  app.use('/api/reports', ReportRoute);

  app.use((req, res, next) => {
    const error = new Error(`Route Not Found: ${req.originalUrl} does not exist.`);
    res.status(404);
    next(error);
  });

  app.use(errorHandler);

  return app;
};

module.exports = createApp;
