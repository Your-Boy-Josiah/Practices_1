const AuditLog = require('../Models/AuditLog');

const sanitizePayload = (body) => {
  const safeBody = { ...body };

  if (safeBody.password) safeBody.password = '[REDACTED FOR SECURITY]';
  if (safeBody.refreshToken) safeBody.refreshToken = '[REDACTED FOR SECURITY]';
  if (safeBody.token) safeBody.token = '[REDACTED FOR SECURITY]';

  return safeBody;
};

exports.systemLogger = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', async () => {
    const durationMs = Date.now() - startTime;

    console.log(
      JSON.stringify({
        level: 'info',
        requestId: req.requestId,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
        ipAddress: req.ip || req.connection.remoteAddress,
      })
    );

    if (process.env.NODE_ENV === 'test' || req.method === 'GET') return;

    try {
      await AuditLog.create({
        userId: req.user ? req.user.id : null,
        userRole: req.user ? req.user.role : 'Guest/Unauthenticated',
        action: req.method,
        endpoint: req.originalUrl,
        payload: JSON.stringify(sanitizePayload(req.body || {})),
        ipAddress: req.ip || req.connection.remoteAddress,
        statusCode: res.statusCode,
      });
    } catch (error) {
      console.error('CRITICAL: Audit Logger Failed to write to DB:', error.message);
    }
  });

  next();
};
