// ===============================================================
//  User.js (Model)
//  Defines the MongoDB schema and business logic for Users.
//  Handles user attributes, role-based access levels, and 
//  secure automated password hashing using bcrypt.
// ===============================================================

const PM = require('mongoose');
const TFA = require('bcryptjs'); // Brought in bcrypt to handle password security

// ==============================================================
// SCHEMA DEFINITION
// Maps the exact structure, data types, and validation rules 
// for every user document stored in the database.
// ==============================================================

const UserSchema = new PM.Schema(
  {
    name: {
      type: String, 
      required: [true, 'Please add a NAME']
    },
    age: {
      type: Number,
      required: [true, 'Please add your AGE'],
      min: [16, 'You must be at least 16 years old'] // Age restriction validation
    },
    gender: {
      type: String,
      // Enums restrict this field to only accept these exact predefined strings
      enum: ['Male', 'Female', 'Transgender', 'Non-binary', 'Other'],
      required: [true, 'Please select your GENDER']
    },
    email: {
      type: String, 
      required: [true, 'Please add your E-MAIL address'],
      unique: true // Ensures no two accounts can share the same email
    },
    password: {
      type: String,
      required: [true, 'Please add a PASSWORD'],
      minlength: 6,
      // select: false is a massive security feature! 
      // It ensures that whenever we query a User (e.g., User.find()), 
      // the database will NOT return the password field by default, 
      // preventing accidental leaks to the frontend.
      select: false 
    },
    phone_number: {
      type: String,
      required: [true, 'Please add your PHONE NUMBER'],
      unique: true // Ensures no two accounts can share the same phone number
    },
    role: {
      type: String,
      // Strict role hierarchy for the application
      enum: ['Super_Admin', 'Admin', 'Store_Keeper', 'User'],
      default: 'User' // New signups are standard users by default
    },
  },
  { 
    // Automatically creates and updates 'createdAt' and 'updatedAt' timestamps
    timestamps: true 
  } 
);

// ============================================================
// INSTANCE METHODS
// Custom functions attached directly to individual user documents.
// ============================================================
// BCRYPT COMPARE METHOD 
// Used inside User_Controller.js to check passwords during login.
// It securely compares the plain-text password typed by the user 
// against the encrypted hash stored in the database.
//================================================================

UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await TFA.compare(enteredPassword, this.password);
}; 

// ============================================================
// MONGOOSE MIDDLEWARE (PRE-SAVE HOOK)
// Automatically intercepts the document right before it is 
// saved to the database. Used here to encrypt plain-text passwords.
// ============================================================

UserSchema.pre('save', async function(next) {
  
  // CRITICAL CHECK: If the password field was NOT modified 
  // (e.g., the user is just updating their phone number), 
  // we skip hashing. Otherwise, we would hash an already-hashed password, 
  // permanently locking the user out of their account!
  if (!this.isModified('password')) {
    return next();
  }
  try {
    // Generate a secure salt 
    // (10 rounds is the industry standard balance between security and server speed)
    const salt = await TFA.genSalt(10);
    
    // Hash the plain text password with the salt, and replace the plain text 
    // version on this document with the new encrypted string
    this.password = await TFA.hash(this.password, salt);
    
    // Move on to actually saving the document to MongoDB
    next();
  } catch (error) {
    // If something goes wrong with the hashing process, pass the error along
    // so the server doesn't freeze
    next(error); 
  }
});

// ============================================================
// MODEL COMPILATION & EXPORT
// Compiles the schema into a usable Mongoose model.
// ============================================================

const User = PM.model('User', UserSchema);

// Export the model so it can be imported and used inside User_Controller.js
module.exports = User;

