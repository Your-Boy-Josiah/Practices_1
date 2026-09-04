const PM = require('mongoose');

const connectDB = async (mongoUri = process.env.MONGO_URI) => {
  try {
    if (PM.connection.readyState === 1) {
      return PM.connection;
    }

    const connection = await PM.connect(mongoUri);
    console.log(`MongoDB Connected: ${connection.connection.host}`);
    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
