// ===============================================================
//  Error Handler (Middleware)
//  Global Error Handler. Catches all unhandled exceptions and 
//  prevents the server from crashing.
// ===============================================================

exports.errorHandler = (err, req, res, next) => {
  console.error('🔥 [GLOBAL ERROR CAUGHT]:', err.message);

  // Default to 500 Internal Server Error if no status code is set
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
    // Security: Only show the detailed stack trace if we are in "development" mode.
    // Hackers can use stack traces to understand your folder structure and find vulnerabilities.
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
