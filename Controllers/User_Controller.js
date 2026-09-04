const User = require('../Models/Users');
const jwt = require('jsonwebtoken');

const issueAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const issueRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, gender, phone_number, age } = req.body;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'This Email already exists' });
    }

    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'This Phone Number already exists' });
    }

    const avatarPath = req.file ? `uploads/${req.file.filename}` : 'uploads/default-avatar.png';

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      gender,
      phone_number: normalizedPhone,
      age: Number(age),
      avatar: avatarPath,
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `This ${field} is already registered. Please use another. Thank You.`,
      });
    }

    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = issueAccessToken(user);
    const refreshToken = issueRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || 'uploads/default-avatar.png',
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
    });
  }
};

exports.RefreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token user' });
    }

    const newAccessToken = issueAccessToken(user);

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      token: newAccessToken,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Refresh token expired' });
    }

    return res.status(403).json({ success: false, message: 'Invalid refresh token' });
  }
};
