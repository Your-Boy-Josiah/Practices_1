const User = require('../Models/Users');
const bcrypt = require('bcryptjs')
// Create A User

exports.CreateUser = async (req, res) => {
    try {
        // Request body
        const {name, email, password, gender, phone_number, role } = req.body

         //check if all required fields are provided
        if (!name || !email || !password || !gender || !phone_number || !role) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Doing an Email check
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ message: 'This Email already exists' });
        }

        // Doing a Phone_number Check
        const existingNumber = await User.findOne({ phone_number: req.body.phone_number });
        if (existingNumber) {
            return res.status(400).json({ message: 'This Phone Number already exists'});
        }
        // Encrypting Password
        const salt = await bcrypt.genSalt(4);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);

        const user = new User({ 

            name: req.body.name,
            email: req.body.email,
            password: hashedPassword,
            gender: req.body.gender,
            phone_number: req.body.phone_number,
            role: req.body.role || 'user'

        });

        await user.save();
        res.status(201).json({ message: 'User created sucessfully' });  
    } catch (errpr) {
        console.error('Error creating user', error);
        res.status(500).json({ message: "Error creating 'USER'", error: error.message });
    } 
};


// Login User
exports.LoginUser = async (req,res) => {
    try {
        const  { email, password } = req.body;

        // Check if all required fields are provided
        if (!email || !password ) {
            return res.status(400).json({message: 'Please provide all required fields'});
        }

        // Check if User exists
        const user = await User.findOne({email});
        if ( !user ) {
            return res.status(400).json({message: 'User is not found' });
        }

        // Check if Password is correct 
        const isPasswordValid = await bcrypt.compare(password, user.password );
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid Password' });
        }

        //Generate a token (You can use JWT or any other method) to create a token 
        // const token  = genarateToken(user); // Implement your token generation logic here

        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login sucessful'. token }) 
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
};
