const { User } = require('../models');
const { generateToken, successResponse, errorResponse } = require('../utils/helpers');

/**
 * POST /api/auth/register
 * Registers a new user (teacher or principal)
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email, and password are required.');
    }

    if (!['principal', 'teacher'].includes(role)) {
      return errorResponse(res, 400, "Role must be either 'principal' or 'teacher'.");
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return errorResponse(res, 409, 'An account with this email already exists.');
    }

    // password_hash is auto-hashed via beforeCreate hook in User model
    const user = await User.create({ name, email, password_hash: password, role });
    const token = generateToken(user);

    return successResponse(res, 201, 'Account created successfully.', { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 * Authenticates a user and returns JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required.');
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isValid = await user.verifyPassword(password);
    if (!isValid) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user);
    return successResponse(res, 200, 'Login successful.', { user, token });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me
 * Returns the logged-in user's profile
 */
const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, 'Profile fetched.', { user: req.user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe };
