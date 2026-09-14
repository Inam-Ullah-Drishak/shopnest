// Runs when no route matched
export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Codes the client is allowed to see. A whitelist, so an internal code like
// ECONNREFUSED never leaks out in a response.
const CLIENT_CODES = new Set(['ACCOUNT_SUSPENDED', 'ADMIN_ONLY']);
// Multer reports a rejected upload by code, not by message
const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: 'That image is larger than 5MB. Please upload a smaller one.',
  LIMIT_FILE_COUNT: 'Too many images. Upload up to 8 at a time.',
  LIMIT_UNEXPECTED_FILE: 'Unexpected file field in the upload.',
};

// Catches every error passed to next()
export const errorHandler = (err, req, res, next) => {
  // Middleware that fails before any controller runs -- multer, JSON body
  // parsing -- calls next(err) without touching the response, so res.statusCode
  // is still 200 and a user mistake was being reported as a server fault.
  // Those errors carry their own status, so use it when there isn't one yet.
  let statusCode =
    res.statusCode === 200
      ? err.status || err.statusCode || 500
      : res.statusCode;

  let message = err.message;

  // Rejected upload: too big, too many, or the wrong field
  if (err.name === 'MulterError') {
    statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message = MULTER_MESSAGES[err.code] || 'That upload could not be accepted';
  }

  // Malformed MongoDB ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Mongoose validation failure
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Duplicate key (e.g. email already registered)
  if (err.code === 11000) {
    statusCode = 400;
    message = `Duplicate value for ${Object.keys(err.keyValue).join(', ')}`;
  }

  res.status(statusCode).json({
    message,
    ...(CLIENT_CODES.has(err.code) ? { code: err.code } : {}),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};