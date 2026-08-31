const User = require('../Models/Users');
const jwt = require('jsonwebtoken');

// Create A User
exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, gender, phone_number, age } = req.body;

    // Required fields check
    if ( !name || !email || !password || !gender || !phone_number || age ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    // Email Check
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'This Email already exists' });
    }

    // Phone Number Check
    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'This Phone Number already exists' });
    }

    // Create & Save User
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      gender,
      phone_number: normalizedPhone,
      age
      // The schema automatically sets 'role' to 'User' by default
    });

    await user.save();

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    // Handles MongoDB Duplicate Key Error (Code 11000) for exact time database clashes
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        message: `This ${field} is already registered. Please use another Thank You.` 
      });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Login User
exports.LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

  // Use .select('+password') to temporarily override the schema setting and pull the password for comparison
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Use your custom matchPassword method from User.js
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT wristband (without sensitive info!)
    const token = jwt.sign(
      {
         id: user._id,
         email: user.email, 
         role: user.role, 
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
