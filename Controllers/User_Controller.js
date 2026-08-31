// const User = require('../Models/Users');
// const bcrypt = require('bcryptjs');

// // Create A User

// exports.CreateUser = async (req, res) => {
//     try {
//         // Request body
//         const {name, email, password, gender, phone_number, role } = req.body

//          //check if all required fields are provided
//         if (!name || !email || !password || !gender || !phone_number || !role) {
//             return res.status(400).json({ message: 'Please provide all required fields' });
//         }

//         // Doing an Email check
//         const existingUser = await User.findOne({ email: req.body.email });
//         if (existingUser) {
//             return res.status(400).json({ message: 'This Email already exists' });
//         }

//         // Doing a Phone_number Check
//         const existingNumber = await User.findOne({ phone_number: req.body.phone_number });
//         if (existingNumber) {
//             return res.status(400).json({ message: 'This Phone Number already exists'});
//         }
//         // Encrypting Password
//         const salt = await bcrypt.genSalt(4);
//         const hashedPassword = await bcrypt.hash(req.body.password, salt);

//         const user = new User({ 

//             name: req.body.name,
//             email: req.body.email,
//             password: hashedPassword,
//             gender: req.body.gender,
//             phone_number: req.body.phone_number,
//             role: req.body.role || 'user'

//         });

//         await user.save();
//         res.status(201).json({ message: 'User created sucessfully' });  
//     } catch (errpr) {
//         console.error('Error creating user', error);
//         res.status(500).json({ message: "Error creating 'USER'", error: error.message });
//     } 
// };


// // Login User
// exports.LoginUser = async (req,res) => {
//     try {
//         const  { email, password } = req.body;

//         // Check if all required fields are provided
//         if (!email || !password ) {
//             return res.status(400).json({message: 'Please provide all required fields'});
//         }

//         // Check if User exists
//         const user = await User.findOne({email});
//         if ( !user ) {
//             return res.status(400).json({message: 'User is not found' });
//         }

//         // Check if Password is correct 
//         const isPasswordValid = await bcrypt.compare(password, user.password );
//         if (!isPasswordValid) {
//             return res.status(400).json({ message: 'Invalid Password' });
//         }

//         //Generate a token (You can use JWT or any other method) to create a token 
//         // const token  = genarateToken(user); // Implement your token generation logic here

//         const jwt = require('jsonwebtoken');
//         const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });

//         res.status(200).json({ message: 'Login sucessful'. token }) 
//     } catch (error) {
//         res.status(500).json({ message: 'Error logging in', error: error.message });
//     }
// };

const User = require('../Models/Users');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create A User
exports.CreateUser = async (req, res) => {
  try {
    const { name, email, password, gender, phone_number, } = req.body;

    // Required fields check
    if ( !name || !email || !password || !gender || !phone_number ) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedPhone = phone_number.trim();

    // Email Check
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ message: 'This Email already exists' });
    }

    // Separate Phone Number Check
    const existingPhone = await User.findOne({ phone_number: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ message: 'This Phone Number already exists' });
    }

    // Custom Third Check (e.g., Username, Referral Code, Age, etc.)
    // Example:
    // const customCheck = await SomeModel.findOne({ ... });
    // if (!customCheck) {
    //   return res.status(400).json({ message: 'Custom validation failed' });
    // }

    // Encrypt Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create & Save User
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      gender,
      phone_number: normalizedPhone,
       role: role === 'admin' ? 'admin' : 'user',
      HasAdminAccess: false, // Prevents privilege escalation during public registration
    });

    await user.save();

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        HasAdminAccess: user.HasAdminAccess,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }};

// Login User
exports.LoginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id,
        email: user.email, 
        role: user.role, 
        HasAdminAccess: user.HasAdminAccess,
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
        HasAdminAccess: user.HasAdminAccess,
      },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
