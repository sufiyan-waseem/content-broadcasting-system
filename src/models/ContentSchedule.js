const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ContentSchedule links a content item to a slot with ordering and duration
const ContentSchedule = sequelize.define('ContentSchedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  content_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content',
      key: 'id',
    },
  },
  slot_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'content_slots',
      key: 'id',
    },
  },
  rotation_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Order in which content plays in the rotation for its subject',
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    comment: 'How many minutes this content plays before switching to the next',
  },
}, {
  tableName: 'content_schedule',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ContentSchedule;
