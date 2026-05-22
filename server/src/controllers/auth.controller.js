const authService = require('../services/auth.service');
const TransactionLog = require('../models/TransactionLog');
const ApiResponse = require('../utils/ApiResponse');

const register = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.registerUser(req.body);

    await TransactionLog.log({
      action: 'USER_REGISTERED',
      performedBy: user._id,
      targetModel: 'User',
      targetId: user._id,
      details: { role: user.role, email: user.email },
      ipAddress: req.ip,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    ApiResponse.created(res, 'User registered successfully', {
      user,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, tokens } = await authService.loginUser(email, password);

    await TransactionLog.log({
      action: 'USER_LOGIN',
      performedBy: user._id,
      targetModel: 'User',
      targetId: user._id,
      ipAddress: req.ip,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, 'Login successful', {
      user,
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logoutUser(req.user._id);

    await TransactionLog.log({
      action: 'USER_LOGOUT',
      performedBy: req.user._id,
      targetModel: 'User',
      targetId: req.user._id,
      ipAddress: req.ip,
    });

    res.clearCookie('refreshToken');
    ApiResponse.success(res, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.body.refreshToken || req.cookies.refreshToken;
    const tokens = await authService.refreshAccessToken(token);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ApiResponse.success(res, 'Token refreshed', {
      accessToken: tokens.accessToken,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    ApiResponse.success(res, 'User profile', req.user);
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, refreshToken, getMe };
