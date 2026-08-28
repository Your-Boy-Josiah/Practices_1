const express = require('express');
const app = express();

const dotenv = require('dotenv');
//Load Environment Variables from .env file
dotenv.config();  

const connectDB = require('../Practices/Config/Database_Config');
//Connect to MONGODB
connectDB();

const ProductRoute = require("../Practices/Routes/Product_Routes");


//Middleware to parse JSON request bodies
app.use(express.json());


// console.log('This is an Extra line')

app.use('/Products', ProductRoute);

// app.use('/User', require('./Routes/User_Route'));

app.listen(process.env.PORT, () => {
    console.log('Server is Running in port $(process.env.PORT)');
});