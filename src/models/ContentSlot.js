const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// A ContentSlot is a subject-level grouping (e.g., "maths", "science")
// This allows independent rotation per subject
const ContentSlot = sequelize.define('ContentSlot', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
    },
  },
}, {
  tableName: 'content_slots',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ContentSlot;
