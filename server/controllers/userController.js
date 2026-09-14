import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';
import generateToken, { cookieOptions } from '../utils/generateToken.js';

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
  // Must carry the same httpOnly, secure, sameSite and path the cookie was
  // set with, or the browser sees a different cookie and keeps the real one
  res.cookie('jwt', '', {
    ...cookieOptions,
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

// PUT /api/users/profile  — protected
export const updateUserProfile = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Account not found');
  }

  if (name?.trim()) {
    user.name = name.trim();
  }

  const cleanEmail = email?.toLowerCase().trim();

  if (cleanEmail && cleanEmail !== user.email) {
    const taken = await User.findOne({
      _id: { $ne: user._id },
      email: cleanEmail,
    });

    if (taken) {
      res.status(400);
      throw new Error('That email is already in use');
    }

    user.email = cleanEmail;
  }

  // Changing a password requires proving you know the current one, so a
  // stolen session alone can't lock the real owner out
  if (newPassword) {
    if (!currentPassword) {
      res.status(400);
      throw new Error('Enter your current password to set a new one');
    }

    if (!(await user.matchPassword(currentPassword))) {
      res.status(401);
      throw new Error('Your current password is not correct');
    }

    if (newPassword.length < 6) {
      res.status(400);
      throw new Error('Use a password of at least 6 characters');
    }

    if (await user.matchPassword(newPassword)) {
      res.status(400);
      throw new Error('That is the same as your current password');
    }

    // Assign the plain value: the pre('save') hook hashes it.
    // Hashing here would double-hash and lock the user out.
    user.password = newPassword;
  }

  const updated = await user.save();

  res.json({
    _id: updated._id,
    name: updated.name,
    email: updated.email,
    isAdmin: updated.isAdmin,
    createdAt: updated.createdAt,
  });
});

// --- Saved addresses -------------------------------------------------------

const REQUIRED_ADDRESS_FIELDS = ['address', 'city', 'postalCode', 'phone'];

// Trims, defaults the country, and rejects a half-filled form before it
// reaches Mongoose, so the message names the missing field.
const cleanAddress = (body) => {
  const missing = REQUIRED_ADDRESS_FIELDS.filter(
    (field) => !String(body?.[field] ?? '').trim()
  );

  if (missing.length) {
    return { ok: false, missing };
  }

  return {
    ok: true,
    value: {
      label: String(body.label || '').trim(),
      address: String(body.address).trim(),
      city: String(body.city).trim(),
      postalCode: String(body.postalCode).trim(),
      country: String(body.country || 'Pakistan').trim(),
      phone: String(body.phone).trim(),
    },
  };
};

// Exactly one default, always. Called after any change that could disturb it.
const settleDefault = (user, preferredId = null) => {
  if (user.addresses.length === 0) return;

  const preferred =
    (preferredId && user.addresses.id(preferredId)) ||
    user.addresses.find((a) => a.isDefault) ||
    user.addresses[0];

  user.addresses.forEach((entry) => {
    entry.isDefault = entry._id.toString() === preferred._id.toString();
  });
};

// GET /api/users/addresses  — protected
export const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');

  if (!user) {
    res.status(404);
    throw new Error('Account not found');
  }

  res.json(user.addresses);
});

// POST /api/users/addresses  — protected
export const addAddress = asyncHandler(async (req, res) => {
  const cleaned = cleanAddress(req.body);

  if (!cleaned.ok) {
    res.status(400);
    throw new Error(`Please fill in: ${cleaned.missing.join(', ')}`);
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error('Account not found');
  }

  // A cap keeps the document small and the picker usable
  if (user.addresses.length >= 10) {
    res.status(400);
    throw new Error('You can save up to 10 addresses. Remove one first.');
  }

  user.addresses.push(cleaned.value);

  const added = user.addresses[user.addresses.length - 1];

  // The first one saved becomes the default whether they asked or not
  const makeDefault = req.body.isDefault === true || user.addresses.length === 1;

  settleDefault(user, makeDefault ? added._id : null);

  await user.save();

  res.status(201).json(user.addresses);
});

// PUT /api/users/addresses/:addressId  — protected
export const updateAddress = asyncHandler(async (req, res) => {
  const cleaned = cleanAddress(req.body);

  if (!cleaned.ok) {
    res.status(400);
    throw new Error(`Please fill in: ${cleaned.missing.join(', ')}`);
  }

  const user = await User.findById(req.user._id);
  const entry = user?.addresses.id(req.params.addressId);

  if (!entry) {
    res.status(404);
    throw new Error('Address not found');
  }

  entry.set(cleaned.value);

  settleDefault(user, req.body.isDefault === true ? entry._id : null);

  await user.save();

  res.json(user.addresses);
});

// DELETE /api/users/addresses/:addressId  — protected
export const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const entry = user?.addresses.id(req.params.addressId);

  if (!entry) {
    res.status(404);
    throw new Error('Address not found');
  }

  entry.deleteOne();

  // Removing the default promotes whichever is left
  settleDefault(user);

  await user.save();

  res.json(user.addresses);
});

// PUT /api/users/addresses/:addressId/default  — protected
export const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const entry = user?.addresses.id(req.params.addressId);

  if (!entry) {
    res.status(404);
    throw new Error('Address not found');
  }

  settleDefault(user, entry._id);

  await user.save();

  res.json(user.addresses);
});