import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';

// POST /api/users  — register
export const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400);
    throw new Error('Please fill all fields');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Use a password of at least 6 characters');
  }

  const userExists = await User.findOne({ email: email.toLowerCase().trim() });

  if (userExists) {
    res.status(400);
    throw new Error('An account with that email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  generateToken(res, user._id);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});

// POST /api/users/login
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email?.toLowerCase().trim() });

  if (user && (await user.matchPassword(password))) {
    // Checked after the password, so a suspended email can't be discovered
    // by someone who doesn't know the password
    if (user.isBlocked) {
      res.status(403);
      throw new Error(
        'This account has been suspended. Get in touch if you think this is a mistake.'
      );
    }

    generateToken(res, user._id);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    });
  }

  res.status(401);
  throw new Error('Invalid email or password');
});

// POST /api/users/logout
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.json({ message: 'Logged out' });
};

// GET /api/users/profile  — protected
export const getUserProfile = (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    createdAt: req.user.createdAt,
  });
};