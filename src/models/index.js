const sequelize = require('../config/database');
const User = require('./User');
const Content = require('./Content');
const ContentSlot = require('./ContentSlot');
const ContentSchedule = require('./ContentSchedule');

// ─── Associations ────────────────────────────────────────────────────────────

// A Teacher (User) uploads many Content items
User.hasMany(Content, { foreignKey: 'uploaded_by', as: 'uploadedContent' });
Content.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });

// A Principal (User) approves/rejects many Content items
User.hasMany(Content, { foreignKey: 'approved_by', as: 'approvedContent' });
Content.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// A ContentSlot (subject) has many ContentSchedule entries
ContentSlot.hasMany(ContentSchedule, { foreignKey: 'slot_id', as: 'schedules' });
ContentSchedule.belongsTo(ContentSlot, { foreignKey: 'slot_id', as: 'slot' });

// A Content item can have one ContentSchedule entry
Content.hasOne(ContentSchedule, { foreignKey: 'content_id', as: 'schedule' });
ContentSchedule.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });

module.exports = {
  sequelize,
  User,
  Content,
  ContentSlot,
  ContentSchedule,
};
