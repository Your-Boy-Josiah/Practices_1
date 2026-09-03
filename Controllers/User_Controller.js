// ===============================================================
//  User_Controller.js
//  Handles all authentication and registration for the User Model.
//  Imported by User_Routes.js and mounted under /api/users.
// ===============================================================

const User = require('../Models/Users');
const jwt = require('jsonwebtoken');

// ==============================================================
// CREATE / REGISTER A NEW USER
// Route  : POST /api/users/register (or /api/users/CreateUser)
// Access : Public
// ==============================================================

exports.CreateUser = async (req, res) => {
  try {
    // 1. Destructure all expected text fields from the request body
    const { name, email, password, gender, phone_number, age } = req.body;

    // 2. Validate that all mandatory fields are present
    // With multipart/form-data, empty text inputs arrive as empty strings ("")
    if (
      !name || 
      !email || 
      !password || 
      !gender || 
      !phone_number || 
      age === undefined || 
      age === ''
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // 3. Normalise string data to ensure database consistency
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    // 4. Check if a user with the same email already exists 
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'This Email already exists' });
    }

    // 5. Check if a user with the same phone number already exists 
    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'This Phone Number already exists' });
    }

    // 6. Handle Profile Avatar (Multer)
    // If a file was uploaded, build a clean relative path using forward slashes
    // Otherwise, assign a clean default avatar path
    const avatarPath = req.file 
      ? `uploads/${req.file.filename}` 
      : 'uploads/default-avatar.png';

    // 7. Build the new User document
    // Convert age to a Number to ensure compatibility with multipart/form-data
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password, 
      gender,
      phone_number: normalizedPhone,
      age: Number(age),
      avatar: avatarPath,
    });

    // 8. Persist the new user to MongoDB
    // Password will be automatically hashed by pre-save hook in Models/Users.js
    await user.save();

    // 9. Return the saved user (excluding password for security)
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
    // MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({ 
        message: `This ${field} is already registered. Please use another. Thank You.` 
      });
    }

    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// ==============================================================
// LOGIN USER
// Route  : POST /api/users/login
// Access : Public
// ==============================================================

exports.LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Query for the user by normalized email and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify password match using model helper method
    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token (1 hour expiration)
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email, 
        role: user.role, 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return token and user metadata (including avatar)
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
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
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
