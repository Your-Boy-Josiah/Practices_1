// ===============================================================
//  User_Controller.js
//  Handles all authentication and registration for the User Model
//  Will be Imported by User_Routes.js and mounted under /api/users
//  Mongoose model for the User collection
//  JSON Web Token library used for issuing authentication tokens
// ===============================================================

const User = require('../Models/Users');
const jwt = require('jsonwebtoken');

// ==============================================================
// CREATE / REGISTER A NEW USER
// Route  : POST /api/users/register
// Access : Public
// ==============================================================

exports.CreateUser = async (req, res) => {
  try {
    // Destructure all expected fields from the request body 
    const { name, email, password, gender, phone_number, age } = req.body;

    // Validate that all mandatory fields are present 
    // age uses strict undefined check because 0 could theoretically be passed and would fail a simple falsy check (!age)

    if (
      !name || 
      !email || 
      !password || 
      !gender || 
      !phone_number || 
      age === undefined
    ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Normalise string data to ensure database consistency
    // trim() removes accidental leading/trailing whitespace before comparison
    // toLowerCase() ensures emails like Test@Email.com match test@email.com

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    // Check if a user with the same email already exists 
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'This Email already exists' });
    }

    // Check if a user with the same phone number already exists 
    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'This Phone Number already exists' });
    }

    // Build the new User document 
    // The password is passed exactly as received. The Mongoose pre-save hook 
    // inside Models/Users.js will automatically intercept and hash it before saving.
    // The schema automatically sets 'role' to 'user' by default.

    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: password, 
      gender,
      phone_number: normalizedPhone,
      age
    }
  );
  
    // Persist the new user document to MongoDB 
    await user.save();

    // Return the saved user with a 201 Created status 
    // We explicitly exclude the password from the response for security
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
    // Error Handler A: MongoDB duplicate key error (code 11000) 
    // Triggered if a unique index is violated at the DB level
    // (e.g. if two identical registration requests hit the server at the exact same millisecond)

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0]; // Extract which field caused the clash
      return res.status(409).json({ 
        message: `This ${field} is already registered. Please use another. Thank You.` 
      });
    }

    // Error Handler B: Any other unexpected server error
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
    // Destructure login credentials from the request body
    const { email, password } = req.body;

    // Validate that both email and password are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Query the DB for a user matching this email 
    // Use .select('+password') to temporarily override the schema's default setting 
    // (if password has select: false) and pull the hashed password for comparison.

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    
    // Return 401 if no matching user is found
    // We use a generic error message to prevent email enumeration attacks
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Verify the provided password against the hashed password in the DB
    // This utilizes the custom matchPassword method defined in the User.js model

    const isPasswordValid = await user.matchPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generating a JSON Web Token (JWT)
    // Encodes non-sensitive identifying data so the server recognizes the user on future requests
    // Token expires in 1 hour for security

    const token = jwt.sign(
      {
         id: user._id,
         email: user.email, 
         role: user.role, 
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Return the token and user metadata with a 200 OK status
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
    // Error Handler: Unexpected server error during login
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

 