const PM = require('mongoose');
const TFA = require('bcryptjs'); // Brought in bcrypt to handle password security

const UserSchema =new PM.Schema({
    name:{
        type:String, 
        required:[true,'Please add a NAME']
    },
    age: {
        type: Number,
        required:[true,'Please add your AGE'],
        min: [16, 'You must be at least 16 years old']
    },
    gender:{
        type: String,
        enum:[ 'Male', 'Female', 'Transgender', 'Non-binary', 'Other' ],
        required: [true, 'Please select your GENDER']
    },
    email:{
        type:String, 
        required:[true,'Please add your E-MAIL address'],
        unique: true      
    },
    password:{
        type:String,
        required:[true,'Please add a PASSWORD'],
        minlength:6,
        select:false
    },
    phone_number:{
        type: String,
        required: [true, 'Please add your PHONE NUMBER'],
        unique: true
    },
    role:{
        type: String,
        enum: ['Super_Admin', 'Admin', 'Store_Keeper', 'User'],
        default: 'User'
    },

   
},
{ timestamps: true } //Date of creation and update will be automatically added to the documentation.
);

// BCRYPT COMPARE METHOD 
// I will need this in my User_Controller.js to check passwords during login!
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await TFA.compare(enteredPassword, this.password);
}; 

// BCRYPT PRE-SAVE HOOK 
// This runs automatically right before a User is saved to the Database
UserSchema.pre('save', async function(next) {
    
    // If the password was NOT modified, skip the hashing process
    if (!this.isModified('password')) {
        return next();
    }
    try {
        // Generate a salt (10 is the industry standard for security vs speed)
        const salt = await TFA.genSalt(10);
        
        // Hash the password and replace the plain text version
        this.password = await TFA.hash(this.password, salt);
        
        // Move on to actually saving the document
        next();
    } catch (error) {
        // If something goes wrong with hashing, pass the error along
        next(error); 
    }
});

//create model from Schema
const User = PM.model('User', UserSchema);
module.exports = User;     // export the model so it can be used in other files
