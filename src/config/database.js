const { Sequelize } = require('sequelize');
require('dotenv').config();

const options = {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  } : {},
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

let sequelize;

if (process.env.DB_URL) {
  // Use a connection string if provided (e.g., from Render)
  sequelize = new Sequelize(process.env.DB_URL, options);
} else {
  // Fallback to individual variables for local development
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      ...options
    }
  );
}

module.exports = sequelize;
