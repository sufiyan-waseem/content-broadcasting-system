require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Sync all models (create tables if they don't exist)
    // Use { alter: true } in development to apply schema changes without dropping data
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database tables synchronized.');

    app.listen(PORT, () => {
      console.log(`\n🚀 Content Broadcasting System API`);
      console.log(`   Running on: http://localhost:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV}`);
      console.log(`   Health check: http://localhost:${PORT}/health`);
      console.log(`   Public broadcast: http://localhost:${PORT}/content/live/:teacherId\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
