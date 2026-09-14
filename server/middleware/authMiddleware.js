import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  let decoded;

  // Only the verify call belongs inside the catch. With the database lookup
  // in here too, a connection blip was reported to the user as a bad token
  // and signed them out instead of surfacing a server problem.
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }

  req.user = await User.findById(decoded.userId).select('-password');

  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  // Blocking someone mid-session should take effect immediately, not
  // whenever their 30-day cookie happens to expire
  if (req.user.isBlocked) {
    res.status(403);

    // Tagged so the client can tell this apart from an ordinary permission
    // refusal and end the session
    const error = new Error('This account has been suspended');
    error.code = 'ACCOUNT_SUSPENDED';

    throw error;
  }

  next();
});

// Reads the cookie if one is there and continues either way. For routes that
// are public but behave differently for an admin -- previewing an unpublished
// collection, say. protect() can't do this job because it rejects anonymous
// visitors outright.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies?.jwt;

  if (!token) return next();

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    // An unreadable cookie just means anonymous on a public route
    return next();
  }

  const user = await User.findById(decoded.userId).select('-password');

  if (user && !user.isBlocked) req.user = user;

  next();
});
export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  // 403, not 401: the request is authenticated, it simply isn't allowed.
  // 401 means the credentials are missing or wrong, which would tell the
  // client to end a perfectly good session.
  res.status(403);

  const error = new Error('Not authorized as admin');
  error.code = 'ADMIN_ONLY';

  throw error;
};