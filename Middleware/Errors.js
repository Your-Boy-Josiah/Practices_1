exports.errorHandler = (err, req, res, _next) => {
  console.error('🔥 [GLOBAL ERROR CAUGHT]:', err.message);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  const response = {
    success: false,
    message: err.message || 'An unexpected error occurred on the server.',
    requestId: req.requestId,
  };

  if (process.env.NODE_ENV !== 'production') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};
