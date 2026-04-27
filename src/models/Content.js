const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Content = sequelize.define('Content', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [1, 255],
    },
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
    },
  },
  file_url: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  file_type: {
    type: DataTypes.ENUM('jpg', 'jpeg', 'png', 'gif'),
    allowNull: false,
  },
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  uploaded_by: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  approved_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  approved_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When content becomes eligible for broadcasting',
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When content stops being eligible for broadcasting',
  },
  rotation_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 5,
    comment: 'Duration in minutes each content is displayed during rotation',
  },
}, {
  tableName: 'content',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Content;
