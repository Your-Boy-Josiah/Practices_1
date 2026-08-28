const mongose = require('mongoose');

const connectDB = async () => {
      try {
        const conn = await mongose.connect(process.env.MONGO_URI) 
        console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the process with failure
    }     
};

module.exports = connectDB;

