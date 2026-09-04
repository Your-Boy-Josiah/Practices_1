require('dotenv').config();

const createApp = require('./app');
const connectDB = require('./Config/Database_Config');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`🚀 Supermarket API is running securely on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error.message);
  process.exit(1);
});
