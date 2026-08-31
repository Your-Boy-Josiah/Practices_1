// ============================================================
//  Database_Config.js
//  Handles the connection to the MongoDB cluster.
//  Imported and executed in the main app.js file.
// ============================================================

const PM = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect to the database using the secret URI
    const conn = await PM.connect(process.env.MONGO_URI);
    
    // Log success with the host name so you know exactly which DB you connected to
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
  } catch (error) {
    // If the connection fails, log the error and kill the server
    // (A backend without a database shouldn't be kept running!)
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); 
  }     
};

// Export the function so app.js can trigger it on startup
module.exports = connectDB;