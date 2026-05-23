
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, msg: 'User already exists' });
    }

    // Create user
    user = new User({
      name,
      email,
      password,
      role,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    res.status(201).json({ success: true, msg: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, msg: 'Invalid credentials' });
    }

    // Create token
    const payload = {
      id: user.id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Don't send back the hashed password
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }

    res.status(200).json({
      success: true,
      token,
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, msg: 'Server error' });
  }
};
