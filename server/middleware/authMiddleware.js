import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';

export const protect = asyncHandler(async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
  } catch (error) {
    res.status(401);
    throw new Error('Not authorized, token failed');
  }

  if (!req.user) {
    res.status(401);
    throw new Error('Not authorized, user not found');
  }

  next();
});

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  res.status(401);
  throw new Error('Not authorized as admin');
};