const mongose = require('mongoose');

const bcrypt = require('bcryptjs')

const userSchema =new mongose.Schema({
    name:{
        type:String, 
        required:[true,'Please add a name']
    },
    email:{
        type:String, 
        required:[true,'Please add an email'],
        unique: true      
    },
    password:{
        type:String,
        required:[true,'Please add a password'],
        minlength:6,
        select:false
    },
    gender:{
        type: String,
        enum:[ 'Male', 'Female', 'Gay', 'Lesbian', 'Bisexual', 'Transgender', 'Non-binary', 'Other' ],
        required: [true, 'Please select your gender']
    },
    phone_number:{
        type: String,
        required: [true, 'Please add your phone number'],
        unique: true
    },
    role:{
        type: String,
        enum: ['Super_Admin', 'Admin', 'User'],
        default: 'User'
    },

   
},
{ timestamps: true } //Date of creation and update will be automatically added to the documentation.

);

//create model from Schema
const User = mongose.model('User', userSchema);
module.exports = User;     // export the model so it can be used in other files

