const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Message = sequelize.define('Message', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  text: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  username: {
    type: Sequelize.STRING,
    allowNull: true
  },
  groupId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  conversationId: {
    type: Sequelize.STRING,
    allowNull: true
  },
  archived: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
  },
  
});

module.exports = Message;